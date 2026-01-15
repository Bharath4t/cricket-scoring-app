// START OF PART 1

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, MapPin, ClipboardList, Undo, CloudRain, RotateCcw,
  Edit2, UserMinus, X, Check , ChevronRight, User, Users,
  Settings, Plus, Trash2, Upload, Camera, Save, Download, FileJson, RefreshCw,
  BarChart2, Star,UserPlus, TrendingUp, Activity, AlertTriangle, LogOut, HeartPulse,
  Shield, Target, Award, Coins, Mic, Zap, Search, Crown, History, Calendar,
  Hand, BoxSelect, Medal ,Footprints, Gavel
   // <--- ADDED THESE
} from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";
// --- IMPORT YOUR LOGO HERE ---
import appLogo from './logo.png';
// --- 1. CONSTANTS & UTILS ---
const DEFAULT_PLAYERS = [];
const DEFAULT_TEAMS = [];
const VENUES = ['Decathlon', 'Ground', 'Terrace', 'Box Cricket', 'Stadium'];
const DISMISSAL_TYPES = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Mankad'];

const generateId = () => Math.random().toString(36).substr(2, 9);

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const calculateMVPPoints = (bat, bowl, field) => {
  let pts = 0;

  // --- 1. BATTING POINTS ---
  if (bat) {
    pts += (bat.runs || 0) * 1;       // 1 pt per run
    pts += (bat.fours || 0) * 1;      // 1 pt Bonus for 4s
    pts += (bat.sixes || 0) * 2;      // 2 pts Bonus for 6s
    if ((bat.runs || 0) >= 30) pts += 4; // Bonus for 30 runs
    if ((bat.runs || 0) >= 50) pts += 8; // Bonus for 50 runs

    // Strike Rate Bonus (Min 10 balls played)
    if (bat.balls >= 3) {
      const sr = (bat.runs / bat.balls) * 100;
      if (sr >= 170) pts += 6;
      else if (sr >= 150) pts += 4;
      else if (sr >= 130) pts += 2;
    }
  }

  // --- 2. BOWLING POINTS ---
  if (bowl) {
    pts += (bowl.wickets || 0) * 25;  // 25 pts per wicket
    if ((bowl.wickets || 0) >= 3) pts += 8;
   
    if ((bowl.maidens || 0) > 0) pts += ((bowl.maidens || 0) * 12);

    // ECONOMY RATE FACTOR (The Fix for Ujjwal)
    // We calculate overs based on legal balls to be accurate
    const overs = (bowl.legalBalls || 0) / 6;
    if (overs >= 1) {
      const economy = (bowl.runs || 0) / overs;
     
      // Bonus for good economy
      if (economy <= 5) pts += 6;
      else if (economy <= 7) pts += 4;
      else if (economy <= 9) pts += 2;
     
      // PENALTY for expensive bowling (This fixes your issue)
      // Ujjwal (17 runs / 1 over) = 17 ER. He will lose 6 points here.
      else if (economy >= 12) pts -= 6;
    }
  }

  // --- 3. FIELDING POINTS ---
  if (field) {
    pts += ((field.catches || 0) * 8) + ((field.stumpings || 0) * 12) + ((field.runouts || 0) * 12);
  }

  return pts;
};

const getOversFromBalls = (balls) => {
    if (typeof balls !== 'number' || isNaN(balls)) return '0.0';
    const overs = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${overs}.${rem}`;
};
// START OF PART 2
// --- 2. SHARED UI COMPONENTS ---

// --- 2. SHARED UI COMPONENTS (Polished & Animated) ---

const Modal = ({ children, title, onClose, maxWidth = "max-w-md" }) => (
  // Animation: Fade in background, Zoom in modal
  <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
    <div className={`bg-black border border-white/10 w-full ${maxWidth} rounded-3xl overflow-hidden shadow-2xl shadow-orange-900/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ring-1 ring-white/5`}>
     
      {/* MODAL HEADER - True Black Style */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-neutral-900/30 backdrop-blur-xl">
        <h3 className="font-bold text-white text-lg flex items-center gap-3">
          {/* The Glowing Orange Bar */}
          <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full shadow-[0_0_10px_#f97316]"></div>
          {title}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors active:scale-90">
            <X size={20}/>
          </button>
        )}
      </div>

      {/* MODAL CONTENT - Pure Black */}
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-black">
        {children}
      </div>
    </div>
  </div>
);

const Button = ({ children, onClick, variant = 'primary: "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/50 border border-orange-500/20"', className = '', disabled = false }) => {
  const baseStyle = "py-3.5 px-6 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg text-sm tracking-wide duration-200";
  const variants = {
    // Gradient backgrounds for extra polish
    primary: "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-orange-900/20 border border-orange-400/20",
    secondary: "bg-neutral-900/50 hover:bg-orange-900/20 text-slate-200 border border-white/10 hover:border-orange-500/50 backdrop-blur-sm shadow-lg",
    danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/20",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/20",
    outline: "border-2 border-slate-600 text-slate-300 hover:border-slate-400 bg-transparent hover:bg-slate-800/50"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const PlayerAvatar = ({ player, size = "md" }) => {
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-sm", lg: "w-24 h-24 text-xl", xl: "w-32 h-32 text-4xl" };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600 flex-shrink-0`}>
      {player?.image ? (
        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-slate-400">{player?.name?.charAt(0) || '?'}</span>
      )}
    </div>
  );
};
// START OF PART 3
// --- 3. FEATURE COMPONENTS & MODALS (Ordered) ---
//--- 3A. INPUT COMPONENT: WAGON WHEEL SELECTOR (Vibrant Night Field)
const ShotMapSelector = ({ onSelect, onClose }) => {
  const btnBase = "absolute text-[9px] md:text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border shadow-lg transition-all hover:scale-110 active:scale-95 z-10 flex items-center justify-center whitespace-nowrap backdrop-blur-md";
  const btnBlue = `${btnBase} bg-blue-600/90 border-blue-400 text-white shadow-blue-500/30`;
  const btnGreen = `${btnBase} bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30`;
  const btnDark = `${btnBase} bg-black/60 border-white/20 text-slate-200 hover:bg-white hover:text-black hover:border-white`;

  return (
    <Modal title="Shot Direction" onClose={onClose}>
      <div className="w-full max-w-[360px] mx-auto mb-4 mt-2">
        <div className="relative w-full aspect-square rounded-full bg-gradient-to-b from-emerald-900 via-emerald-950 to-black border-4 border-white/10 shadow-2xl overflow-hidden">
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[45%] h-[45%] rounded-full border border-white/20 border-dashed"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-24 bg-[#d4d4d8] opacity-20 rounded"></div>
           </div>

           <button onClick={() => onSelect('Third Man')} className={`${btnDark} top-[15%] left-[15%]`}>Third Man</button>
           <button onClick={() => onSelect('Behind')} className={`${btnDark} top-[5%] left-1/2 -translate-x-1/2`}>Behind</button>
           <button onClick={() => onSelect('Fine Leg')} className={`${btnDark} top-[15%] right-[15%]`}>Fine Leg</button>
           <button onClick={() => onSelect('Point')} className={`${btnDark} top-1/2 -translate-y-1/2 left-[2%]`}>Point</button>
           <button onClick={() => onSelect('Square Leg')} className={`${btnDark} top-1/2 -translate-y-1/2 right-[2%]`}>Sq. Leg</button>
           <button onClick={() => onSelect('Cover')} className={`${btnDark} bottom-[25%] left-[8%]`}>Cover</button>
           <button onClick={() => onSelect('Long Off')} className={`${btnGreen} bottom-[10%] left-[20%]`}>Long Off</button>
           <button onClick={() => onSelect('Straight')} className={`${btnBlue} bottom-[2%] left-1/2 -translate-x-1/2 px-6`}>Straight</button>
           <button onClick={() => onSelect('Long On')} className={`${btnGreen} bottom-[10%] right-[20%]`}>Long On</button>
           <button onClick={() => onSelect('Mid Wicket')} className={`${btnDark} bottom-[25%] right-[8%]`}>Mid Wkt</button>
        </div>
        <div className="text-center text-[10px] font-bold text-slate-500 mt-4">Tap the zone where the shot was played</div>
      </div>
    </Modal>
  );
};
// --- 3B. DISPLAY COMPONENT: INTERACTIVE WAGON WHEEL (For Stats/Archives) ---
//--- 3B. DISPLAY COMPONENT: INTERACTIVE WAGON WHEEL (Premium Radar Style)
const WagonWheel = ({ timeline, title = "Scoring Analysis" }) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [animate, setAnimate] = useState(false);

  // Trigger animation on load
  useEffect(() => {
    setAnimate(true);
  }, []);

  if (!timeline || timeline.length === 0) return null;

  // Filter only shots with direction
  const shots = timeline.filter(t => t.shotDirection);
  if (shots.length === 0) return (
    <div className="text-center text-slate-500 text-xs p-6 border border-white/5 rounded-2xl bg-neutral-900/50 italic">
      No boundary data available yet.
    </div>
  );

  // 1. AGGREGATE STATS PER ZONE
  const zoneStats = {};
  shots.forEach(s => {
    const dir = s.shotDirection;
    if (!zoneStats[dir]) zoneStats[dir] = { fours: 0, sixes: 0, total: 0, runs: 0 };
    if (s.boundary === 4) zoneStats[dir].fours++;
    if (s.boundary === 6) zoneStats[dir].sixes++;
    zoneStats[dir].total++;
    zoneStats[dir].runs += s.ballRuns;
  });

  // Updated Angles for Batsman View (Straight = Bottom)
  const zoneAngles = {
    'Straight': 90,
    'Long On': 65,
    'Long Off': 115,
    'Mid Wicket': 25,
    'Cover': 155,
    'Square Leg': 335,
    'Point': 205,
    'Fine Leg': 300,
    'Third Man': 240,
    'Behind': 270
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 to-black/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
      {/* Decorative Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>

      <h4 className="text-xs font-black text-orange-500 uppercase mb-6 flex items-center gap-2 tracking-widest relative z-10">
        <Activity size={14} className="animate-pulse"/> {title}
      </h4>

      <div className="relative w-full aspect-square max-w-[340px] mx-auto">
       
        {/* SVG CANVAS */}
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-xl">
         
          {/* DEFINITIONS FOR GLOW FILTERS */}
          <defs>
            <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Radial Gradient for the Field */}
            <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#171717" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* 1. THE FIELD (Radar Style) */}
          <circle cx="100" cy="100" r="98" fill="url(#fieldGrad)" stroke="#333" strokeWidth="1"/>
          {/* Concentric "Sonar" Rings */}
          <circle cx="100" cy="100" r="70" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4"/>
          <circle cx="100" cy="100" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
         
          {/* Axis Lines (Crosshair) */}
          <line x1="100" y1="0" x2="100" y2="200" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />

          {/* 2. THE PITCH (Detailed) */}
          <rect x="94" y="80" width="12" height="40" fill="#262626" rx="2" stroke="#404040" strokeWidth="1" />
          {/* Crease Markers */}
          <line x1="94" y1="88" x2="106" y2="88" stroke="#737373" strokeWidth="0.5" />
          <line x1="94" y1="112" x2="106" y2="112" stroke="#737373" strokeWidth="0.5" />
          {/* Stumps */}
          <circle cx="100" cy="82" r="1" fill="#ccc" />
          <circle cx="98" cy="82" r="1" fill="#ccc" />
          <circle cx="102" cy="82" r="1" fill="#ccc" />
          <circle cx="100" cy="118" r="1" fill="#ccc" />

          {/* 3. SHOT LINES (Laser Beams) */}
          {shots.map((shot, i) => {
            const angle = zoneAngles[shot.shotDirection] || 90;
            const rad = (angle * Math.PI) / 180;
           
            // Length varies slightly for randomness to look organic
            const length = shot.boundary === 6 ? 95 : shot.boundary === 4 ? 85 : 60;
           
            const x2 = 100 + length * Math.cos(rad);
            const y2 = 100 + length * Math.sin(rad);
           
            // Color Logic
            const isSix = shot.boundary === 6;
            const isFour = shot.boundary === 4;
            const color = isSix ? '#f97316' : isFour ? '#fbbf24' : '#94a3b8'; // Orange, Amber, Slate
            const width = isSix ? 2.5 : isFour ? 2 : 1;
            const opacity = isSix ? 1 : isFour ? 0.9 : 0.4;
            const filter = isSix ? "url(#glow-orange)" : isFour ? "url(#glow-orange)" : "";

            return (
              <line
                key={i}
                x1="100" y1="100"
                x2={animate ? x2 : 100}
                y2={animate ? y2 : 100}
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                opacity={opacity}
                filter={filter}
                className="transition-all duration-1000 ease-out"
                style={{ transitionDelay: `${i * 50}ms` }} // Staggered animation
              />
            );
          })}
        </svg>

        {/* 4. INTERACTIVE ZONES (Floating Badges) */}
        {Object.keys(zoneAngles).map((zone) => {
          const stat = zoneStats[zone];
          if (!stat) return null;
         
          const angle = zoneAngles[zone];
          const rad = (angle * Math.PI) / 180;
          const cx = 50 + (42 * Math.cos(rad));
          const cy = 50 + (42 * Math.sin(rad));
         
          return (
            <button
              key={zone}
              onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg transition-all duration-300 z-10 border ${
                selectedZone === zone
                ? 'bg-orange-500 text-white scale-125 border-orange-400 shadow-orange-500/50'
                : 'bg-neutral-900/80 text-orange-500 border-orange-500/30 hover:scale-110 hover:border-orange-500 backdrop-blur-sm'
              }`}
              style={{ left: `${cx}%`, top: `${cy}%` }}
            >
              {stat.runs}
            </button>
          );
        })}

        {/* 5. DETAIL POPUP (Glass Card) */}
        {selectedZone && zoneStats[selectedZone] && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neutral-900/95 backdrop-blur-xl border border-orange-500/50 p-4 rounded-2xl shadow-2xl z-20 w-48 text-center animate-in fade-in zoom-in duration-200 ring-4 ring-black/50">
            <div className="text-orange-500 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-white/10 pb-2">{selectedZone}</div>
           
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-neutral-800/50 p-2 rounded-lg border border-white/5">
                <div className="text-white font-black text-lg">{zoneStats[selectedZone].runs}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Runs</div>
              </div>
              <div className="bg-neutral-800/50 p-2 rounded-lg border border-white/5">
                <div className="text-white font-black text-lg">{zoneStats[selectedZone].total}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Shots</div>
              </div>
            </div>

            <div className="flex justify-center gap-2 text-[10px]">
               <span className="text-orange-400 font-bold">{zoneStats[selectedZone].sixes} Sixes</span>
               <span className="text-slate-600">•</span>
               <span className="text-amber-400 font-bold">{zoneStats[selectedZone].fours} Fours</span>
            </div>

            <button onClick={() => setSelectedZone(null)} className="mt-4 w-full py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-400 uppercase font-bold transition-colors">Close</button>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-neutral-500 mt-6 font-medium flex justify-center gap-4">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div> 6s</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div> 4s</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500 opacity-50"></div> 1s/2s</span>
      </div>
    </div>
  );
};
// --- 3C. PLAYER CARD COMPONENT ---
const PlayerPerformanceCard = ({ title, player, stats, type = 'MATCH' }) => {
  if (!player) return null;
  const safeStats = stats || {};

  // 1. Extract Stats
  const runs = safeStats.runs || 0;
  const balls = safeStats.balls || 0;
  const wickets = safeStats.wickets || 0;
  // Handle naming variations for runs conceded
  const bowlRuns = type === 'MATCH'
    ? (safeStats.runsConceded || safeStats.bowlRuns || 0)
    : (safeStats.runsConceded || 0);
  const legalBalls = safeStats.legalBalls || 0;
  const fieldingPts = (safeStats.catches || 0) + (safeStats.runouts || 0) + (safeStats.stumpings || 0);

  // 2. Determine Visibility (Dynamic Logic)
  // Show batting if they faced balls OR scored runs (handles 0 runs off 1 ball)
  const showBatting = balls > 0 || runs > 0;
  // Show bowling if they bowled legal balls OR took wickets (handles 0 overs but 1 wicket scenario)
  const showBowling = legalBalls > 0 || wickets > 0;
  // Show fielding if they have any dismissals
  const showFielding = fieldingPts > 0;

  // 3. Dynamic Grid Layout Calculation
  const activeSections = [showBatting, showBowling, showFielding].filter(Boolean).length;
  // Default to 3 columns if 3 items, 2 if 2, 1 if 1.
  const gridCols = activeSections === 1 ? 'grid-cols-1' : activeSections === 2 ? 'grid-cols-2' : 'grid-cols-3';

  // Styling Variables
  const isSeries = type === 'SERIES';
  const accentColor = isSeries ? 'purple' : 'yellow';
  const bgGradient = isSeries ? 'from-purple-900/50 to-purple-600/20' : 'from-yellow-900/50 to-yellow-600/20';
  const borderColor = isSeries ? 'border-purple-500/30' : 'border-yellow-500/30';
  const Icon = isSeries ? Crown : Award;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} border ${borderColor} w-full max-w-sm mx-auto shadow-2xl mb-6`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-${accentColor}-500`}></div>
     
      {/* Player Header */}
      <div className="p-4 flex items-center gap-4">
        <PlayerAvatar player={player} size="xl" />
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-${accentColor}-400`}>
            <Icon size={12} /> {title}
          </div>
          <div className="text-xl font-black text-white leading-none mb-1">{player.name}</div>
          <div className="text-xs text-slate-400">{player.role}</div>
        </div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className={`bg-black/20 p-3 grid ${gridCols} divide-x divide-white/10`}>
       
        {/* Batting Section */}
        {showBatting && (
          <div className="text-center px-1">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Batting</div>
            <div className="text-sm font-bold text-white">
              {runs}<span className="text-[10px] text-slate-400 font-normal">({balls})</span>
            </div>
          </div>
        )}
       
        {/* Bowling Section */}
        {showBowling && (
          <div className="text-center px-1">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Bowling</div>
            <div className="text-sm font-bold text-white">
              {wickets}<span className="text-[10px] text-slate-400 font-normal">/{bowlRuns}</span>
            </div>
          </div>
        )}

        {/* Fielding Section */}
        {showFielding && (
          <div className="text-center px-1">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Fielding</div>
            <div className="text-sm font-bold text-white">
              {fieldingPts} <span className="text-[10px] text-slate-400 font-normal">acts</span>
            </div>
          </div>
        )}

        {/* Fallback (If no stats found but player won award) */}
        {activeSections === 0 && (
           <div className="text-center px-1 col-span-full">
             <div className="text-[9px] text-slate-500 italic">Key Impact Player</div>
           </div>
        )}
      </div>
    </div>
  );
};
// START OF PART 4
const MatchSettingsModal = ({ currentSettings, onUpdate, onClose }) => {
    const [lms, setLms] = useState(currentSettings.lastManStanding);
    const [maxOvers, setMaxOvers] = useState(currentSettings.maxOversPerBowler);

    const handleSave = () => {
        onUpdate(prev => ({ 
            ...prev, 
            lastManStanding: lms, 
            maxOversPerBowler: parseInt(maxOvers) 
        }));
        onClose();
    };

    return (
        <Modal title="In-Match Settings" onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-white">Last Man Standing</div>
                        <div className="text-xs text-slate-400">Allow last batter to play alone</div>
                    </div>
                    <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-blue-500 rounded cursor-pointer" 
                        checked={lms} 
                        onChange={e => setLms(e.target.checked)} 
                    />
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="font-bold text-white mb-2">Max Overs Per Bowler</div>
                    <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg text-white font-mono text-lg"
                        value={maxOvers} 
                        onChange={e => setMaxOvers(e.target.value)} 
                    />
                    <p className="text-xs text-slate-500 mt-2">Changes apply immediately to bowler selection limits.</p>
                </div>

                <Button onClick={handleSave}>Update Settings</Button>
            </div>
        </Modal>
    );
};
// START OF PART 5
// --- UPDATED WORM GRAPH (With Bar Chart Option) ---
const WormGraph = ({ currentInningsData, previousInningsData, matchSettings }) => {
    const [view, setView] = useState('WORM'); // 'WORM' or 'MANHATTAN'
    const width = 300;
    const height = 150;
    const totalBalls = matchSettings.totalOvers * 6;
    
    // Helper to aggregate runs per over for Bar Chart
    const getRunsPerOver = (history) => {
        const overs = [];
        let currentOverRuns = 0;
        history.forEach((ball, i) => {
            // Calculate runs scored on this specific ball (diff from previous total)
            const prevTotal = i > 0 ? history[i-1].totalRuns : 0;
            const runsOnBall = ball.totalRuns - prevTotal;
            currentOverRuns += runsOnBall;
            
            // If end of over (every 6th ball) or last ball
            if ((i + 1) % 6 === 0 || i === history.length - 1) {
                overs.push(currentOverRuns);
                currentOverRuns = 0;
            }
        });
        return overs;
    };

    const history = currentInningsData?.history || [];
    const prevHistory = previousInningsData?.timeline || [];

    const createPoints = (hist) => {
        if (!hist || hist.length === 0) return `0,${height}`;
        let points = `0,${height} `;
        hist.forEach((ballData, index) => {
             if(index > totalBalls) return;
             const x = ((index + 1) / totalBalls) * width;
             const currentRuns = ballData.totalRuns || 0;
             const maxY = previousInningsData?.runs ? Math.max(previousInningsData.runs + 20, 100) : Math.max(currentRuns + 50, 150); 
             const y = height - ((currentRuns / maxY) * height);
             points += `${x},${Math.max(0, y)} `;
        });
        return points;
    };

    const currentOvers = getRunsPerOver(history);

    return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <TrendingUp size={12}/> Match Analysis
                </h4>
                <div className="flex bg-slate-900 rounded p-1">
                    <button onClick={() => setView('WORM')} className={`px-2 py-1 text-[10px] rounded ${view==='WORM' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Worm</button>
                    <button onClick={() => setView('MANHATTAN')} className={`px-2 py-1 text-[10px] rounded ${view==='MANHATTAN' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Bar</button>
                </div>
            </div>

            <div className="relative h-[150px] w-full bg-slate-900/50 rounded border border-slate-700/30 overflow-hidden">
                {view === 'WORM' ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                         {/* Grid Lines */}
                        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#334155" strokeDasharray="4" strokeWidth="1"/>
                        
                        {/* Previous Innings Line */}
                        {prevHistory.length > 0 && (
                             <polyline points={createPoints(prevHistory)} fill="none" stroke="#64748b" strokeWidth="2" opacity="0.6" />
                        )}
                        {/* Current Innings Line */}
                        <polyline points={createPoints(history)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                ) : (
                    <div className="flex items-end h-full gap-1 px-2 pb-2">
                        {currentOvers.map((runs, i) => {
                            const h = Math.min((runs / 25) * 100, 100); // Max height assumed 25 runs/over
                            return (
                                <div key={i} className="flex-1 bg-blue-500 hover:bg-blue-400 transition-all rounded-t relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-white opacity-0 group-hover:opacity-100">{runs}</div>
                                </div>
                            )
                        })}
                        {currentOvers.length === 0 && <div className="w-full text-center text-xs text-slate-500 mt-10">Play overs to see data</div>}
                    </div>
                )}
            </div>
            
            {view === 'WORM' && previousInningsData && (
                <div className="flex justify-center gap-4 mt-2 text-[10px]">
                     <div className="flex items-center gap-1"><div className="w-3 h-1 bg-slate-500"></div> <span>1st Inn</span></div>
                     <div className="flex items-center gap-1"><div className="w-3 h-1 bg-blue-500"></div> <span>2nd Inn</span></div>
                </div>
            )}
        </div>
    );
};
// START OF PART 6
const ArchivesModal = ({ matchHistory, teams, players, onClose, onViewScorecard }) => {
    const getTeamName = (id) => teams.find(t => t.id === id)?.name || 'Unknown';
    const getPlayerName = (id) => players.find(p => p.id === id)?.name || 'Unknown';

    // FIX: Safely handle missing dates to prevent sort crashes
    const sortedHistory = [...matchHistory].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });

    return (
        <Modal title="Match Archives" onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-4">
                {sortedHistory.length === 0 && <p className="text-slate-500 text-center py-8">No matches played yet.</p>}
                {sortedHistory.map(match => {
  const t1 = match.scoreSummary?.t1 || {name: 'T1', runs:0, wickets:0};
  const t2 = match.scoreSummary?.t2 || {name: 'T2', runs:0, wickets:0};
  const winnerId = match.winnerId;
  const dateStr = match.date ? new Date(match.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '-';
 
  return (
    <div key={match.id} className="bg-neutral-900 border border-white/10 rounded-2xl mb-4 overflow-hidden shadow-lg group hover:border-orange-500/30 transition-all">
      <div className="bg-white/5 p-2 px-4 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
         <span>{dateStr} • {match.venue}</span>
         {match.momId && <span className="text-orange-400 flex items-center gap-1"><Crown size={10}/> MoM: {getPlayerName(match.momId)}</span>}
      </div>

      <div className="p-4 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
         <div className={`text-right ${t1.id === winnerId ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`font-black text-lg ${t1.id === winnerId ? 'text-white' : 'text-slate-400'}`}>{t1.name}</div>
            <div className="font-mono text-xl text-orange-500 leading-none">{t1.runs}/{t1.wickets}</div>
         </div>

         <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-600 bg-black/50 px-2 py-1 rounded-full border border-white/5">VS</span>
            <div className="mt-2 text-[9px] text-green-400 font-bold uppercase tracking-tight text-center">
               {winnerId === t1.id ? `${t1.name} Won` : winnerId === t2.id ? `${t2.name} Won` : 'Draw'}
            </div>
         </div>

         <div className={`text-left ${t2.id === winnerId ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`font-black text-lg ${t2.id === winnerId ? 'text-white' : 'text-slate-400'}`}>{t2.name}</div>
            <div className="font-mono text-xl text-orange-500 leading-none">{t2.runs}/{t2.wickets}</div>
         </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
         <button onClick={() => onViewScorecard(match)} className="p-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2">
            <ClipboardList size={14}/> Scorecard
         </button>
         <button onClick={() => {
            const winnerName = teams.find(t => t.id === match.winnerId)?.name || 'Unknown';
            alert(`Match won by ${winnerName}. Share feature enabled!`);
         }} className="p-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
            <Upload size={14}/> Share
         </button>
      </div>
    </div>
  );
})}
            </div>
        </Modal>
    );
};
// START OF PART 7 - PREMIUM ARCHIVED MATCH DETAIL
// START OF PART 7 - PREMIUM ARCHIVED DETAILS
const ArchivedMatchDetail = ({ match, players, onClose }) => {
  const getP = (id) => players.find(p => p.id === id) || { name: 'Unknown' };

  // Helper for Dismissal Text (Re-used here for Archives)
  const getDismissalText = (outData) => {
    if (!outData) return "not out";
    const bowlerName = outData.bowlerId ? getP(outData.bowlerId).name : "";
    const fielderName = outData.fielderId ? getP(outData.fielderId).name : "";

    switch (outData.howOut) {
      case 'Caught': return `c ${fielderName} b ${bowlerName}`;
      case 'Bowled': return `b ${bowlerName}`;
      case 'LBW': return `lbw b ${bowlerName}`;
      case 'Run Out': return `run out (${fielderName})`;
      case 'Stumped': return `st ${fielderName} b ${bowlerName}`;
      case 'Hit Wicket': return `hit wicket b ${bowlerName}`;
      default: return outData.howOut;
    }
  };

  const renderInnings = (battingStats, bowlerStats, outPlayers, teamName, runs, wickets, overs) => {
  const batters = Object.keys(battingStats);
  return (
    <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* INNINGS HEADER CARD */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-neutral-900 to-black border-x border-t border-white/10 p-5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[40px] rounded-full"></div>
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
            <div>
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-0.5">Innings</div>
              <h3 className="text-2xl font-black text-white italic">{teamName}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white leading-none">
              {runs}<span className="text-xl text-slate-500 font-medium">/{wickets}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1 bg-white/5 px-2 py-0.5 rounded inline-block">
              {overs} Overs
            </div>
          </div>
        </div>
      </div>

      {/* BATTING TABLE */}
      <div className="bg-neutral-900/80 border-x border-b border-white/10 rounded-b-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-[3fr_1fr_1fr_1.5fr] gap-2 p-2 bg-black/40 text-[9px] text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
          <div className="pl-3">Batter</div>
          <div className="text-center">R (B)</div>
          <div className="text-center">4s/6s</div>
          <div className="text-right pr-3">SR</div>
        </div>
        <div className="divide-y divide-white/5">
          {batters.length === 0 && <p className="text-center text-xs text-slate-500 py-4 italic">No batting data</p>}
          {batters.map(pid => {
            const stat = battingStats[pid];
            // FIX: Ensure we look for 'playerId' (Case Sensitive check)
            const outInfo = outPlayers.find(o => o.playerId === pid);
            const status = outInfo ? getDismissalText(outInfo) : 'not out';
            const isNotOut = status === 'not out';
            const sr = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(0) : '0';
           
            return (
              <div key={pid} className="grid grid-cols-[3fr_1fr_1fr_1.5fr] gap-2 p-3 items-center hover:bg-white/5 transition-colors">
                <div className="pl-1">
                  <div className={`text-sm font-bold ${isNotOut ? 'text-orange-400' : 'text-slate-200'}`}>
                    {getP(pid).name}{isNotOut && '*'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate italic">{status}</div>
                </div>
                <div className="text-center">
                  <span className="text-white font-bold">{stat.runs}</span>
                  <span className="text-slate-500 text-xs"> ({stat.balls})</span>
                </div>
                <div className="text-center text-xs text-slate-400">
                  {stat.fours}<span className="text-slate-600">/</span>{stat.sixes}
                </div>
                <div className="text-right pr-3 font-mono text-xs text-slate-500">{sr}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOWLING TABLE */}
      {Object.keys(bowlerStats).length > 0 && (
        <div className="mt-2 bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden shadow-inner">
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr] gap-2 p-2 bg-black/20 text-[9px] text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
            <div className="col-span-1 pl-2">Bowler</div>
            <div className="text-center">O</div>
            <div className="text-center">R</div>
            <div className="text-center text-orange-500">W</div>
            <div className="text-right pr-2">Econ</div>
          </div>
          <div className="divide-y divide-white/5">
            {Object.keys(bowlerStats).map(pid => {
              const stat = bowlerStats[pid];
              const oversDecimal = (stat.legalBalls || 0) / 6;
              const economy = oversDecimal > 0 ? (stat.runs / oversDecimal).toFixed(1) : "0.0";
              return (
                <div key={pid} className="grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr] gap-2 p-3 px-3 items-center hover:bg-white/5 transition-colors">
                  <div className="col-span-1 pl-2">
                    <div className="text-sm font-medium text-slate-300 truncate text-left">{getP(pid).name}</div>
                  </div>
                  <div className="text-center text-xs font-mono text-slate-400">{getOversFromBalls(stat.legalBalls)}</div>
                  <div className="text-center text-xs font-mono text-slate-300">{stat.runs}</div>
                  <div className="text-center text-sm font-black text-orange-500">{stat.wickets}</div>
                  <div className="text-right pr-2 text-xs font-mono text-slate-500">{economy}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <Modal title="Match Details" onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* MATCH HEADER INFO */}
        <div className="text-center mb-6 relative">
           <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {new Date(match.date).toDateString()} • {match.venue}
           </div>
           <div className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">
              Winner: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                 {match.scoreSummary?.t1?.id === match.winnerId ? match.scoreSummary.t1.name : match.scoreSummary?.t2?.name}
              </span>
           </div>
        </div>

        {/* WAGON WHEEL (If available) */}
        {(match.timeline || match.innings1?.timeline) && (
           <div className="mb-8">
              <WagonWheel timeline={[...(match.firstInningsTimeline || []), ...(match.timeline || [])]} />
           </div>
        )}

        {/* INNINGS 1 */}
        {match.innings1 && renderInnings(
           match.innings1.battingStats || {},
           match.innings1.bowlerStats || {},
           match.innings1.outPlayers || [],
           match.innings1.teamName || "1st Innings",
           match.innings1.runs,
           match.innings1.wickets,
           `${match.innings1.overs}.${match.innings1.balls}`
        )}

        {/* INNINGS 2 */}
        {match.innings2 && renderInnings(
           match.innings2.battingStats || {},
           match.innings2.bowlerStats || {},
           match.innings2.outPlayers || [],
           match.innings2.teamName || "2nd Innings",
           match.innings2.runs,
           match.innings2.wickets,
           `${match.innings2.overs}.${match.innings2.balls}`
        )}

        {/* FALLBACK FOR OLD DATA */}
        {!match.innings1 && !match.innings2 && (
           <div className="text-center text-slate-500 p-8 border border-white/10 rounded-2xl bg-white/5 italic">
              Detailed innings data not available for this legacy match.
              <div className="mt-4">
                 {renderInnings(match.battingStats || {}, match.bowlerStats || {}, match.outPlayers || [], "Aggregate Stats", "N/A", "N/A", "N/A")}
              </div>
           </div>
        )}
      </div>
    </Modal>
  );
};
// START OF PART 8 - PREMIUM RANKINGS MODAL (Nightfire Edition)
const RankingsModal = ({ matchSettings, players, matchHistory, battingStats, bowlerStats, firstInningsData, onClose, outPlayers: currentOutPlayers }) => {
  const [category, setCategory] = useState('BATTING');
  const [subFilter, setSubFilter] = useState('RUNS');
  const [venueFilter, setVenueFilter] = useState('ALL');

  const currentBatting = { ...battingStats, ...(firstInningsData?.battingStats || {}) };
  const currentBowling = { ...bowlerStats, ...(firstInningsData?.bowlerStats || {}) };
  const aggregatedPlayers = {};

  const mergeStats = (pid, bat, bowl, field) => {
    if (!aggregatedPlayers[pid]) aggregatedPlayers[pid] = {
      bat: { runs: 0, balls: 0, fours: 0, sixes: 0 },
      bowl: { runs: 0, wickets: 0, overs: 0, legalBalls: 0 },
      field: { catches: 0, runouts: 0, stumpings: 0 }
    };

    if (bat) {
      aggregatedPlayers[pid].bat.runs += bat.runs || 0;
      aggregatedPlayers[pid].bat.balls += bat.balls || 0;
      aggregatedPlayers[pid].bat.fours += bat.fours || 0;
      aggregatedPlayers[pid].bat.sixes += bat.sixes || 0;
    }
    if (bowl) {
      aggregatedPlayers[pid].bowl.runs += bowl.runs || 0;
      aggregatedPlayers[pid].bowl.wickets += bowl.wickets || 0;
      aggregatedPlayers[pid].bowl.legalBalls += bowl.legalBalls || 0;
    }
    if (field) {
      aggregatedPlayers[pid].field.catches += field.catches || 0;
      aggregatedPlayers[pid].field.runouts += field.runouts || 0;
      aggregatedPlayers[pid].field.stumpings += field.stumpings || 0;
    }
  };

  const processFielding = (outPlayers) => {
    const fieldStats = {};
    if (!outPlayers) return fieldStats;
    outPlayers.forEach(out => {
      if (out.fielderId) {
        if (!fieldStats[out.fielderId]) fieldStats[out.fielderId] = { catches: 0, runouts: 0, stumpings: 0 };
        if (out.howOut === 'Caught') fieldStats[out.fielderId].catches++;
        if (out.howOut === 'Run Out') fieldStats[out.fielderId].runouts++;
        if (out.howOut === 'Stumped') fieldStats[out.fielderId].stumpings++;
      }
    });
    return fieldStats;
  };

  // --- AGGREGATION LOGIC ---
  matchHistory.forEach(m => {
    if (venueFilter === 'ALL' || m.venue === venueFilter) {
      const fieldStats = processFielding(m.outPlayers);
      if (m.battingStats) Object.entries(m.battingStats).forEach(([pid, stats]) => mergeStats(pid, stats, null, null));
      if (m.bowlerStats) Object.entries(m.bowlerStats).forEach(([pid, stats]) => mergeStats(pid, null, stats, null));
      Object.entries(fieldStats).forEach(([pid, stats]) => mergeStats(pid, null, null, stats));
    }
  });

  if (venueFilter === 'ALL' || matchSettings.venue === venueFilter) {
    const currentFieldStats = processFielding([...(firstInningsData?.outPlayers || []), ...(currentOutPlayers || [])]);
    Object.entries(currentBatting).forEach(([pid, stats]) => mergeStats(pid, stats, null, null));
    Object.entries(currentBowling).forEach(([pid, stats]) => mergeStats(pid, null, stats, null));
    Object.entries(currentFieldStats).forEach(([pid, stats]) => mergeStats(pid, null, null, stats));
  }

  const sortedPlayers = Object.keys(aggregatedPlayers).map(pid => {
    const pDetails = players.find(p => p.id === pid);
    return {
      ...aggregatedPlayers[pid],
      id: pid,
      name: pDetails?.name || 'Unknown',
      image: pDetails?.image
    };
  }).sort((a, b) => {
    if (category === 'MVP') return calculateMVPPoints(b.bat, b.bowl, b.field) - calculateMVPPoints(a.bat, a.bowl, a.field);
   
    if (category === 'BATTING') {
      if (subFilter === 'SR') {
        const srA = a.bat.balls > 0 ? (a.bat.runs / a.bat.balls) * 100 : 0;
        const srB = b.bat.balls > 0 ? (b.bat.runs / b.bat.balls) * 100 : 0;
        return srB - srA;
      }
      if (subFilter === '4s') return b.bat.fours - a.bat.fours;
      if (subFilter === '6s') return b.bat.sixes - a.bat.sixes;
      return b.bat.runs - a.bat.runs;
    }

    if (category === 'BOWLING') {
      if (subFilter === 'ECON') {
        const ovA = a.bowl.legalBalls / 6;
        const ovB = b.bowl.legalBalls / 6;
        const econA = ovA > 0 ? a.bowl.runs / ovA : 999;
        const econB = ovB > 0 ? b.bowl.runs / ovB : 999;
        if (ovA === 0) return 1;
        if (ovB === 0) return -1;
        return econA - econB;
      }
      return b.bowl.wickets - a.bowl.wickets;
    }

    if (category === 'FIELDING') {
      if (subFilter === 'CATCHES') return b.field.catches - a.field.catches;
      if (subFilter === 'RUNOUTS') return b.field.runouts - a.field.runouts;
      if (subFilter === 'STUMPINGS') return b.field.stumpings - a.field.stumpings;
      const ptsA = (a.field.catches * 10) + (a.field.runouts * 15) + (a.field.stumpings * 10);
      const ptsB = (b.field.catches * 10) + (b.field.runouts * 15) + (b.field.stumpings * 10);
      return ptsB - ptsA;
    }
    return 0;
  });

  return (
    <Modal title="Rankings" onClose={onClose}>
      {/* 1. VENUE FILTER */}
      <div className="mb-6 relative">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Venue Filter</label>
        <div className="relative">
           <MapPin className="absolute left-3 top-3.5 text-orange-500" size={16} />
           <select
             className="w-full bg-neutral-900 border border-white/5 p-3 pl-10 rounded-xl text-white text-sm outline-none focus:border-orange-500 appearance-none font-medium cursor-pointer hover:border-orange-500/50 transition-colors"
             value={venueFilter} onChange={e => setVenueFilter(e.target.value)}
           >
             <option value="ALL">All Venues</option>
             {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
           </select>
           <div className="absolute right-3 top-4 pointer-events-none">
              <ChevronRight className="rotate-90 text-slate-600" size={14} />
           </div>
        </div>
      </div>

      {/* 2. CATEGORY TABS (Premium Gradient) */}
      <div className="grid grid-cols-4 gap-2 mb-6 p-1 bg-neutral-900/50 rounded-xl border border-white/5">
        {['BATTING', 'BOWLING', 'FIELDING', 'MVP'].map(cat => (
           <button
             key={cat}
             onClick={() => setCategory(cat)}
             className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                category === cat
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/20 scale-105'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
             }`}
           >
             {cat}
           </button>
        ))}
      </div>

      {/* 3. SUB-FILTERS (Glass Chips) */}
      {category !== 'MVP' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          {(category === 'BATTING' ? ['RUNS', 'SR', '4s', '6s'] :
            category === 'BOWLING' ? ['WICKETS', 'ECON'] :
            ['OVERALL', 'CATCHES', 'RUNOUTS', 'STUMPINGS']).map(filter => (
              <button
                key={filter}
                onClick={() => setSubFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all whitespace-nowrap ${
                   subFilter === filter
                   ? 'bg-neutral-800 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                   : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300'
                }`}
              >
                {filter}
              </button>
          ))}
        </div>
      )}

      {/* 4. PLAYERS LIST (Podium Style) */}
      <div className="space-y-3">
        {sortedPlayers.length === 0 && <p className="text-center text-slate-500 py-8 italic">No stats available for this filter.</p>}
       
        {sortedPlayers.map((p, i) => {
          let val = 0;
          if (category === 'MVP') val = calculateMVPPoints(p.bat, p.bowl, p.field);
          else if (category === 'BATTING') val = subFilter === 'SR' ? ((p.bat.runs/p.bat.balls || 0)*100).toFixed(1) : subFilter === '4s' ? p.bat.fours : subFilter === '6s' ? p.bat.sixes : p.bat.runs;
          else if (category === 'BOWLING') val = subFilter === 'ECON' ? ((p.bowl.runs/(p.bowl.legalBalls/6)) || 0).toFixed(2) : p.bowl.wickets;
          else val = subFilter === 'CATCHES' ? p.field.catches : subFilter === 'RUNOUTS' ? p.field.runouts : subFilter === 'STUMPINGS' ? p.field.stumpings : (p.field.catches*10 + p.field.runouts*15 + p.field.stumpings*10);

          // PODIUM STYLING LOGIC - UNIFORM SIZE
          let rankClass = "bg-neutral-900 border-white/5 opacity-80 hover:opacity-100 hover:bg-black"; // Default
          // Clean Numbering (1, 2, 3, 4...)
          let rankIcon = <span className="text-slate-500 font-black text-sm italic">{i + 1}</span>;
          let textGlow = "text-white";

          // GOLD
          if (i === 0) {
             rankClass = "bg-gradient-to-r from-yellow-900/20 to-neutral-900 border-yellow-500/50 shadow-lg relative overflow-hidden";
             rankIcon = <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-yellow-500/50"><Crown size={14} fill="black" /></div>;
             textGlow = "text-yellow-400 drop-shadow-md";
          }
          // SILVER
          else if (i === 1) {
             rankClass = "bg-gradient-to-r from-slate-800 to-neutral-900 border-slate-400/50 shadow-lg";
             rankIcon = <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-black font-black text-[10px] shadow-lg">2</div>;
             textGlow = "text-slate-200";
          }
          // BRONZE
          else if (i === 2) {
             rankClass = "bg-gradient-to-r from-orange-900/20 to-neutral-900 border-orange-700/50 shadow-lg";
             rankIcon = <div className="w-6 h-6 rounded-full bg-orange-700 flex items-center justify-center text-white font-black text-[10px] shadow-lg">3</div>;
             textGlow = "text-orange-200";
          }

          return (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group ${rankClass}`}>
              {/* Shine Effect for #1 */}
              {i === 0 && <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-500/10 blur-[40px] rounded-full pointer-events-none"></div>}

              {/* Hover Glow Effect for EVERY player (Animation) */}
              <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>

              <div className="flex items-center gap-4 relative z-10">
                {/* Rank Indicator */}
                <div className="w-8 flex justify-center">{rankIcon}</div>
               
                <PlayerAvatar player={p} size={i === 0 ? "md" : "sm"} />
               
                <div>
                  <div className={`font-bold text-sm ${i === 0 ? 'text-white' : 'text-slate-300'}`}>{p.name}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{p.role}</div>
                </div>
              </div>

              <div className="text-right relative z-10 pr-2">
                <span className={`font-black block leading-none text-xl ${textGlow}`}>{val}</span>
                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">
                  {category === 'BATTING' ? subFilter : category === 'BOWLING' ? subFilter : category === 'FIELDING' ? subFilter : 'Pts'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
// START OF PART 9 - PREMIUM PLAYER PROFILES & LIST (Soft Black Theme)
const PlayerProfileModal = ({ players, matchHistory, onClose, onResetProfile }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [venueFilter, setVenueFilter] = useState('ALL');

  const getPlayerStats = (pid) => {
    let stats = {
      matches: 0,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      fifties: 0,
      hundreds: 0,
      notOuts: 0,
      wickets: 0,
      overs: 0,
      runsConceded: 0,
      maidens: 0,
      catches: 0,
      runouts: 0,
      stumpings: 0,
      highestScore: 0,
      bestBowling: { wickets: 0, runs: 0 },
      recentScores: [],
      shots: [],
      momCount: 0, // <--- NEW: Initialize MOM Count
      mosCount: 0  // <--- NEW: Initialize MOS Count
    };

    matchHistory.forEach(m => {
      if (venueFilter !== 'ALL' && m.venue !== venueFilter) return;
// --- NEW LOGIC STARTS HERE ---
      // Check for Man of the Match
      if (m.momId === pid) {
        stats.momCount++;
      }
      // Check for Man of the Series (Note: You'll need to save 'mosId' in your matchHistory for this to work perfectly in the future)
      if (m.mosId === pid) {
        stats.mosCount++;
      }
      // --- NEW LOGIC ENDS HERE ---
      // Collect Shots
      if (m.timeline) {
         const playerShots = m.timeline.filter(t => t.strikerId === pid && t.shotDirection);
         stats.shots.push(...playerShots);
      }
      if (m.firstInningsTimeline) {
         const pShots = m.firstInningsTimeline.filter(t => t.strikerId === pid && t.shotDirection);
         stats.shots.push(...pShots);
      }

      let played = false;

      // Batting
      if (m.battingStats && m.battingStats[pid]) {
        played = true;
        const b = m.battingStats[pid];
        stats.runs += b.runs;
        stats.balls += b.balls;
        stats.fours += b.fours;
        stats.sixes += b.sixes;
        if (b.runs >= 100) stats.hundreds++;
        else if (b.runs >= 50) stats.fifties++;
        if (b.runs > stats.highestScore) stats.highestScore = b.runs;
       
        const isOut = m.outPlayers.some(o => o.playerId === pid);
        if (!isOut) stats.notOuts++;
       
        const scoreString = `${b.runs}${!isOut ? '*' : ''}(${b.balls})`;
        stats.recentScores.push(scoreString);
      }

      // Bowling
      if (m.bowlerStats && m.bowlerStats[pid]) {
        played = true;
        const b = m.bowlerStats[pid];
        stats.runsConceded += b.runs;
        stats.wickets += b.wickets;
        stats.overs += (b.legalBalls || 0) / 6;
        stats.maidens += (b.maidens || 0);
       
        if (b.wickets > stats.bestBowling.wickets || (b.wickets === stats.bestBowling.wickets && b.runs < stats.bestBowling.runs)) {
          stats.bestBowling = { wickets: b.wickets, runs: b.runs };
        }
      }

      // Fielding
      m.outPlayers.forEach(out => {
        if (out.fielderId === pid) {
          played = true;
          if (out.howOut === 'Caught') stats.catches++;
          if (out.howOut === 'Run Out') stats.runouts++;
          if (out.howOut === 'Stumped') stats.stumpings++;
        }
      });

      if (played) stats.matches++;
    });

    stats.recentScores = stats.recentScores.slice(-5).reverse();
    return stats;
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const stats = selectedPlayer ? getPlayerStats(selectedPlayerId) : null;
 
  const battingAvg = stats ? (stats.runs / (stats.matches - stats.notOuts || 1)).toFixed(2) : 0;
  const strikeRate = stats ? (stats.balls > 0 ? (stats.runs / stats.balls * 100).toFixed(2) : '0.00') : 0;
  const bowlingAvg = stats ? (stats.wickets > 0 ? (stats.runsConceded / stats.wickets).toFixed(2) : '0.00') : 0;
  const economy = stats ? (stats.overs > 0 ? (stats.runsConceded / stats.overs).toFixed(2) : '0.00') : 0;

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleResetClick = () => {
    if (confirm(`Are you sure you want to reset stats for ${selectedPlayer.name}? This cannot be undone.`)) {
      onResetProfile(selectedPlayer.id);
      setSelectedPlayerId(null);
    }
  };

  return (
    <Modal title={selectedPlayer ? "Player Profile" : "Career Profiles"} onClose={onClose} maxWidth="max-w-4xl">
      {selectedPlayer ? (
        <div className="flex flex-col md:flex-row gap-6 p-1">
          {/* LEFT COLUMN: AVATAR CARD */}
          <div className="flex flex-col items-center gap-4 bg-neutral-900 border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden h-fit w-full md:w-72">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
             
             <div className="mt-2 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-full opacity-30 blur group-hover:opacity-60 transition duration-500"></div>
                <div className="relative"><PlayerAvatar player={selectedPlayer} size="xl" /></div>
             </div>
             
             <div className="text-center relative z-10">
                <h2 className="text-3xl font-black text-white tracking-tight">{selectedPlayer.name}</h2>
                <p className="text-orange-500 font-bold uppercase text-[10px] tracking-widest mt-1">{selectedPlayer.role}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">{selectedPlayer.battingStyle} • {selectedPlayer.bowlingStyle}</p>
             </div>

             <div className="w-full pt-4 border-t border-white/5 mt-2 space-y-2">
                <div className="flex justify-between text-sm items-center bg-black/40 p-3 rounded-lg border border-white/5">
                   <span className="text-slate-400 text-xs uppercase font-bold">Matches</span>
                   <span className="font-mono font-bold text-white">{stats.matches}</span>
                </div>
                <div className="flex justify-between text-sm items-center bg-black/40 p-3 rounded-lg border border-orange-500/20">
                   <span className="text-orange-400 text-xs uppercase font-bold">MVP Pts</span>
                   <span className="font-black text-orange-500">{calculateMVPPoints({runs: stats.runs, fours: stats.fours, sixes: stats.sixes}, {wickets: stats.wickets, maidens: stats.maidens}, {catches: stats.catches, runouts: stats.runouts, stumpings: stats.stumpings})}</span>
                </div>
                {/* --- NEW AWARDS SECTION START --- */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {/* Man of the Match */}
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex flex-col items-center justify-center group hover:border-orange-500/30 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy size={12} className="text-orange-500" />
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">M.O.M</span>
                      </div>
                      <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                        {stats.momCount}
                      </span>
                    </div>

                    {/* Man of the Series */}
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex flex-col items-center justify-center group hover:border-yellow-500/30 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Crown size={12} className="text-yellow-500" />
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">M.O.S</span>
                      </div>
                      <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                        {stats.mosCount}
                      </span>
                    </div>
                  </div>
                  {/* --- NEW AWARDS SECTION END --- */}
             </div>

             <div className="w-full mt-4">
                <label className="text-[9px] text-slate-500 uppercase font-bold mb-1.5 block tracking-widest">Filter by Venue</label>
                <select
                   className="w-full bg-black/40 border border-white/5 p-2.5 rounded-xl text-white text-xs outline-none focus:border-orange-500 transition-colors cursor-pointer"
                   value={venueFilter}
                   onChange={e => setVenueFilter(e.target.value)}
                >
                   <option value="ALL">All Venues</option>
                   {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>

             <div className="w-full flex flex-col gap-3 mt-6">
                <Button variant="danger" onClick={handleResetClick} className="w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-900/20">Reset Stats</Button>
                <Button variant="secondary" onClick={() => setSelectedPlayerId(null)} className="w-full py-2.5 text-xs font-bold uppercase tracking-wider border-white/10 hover:bg-white/5">Back to List</Button>
             </div>
          </div>

          {/* RIGHT COLUMN: STATS */}
          <div className="flex-1 space-y-6">
             {/* WAGON WHEEL */}
             {stats.shots && stats.shots.length > 0 && (
                <WagonWheel timeline={stats.shots} title={`${selectedPlayer.name}'s Scoring Areas`} />
             )}

             {/* BATTING CARD */}
             <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={64} className="text-orange-500"/></div>
                <h3 className="text-sm font-black text-orange-500 uppercase mb-6 flex items-center gap-2 tracking-widest border-b border-white/5 pb-4">
                   <Activity size={16} /> Batting Career
                </h3>
               
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Runs</div><div className="text-3xl font-black text-white">{stats.runs}</div></div>
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Balls</div><div className="text-3xl font-black text-white">{stats.balls}</div></div>
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Highest</div><div className="text-2xl font-bold text-white">{stats.highestScore}{stats.notOuts > 0 && '*'}</div></div>
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Average</div><div className="text-2xl font-bold text-white">{battingAvg}</div></div>
                   
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Strike Rate</div><div className="text-xl font-bold text-slate-200">{strikeRate}</div></div>
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">50s / 100s</div><div className="text-xl font-bold text-slate-200">{stats.fifties} / {stats.hundreds}</div></div>
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Fours</div><div className="text-xl font-bold text-amber-400">{stats.fours}</div></div>
                   <div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Sixes</div><div className="text-xl font-bold text-orange-500">{stats.sixes}</div></div>
                </div>

                {/* RECENT FORM (Bright Balls Fix) */}
                <div className="mt-8 pt-6 border-t border-white/5">
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity size={14} /> Recent Form <span className="text-slate-600 normal-case tracking-normal">(Last 5 Innings)</span>
                   </div>
                   <div className="flex gap-3">
                      {stats.recentScores.length > 0 ? stats.recentScores.map((s, i) => {
                         const isNotOut = s.includes('*');
                         const runs = parseInt(s.split('*')[0].split('(')[0]);
                         const balls = s.split('(')[1]?.replace(')', '') || '0';
                         
                         let bgClass = "bg-black border-white/5";
                         let textClass = "text-white";
                         
                         if (runs >= 50) bgClass = "bg-gradient-to-br from-orange-600 to-red-600 border-orange-500";
                         else if (runs >= 30) bgClass = "bg-neutral-800 border-orange-500/50";
                         else if (runs === 0 && !isNotOut) textClass = "text-red-500";

                         return (
                            <div key={i} className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border ${bgClass} shadow-lg relative group hover:scale-105 transition-transform`}>
                               {isNotOut && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>}
                               <div className={`text-2xl font-black ${textClass} leading-none mb-0.5`}>{runs}</div>
                               <div className="text-[10px] font-bold text-white opacity-90">{balls}b</div>
                            </div>
                         );
                      }) : <span className="text-slate-600 text-xs italic">No data</span>}
                   </div>
                </div>
             </div>

             {/* BOWLING & FIELDING GRID */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                   <h3 className="text-sm font-black text-emerald-500 uppercase mb-5 flex items-center gap-2 tracking-wider border-b border-white/5 pb-3">
                      <Target size={16} /> Bowling
                   </h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Wickets</span><span className="text-3xl font-black text-white">{stats.wickets}</span></div>
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Best</span><span className="text-xl font-bold text-white">{stats.bestBowling.wickets}/{stats.bestBowling.runs}</span></div>
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Average</span><span className="text-lg font-bold text-slate-300">{bowlingAvg}</span></div>
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Economy</span><span className="text-lg font-bold text-slate-300">{economy}</span></div>
                   </div>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                   <h3 className="text-sm font-black text-purple-500 uppercase mb-5 flex items-center gap-2 tracking-wider border-b border-white/5 pb-3">
                      <Shield size={16} /> Fielding
                   </h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Catches</span><span className="text-2xl font-black text-white">{stats.catches}</span></div>
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Run Outs</span><span className="text-2xl font-black text-white">{stats.runouts}</span></div>
                      <div className="flex justify-between items-end"><span className="text-xs text-slate-500 font-bold uppercase">Stumpings</span><span className="text-2xl font-black text-white">{stats.stumpings}</span></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        /* --- LIST VIEW (Career Profiles) - SOFT BLACK CARDS & CHIPS --- */
        <div className="space-y-4 h-full flex flex-col">
          {/* SEARCH BAR */}
          <div className="relative">
             <Search className="absolute left-4 top-4 text-slate-500" size={18} />
             <input
               className="w-full bg-neutral-900 border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder-slate-600 font-medium"
               placeholder="Search player..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          {/* PLAYERS LIST GRID */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {filteredPlayers.length === 0 && <p className="text-slate-500 text-center col-span-2 py-12 italic">No players found.</p>}
               
               {filteredPlayers.map(p => {
                 const s = getPlayerStats(p.id);
                 return (
                   <button
                     key={p.id}
                     onClick={() => setSelectedPlayerId(p.id)}
                     className="group relative flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-white/5 hover:border-orange-500/50 hover:bg-neutral-800 transition-all duration-300 shadow-md hover:shadow-orange-900/10 text-left"
                   >
                     {/* Decorative Side Bar */}
                     <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                     <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-neutral-800 to-black group-hover:from-orange-500 group-hover:to-red-600 transition-colors">
                           <div className="w-full h-full rounded-full overflow-hidden bg-black">
                              <PlayerAvatar player={p} size="full" />
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                       <div className="font-black text-lg text-white truncate group-hover:text-orange-400 transition-colors tracking-tight">{p.name}</div>
                       
                       {/* STATS CHIPS (Premium Look) */}
                       <div className="flex gap-2 items-center flex-wrap">
                          <div className="px-2 py-0.5 rounded-md bg-black border border-white/5 flex items-center gap-1.5 shadow-sm">
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Mat</span>
                             <span className="text-xs font-black text-white">{s.matches}</span>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-black border border-white/5 flex items-center gap-1.5 shadow-sm">
                             <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wide">Runs</span>
                             <span className="text-xs font-black text-white">{s.runs}</span>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-black border border-white/5 flex items-center gap-1.5 shadow-sm">
                             <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Wkts</span>
                             <span className="text-xs font-black text-white">{s.wickets}</span>
                          </div>
                       </div>
                     </div>

                     <ChevronRight className="text-slate-700 group-hover:text-orange-500 transition-colors transform group-hover:translate-x-1" size={20}/>
                   </button>
                 );
               })}
             </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
// START OF PART 10
// START OF PART 10 - PREMIUM PLAYER MANAGER (Nightfire Style)
const PlayerManagerModal = ({ players, setPlayers, onClose }) => {
  const [view, setView] = useState('LIST');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = () => {
    if (editId) {
      setPlayers(players.map(p => p.id === editId ? { ...formData, id: editId } : p));
    } else {
      setPlayers([...players, { ...formData, id: generateId() }]);
    }
    setView('LIST');
  };

  const handleDelete = (id) => {
    if (confirm("Delete player? This might break teams containing this player.")) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await compressImage(e.target.files[0]);
      setFormData({ ...formData, image: base64 });
    }
  };

  // Filter players for search
  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal title="Player Manager" onClose={onClose} maxWidth="max-w-2xl">
      {view === 'LIST' ? (
        <div className="space-y-4 h-full flex flex-col">
          {/* SEARCH & ADD HEADER */}
          <div className="flex gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-orange-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Search by name or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button onClick={() => { setFormData({ name: '', role: 'Batsman', battingStyle: 'Right', bowlingStyle: 'Right Arm Seam' }); setEditId(null); setView('EDIT'); }} className="px-6 bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-orange-900/20">
                <Plus size={18} /> <span className="hidden sm:inline ml-2">Add</span>
             </Button>
          </div>
         
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPlayers.length === 0 && <p className="text-slate-500 col-span-2 text-center py-12 italic">No players found.</p>}
             
              {filteredPlayers.map(p => (
                <div key={p.id} className="group flex items-center gap-4 bg-neutral-900/40 border border-white/5 p-3 rounded-2xl hover:bg-black hover:border-orange-500/40 transition-all shadow-md hover:shadow-orange-900/10 relative overflow-hidden">
                 
                  {/* Decorative Side Glow */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Avatar with Ring */}
                  <div className="relative">
                     <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-neutral-700 to-black group-hover:from-orange-500 group-hover:to-red-600 transition-colors">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black">
                           <PlayerAvatar player={p} size="full" />
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="font-bold truncate text-slate-200 group-hover:text-white text-base">{p.name}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-orange-500/80 mb-0.5">{p.role}</div>
                    <div className="text-[10px] text-slate-500 truncate">{p.battingStyle} • {p.bowlingStyle}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setFormData(p); setEditId(p.id); setView('EDIT'); }} className="p-1.5 bg-neutral-800 hover:bg-blue-600 hover:text-white rounded text-slate-400 transition-colors">
                       <Edit2 size={14}/>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-neutral-800 hover:bg-red-600 hover:text-white rounded text-slate-400 transition-colors">
                       <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* UPLOAD HERO */}
          <div className="flex justify-center mb-2">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-900/20">
                 <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                    <PlayerAvatar player={formData} size="xl" />
                 </div>
              </div>
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                <Camera className="text-white drop-shadow-md" size={28} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Player Name</label>
              <input
                 className="w-full bg-black border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 p-4 rounded-xl text-white outline-none transition-all font-bold text-lg shadow-inner placeholder-slate-700"
                 value={formData.name || ''}
                 onChange={e => setFormData({ ...formData, name: e.target.value })}
                 placeholder="e.g., Virat Kohli"
              />
            </div>
           
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Role</label>
                <select className="w-full bg-black border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 transition-all appearance-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicketkeeper</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Batting Style</label>
                <select className="w-full bg-black border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 transition-all appearance-none" value={formData.battingStyle} onChange={e => setFormData({ ...formData, battingStyle: e.target.value })}>
                  <option>Right</option><option>Left</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Bowling Style</label>
              <select className="w-full bg-black border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 transition-all appearance-none" value={formData.bowlingStyle} onChange={e => setFormData({ ...formData, bowlingStyle: e.target.value })}>
                <option>Right Arm Seam</option>
                <option>Right Arm Spin</option>
                <option>Left Arm Seam</option>
                <option>Left Arm Spin</option>
                <option>None</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button variant="secondary" onClick={() => setView('LIST')} className="flex-1 bg-black hover:bg-neutral-900 border-white/10">Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-orange-900/30">Save Player</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
// START OF PART 11
// START OF PART 11 - TEAM MANAGER (True Black + Logo Upload)
const TeamManagerModal = ({ teams, setTeams, players, onClose }) => {
  const [view, setView] = useState('LIST');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});

  const handleSave = () => {
    if (editId) {
      setTeams(teams.map(t => t.id === editId ? { ...formData, id: editId } : t));
    } else {
      setTeams([...teams, { ...formData, id: generateId() }]);
    }
    setView('LIST');
  };

  const handleLogoUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await compressImage(e.target.files[0]);
      setFormData({ ...formData, image: base64 });
    }
  };

  const togglePlayerInTeam = (pid) => {
    const currentPlayers = formData.players || [];
    if (currentPlayers.includes(pid)) {
      setFormData({ ...formData, players: currentPlayers.filter(id => id !== pid) });
    } else {
      setFormData({ ...formData, players: [...currentPlayers, pid] });
    }
  };

  return (
    <Modal title="Team Manager" onClose={onClose} maxWidth="max-w-2xl">
      {view === 'LIST' ? (
        <div className="space-y-4">
          <Button onClick={() => { setFormData({ name: '', players: [] }); setEditId(null); setView('EDIT'); }} className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold shadow-lg shadow-orange-900/20">
            <Plus size={18} /> Create New Team
          </Button>
         
          <div className="space-y-3 mt-4">
            {teams.length === 0 && <p className="text-slate-500 text-center py-8 italic">No teams created yet.</p>}
            {teams.map(t => (
              <div key={t.id} className="group flex justify-between items-center bg-black border border-white/10 p-4 rounded-2xl hover:border-orange-500/50 transition-all shadow-lg hover:shadow-orange-900/10">
                <div className="flex items-center gap-4">
                   {/* Team Logo or Initial */}
                   <div className="w-14 h-14 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {t.image ? (
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-xl text-slate-600 group-hover:text-orange-500 transition-colors">{t.name.charAt(0)}</span>
                      )}
                   </div>
                   <div>
                      <div className="font-black text-lg text-white tracking-wide group-hover:text-orange-400 transition-colors">{t.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{t.players.length} Players</div>
                   </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setFormData(t); setEditId(t.id); setView('EDIT'); }}
                    className="p-3 bg-neutral-900 hover:bg-orange-500 hover:text-white rounded-xl text-slate-400 transition-colors border border-white/5">
                    <Edit2 size={16}/>
                  </button>
                  <button onClick={() => setTeams(teams.filter(x => x.id !== t.id))}
                    className="p-3 bg-neutral-900 hover:bg-red-600 hover:text-white rounded-xl text-slate-400 transition-colors border border-white/5">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 h-full flex flex-col">
         
          {/* LOGO UPLOAD SECTION */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-black border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-colors">
                 {formData.image ? (
                   <img src={formData.image} alt="Team Logo" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center">
                      <Shield size={32} className="text-slate-700 mx-auto mb-1" />
                      <span className="text-[9px] text-slate-600 uppercase font-bold">Add Logo</span>
                   </div>
                 )}
              </div>
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                 <Camera className="text-orange-500 drop-shadow-lg" size={28} />
                 <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          {/* TEAM NAME INPUT */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Team Name</label>
            <input
              className="w-full bg-black border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 p-4 rounded-xl text-white outline-none transition-all font-bold text-lg shadow-inner placeholder-slate-700"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mumbai Indians"
              autoFocus
            />
          </div>

          {/* SQUAD SELECTION GRID */}
          <div className="flex-1 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-end mb-3">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Squad</label>
               <span className="text-xs font-mono text-orange-400 bg-orange-900/10 px-2 py-1 rounded-lg border border-orange-500/20">{formData.players?.length || 0} Selected</span>
            </div>
           
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {players.length === 0 && <p className="col-span-2 text-slate-500 text-center text-sm py-10 italic">Add players in Player Manager first</p>}
                  {players.map(p => {
  const isSelected = formData.players?.includes(p.id);
  return (
    <button
      key={p.id}
      onClick={() => togglePlayerInTeam(p.id)}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group ${
         isSelected
         // FIX 1: Changed Blue background to Premium Orange/Black Gradient
         ? 'bg-gradient-to-r from-orange-600/20 to-neutral-900 border-orange-500 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]'
         // FIX 2: Darker unselected background (Black tone)
         : 'bg-black border-white/10 hover:bg-neutral-900'
      }`}
    >
      {/* Checkbox Indicator */}
      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
         isSelected ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/40' : 'bg-neutral-900 border border-white/10 text-transparent group-hover:border-orange-500/50'
      }`}>
         <Check size={14} strokeWidth={4} />
      </div>

      <PlayerAvatar player={p} size="sm" />
     
      <div className="text-left overflow-hidden">
         <div className={`text-sm truncate font-bold ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
            {p.name}
         </div>
         {/* FIX 3: Changed text color from dark grey to bright slate so it's visible */}
         <div className={`text-[10px] truncate font-medium ${isSelected ? 'text-orange-200/70' : 'text-slate-500'}`}>
            {p.role}
         </div>
      </div>
     
      {/* Selected Glow Border */}
      {isSelected && <div className="absolute inset-0 rounded-xl ring-1 ring-orange-500/30 pointer-events-none"></div>}
    </button>
  );
})}
               </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button variant="secondary" onClick={() => setView('LIST')} className="flex-1 bg-black hover:bg-neutral-900 border-white/10">Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-orange-900/30">Save Team</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
// START OF PART 12 - PREMIUM SETUP SCREEN (Nightfire Edition)
const SetupScreen = ({ teams, players, onStart, onManagePlayers, onManageTeams, resumeId, onResume, onOpenRankings, onOpenProfiles, onExport, onImport, onOpenArchives, onRequestReset }) => {
  const [t1Id, setT1Id] = useState(teams[0]?.id || '');
  const [t2Id, setT2Id] = useState(teams[1]?.id || '');
  const [jokerId, setJokerId] = useState('');
  const [overs, setOvers] = useState(5);
  const [venue, setVenue] = useState('Box Cricket');
  const [lastManStanding, setLastManStanding] = useState(false);
  const [trackShots, setTrackShots] = useState(true);
  const [seriesType, setSeriesType] = useState('SINGLE');
  const [maxOversPerBowler, setMaxOversPerBowler] = useState(2);
  const fileInputRef = useRef(null);

  const team1Players = teams.find(t => t.id === t1Id)?.players || [];
  const team2Players = teams.find(t => t.id === t2Id)?.players || [];

  const handleOversChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setOvers(val);
    const recommendedMax = Math.max(1, Math.ceil(val / 5));
    setMaxOversPerBowler(recommendedMax);
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
     
      {/* 1. HERO HEADER */}
      <div className="text-center mb-10 mt-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="mx-auto flex justify-center animate-in zoom-in duration-1000 relative z-10">
          <img
            src={appLogo}
            alt="CricBharath"
            className="w-full max-w-[320px] h-auto object-contain hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_50px_rgba(249,115,22,0.5)]"
          />
        </div>
        <div className="relative z-10 -mt-8 mb-6">
          <p className="text-sm md:text-base font-black italic tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-orange-400 drop-shadow-sm opacity-90 animate-pulse-slow">
            Professional Cricket Scoring
          </p>
          <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-2 opacity-50"></div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur-md rounded-full border border-white/10 shadow-lg shadow-black/20 group hover:border-orange-500/30 transition-colors relative z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
          <span className="text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
            v3.0 <span className="opacity-50">|</span> Nightfire
          </span>
        </div>
      </div>
{/* --- NEW: RESUME BUTTON --- */}
      {resumeId && (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button
            onClick={() => onResume(resumeId)}
            className="w-full relative overflow-hidden group p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/50 shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-center">
               <div className="text-left">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Activity size={12} className="animate-pulse"/> Match In Progress
                  </div>
                  <div className="text-xl font-black text-white italic tracking-tight">Resume Match</div>
               </div>
               <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <ChevronRight size={20} />
               </div>
            </div>
          </button>
        </div>
      )}
      {/* 2. MAIN MENU GRID (Compact Glass Tiles) */}
      <div className="grid grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {[
          { label: "Players", icon: User, action: onManagePlayers },
          { label: "Teams", icon: Users, action: onManageTeams },
          { label: "Rankings", icon: BarChart2, action: onOpenRankings },
          { label: "Profiles", icon: Activity, action: onOpenProfiles },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="group relative flex flex-row items-center justify-start gap-4 p-4 rounded-xl bg-neutral-900 border border-white/5 hover:border-orange-500/50 hover:bg-black transition-all duration-300 shadow-lg active:scale-95"
          >
            <div className="p-2.5 rounded-full bg-black border border-white/5 group-hover:bg-orange-600/20 group-hover:text-orange-500 text-slate-400 transition-colors duration-300 shadow-inner">
              <item.icon size={20} />
            </div>
            <span className="text-sm font-bold text-slate-300 group-hover:text-white tracking-wide text-left">
              {item.label}
            </span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
              <ChevronRight size={16} className="text-orange-500" />
            </div>
          </button>
        ))}

        {/* Head-to-Head - Full Width */}
        <button
          onClick={() => onOpenArchives('H2H')}
          className="col-span-2 flex items-center justify-center gap-3 p-5 rounded-2xl bg-neutral-900 border border-white/5 hover:border-orange-500/30 group transition-all active:scale-95 shadow-lg hover:bg-black"
        >
          <Search size={20} className="text-orange-500/70 group-hover:text-orange-400" />
          <span className="font-bold text-slate-200 group-hover:text-white">Head-to-Head Analysis</span>
        </button>
      </div>

      {/* 3. ARCHIVES & RESET (Secondary Actions) */}
      <div className="grid grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100">
         <button onClick={onOpenArchives} className="p-4 rounded-xl bg-neutral-900 border border-white/5 hover:border-orange-500/40 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-black group shadow-md">
            <History size={16} className="group-hover:text-orange-400 transition-colors"/> Archives
         </button>
         <button onClick={onRequestReset} className="p-4 rounded-xl bg-red-950/10 border border-red-900/20 hover:border-red-500/50 text-red-500/70 hover:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-red-950/20 group shadow-md">
            <Trash2 size={16} className="group-hover:animate-bounce"/> Reset Stats
         </button>
      </div>

      {/* 4. BACKUP & RESTORE (Modernized) */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button onClick={onExport} className="flex items-center justify-center gap-2 p-3 bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 rounded-xl text-blue-200 hover:text-white text-xs font-bold uppercase tracking-wide transition-all border border-blue-500/20 shadow-lg hover:shadow-blue-500/10 active:scale-95">
          <Download size={16} className="text-blue-400" /> Backup
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 rounded-xl text-emerald-200 hover:text-white text-xs font-bold uppercase tracking-wide transition-all border border-emerald-500/20 shadow-lg hover:shadow-emerald-500/10 active:scale-95">
          <Upload size={16} className="text-emerald-400" /> Restore
        </button>
        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
      </div>

      {/* 5. MATCH SETUP CARD (Nightfire UI) */}
      <div className="bg-neutral-900 border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-orange-500/20 transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
       
        <h3 className="font-black text-white mb-6 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
           <RefreshCw size={14} className="text-orange-500 animate-spin-slow"/> Match Setup
        </h3>

        <div className="space-y-5">
          {/* Series Type */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Tournament Type</label>
            <select className="w-full bg-black border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 p-4 rounded-xl text-white outline-none transition-all font-bold appearance-none shadow-inner cursor-pointer"
              value={seriesType} onChange={e => setSeriesType(e.target.value)}>
              <option value="SINGLE">Single Match</option>
              <option value="SERIES_3">3-Match Series</option>
              <option value="SERIES_5">5-Match Series</option>
            </select>
          </div>

          {/* Teams Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Home Team</label>
              <select className="w-full bg-black border border-white/10 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all font-bold appearance-none shadow-inner cursor-pointer"
                value={t1Id} onChange={e => setT1Id(e.target.value)}>
                <option value="">Select...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Away Team</label>
              <select className="w-full bg-black border border-white/10 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all font-bold appearance-none shadow-inner cursor-pointer"
                value={t2Id} onChange={e => setT2Id(e.target.value)}>
                <option value="">Select...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Joker Player */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Joker / Common Player</label>
            <select className="w-full bg-black border border-white/10 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all font-bold appearance-none shadow-inner cursor-pointer"
              value={jokerId} onChange={e => setJokerId(e.target.value)} disabled={!t1Id || !t2Id}>
              <option value="">None</option>
              {players.filter(p => !team1Players.includes(p.id) && !team2Players.includes(p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Overs & Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Overs</label>
              <input type="number" className="w-full bg-black border border-white/10 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all font-bold shadow-inner"
                value={overs} onChange={handleOversChange} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Max Overs/Bowler</label>
              <input type="number" className="w-full bg-black border border-white/10 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all font-bold shadow-inner"
                value={maxOversPerBowler} onChange={e => setMaxOversPerBowler(e.target.value)} />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Venue</label>
            <select className="w-full bg-black border border-white/10 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all font-bold appearance-none shadow-inner cursor-pointer"
              value={venue} onChange={e => setVenue(e.target.value)}>
              {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors cursor-pointer" onClick={() => setLastManStanding(!lastManStanding)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${lastManStanding ? 'bg-blue-600 border-blue-500' : 'border-slate-600'}`}>
               {lastManStanding && <Check size={14} className="text-white"/>}
            </div>
            <label className="text-sm font-bold text-slate-300 cursor-pointer select-none">Last Man Standing Rule</label>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => setTrackShots(!trackShots)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${trackShots ? 'bg-emerald-600 border-emerald-500' : 'border-slate-600'}`}>
               {trackShots && <Check size={14} className="text-white"/>}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-300 select-none">Track Boundary Shots</div>
              <div className="text-[10px] text-slate-500 select-none">Map 4s & 6s (Wagon Wheel)</div>
            </div>
          </div>

          {/* START BUTTON */}
          <Button
            onClick={() => onStart({ team1Id: t1Id, team2Id: t2Id, totalOvers: parseInt(overs), venue, jokerId, lastManStanding, seriesType, maxOversPerBowler: parseInt(maxOversPerBowler), trackShots })}
            disabled={!t1Id || !t2Id || t1Id === t2Id}
            className="w-full py-4 text-lg font-black uppercase tracking-widest bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] border-t border-white/20 transform transition-all active:scale-95 hover:scale-[1.02] animate-pulse-slow mt-6"
          >
            Start Match
          </Button>
        </div>
      </div>

      {/* --- DEVELOPER SIGNATURE --- */}
      <div className="mt-12 mb-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
        <p className="text-[10px] text-neutral-600 font-medium tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity cursor-default">
          Designed & Developed by <span className="text-orange-500 hover:text-orange-400 transition-colors font-bold">Bharath</span>
        </p>
      </div>

    </div>
  );
};
// START OF PART 13 - PREMIUM TOSS SCREEN (Nightfire Edition)
const TossScreen = ({ team1, team2, onToss }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [callingTeamId, setCallingTeamId] = useState(team1?.id || '');
  const [callSide, setCallSide] = useState('');
  const [rotation, setRotation] = useState(0);

  const handleFlip = () => {
    if (!callingTeamId || !callSide) {
      alert("Please select who is calling and what they call!");
      return;
    }
    setIsFlipping(true);
    const newRotation = rotation + 1800 + (Math.random() * 360);
    setRotation(newRotation);

    setTimeout(() => {
      const finalSide = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      const callingTeam = [team1, team2].find(t => t.id === callingTeamId);
      const didWin = finalSide === callSide;
      const winner = didWin ? callingTeam : [team1, team2].find(t => t.id !== callingTeamId);
     
      // Adjust rotation to land visually correct
      const currentMod = newRotation % 360;
      const targetMod = finalSide === 'HEADS' ? 0 : 180;
      const adjustment = targetMod - currentMod;
     
      setRotation(newRotation + adjustment);
      setIsFlipping(false);
      setResult({ winner, side: finalSide });
    }, 2500);
  };

  if (!team1 || !team2) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black">
     
      {/* HEADER */}
      <h2 className="text-4xl font-black text-white mb-10 uppercase tracking-widest flex items-center gap-3">
         <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
         Toss Time
      </h2>

      {/* 3D COIN VISUAL */}
      <div className="relative w-48 h-48 mb-12 perspective-1000">
        <div
          onClick={!isFlipping && !result ? handleFlip : undefined}
          className="w-full h-full absolute transform-style-3d transition-transform duration-[2500ms] ease-out cursor-pointer"
          style={{ transform: `rotateY(${rotation}deg)` }}
        >
          {/* HEADS SIDE (GOLD) */}
          <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 border-[6px] border-yellow-600 flex items-center justify-center backface-hidden shadow-[0_0_50px_rgba(234,179,8,0.4)]">
            <div className="border-4 border-yellow-200/50 rounded-full w-36 h-36 flex items-center justify-center bg-yellow-500 shadow-inner">
               <span className="text-7xl font-black text-yellow-900 drop-shadow-md">H</span>
            </div>
          </div>

          {/* TAILS SIDE (SILVER) */}
          <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 border-[6px] border-slate-500 flex items-center justify-center backface-hidden shadow-[0_0_50px_rgba(148,163,184,0.4)]" style={{ transform: 'rotateY(180deg)' }}>
            <div className="border-4 border-slate-200/50 rounded-full w-36 h-36 flex items-center justify-center bg-slate-400 shadow-inner">
               <span className="text-7xl font-black text-slate-800 drop-shadow-md">T</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS AREA */}
      {!result && !isFlipping && (
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
         
          {/* WHO IS CALLING? */}
          <div className="bg-neutral-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Who is calling?</p>
            <div className="flex gap-4">
              {[team1, team2].map(t => (
                 <button
                   key={t.id}
                   onClick={() => setCallingTeamId(t.id)}
                   className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-wide transition-all duration-300 border ${
                      callingTeamId === t.id
                      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-105'
                      : 'bg-black border-white/10 text-slate-500 hover:bg-neutral-800'
                   }`}
                 >
                   {t.name}
                 </button>
              ))}
            </div>
          </div>

          {/* HEADS OR TAILS? */}
          <div className="bg-neutral-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">What is the call?</p>
            <div className="flex gap-4">
               {['HEADS', 'TAILS'].map(side => (
                  <button
                    key={side}
                    onClick={() => setCallSide(side)}
                    className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-wide transition-all duration-300 border ${
                       callSide === side
                       ? side === 'HEADS' ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg' : 'bg-slate-400 text-black border-slate-400 shadow-lg'
                       : 'bg-black border-white/10 text-slate-500 hover:bg-neutral-800'
                    }`}
                  >
                    {side}
                  </button>
               ))}
            </div>
          </div>

          <Button
             onClick={handleFlip}
             disabled={!callingTeamId || !callSide}
             className="w-full py-5 text-xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-orange-600 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-[1.02] transition-transform"
          >
             Flip Coin
          </Button>
        </div>
      )}

      {/* FLIPPING STATE */}
      {isFlipping && (
         <div className="mt-8 text-center animate-pulse">
            <div className="text-2xl font-black text-orange-500 tracking-widest uppercase">Flipping...</div>
            <div className="text-xs text-slate-500 font-mono mt-2">Good Luck!</div>
         </div>
      )}

      {/* RESULT STATE */}
      {result && (
        <div className="w-full max-w-md mt-6 animate-in zoom-in duration-500">
          <div className="mb-8 bg-neutral-900 border border-orange-500/30 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
             
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">The Result Is</div>
             <div className={`text-6xl font-black mb-4 ${result.side === 'HEADS' ? 'text-yellow-500' : 'text-slate-300'}`}>{result.side}</div>
             
             <div className="inline-block px-6 py-2 bg-white/5 rounded-full border border-white/10">
                <span className="text-white font-bold text-lg">{result.winner.name}</span>
                <span className="text-slate-400 ml-2">won the toss!</span>
             </div>
          </div>

          <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">What do they choose?</p>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onToss(result.winner.id, 'bat')} className="group p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl border border-blue-400/30 shadow-lg hover:shadow-blue-500/40 hover:-translate-y-1 transition-all">
               <div className="text-blue-200 text-xs font-bold uppercase mb-1 group-hover:text-white">Opt To</div>
               <div className="text-2xl font-black text-white uppercase italic">Bat</div>
            </button>

            <button onClick={() => onToss(result.winner.id, 'bowl')} className="group p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl border border-emerald-400/30 shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all">
               <div className="text-emerald-200 text-xs font-bold uppercase mb-1 group-hover:text-white">Opt To</div>
               <div className="text-2xl font-black text-white uppercase italic">Bowl</div>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
};
// START OF PART 14 - PREMIUM SELECTION MODALS (Openers, Batsman, Bowler)

// 1. OPENERS SELECTION (Strategic Layout)
const OpenersModal = ({ squad, teamName, onSelect }) => {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');

  return (
    <Modal title={`Opening Pair: ${teamName}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
       
        {/* STRIKER SECTION */}
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Striker</span>
              <span className="text-[10px] text-slate-500 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-white/5">Facing 1st Ball</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {squad.filter(p => p.id !== s2).map(p => (
                 <button
                   key={`s1-${p.id}`}
                   onClick={() => setS1(p.id)}
                   className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${s1 === p.id ? 'bg-gradient-to-r from-orange-600/20 to-black border-orange-500 shadow-[inset_0_0_10px_rgba(249,115,22,0.2)]' : 'bg-neutral-900 border-white/5 hover:bg-neutral-800'}`}
                 >
                    <PlayerAvatar player={p} size="sm" />
                    <div className="text-left">
                       <div className={`text-sm font-bold ${s1 === p.id ? 'text-white' : 'text-slate-300'}`}>{p.name}</div>
                       <div className="text-[10px] text-slate-500 uppercase font-bold">{p.battingStyle}</div>
                    </div>
                    {s1 === p.id && <Check size={16} className="ml-auto text-orange-500" strokeWidth={3}/>}
                 </button>
              ))}
           </div>
        </div>

        {/* NON-STRIKER SECTION */}
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Non-Striker</span>
              <span className="text-[10px] text-slate-500 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-white/5">Runner's End</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {squad.filter(p => p.id !== s1).map(p => (
                 <button
                   key={`s2-${p.id}`}
                   onClick={() => setS2(p.id)}
                   className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${s2 === p.id ? 'bg-gradient-to-r from-blue-600/20 to-black border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'bg-neutral-900 border-white/5 hover:bg-neutral-800'}`}
                 >
                    <PlayerAvatar player={p} size="sm" />
                    <div className="text-left">
                       <div className={`text-sm font-bold ${s2 === p.id ? 'text-white' : 'text-slate-300'}`}>{p.name}</div>
                       <div className="text-[10px] text-slate-500 uppercase font-bold">{p.battingStyle}</div>
                    </div>
                    {s2 === p.id && <Check size={16} className="ml-auto text-blue-500" strokeWidth={3}/>}
                 </button>
              ))}
           </div>
        </div>

        <Button
           disabled={!s1 || !s2}
           onClick={() => onSelect(s1, s2)}
           className="w-full py-4 text-lg font-black uppercase tracking-widest bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-orange-900/30 mt-4"
        >
           Start Innings
        </Button>
      </div>
    </Modal>
  );
};

// 2. NEXT BATSMAN SELECTION (Fixed: Safe String Comparison)
const PlayerSelectionModal = ({ title, squad, excludeIds, retiredHurtPlayers, onSelect, onClose }) => {
  const retiredIds = retiredHurtPlayers ? retiredHurtPlayers.map(r => String(r.id)) : [];
  
  // FIX: Convert all IDs to strings for safe comparison
  const safeExcludeIds = excludeIds.map(id => String(id));
  const allExcluded = [...safeExcludeIds, ...retiredIds];
  
  // FIX: Use String comparison to ensure we actually show available players
  const available = squad.filter(p => !allExcluded.includes(String(p.id)));

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-6">
       
        {/* RETIRED HURT SECTION */}
        {retiredHurtPlayers && retiredHurtPlayers.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
             <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]">
                   <HeartPulse size={12} className="text-black fill-black"/>
                </div>
                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">Resume Innings</h4>
             </div>
             
             <div className="grid grid-cols-1 gap-2">
                {retiredHurtPlayers.map(rh => {
                   const p = squad.find(pl => String(pl.id) === String(rh.id)) || { name: 'Unknown' };
                   return (
                      <button key={rh.id} onClick={() => onSelect(rh.id, true)} className="flex items-center justify-between p-4 bg-neutral-800 border-2 border-red-500/50 hover:border-red-500 hover:bg-neutral-700 rounded-xl group transition-all shadow-lg shadow-red-900/20">
                         <div className="flex items-center gap-4">
                            <div className="relative">
                               <PlayerAvatar player={p} size="md"/>
                               <div className="absolute -bottom-2 -right-2 bg-red-600 rounded-full p-1 border-2 border-neutral-800">
                                 <HeartPulse size={10} className="text-white"/>
                               </div>
                            </div>
                            <div className="text-left">
                               <div className="font-black text-white text-lg leading-none">{p.name}</div>
                               <div className="text-sm text-red-300 font-mono font-bold mt-1">
                                  {rh.stats.runs}* <span className="text-slate-400 text-xs font-sans">({rh.stats.balls} balls)</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-[10px] bg-red-600 text-white px-4 py-2 rounded-full font-black uppercase tracking-wide shadow-md group-hover:scale-105 transition-transform">
                            Play
                         </div>
                      </button>
                   );
                })}
             </div>
          </div>
        )}

        {/* FRESH BATSMEN SECTION */}
        <div>
           <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Fresh Batsmen</h4>
           <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {available.length === 0 && <p className="text-center text-slate-500 py-8 italic border border-dashed border-white/10 rounded-xl">No fresh players available</p>}
              {available.map(p => (
                 <button key={p.id} onClick={() => onSelect(p.id, false)} className="flex items-center gap-4 p-3 bg-black border border-white/10 hover:bg-neutral-900 hover:border-orange-500/50 rounded-xl text-left group transition-all">
                    <PlayerAvatar player={p} size="sm" />
                    <div>
                       <div className="font-bold text-slate-300 group-hover:text-white transition-colors">{p.name}</div>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono border border-white/5">{p.battingStyle}</span>
                          <span className="text-[10px] text-slate-600 uppercase font-bold">{p.role}</span>
                       </div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-slate-700 group-hover:text-orange-500 transition-colors"/>
                 </button>
              ))}
           </div>
        </div>
      </div>
    </Modal>
  );
};
// 3. BOWLER SELECTION (Fixed: Safe ID Comparison)
// FIX: Updated BowlerSelectionModal with safer limits
const BowlerSelectionModal = ({ currentOver, squad, lastBowlerId, onSelect, bowlerStats, maxOvers }) => {
  const statsMap = bowlerStats || {};
  const safeSquad = squad || [];
  // Safety: If limit is missing or 0, allow infinite overs (for testing)
  const limit = (maxOvers && parseInt(maxOvers) > 0) ? parseInt(maxOvers) : 999;

  const availableBowlers = safeSquad.filter(p => {
    // 1. Prevent consecutive overs (The Rule)
    if (String(p.id) === String(lastBowlerId)) return false;
    
    // 2. Check Over Limits
    const stats = statsMap[p.id] || statsMap[String(p.id)] || {};
    const legal = stats.legalBalls || 0;
    const oversBowled = Math.floor(legal / 6);
    
    return oversBowled < limit;
  });

  return (
    <Modal title={`Select Bowler: Over ${currentOver}`} onClose={() => {}}>
      <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {/* Fallback: If logic hides everyone, show message but also show full list below for safety */}
        {availableBowlers.length === 0 && (
            <div className="text-center text-slate-500 py-4 italic text-xs">
                No eligible bowlers found under current rules.<br/>
                (Max {limit} overs/bowler)
            </div>
        )}
       
        {/* RENDER LIST: Use availableBowlers, or fallback to full squad if empty (Emergency Mode) */}
        {(availableBowlers.length > 0 ? availableBowlers : safeSquad).map(p => {
           const stats = statsMap[p.id] || statsMap[String(p.id)] || { runs: 0, wickets: 0, legalBalls: 0 };
           const legal = stats.legalBalls || 0;
           const overs = Math.floor(legal / 6) + '.' + (legal % 6);
           
           return (
             <button key={p.id} onClick={() => onSelect(p.id)} className="group flex items-center justify-between p-3 bg-neutral-900 border border-white/5 hover:bg-black hover:border-orange-500/50 rounded-xl transition-all shadow-md">
                <div className="flex items-center gap-3">
                   <PlayerAvatar player={p} size="sm" />
                   <div className="text-left">
                      <div className="font-bold text-slate-200 group-hover:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">{p.bowlingStyle}</div>
                   </div>
                </div>
               
                {legal > 0 ? (
                   <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Figures</div>
                      <div className="text-xs font-mono font-bold text-orange-400 bg-orange-900/10 px-2 py-1 rounded border border-orange-500/20">
                         {overs} - {stats.runs || 0} - {stats.wickets || 0}
                      </div>
                   </div>
                ) : (
                   <span className="text-[10px] text-emerald-500 bg-emerald-900/10 px-2 py-1 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">
                      Fresh Spell
                   </span>
                )}
             </button>
           );
        })}
      </div>
    </Modal>
  );
};
// START OF PART 15 - SCORECARD FIX
const ScorecardModal = ({ matchSettings, teamName, data, players, onClose, battingOrder }) => {
  // FIX: Robust ID Lookup (Safe String Comparison)
  const getP = (id) => players.find(p => String(p.id) === String(id)) || { name: 'Unknown' };
  const extras = data.extras || { wd: 0, nb: 0, lb: 0, b: 0 };

  const getDismissalText = (outData) => {
    if (!outData) return "not out";
    const bowlerName = outData.bowlerId ? getP(outData.bowlerId).name : "";
    const fielderName = outData.fielderId ? getP(outData.fielderId).name : "";

    switch (outData.howOut) {
      case 'Caught': return `c ${fielderName} b ${bowlerName}`;
      case 'Bowled': return `b ${bowlerName}`;
      case 'LBW': return `lbw b ${bowlerName}`;
      case 'Run Out': return `run out (${fielderName})`;
      case 'Stumped': return `st ${fielderName} b ${bowlerName}`;
      case 'Hit Wicket': return `hit wicket b ${bowlerName}`;
      case 'Mankad': return `run out (${bowlerName})`;
      case 'Retired Out': return 'retired out';
      default: return outData.howOut;
    }
  };

  return (
    <Modal title="Detailed Scorecard" onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* TEAM HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 to-black border border-white/10 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full"></div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-1">Innings Summary</div>
              <h2 className="text-3xl font-black text-white italic tracking-tight">{teamName}</h2>
              <p className="text-slate-400 text-xs font-mono mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                {data.overs}.{data.balls} Overs
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                {data.runs}<span className="text-2xl text-slate-500">/{data.wickets}</span>
              </div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Total Score</div>
            </div>
          </div>
        </div>

        {/* BATTING CARD */}
        <div className="bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5">
             <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-3 bg-orange-500 rounded-full"></div> Batting
             </h4>
             <div className="text-[9px] text-slate-500 uppercase font-bold">Runs (Balls)</div>
          </div>

          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1.5fr] gap-2 p-2 bg-black/20 text-[9px] text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
            <div className="col-span-1 pl-2">Batter</div>
            <div className="text-center">R</div>
            <div className="text-center">B</div>
            <div className="text-center text-orange-500/70">4s</div>
            <div className="text-center text-orange-500/70">6s</div>
            <div className="text-right pr-2">SR</div>
          </div>

          <div className="divide-y divide-white/5">
            {battingOrder.map((pid, index) => {
              const p = getP(pid);
              let stats = null;
              let status = '';
              let rowClass = "grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1.5fr] gap-2 p-3 items-center hover:bg-white/5 transition-colors";
             
              // FIX: Use String() for safe comparisons
              if (String(pid) === String(data.strikerId)) {
                stats = data.strikerStats;
                status = ' bato';
                rowClass += ' bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500';
              } else if (String(pid) === String(data.nonStrikerId)) {
                stats = data.nonStrikerStats;
                status = ' bato';
                rowClass += ' bg-white/[0.02]';
              } else {
                // FIX: Safe Find in OutPlayers
                const outData = data.outPlayers.find(o => String(o.playerId) === String(pid));
                if (outData) {
                  stats = outData;
                } else {
                   // FIX: Safe Find in Retired
                   const rh = data.retiredHurtPlayers?.find(r => String(r.id) === String(pid));
                   if(rh) { stats = rh.stats; status = ' (ret hurt)'; }
                }
              }

              if (!stats) return null;
             
              const dismissal = (String(pid) === String(data.strikerId) || String(pid) === String(data.nonStrikerId))
                ? "not out"
                : getDismissalText(data.outPlayers.find(o => String(o.playerId) === String(pid)));

              const sr = stats.balls > 0 ? ((stats.runs/stats.balls)*100).toFixed(0) : '0';

              return (
                <div key={pid} className={rowClass}>
                  <div className="col-span-1 overflow-hidden pl-2">
                    <div className={`text-sm truncate flex items-center gap-2 ${status.includes('bato') ? 'font-bold text-white' : 'text-slate-300'}`}>
                      {p.name}
                      {status.includes('bato') && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate lowercase font-medium italic">{dismissal}</div>
                  </div>
                  <div className={`text-center font-bold text-sm ${status.includes('bato') ? 'text-white' : 'text-slate-400'}`}>{stats.runs}</div>
                  <div className="text-center text-slate-500 text-xs">{stats.balls}</div>
                  <div className="text-center text-slate-600 text-xs">{stats.fours || 0}</div>
                  <div className="text-center text-slate-600 text-xs">{stats.sixes || 0}</div>
                  <div className="text-right pr-2 font-mono text-slate-500 text-xs">{sr}</div>
                </div>
              );
            })}
          </div>
          
          {/* Extras Footer */}
          <div className="p-3 text-[10px] font-bold text-slate-400 bg-white/5 flex justify-between items-center border-t border-white/10">
            <span className="uppercase tracking-widest">Extras</span>
            <div className="flex gap-3">
               <span>WD: <span className="text-white">{extras.wd}</span></span>
               <span>NB: <span className="text-white">{extras.nb}</span></span>
               <span>LB: <span className="text-white">{extras.lb}</span></span>
               <span>B: <span className="text-white">{extras.b}</span></span>
            </div>
          </div>
        </div>

        {/* BOWLING CARD */}
        <div className="bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5">
             <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> Bowling
             </h4>
          </div>
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr] gap-2 p-2 bg-black/20 text-[9px] text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
            <div className="col-span-1 pl-2">Bowler</div>
            <div className="text-center">O</div>
            <div className="text-center">R</div>
            <div className="text-center text-orange-500">W</div>
            <div className="text-right pr-2">Econ</div>
          </div>
          <div className="divide-y divide-white/5">
            {Object.entries(data.bowlerStats).map(([id, stats]) => {
              const oversDecimal = stats.legalBalls / 6;
              const economy = oversDecimal > 0 ? (stats.runs / oversDecimal).toFixed(1) : "0.0";
              return (
                <div key={id} className="grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr] gap-2 p-3 items-center hover:bg-white/5 transition-colors">
                  <div className="col-span-1 pl-2">
                    <div className="text-sm font-medium text-slate-300">{getP(id).name}</div>
                  </div>
                  <div className="text-center text-slate-400 text-xs font-mono">{getOversFromBalls(stats.legalBalls)}</div>
                  <div className="text-center text-slate-400 text-xs">{stats.runs}</div>
                  <div className="text-center font-black text-orange-500 text-sm">{stats.wickets}</div>
                  <div className="text-right pr-2 text-slate-500 text-xs font-mono">{economy}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
// START OF PART 16 - PREMIUM WICKET MODAL (Nightfire Edition)
export const WicketModal = ({ squad, players, striker, nonStriker, onConfirm, onClose }) => {
  const [type, setType] = useState('Caught');
  const [fielder, setFielder] = useState('');
  // Default victim is the Striker
  const [victimId, setVictimId] = useState(striker?.id);
  
  const needsFielder = ['Caught', 'Run Out', 'Stumped'].includes(type);
  const validSquad = squad || [];

  // Icon mapping for dismissals
  const getDismissalIcon = (t) => {
    switch (t) {
      case 'Bowled':
        // Target: Hitting the stumps directly
        return <Target size={24} className="text-red-500" />;
     
      case 'Caught':
        // Hand: Fielder catching the ball
        return <Hand size={24} className="text-orange-500" />;
     
      case 'LBW':
        // Footprints: Leg Before Wicket (Pads)
        return <Footprints size={24} className="text-yellow-500" />;
     
      case 'Run Out':
        // UserMinus: Player removed / Short of crease
        return <UserMinus size={24} className="text-red-400" />;
     
      case 'Stumped':
        // BoxSelect: Wicket zone / Bails off
        return <BoxSelect size={24} className="text-purple-500" />;
     
      case 'Hit Wicket':
        // Gavel: Self-inflicted / Rule violation
        return <Gavel size={24} className="text-amber-600" />;
     
      case 'Mankad':
        // Alert: Rare dismissal
        return <AlertTriangle size={24} className="text-slate-400" />;
       
      default:
        return <AlertTriangle size={24} />;
    }
  };

  return (
    <Modal title="Fall of Wicket" onClose={onClose}>
      <div className="space-y-6">
       
        {/* DISMISSAL GRID */}
        <div>
           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">How Wicket Fell?</label>
           <div className="grid grid-cols-3 gap-3">
              {DISMISSAL_TYPES.map(t => {
                 const isSelected = type === t;
                 return (
                   <button
                     key={t}
                     onClick={() => setType(t)}
                     className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                        isSelected
                        ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                        : 'bg-neutral-900 border-white/5 text-slate-400 hover:bg-neutral-800 hover:text-white'
                     }`}
                   >
                      {/* Icon Container */}
                      <div className={`opacity-80 group-hover:opacity-100 transition-opacity ${isSelected ? 'animate-bounce' : ''}`}>
                         {t === 'Caught' ? <Shield size={20}/> : t === 'Bowled' ? <Target size={20}/> : <AlertTriangle size={20}/>}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide">{t}</span>
                     
                      {/* Active Glow */}
                      {isSelected && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
                   </button>
                 )
              })}
           </div>
        </div>

        {/* VICTIM SELECTION (For Run Outs) */}
        {type === 'Run Out' && (
           <div className="animate-in fade-in slide-in-from-bottom-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Who is Out?</label>
              <div className="flex gap-2">
                 <button 
                    onClick={() => setVictimId(striker?.id)} 
                    className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-colors ${victimId === striker?.id ? 'bg-red-600 border-red-500 text-white' : 'bg-neutral-800 border-white/10 text-slate-400'}`}
                 >
                    {striker?.name || 'Striker'}
                 </button>
                 <button 
                    onClick={() => setVictimId(nonStriker?.id)} 
                    className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-colors ${victimId === nonStriker?.id ? 'bg-red-600 border-red-500 text-white' : 'bg-neutral-800 border-white/10 text-slate-400'}`}
                 >
                    {nonStriker?.name || 'Non-Striker'}
                 </button>
              </div>
           </div>
        )}

        {/* FIELDER SELECTION (If Needed) */}
        {needsFielder && (
           <div className="animate-in fade-in slide-in-from-bottom-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Who was the Fielder?</label>
              <div className="relative">
                 <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
                 <select
                    className="w-full bg-black border border-white/10 p-3 pl-10 rounded-xl text-white text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all appearance-none font-bold cursor-pointer"
                    value={fielder}
                    onChange={e => setFielder(e.target.value)}
                 >
                    <option value="">Select Fielder...</option>
                    {/* FIX: Use squad if available, otherwise fallback to all players */}
                    {(validSquad.length > 0 ? validSquad : players).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                 </select>
              </div>
           </div>
        )}

        <Button
           onClick={() => onConfirm(type, fielder, victimId)}
           disabled={needsFielder && !fielder}
           className="w-full py-4 text-lg font-black uppercase tracking-widest bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-lg shadow-red-900/40 border border-red-500/30 mt-2"
        >
           Confirm Wicket
        </Button>
      </div>
    </Modal>
  );
};
// START OF PART 16 - PREMIUM HEAD-TO-HEAD (Nightfire Edition)
const HeadToHeadModal = ({ players, matchHistory, onClose }) => {
  const [batterId, setBatterId] = useState('');
  const [bowlerId, setBowlerId] = useState('');

  const calculateStats = () => {
    if (!batterId || !bowlerId) return null;
    let runs = 0, balls = 0, outs = 0, dots = 0, fours = 0, sixes = 0;

    matchHistory.forEach(match => {
      const timeline = [...(match.firstInningsTimeline || []), ...(match.timeline || [])];
      timeline.forEach(ball => {
        if (ball.strikerId === batterId && ball.bowlerId === bowlerId) {
          if (ball.isWicket) { outs++; balls++; }
          else if (ball.extraType === 'Wd') { runs += (ball.ballRuns || 0); }
          else {
            runs += (ball.ballRuns || 0);
            if (ball.extraType !== 'Wd') balls++;
            if (ball.ballRuns >= 4 && ball.ballRuns < 6) fours++;
            if (ball.ballRuns >= 6) sixes++;
            if (ball.ballRuns === 0) dots++;
          }
        }
      });
    });
    return { runs, balls, outs, dots, fours, sixes };
  };

  const stats = calculateStats();
  const batter = players.find(p => p.id === batterId);
  const bowler = players.find(p => p.id === bowlerId);

  // Helper for Strike Rate Color
  const getSrColor = (sr) => {
     if(sr >= 200) return "text-orange-500";
     if(sr >= 150) return "text-yellow-400";
     return "text-white";
  };

  return (
    <Modal title="Head-to-Head Analysis" onClose={onClose}>
      <div className="space-y-8">
       
        {/* 1. SELECTION ARENA (VS LAYOUT) */}
        <div className="relative grid grid-cols-2 gap-4 items-start">
           
           {/* VS BADGE (Centered) */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-10 h-10 rounded-full bg-black border-2 border-orange-500 shadow-[0_0_15px_#f97316] flex items-center justify-center">
                 <span className="font-black text-xs text-orange-500 italic">VS</span>
              </div>
           </div>

           {/* BATTER SIDE */}
           <div className="space-y-4">
              <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-600 to-transparent rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative bg-neutral-900 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
                    <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">The Batter</div>
                    <PlayerAvatar player={batter} size="lg" />
                    <select
                       className="mt-3 w-full bg-black border border-white/10 p-2 rounded-lg text-white text-xs outline-none focus:border-orange-500 transition-all font-bold text-center appearance-none"
                       value={batterId}
                       onChange={e => setBatterId(e.target.value)}
                    >
                       <option value="">Select Batter...</option>
                       {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           {/* BOWLER SIDE */}
           <div className="space-y-4">
              <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-bl from-blue-600 to-transparent rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative bg-neutral-900 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">The Bowler</div>
                    <PlayerAvatar player={bowler} size="lg" />
                    <select
                       className="mt-3 w-full bg-black border border-white/10 p-2 rounded-lg text-white text-xs outline-none focus:border-blue-500 transition-all font-bold text-center appearance-none"
                       value={bowlerId}
                       onChange={e => setBowlerId(e.target.value)}
                    >
                       <option value="">Select Bowler...</option>
                       {players.filter(p => p.id !== batterId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. STATS DISPLAY (Tale of the Tape) */}
        {stats ? (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
             
              {/* MAIN SCORE CARD */}
              <div className="bg-gradient-to-r from-neutral-900 to-black border border-white/10 p-6 rounded-3xl shadow-2xl text-center relative overflow-hidden">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                 
                 <div className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-2">Total Face-Off Score</div>
                 <div className="text-6xl font-black text-white leading-none tracking-tighter drop-shadow-lg">
                    {stats.runs}<span className="text-2xl text-slate-600 font-medium">({stats.balls})</span>
                 </div>
                 
                 {/* DOMINANCE TEXT */}
                 <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                    {stats.outs > 0 ? (
                       <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                          <Target size={12}/> {bowler?.name} has dismissed {batter?.name} <span className="text-white">{stats.outs}</span> times!
                       </span>
                    ) : (
                       <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                          <Shield size={12}/> {batter?.name} has never been dismissed by {bowler?.name}.
                       </span>
                    )}
                 </div>
              </div>

              {/* DETAILED METRICS GRID */}
              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 text-center group hover:border-orange-500/30 transition-colors">
                    <div className="text-2xl font-black text-white">{stats.fours + stats.sixes}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-orange-500 transition-colors">Boundaries</div>
                 </div>
                 
                 <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 text-center group hover:border-orange-500/30 transition-colors">
                    <div className={`text-2xl font-black ${getSrColor(stats.balls > 0 ? (stats.runs/stats.balls)*100 : 0)}`}>
                       {stats.balls > 0 ? ((stats.runs/stats.balls)*100).toFixed(0) : 0}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-orange-500 transition-colors">Strike Rate</div>
                 </div>

                 <div className="bg-neutral-900 p-3 rounded-2xl border border-white/5 text-center group hover:border-red-500/30 transition-colors">
                    <div className="text-2xl font-black text-red-500">{stats.dots}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-red-400 transition-colors">Dot Balls</div>
                 </div>
              </div>

           </div>
        ) : (
           <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <Search className="mx-auto text-slate-600 mb-2 opacity-50" size={32}/>
              <p className="text-sm text-slate-500 font-medium">Select both players to start analysis</p>
           </div>
        )}
      </div>
    </Modal>
  );
};
// --- 4. APP COMPONENT ---
// START OF PART 11B - ADD LATE PLAYER MODAL
const AddLatePlayerModal = ({ teams, allPlayers, battingTeamId, bowlingTeamId, onAdd, onClose }) => {
  const [targetTeamId, setTargetTeamId] = useState(battingTeamId);
  const [mode, setMode] = useState('EXISTING'); // 'EXISTING' or 'NEW'
 
  // New Player Form State
  const [newP, setNewP] = useState({ name: '', role: 'All-Rounder', battingStyle: 'Right', bowlingStyle: 'Right Arm Seam' });
 
  // Existing Player Selection
  const [selectedExistingId, setSelectedExistingId] = useState('');

  // Filter existing players: Must NOT be in the target team already
  const targetTeam = teams.find(t => t.id === targetTeamId);
  const availablePlayers = allPlayers.filter(p => !targetTeam?.players.includes(p.id));

  const handleSubmit = () => {
    if (mode === 'NEW') {
      if (!newP.name) return alert("Enter a name");
      onAdd(targetTeamId, newP, true);
    } else {
      if (!selectedExistingId) return alert("Select a player");
      const p = allPlayers.find(x => x.id === selectedExistingId);
      onAdd(targetTeamId, p, false);
    }
  };

  return (
    <Modal title="Add Player to Squad" onClose={onClose}>
      <div className="space-y-6">
        {/* 1. WHICH TEAM? */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Add To Team</label>
          <div className="flex gap-2">
            {teams.filter(t => t.id === battingTeamId || t.id === bowlingTeamId).map(t => (
              <button
                key={t.id}
                onClick={() => setTargetTeamId(t.id)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase border transition-all ${
                  targetTeamId === t.id
                  ? 'bg-orange-500 text-black border-orange-500 shadow-lg'
                  : 'bg-black border-white/10 text-slate-500'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. MODE SWITCH */}
        <div className="bg-neutral-900 p-1 rounded-xl flex">
          <button onClick={() => setMode('EXISTING')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${mode === 'EXISTING' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Existing Player</button>
          <button onClick={() => setMode('NEW')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase ${mode === 'NEW' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>New Creation</button>
        </div>

        {/* 3. INPUTS */}
        {mode === 'EXISTING' ? (
          <div>
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Player</label>
             <select
               className="w-full bg-black border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 font-bold"
               value={selectedExistingId}
               onChange={(e) => setSelectedExistingId(e.target.value)}
             >
               <option value="">Select...</option>
               {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
             {availablePlayers.length === 0 && <p className="text-xs text-red-400 mt-2">No extra players available.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              placeholder="Player Name"
              className="w-full bg-black border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 font-bold"
              value={newP.name}
              onChange={e => setNewP({...newP, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
               <select
                 className="bg-black border border-white/10 p-3 rounded-xl text-white text-xs font-bold outline-none"
                 value={newP.battingStyle}
                 onChange={e => setNewP({...newP, battingStyle: e.target.value})}
               >
                 <option>Right</option><option>Left</option>
               </select>
               <select
                 className="bg-black border border-white/10 p-3 rounded-xl text-white text-xs font-bold outline-none"
                 value={newP.bowlingStyle}
                 onChange={e => setNewP({...newP, bowlingStyle: e.target.value})}
               >
                 <option>Right Arm Seam</option><option>Right Arm Spin</option><option>None</option>
               </select>
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-emerald-600 to-green-600">
          <Plus size={18} className="mr-2"/> Add to Match
        </Button>
      </div>
    </Modal>
  );
};
const App = () => {
  // Lazy Initialization for Persistence
  const [playerPool, setPlayerPool] = useState(() => {
      const saved = localStorage.getItem('cric_players');
      // Fix: Fallback to [] if parsing returns null/undefined
      return saved ? (JSON.parse(saved) || []) : DEFAULT_PLAYERS;
  });
  const [savedTeams, setSavedTeams] = useState(() => {
      const saved = localStorage.getItem('cric_teams');
      // Fix: Fallback to [] if parsing returns null/undefined
      return saved ? (JSON.parse(saved) || []) : DEFAULT_TEAMS;
  });
  const [matchHistory, setMatchHistory] = useState(() => {
      const saved = localStorage.getItem('cric_history');
      // Fix: Fallback to [] if parsing returns null/undefined
      return saved ? (JSON.parse(saved) || []) : [];
  });
  const [seriesConfig, setSeriesConfig] = useState(() => {
      const saved = localStorage.getItem('cric_series');
      return saved ? JSON.parse(saved) : {
          active: false,
          type: 'SINGLE',
          matchesPlayed: 0,
          team1Wins: 0,
          team2Wins: 0,
          history: [] 
      };
  });
  // Add firstInningsData to storage to prevent loss on reload between innings
  const [firstInningsData, setFirstInningsData] = useState(() => {
       const saved = localStorage.getItem('cric_first_innings');
       return saved ? JSON.parse(saved) : null;
  });

  const [selectedArchivedMatch, setSelectedArchivedMatch] = useState(null);
  const [gameState, setGameState] = useState('SETUP'); 
 const [matchSettings, setMatchSettings] = useState(() => {
    const saved = localStorage.getItem('cric_match_settings');
    return saved ? JSON.parse(saved) : {
      team1Id: null, team2Id: null, totalOvers: 5, venue: 'Box Cricket',
      isRainReduced: false, jokerId: null, lastManStanding: false, maxOversPerBowler: 2,
      battingFirstId: null, battingSecondId: null // Ensure these are tracked
    };
  });
  
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [extras, setExtras] = useState({ wd: 0, nb: 0, lb: 0, b: 0 });
  
  const [strikerId, setStrikerId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [currentBowlerId, setCurrentBowlerId] = useState(null);
  const [lastBowlerId, setLastBowlerId] = useState(null);
  
  const [strikerStats, setStrikerStats] = useState({ runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [nonStrikerStats, setNonStrikerStats] = useState({ runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [battingStats, setBattingStats] = useState({}); 
  const [bowlerStats, setBowlerStats] = useState({}); 

  const [outPlayers, setOutPlayers] = useState([]); 
  const [retiredPlayers, setRetiredPlayers] = useState([]); 
  const [retiredHurtPlayers, setRetiredHurtPlayers] = useState([]); 
  const [battingOrder, setBattingOrder] = useState([]);

  const [currentOverHistory, setCurrentOverHistory] = useState([]); 
  const [commentary, setCommentary] = useState([]); // NEW: Text commentary
  const [mom, setMom] = useState(null); 
  const [momStats, setMomStats] = useState(null); // Detailed MOM stats
  const [mos, setMos] = useState(null); // Man of the Series
  const [mosStats, setMosStats] = useState(null); // Detailed MOS stats
  
  const [historyStack, setHistoryStack] = useState([]);
  const [activeModal, setActiveModal] = useState(null); 
  const [pendingScore, setPendingScore] = useState(null);
  const [scoreAtLastWicket, setScoreAtLastWicket] = useState(0); // For partnership
  const [ballsAtLastWicket, setBallsAtLastWicket] = useState(0); // For partnership balls
  
  const [timeline, setTimeline] = useState([]); // Timeline for worm graph
  const [isLoaded, setIsLoaded] = useState(false);
  // Track the last match ID for the Resume Button
  const [resumeId, setResumeId] = useState(localStorage.getItem('lastMatchId'));
  // --- CLOUD SYNC LOGIC (Dynamic) ---
  const [matchId, setMatchId] = useState(null); 

  // 1. BOOTSTRAP: On Load, check URL for matchId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMatchId = params.get('matchId');
    if (urlMatchId) {
      console.log("Resuming match from URL:", urlMatchId);
      setMatchId(urlMatchId); 
    }
  }, []);

  // 2. SYNC: Listen to the specific matchId
  useEffect(() => {
    if (!matchId) return;

    console.log("Subscribing to match:", matchId);
    const matchRef = doc(db, "matches", matchId);
    const unsubscribe = onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        // SAVE FOR RESUME BUTTON
        if (matchId) {
            localStorage.setItem('lastMatchId', matchId);
            setResumeId(matchId);
        }
        const data = docSnap.data();

        // HYDRATE STATE (Load Cloud Data into RAM)
        // We use || defaults to prevent crashes if fields are missing
        setRuns(data.runs || 0);
        setWickets(data.wickets || 0);
        setBalls(data.balls || 0);
        setOvers(data.overs || 0);
        setBattingStats(data.battingStats || {});
        setBowlerStats(data.bowlerStats || {});
        setTimeline(data.timeline || []);
        setCommentary(data.commentary || []);

        // Restore Context
        if(data.strikerId) setStrikerId(data.strikerId);
        if(data.nonStrikerId) setNonStrikerId(data.nonStrikerId);
        if(data.currentBowlerId) setCurrentBowlerId(data.currentBowlerId);
        // FIX: Restore 1st Innings Data for Target Calculation
        if(data.innings1) setFirstInningsData(data.innings1);
        if(data.battingOrder) setBattingOrder(data.battingOrder);
        if(data.matchSettings) setMatchSettings(data.matchSettings);
        if(data.playerPool) setPlayerPool(data.playerPool);
        if(data.savedTeams) setSavedTeams(data.savedTeams);

        // FORCE NAVIGATION (Jump to the game screen if needed)
        if (data.gameState && gameState === 'SETUP') {
            setGameState(data.gameState);
        }
      } else {
        console.error("Match ID not found in database!");
        alert("Match not found! Returning to home.");
        setMatchId(null);
        // Optional: Clear URL
        window.history.pushState({}, '', window.location.pathname);
      }
    });

    return () => unsubscribe();
  }, [matchId]); // Run once on mount

  // 2. WRITE: Save to Cloud helper
  // FIXED: Save to Cloud using dynamic matchId
  const saveToCloud = async (updatedData = {}) => {
    if (!matchId) return; // Safety: Don't save if no match ID exists

    const fullState = {
        runs, wickets, balls, overs,
        strikerId, nonStrikerId, currentBowlerId,
        battingStats, bowlerStats,
        timeline, commentary,
        lastUpdated: new Date().toISOString(),
        gameState, // Important: Save which screen we are on
        ...updatedData 
    };
    
    try {
        // CRITICAL FIX: Use 'matchId' state, not 'MATCH_ID' constant
        await setDoc(doc(db, "matches", matchId), fullState, { merge: true });
        console.log("☁️ Saved to Cloud");
    } catch (e) {
        console.error("Save Error:", e);
    }
  };
// START OF PART 17
  // CALCULATE CRR & RRR HERE
  let target = null;
  let runsNeeded = 0;
  let ballsRemaining = 0;
  let crr = '0.00';
  let rrr = '0.00';

  const totalOversBowled = overs + (balls / 6);
  if (totalOversBowled > 0) {
      crr = (runs / totalOversBowled).toFixed(2);
  }

  if (gameState === 'INNINGS_2' && firstInningsData) {
      target = firstInningsData.runs + 1;
      runsNeeded = target - runs;
      ballsRemaining = (matchSettings.totalOvers * 6) - (overs * 6 + balls);
      if (ballsRemaining > 0) {
          rrr = (runsNeeded / (ballsRemaining / 6)).toFixed(2);
      }
  }

  // Partnership Calc
  const currentPartnership = runs - scoreAtLastWicket;
  const currentPartnershipBalls = (overs * 6 + balls) - ballsAtLastWicket;

  // PROJECTED SCORE WIDGET
  const projectedScore = crr > 0 ? Math.floor(parseFloat(crr) * matchSettings.totalOvers) : 0;

  useEffect(() => {
    // Double safety check: Re-read if needed, but lazy init is usually enough
    const saved = localStorage.getItem('cric_players');
    if (saved && playerPool.length === 0) {
         const parsed = JSON.parse(saved);
         if(parsed) setPlayerPool(parsed);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('cric_players', JSON.stringify(playerPool));
    localStorage.setItem('cric_teams', JSON.stringify(savedTeams));
    localStorage.setItem('cric_history', JSON.stringify(matchHistory));
    localStorage.setItem('cric_series', JSON.stringify(seriesConfig));
    localStorage.setItem('cric_match_settings', JSON.stringify(matchSettings)); // <--- MAKE SURE THIS LINE EXISTS!

    if (firstInningsData) {
      localStorage.setItem('cric_first_innings', JSON.stringify(firstInningsData));
    } else {
      localStorage.removeItem('cric_first_innings');
    }
  }, [playerPool, savedTeams, matchHistory, seriesConfig, firstInningsData, matchSettings, isLoaded]); // <--- ADD matchSettings to dependencies

  // FIX 1: Robust Player Lookup - Prevents crash if playerPool has nulls
 // FIX: Robust Player Lookup - Prevents crash if playerPool has nulls
  // CHANGE: Added String() conversion to fix ID mismatch bugs
  const getPlayer = (id) => {
      if (!playerPool || !Array.isArray(playerPool)) return { name: 'Unknown', id };
      // FIX: Use String() comparison to match "123" with 123
      const found = playerPool.find(p => p && String(p.id) === String(id));
      return found || { name: 'Unknown', id };
  };
  
  // FIX 2: Robust Team Lookup - Filters out bad data
  const getTeamPlayers = (teamId) => {
    const validTeams = Array.isArray(savedTeams) ? savedTeams : [];
    // FIX: Convert IDs to String() to ensure "1" matches 1. 
    // This fixes the empty squad bug.
    const team = validTeams.find(t => t && String(t.id) === String(teamId));
    
    return team && Array.isArray(team.players) 
        ? team.players.map(pid => getPlayer(pid)).filter(p => p && p.id) 
        : [];
  };
// START OF PART 19
 const getCurrentBattingTeamId = () => {
    if (gameState === 'INNINGS_1') return matchSettings.battingFirstId;
    if (gameState === 'INNINGS_2') return matchSettings.battingSecondId;
    return null;
  };
  
  const getCurrentBowlingTeamId = () => {
    if (gameState === 'INNINGS_1') return matchSettings.battingSecondId;
    if (gameState === 'INNINGS_2') return matchSettings.battingFirstId;
    return null;
  };

  const getBattingSquad = () => {
    // FIX: Ensure ID is treated as string for lookup
    const teamId = getCurrentBattingTeamId();
    if (!teamId) return [];
    
    const regular = getTeamPlayers(String(teamId));
    
    if (matchSettings.jokerId) {
        const joker = getPlayer(matchSettings.jokerId);
        // FIX: Safe comparison
        if (joker && !regular.find(p => String(p.id) === String(joker.id))) {
            return [...regular, joker];
        }
    }
    return regular;
  };

  const getBowlingSquad = () => {
      // FIX: Ensure ID is treated as string for lookup
      const teamId = getCurrentBowlingTeamId();
      if (!teamId) return [];

      const regular = getTeamPlayers(String(teamId));
      
      if (matchSettings.jokerId) {
          const joker = getPlayer(matchSettings.jokerId);
          // FIX: Safe comparison
          if (joker && !regular.find(p => String(p.id) === String(joker.id))) {
              return [...regular, joker];
          }
      }
      return regular;
  };
  const generateCommentary = (bowlerName, batterName, runs, extrasType, wicketType) => {
      const ballNum = `${overs}.${balls + 1}`;
      let text = `${ballNum}: ${bowlerName} to ${batterName}, `;
      
      if (wicketType) {
          text += `OUT! ${wicketType}. Big wicket!`;
      } else if (extrasType) {
          if (extrasType === 'Wd') text += "Wide ball.";
          else if (extrasType === 'NB') text += "No Ball!";
          else if (extrasType === 'B') text += "Bye, runs taken.";
          else if (extrasType === 'LB') text += "Leg Bye, runs taken.";
      } else {
          if (runs === 0) text += "no run.";
          else if (runs === 1) text += "1 run, single taken.";
          else if (runs === 2) text += "2 runs, good running.";
          else if (runs === 4) text += "FOUR! Beautiful shot!";
          else if (runs === 6) text += "SIX! Massive hit!";
          else text += `${runs} runs.`;
      }
      return { id: generateId(), text };
  };

  const pushHistory = () => {
    const snapshot = {
      runs, wickets, balls, overs, extras, strikerId, nonStrikerId, 
      strikerStats, nonStrikerStats, currentBowlerId, lastBowlerId, 
      outPlayers, retiredPlayers, retiredHurtPlayers, bowlerStats, currentOverHistory, firstInningsData,
      battingStats, battingOrder, commentary, scoreAtLastWicket, ballsAtLastWicket, timeline
    };
    setHistoryStack(prev => [...prev.slice(-10), snapshot]);
  };

  const undo = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setRuns(prev.runs); setWickets(prev.wickets); setBalls(prev.balls); setOvers(prev.overs);
    setExtras(prev.extras); setStrikerId(prev.strikerId); setNonStrikerId(prev.nonStrikerId);
    setStrikerStats(prev.strikerStats); setNonStrikerStats(prev.nonStrikerStats);
    setCurrentBowlerId(prev.currentBowlerId); setLastBowlerId(prev.lastBowlerId);
    setOutPlayers(prev.outPlayers); setRetiredPlayers(prev.retiredPlayers); setRetiredHurtPlayers(prev.retiredHurtPlayers);
    setBowlerStats(prev.bowlerStats); setCurrentOverHistory(prev.currentOverHistory);
    setFirstInningsData(prev.firstInningsData);
    setBattingStats(prev.battingStats);
    setBattingOrder(prev.battingOrder);
    setCommentary(prev.commentary);
    setScoreAtLastWicket(prev.scoreAtLastWicket);
    setBallsAtLastWicket(prev.ballsAtLastWicket);
    setTimeline(prev.timeline);
    setHistoryStack(prev => prev.slice(0, -1));
  };

  // FIXED: Start Match with Cloud Creation & URL Update
  const startMatch = async (settings) => {
      // 1. Generate a Unique ID
      const newMatchId = generateId(); 
      
      // 2. Prepare Initial Data
      const initialData = {
          id: newMatchId,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          matchSettings: { ...matchSettings, ...settings },
          gameState: 'TOSS',
          runs: 0, wickets: 0, balls: 0, overs: 0,
          strikerId: null, nonStrikerId: null, currentBowlerId: null,
          battingStats: {}, bowlerStats: {},
          timeline: [], commentary: [],
          // Save copies of teams/players so match works even if they are deleted later
          playerPool: playerPool, 
          savedTeams: savedTeams
      };

      try {
          // 3. Save to Cloud FIRST
          await setDoc(doc(db, "matches", newMatchId), initialData);
          console.log("Match Created:", newMatchId);
          
          // 4. Update URL (The "Resume" Key)
          const newUrl = `${window.location.pathname}?matchId=${newMatchId}`;
          window.history.pushState({ path: newUrl }, '', newUrl);

          // 5. Update Local State
          setMatchId(newMatchId);
          setMatchSettings(prev => ({...prev, ...settings}));
          setGameState('TOSS');
      } catch (e) {
          console.error("Error creating match:", e);
          alert("Could not start match. Check internet connection.");
      }
  };

  const nextMatchInSeries = () => {
      setRuns(0); setWickets(0); setBalls(0); setOvers(0); setExtras({wd:0,nb:0,lb:0,b:0});
      setStrikerId(null); setNonStrikerId(null); setCurrentBowlerId(null);
      setStrikerStats({runs:0,balls:0,fours:0,sixes:0}); setNonStrikerStats({runs:0,balls:0,fours:0,sixes:0});
      setBattingStats({}); setBowlerStats({});
      setOutPlayers([]); setRetiredPlayers([]); setRetiredHurtPlayers([]);
      setCurrentOverHistory([]); setFirstInningsData(null); setMom(null); setMos(null);
      setHistoryStack([]); setBattingOrder([]); setCommentary([]); setScoreAtLastWicket(0); setBallsAtLastWicket(0);
      setTimeline([]);
      setGameState('TOSS');
  };
// START OF PART 20
  // NEW: Function to re-create a player (effectively resetting stats)
  const handleResetPlayerProfile = (playerId) => {
     // 1. Find old player data
     const oldPlayer = playerPool.find(p => p.id === playerId);
     if(!oldPlayer) return;

     // 2. Create new player with same details but NEW ID
     const newId = generateId();
     const newPlayer = { ...oldPlayer, id: newId };

     // 3. Update Pool: Remove old, add new
     const newPool = playerPool.map(p => p.id === playerId ? newPlayer : p);
     setPlayerPool(newPool);

     // 4. Update Teams: Replace old ID with new ID in all teams
     const newTeams = savedTeams.map(t => ({
         ...t,
         players: t.players.map(pid => pid === playerId ? newId : pid)
     }));
     setSavedTeams(newTeams);

     // Note: We do NOT touch matchHistory. The old ID remains there, preserving history.
     // The new ID has 0 matches, so stats are reset for the current profile.
  };

  const handleResetStats = () => {
      setMatchHistory([]);
      setSeriesConfig({ active: false, type: 'SINGLE', matchesPlayed: 0, team1Wins: 0, team2Wins: 0, history: [] });
      localStorage.removeItem('cric_history');
      localStorage.removeItem('cric_series');
      setActiveModal(null);
      localStorage.removeItem('lastMatchId');
      setResumeId(null);
      alert("All stats have been reset."); 
  };

  const resetToHome = () => {
      setRuns(0); setWickets(0); setBalls(0); setOvers(0); setExtras({wd:0,nb:0,lb:0,b:0});
      setStrikerId(null); setNonStrikerId(null); setCurrentBowlerId(null);
      setStrikerStats({runs:0,balls:0,fours:0,sixes:0}); setNonStrikerStats({runs:0,balls:0,fours:0,sixes:0});
      setBattingStats({}); setBowlerStats({});
      setOutPlayers([]); setRetiredPlayers([]); setRetiredHurtPlayers([]);
      setCurrentOverHistory([]); setFirstInningsData(null); setMom(null); setMos(null);
      setHistoryStack([]); setBattingOrder([]); setCommentary([]); setScoreAtLastWicket(0); setBallsAtLastWicket(0);
      setTimeline([]);
      setFirstInningsData(null); // Clear previous match data
      setSeriesConfig({ active: false, type: 'SINGLE', matchesPlayed: 0, team1Wins: 0, team2Wins: 0, history: [] });
      setGameState('SETUP');
  };

  const updateBattingStats = (playerId, runsToAdd, ball = 1, boundaryType = 0) => {
      setBattingStats(prev => {
          const stats = prev[playerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
          return {
              ...prev,
              [playerId]: {
                  runs: stats.runs + runsToAdd,
                  balls: stats.balls + ball,
                  fours: stats.fours + (boundaryType === 4 ? 1 : 0),
                  sixes: stats.sixes + (boundaryType === 6 ? 1 : 0)
              }
          };
      });
  };

  const updateBowlerStats = (runsConceded, validBall = true, isWicket = false) => {
    if (!currentBowlerId) return;
    setBowlerStats(prev => {
      const stats = prev[currentBowlerId] || { overs: 0, runs: 0, wickets: 0, balls: 0, maidens: 0, legalBalls: 0 };
      let newBalls = stats.balls;
      let newOvers = stats.overs;
      
      if (validBall) {
        newBalls += 1;
        if (newBalls === 6) {
          newOvers += 1;
          newBalls = 0;
        }
      }
      
      const newLegalBalls = stats.legalBalls + (validBall ? 1 : 0);

      return {
        ...prev,
        [currentBowlerId]: {
          ...stats,
          runs: stats.runs + runsConceded,
          wickets: stats.wickets + (isWicket ? 1 : 0),
          balls: newBalls,
          overs: newOvers,
          legalBalls: newLegalBalls
        }
      };
    });
  };
// START OF PART 21
 // --- REPLACED SCORING LOGIC START ---
// --- MASTER SCORING LOGIC (Fixed Buttons + Fixed Last Ball Stats) ---

  const handleScore = (label, runValue, isLegal = true, extraType = null) => {
    // 1. Safety Checks
    if (!matchSettings || matchSettings.totalOvers === undefined) {
        console.error("Match Settings missing"); return;
    }
    const currentTotalBalls = overs * 6 + balls;
    const maxBalls = matchSettings.totalOvers * 6;
   
    if (currentTotalBalls >= maxBalls) {
        setActiveModal(null); // Fix: Ensure modal closes
        alert("Match is already over!");
        return;
    }

    if (!strikerId) {
        setActiveModal(null); // Fix: Ensure modal closes
        alert("Please select a batsman first!");
        setActiveModal('SELECT_BATSMAN');
        return;
    }

    // 2. Shot Tracking Logic
    const isBoundary = (runValue === 4 || runValue === 6) || (extraType === 'NB' && (runValue === 4 || runValue === 6));
    const shouldTrack = matchSettings.trackShots === true;
   
    if (isBoundary && shouldTrack) {
        setPendingScore({ label, runValue, isLegal, extraType });
        setActiveModal('SHOT_MAP_INPUT'); // This will now open correctly
        return;
    }

    // FIX: Close the modal manually for normal runs (since we removed it from the button)
    setActiveModal(null);

    processScore(label, runValue, isLegal, extraType, null);
  };

  const processScore = (label, runValue, isLegal, extraType, shotDirection = null) => {
    pushHistory();
    let runsScored = runValue || 0;
    let extraRuns = 0;
    let boundary = 0;
   
    // --- EXTRAS CALCULATION ---
    if (extraType === 'Wd') {
        extraRuns = 1 + runsScored;
        runsScored = 0;
        setExtras(prev => ({ ...prev, wd: (prev?.wd || 0) + 1 + runsScored }));
    } else if (extraType === 'NB') {
        extraRuns = 1;
        if (runsScored === 4) boundary = 4;
        if (runsScored === 6) boundary = 6;
        setExtras(prev => ({ ...prev, nb: (prev?.nb || 0) + 1 }));
    } else if (extraType === 'B') {
        extraRuns = runsScored;
        runsScored = 0;
        setExtras(prev => ({ ...prev, b: (prev?.b || 0) + extraRuns }));
    } else if (extraType === 'LB') {
        extraRuns = runsScored;
        runsScored = 0;
        setExtras(prev => ({ ...prev, lb: (prev?.lb || 0) + extraRuns }));
    } else {
        if (runsScored === 4) boundary = 4;
        if (runsScored === 6) boundary = 6;
    }

    const totalRunImpact = extraRuns + runsScored;
    const newTotalScore = runs + totalRunImpact;
    setRuns(newTotalScore);

    // --- TIMELINE & DATA RECORDING ---
    const currentTotalOvers = overs + (balls / 6);
    const newTimelineEntry = {
        totalRuns: newTotalScore,
        runRate: newTotalScore / (currentTotalOvers || 1),
        shotDirection,
        boundary,
        strikerId: strikerId || 'unknown',
        bowlerId: currentBowlerId || 'unknown', // Head-to-Head Data
        ballRuns: totalRunImpact,  
        isWicket: false,
        extraType
    };
    // Safe timeline update using functional update
    setTimeline(prev => [...(prev || []), newTimelineEntry]);
   
    const comm = generateCommentary(
        currentBowlerId ? getPlayer(currentBowlerId).name : "Bowler",
        strikerId ? getPlayer(strikerId).name : "Batter",
        runValue,
        extraType,
        null
    );
    if(shotDirection) comm.text = comm.text.replace('.', ` towards ${shotDirection}.`);
    setCommentary(prev => [comm, ...(prev || [])]);

    // --- CALCULATE NEXT STATE ---
    let nextBalls = balls;
    let nextOvers = overs;
    let isOverComplete = false;
   
    if (isLegal) {
        let newBalls = balls + 1;
        if (newBalls === 6) {
            nextBalls = 0;
            nextOvers = overs + 1;
            isOverComplete = true;
        } else {
            nextBalls = newBalls;
        }
    }

    // --- CRITICAL FIX: PREPARE NEW STATS LOCALLY ---
    const ballsFaced = (extraType === 'Wd') ? 0 : 1;
    const currentStrikerStats = battingStats[strikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
   
    const newBattingStats = {
        ...battingStats,
        [strikerId]: {
            runs: currentStrikerStats.runs + runsScored,
            balls: currentStrikerStats.balls + ballsFaced,
            fours: currentStrikerStats.fours + (boundary === 4 ? 1 : 0),
            sixes: currentStrikerStats.sixes + (boundary === 6 ? 1 : 0)
        }
    };

    let newBowlerStats = { ...bowlerStats };
    if (currentBowlerId) {
        const stats = newBowlerStats[currentBowlerId] || { overs: 0, runs: 0, wickets: 0, balls: 0, maidens: 0, legalBalls: 0 };
        const bowlerRuns = (extraType === 'B' || extraType === 'LB') ? 0 : totalRunImpact;
       
        newBowlerStats[currentBowlerId] = {
            ...stats,
            runs: stats.runs + bowlerRuns,
            wickets: stats.wickets,
            balls: nextBalls,
            overs: nextOvers,
            legalBalls: stats.legalBalls + (isLegal ? 1 : 0)
        };
    }

    // Update State
    setBattingStats(newBattingStats);
    setBowlerStats(newBowlerStats);
   // --- CLOUD SAVE ---
    // We use 'commentary' (the state variable) instead of 'prev'
    // --- CLOUD SAVE ---
    saveToCloud({
        runs: newTotalScore,
        balls: nextBalls,
        overs: nextOvers,
        battingStats: newBattingStats,
        bowlerStats: newBowlerStats,
        timeline: [...(timeline || []), newTimelineEntry],
        // FIX IS HERE: Use 'commentary' instead of 'prev'
        commentary: [comm, ...(commentary || [])] 
    });

    const historyLabel = extraType ? (runValue > 0 ? `${extraType}+${runValue}` : extraType) : label;
    setCurrentOverHistory(prev => [...(prev || []), historyLabel]);

    // --- END OF INNINGS CHECK (Using Local Stats) ---
    const maxOvers = parseInt(matchSettings.totalOvers) || 0;
   
    // We pass the NEW updated timeline (including current ball) to handleInningsEnd
    const finalTimeline = [...(timeline || []), newTimelineEntry];

    if (nextOvers === maxOvers && nextBalls === 0) {
        setBalls(nextBalls);
        setOvers(nextOvers);
        handleInningsEnd(newTotalScore, nextOvers, nextBalls, newBattingStats, newBowlerStats, finalTimeline);
        return;
    }

    // --- BALL/OVER UPDATES ---
    if (isLegal) {
        setBalls(nextBalls);
        if (isOverComplete) {
            setOvers(nextOvers);
            setLastBowlerId(currentBowlerId);
            setCurrentOverHistory([]);
           
            // Fix: Force Modal Open for new bowler
            setTimeout(() => setActiveModal('BOWLER'), 50);

            // Logic: Swap Ends
            const isLastManStanding = matchSettings.lastManStanding && nonStrikerId === null;
            let swapNeeded = runValue % 2 !== 0;
            if (!isLastManStanding && !swapNeeded && nonStrikerId) {
                 setStrikerId(nonStrikerId);
                 setNonStrikerId(strikerId);
                 setStrikerStats(nonStrikerStats);
                 // We use the local 'newBattingStats' because state isn't ready
                 const sStats = newBattingStats[strikerId];
                 setNonStrikerStats(sStats);
            }
        } else {
            // Normal Ball - Swap if odd runs
            let swapNeeded = runValue % 2 !== 0;
            const isLastManStanding = matchSettings.lastManStanding && nonStrikerId === null;
           
            if (swapNeeded && !isLastManStanding && nonStrikerId) {
                setStrikerId(nonStrikerId);
                setNonStrikerId(strikerId);
                setStrikerStats(nonStrikerStats);
                const sStats = newBattingStats[strikerId];
                setNonStrikerStats(sStats);
            } else {
                const sStats = newBattingStats[strikerId];
                setStrikerStats(sStats);
            }
        }
    } else {
         // Illegal Ball
         let swapNeeded = runValue % 2 !== 0;
         if (swapNeeded && !matchSettings.lastManStanding && nonStrikerId) {
             setStrikerId(nonStrikerId);
             setNonStrikerId(strikerId);
             setStrikerStats(nonStrikerStats);
             const sStats = newBattingStats[strikerId];
             setNonStrikerStats(sStats);
         } else {
             const sStats = newBattingStats[strikerId];
             setStrikerStats(sStats);
         }
    }
   
    // Check Match End (Using Local Stats)
    checkMatchEnd(newTotalScore, newBattingStats, newBowlerStats);
  };

  const confirmWicket = (type, fielderId = null, victimId = strikerId) => {
    const currentTotalBalls = overs * 6 + balls;
    const maxBalls = matchSettings.totalOvers * 6;
    if (currentTotalBalls >= maxBalls) return;

    pushHistory();

    // 1. Prepare New Stats
    const currentStrikerStats = battingStats[strikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const newBattingStats = {
        ...battingStats,
        [strikerId]: {
            ...currentStrikerStats,
            balls: currentStrikerStats.balls + 1
        }
    };
    setBattingStats(newBattingStats);

    // 2. Identify Stats for the Victim
    const isStrikerOut = victimId === strikerId;
    const victimStats = isStrikerOut ? { ...strikerStats, balls: strikerStats.balls + 1 } : nonStrikerStats;

    // 3. Record Wicket
    const outData = { 
        playerId: victimId, 
        runs: victimStats.runs, 
        balls: victimStats.balls, 
        howOut: type, 
        fielderId, 
        bowlerId: currentBowlerId, 
        fours: victimStats.fours, 
        sixes: victimStats.sixes 
    };
    
    const newOutPlayers = [...outPlayers, outData];
    setOutPlayers(newOutPlayers);

    // 4. Increment Wickets
    const newWickets = wickets + 1;
    setWickets(newWickets);
    setScoreAtLastWicket(runs);
    setBallsAtLastWicket(currentTotalBalls + 1);

    // 5. Update Timeline
    const currentTotalOvers = overs + (balls / 6);
    const newTimelineEntry = {
        totalRuns: runs,
        runRate: runs / (currentTotalOvers || 1),
        isWicket: true,
        strikerId: strikerId,
        bowlerId: currentBowlerId,
        ballRuns: 0
    };
    const finalTimeline = [...(timeline || []), newTimelineEntry];
    setTimeline(finalTimeline);

    setCurrentOverHistory(prev => [...prev, 'W']);
    const comm = generateCommentary(getPlayer(currentBowlerId).name, getPlayer(strikerId).name, 0, null, type);
    setCommentary(prev => [comm, ...prev]);

    // 6. Update Balls/Overs
    let newBalls = balls + 1;
    let isOverEnd = false;
    let nextOvers = overs;

    if (newBalls === 6) {
        setBalls(0);
        setOvers(prev => prev + 1);
        setLastBowlerId(currentBowlerId);
        setCurrentOverHistory([]);
        isOverEnd = true;
        nextOvers = overs + 1;
    } else {
        setBalls(newBalls);
    }

    // 7. Update Bowler Stats
    let newBowlerStats = { ...bowlerStats };
    if (currentBowlerId) {
        const stats = newBowlerStats[currentBowlerId] || { overs: 0, runs: 0, wickets: 0, balls: 0, maidens: 0, legalBalls: 0 };
        let bBalls = stats.balls + 1;
        let bOvers = stats.overs;
        if (bBalls === 6) { bOvers += 1; bBalls = 0; }

        newBowlerStats[currentBowlerId] = {
            ...stats,
            wickets: stats.wickets + 1,
            balls: bBalls,
            overs: bOvers,
            legalBalls: stats.legalBalls + 1
        };
    }
    setBowlerStats(newBowlerStats);

    // 8. Remove the Victim
    if (isStrikerOut) {
        setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
        setStrikerId(null);
    } else {
        setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
        setNonStrikerId(null);
    }

    if (isOverEnd && nextOvers === matchSettings.totalOvers) {
        handleInningsEnd(runs, nextOvers, 0, newBattingStats, newBowlerStats, finalTimeline, newOutPlayers, newWickets);
        return;
    }

    // --- CRITICAL FIX START: Safe "All Out" Logic ---
    const squadSize = getBattingSquad().length;
    // Only trigger All Out if we actually HAVE players in the squad (squadSize > 0)
    // This prevents the "Instant Match End" bug if data is loading
    const isAllOut = squadSize > 0 && (
        matchSettings.lastManStanding
        ? newWickets >= squadSize
        : newWickets >= squadSize - 1
    );
    // --- CRITICAL FIX END ---

    if (isAllOut) {
        handleInningsEnd(runs, isOverEnd ? nextOvers : overs, isOverEnd ? 0 : newBalls, newBattingStats, newBowlerStats, finalTimeline, newOutPlayers, newWickets);
    } else {
        if (matchSettings.lastManStanding && squadSize > 0 && newWickets === squadSize - 1) {
            if (!isStrikerOut) {
                 setNonStrikerId(null);
            } else {
                setStrikerId(nonStrikerId);
                setStrikerStats(nonStrikerStats);
                setNonStrikerId(null);
                setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
            }
            if (isOverEnd) setTimeout(() => setActiveModal('BOWLER'), 0);
        } else {
            setActiveModal('SELECT_BATSMAN');
        }
    }
  };
// --- NEW FEATURE: ADD PLAYER DURING MATCH ---
const handleAddLatecomer = (teamId, playerDetails, isNewPlayer) => {
  let playerId = playerDetails.id;

  // 1. If it's a brand new player, create them in the pool first
  if (isNewPlayer) {
    playerId = generateId();
    const newPlayer = {
      id: playerId,
      name: playerDetails.name,
      role: playerDetails.role || 'All-Rounder',
      battingStyle: playerDetails.battingStyle || 'Right',
      bowlingStyle: playerDetails.bowlingStyle || 'Right Arm Seam',
      image: null
    };
    setPlayerPool(prev => [...prev, newPlayer]);
  }

  // 2. Add this ID to the specific Team's player list
  setSavedTeams(prev => prev.map(t => {
    if (t.id === teamId) {
      // Prevent duplicates
      if (t.players.includes(playerId)) return t;
      return { ...t, players: [...t.players, playerId] };
    }
    return t;
  }));

  setActiveModal(null);
  alert(`${playerDetails.name} added to the squad!`);
};
  const handleRetire = (type) => {
      pushHistory();
      const isHurt = type === 'HURT';
      const currentOutCount = outPlayers.length;
      const currentHurtCount = retiredHurtPlayers.length;
      let newTotalGone = 0;

      if (isHurt) {
          setRetiredHurtPlayers(prev => [...prev, { id: strikerId, stats: strikerStats }]);
          newTotalGone = currentOutCount + currentHurtCount + 1; 
      } else {
          setRetiredPlayers(prev => [...prev, strikerId]);
          setOutPlayers(prev => [...prev, { 
              playerId: strikerId, 
              runs: strikerStats.runs, 
              balls: strikerStats.balls, 
              howOut: 'Retired Out', 
              fours: strikerStats.fours, 
              sixes: strikerStats.sixes 
          }]);
          setWickets(prev => prev + 1);
          setScoreAtLastWicket(runs);
          setBallsAtLastWicket(overs * 6 + balls);
          newTotalGone = currentOutCount + currentHurtCount + 1;
      }

      setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
      setStrikerId(null);

      const squadSize = getBattingSquad().length;
      const limit = matchSettings.lastManStanding ? squadSize : squadSize - 1;

      // FIX: Added (squadSize > 0) check to prevent bugs
      if (squadSize > 0 && newTotalGone >= limit) {
             if (matchSettings.lastManStanding && newTotalGone === squadSize - 1) {
                if (nonStrikerId) {
                    setStrikerId(nonStrikerId);
                    setStrikerStats(nonStrikerStats);
                    setNonStrikerId(null);
                    setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
                    setTimeout(() => setActiveModal('BOWLER'), 100);
                } else {
                     handleInningsEnd();
                }
             } else {
                handleInningsEnd();
             }
      } else {
            setActiveModal('SELECT_BATSMAN');
      }
  };

  const checkMatchEnd = (currentTotal, currentBattingStats, currentBowlerStats) => {
      if (gameState === 'INNINGS_2' && firstInningsData) {
          if (currentTotal > firstInningsData.runs) {
              handleInningsEnd(currentTotal, undefined, undefined, currentBattingStats, currentBowlerStats);
          }
      }
  };

  // REPLACE your entire handleInningsEnd function with this:

// UPDATED handleInningsEnd to accept finalOutPlayers
// UPDATED handleInningsEnd to accept finalWickets and finalOutPlayers
const handleInningsEnd = (finalScore, finalOvers, finalBalls, finalBattingStats, finalBowlerStats, finalTimeline, finalOutPlayers, finalWickets) => {
    setActiveModal(null);
    const finalRuns = finalScore !== undefined ? finalScore : runs;
    const endOvers = finalOvers !== undefined ? finalOvers : overs;
    const endBalls = finalBalls !== undefined ? finalBalls : balls;
    // FIX: Use the Passed Wickets if available, otherwise use state
    const endWickets = finalWickets !== undefined ? finalWickets : wickets;
   
    // FIX: Use the Passed OutPlayers if available
    const currentOutPlayers = finalOutPlayers || outPlayers;

    // 1. Get pure 2nd innings stats
    const secondInningsBattingStats = finalBattingStats || battingStats;
    const secondInningsBowlingStats = finalBowlerStats || bowlerStats;

    if (gameState === 'INNINGS_1') {
        // 1. Prepare Data Object
        const i1Data = {
            teamName: savedTeams.find(t => t.id === getCurrentBattingTeamId())?.name,
            runs: finalRuns,
            wickets: endWickets,
            overs: endOvers,
            balls: endBalls,
            bowlerStats: secondInningsBowlingStats,
            outPlayers: currentOutPlayers,
            battingStats: secondInningsBattingStats,
            timeline: finalTimeline || timeline
        };

        // 2. Set Local State
        setFirstInningsData(i1Data);
        setBattingStats({});
        setBowlerStats({});
        setBattingOrder([]);
        setRetiredHurtPlayers([]);
        setCommentary([]);
        setCurrentOverHistory([]);
        setScoreAtLastWicket(0);
        setBallsAtLastWicket(0);
        setTimeline([]);
        setGameState('INNINGS_BREAK');

        // 3. CRITICAL: Save to Cloud immediately
        saveToCloud({
            gameState: 'INNINGS_BREAK',
            innings1: i1Data, // Persist the score
            runs: 0, wickets: 0, balls: 0, overs: 0, // Reset cloud live score
            battingStats: {}, bowlerStats: {}, 
            timeline: [], commentary: [],
            strikerId: null, nonStrikerId: null, currentBowlerId: null
        });
    } else {
        // --- MATCH OVER LOGIC ---

        // 2. TRUE AGGREGATION: SUM stats from both innings
        const matchBattingStats = { ...firstInningsData?.battingStats };
        const matchBowlingStats = { ...firstInningsData?.bowlerStats };

        // Helper to sum batting stats
        Object.entries(secondInningsBattingStats).forEach(([pid, stats]) => {
            if (matchBattingStats[pid]) {
                matchBattingStats[pid] = {
                    runs: matchBattingStats[pid].runs + stats.runs,
                    balls: matchBattingStats[pid].balls + stats.balls,
                    fours: matchBattingStats[pid].fours + stats.fours,
                    sixes: matchBattingStats[pid].sixes + stats.sixes,
                };
            } else {
                matchBattingStats[pid] = stats;
            }
        });

        // Helper to sum bowling stats
        Object.entries(secondInningsBowlingStats).forEach(([pid, stats]) => {
            if (matchBowlingStats[pid]) {
                matchBowlingStats[pid] = {
                    runs: matchBowlingStats[pid].runs + stats.runs,
                    wickets: matchBowlingStats[pid].wickets + stats.wickets,
                    legalBalls: matchBowlingStats[pid].legalBalls + stats.legalBalls,
                    maidens: matchBowlingStats[pid].maidens + stats.maidens,
                };
            } else {
                matchBowlingStats[pid] = stats;
            }
        });

        // 3. DETERMINE WINNER
        let winnerId = null;
        const targetScore = firstInningsData?.runs || 0;
        if (finalRuns > targetScore) winnerId = getCurrentBattingTeamId();
        else if (finalRuns < targetScore) winnerId = matchSettings.battingFirstId;
       
        // 4. CALCULATE MOM (Updated for Fairness)
  let calculatedMomId = null;
  try {
    let allPerformances = [];
    playerPool.forEach(p => {
      const bat = matchBattingStats[p.id];
      const bowl = matchBowlingStats[p.id];

      if (bat || bowl) {
        let catches = 0, runouts = 0, stumpings = 0;
        // ... (Keep your existing fielding counting logic here) ...
        [...(firstInningsData?.outPlayers || []), ...currentOutPlayers].forEach(out => {
             if (out.fielderId === p.id) {
               if (out.howOut === 'Caught') catches++;
               if (out.howOut === 'Run Out') runouts++;
               if (out.howOut === 'Stumped') stumpings++;
             }
        });

        const fieldStats = { catches, runouts, stumpings };
        let pts = 0;
        // Use the updated function with lower ball threshold
        if (typeof calculateMVPPoints === 'function') {
          pts = calculateMVPPoints(bat, bowl, fieldStats);
        } else {
          pts = (bat?.runs || 0) + ((bowl?.wickets || 0) * 25);
        }

        const statsObj = {
          runs: bat ? bat.runs : 0,
          balls: bat ? bat.balls : 0,
          fours: bat ? bat.fours : 0,
          sixes: bat ? bat.sixes : 0,
          wickets: bowl ? bowl.wickets : 0,
          runsConceded: bowl ? bowl.runs : 0,
          legalBalls: bowl ? bowl.legalBalls : 0,
          maidens: bowl ? bowl.maidens : 0,
          catches, runouts, stumpings
        };

        const winningTeamObj = savedTeams.find(t => t.id === winnerId);
        const isFromWinningTeam = winningTeamObj?.players?.includes(p.id) || false;

        allPerformances.push({
          player: p,
          stats: statsObj,
          points: pts,
          isWinner: isFromWinningTeam
        });
      }
    });

    allPerformances.sort((a, b) => b.points - a.points);
    const bestWinner = allPerformances.find(p => p.isWinner);
    const bestLoser = allPerformances.find(p => !p.isWinner);
    let selectedMom = null;

    if (!bestWinner && !bestLoser) selectedMom = null;
    else if (!bestWinner) selectedMom = bestLoser;
    else if (!bestLoser) selectedMom = bestWinner;
    else {
      // FIX 2: Increased Threshold from 1.5 to 2.5
      // The loser now needs 2.5x more points than the winner to steal the award.
      if (bestLoser.points > (bestWinner.points * 2.5)) selectedMom = bestLoser;
      else selectedMom = bestWinner;
    }

    if (selectedMom) {
      calculatedMomId = selectedMom.player.id;
      setMom(selectedMom.player);
      setMomStats(selectedMom.stats);
    } else {
      setMom(null);
      setMomStats(null);
    }

  } catch (error) {
    console.error("MOM Calculation error", error);
  }

  // 5. SERIES UPDATES (Fixed Logic with String Conversion)
  if (seriesConfig.active) {
    // Force convert IDs to string to ensure matching works regardless of type (number vs string)
    const wId = String(winnerId);
    const t1Id = String(matchSettings.team1Id);
    const t2Id = String(matchSettings.team2Id);

    const isTeam1Winner = wId === t1Id;
    const isTeam2Winner = wId === t2Id;

    console.log("Series Update Debug:", { wId, t1Id, t2Id, isTeam1Winner, isTeam2Winner });

    setSeriesConfig(prev => ({
      ...prev,
      matchesPlayed: prev.matchesPlayed + 1,
      team1Wins: prev.team1Wins + (isTeam1Winner ? 1 : 0),
      team2Wins: prev.team2Wins + (isTeam2Winner ? 1 : 0),
      history: [...prev.history, { battingStats: matchBattingStats, bowlerStats: matchBowlingStats }]
    }));
  }

  // --- NEW: MOS LOGIC START (Fixed Display Bug) ---
  let seriesMosId = null;
  let currentMosStats = null;

  const totalMatches = seriesConfig.type === 'SERIES_5' ? 5 : 3;
  // Use (matchesPlayed + 1) because state update is scheduled but not yet applied
  if (seriesConfig.active && (seriesConfig.matchesPlayed + 1) >= totalMatches) {
    try {
      const allSeriesMatches = [
        ...seriesConfig.history,
        { battingStats: matchBattingStats, bowlerStats: matchBowlingStats }
      ];

      const playerTotals = {};

      allSeriesMatches.forEach(match => {
        // Aggregate Batting
        Object.entries(match.battingStats || {}).forEach(([pid, stat]) => {
          if (!playerTotals[pid]) playerTotals[pid] = { points: 0, runs: 0, wickets: 0, bowlRuns: 0 };
         
          playerTotals[pid].points += (stat.runs || 0) + ((stat.fours || 0) * 1) + ((stat.sixes || 0) * 2);
          playerTotals[pid].runs += (stat.runs || 0);
        });
       
        // Aggregate Bowling
        Object.entries(match.bowlerStats || {}).forEach(([pid, stat]) => {
          if (!playerTotals[pid]) playerTotals[pid] = { points: 0, runs: 0, wickets: 0, bowlRuns: 0 };
         
          playerTotals[pid].points += ((stat.wickets || 0) * 25);
          playerTotals[pid].wickets += (stat.wickets || 0);
          playerTotals[pid].bowlRuns += (stat.runs || 0);
        });
      });

      let bestPid = null;
      let maxPts = -1;
     
      Object.entries(playerTotals).forEach(([pid, stats]) => {
        if (stats.points > maxPts) {
          maxPts = stats.points;
          bestPid = pid;
        }
      });

      if (bestPid) {
        seriesMosId = bestPid;
        setMos(getPlayer(bestPid));
       
        // FIX 3: Store Actual Wickets and Runs Conceded
        setMosStats({
           runs: playerTotals[bestPid].runs,
           wickets: playerTotals[bestPid].wickets,
           runsConceded: playerTotals[bestPid].bowlRuns,
           balls: 0, fours: 0, sixes: 0
        });
      }
    } catch (err) {
      console.error("Error calculating Man of Series:", err);
    }
  }
  // --- MOS LOGIC END ---

  // 6. SAVE MATCH HISTORY
  const t1 = savedTeams.find(t => t.id === matchSettings.battingFirstId);
  const t2 = savedTeams.find(t => t.id === getCurrentBattingTeamId());

  const finalMatchData = {
    id: generateId(),
    date: new Date().toISOString(),
    venue: matchSettings.venue,
    winnerId,
    momId: calculatedMomId, // <--- FIX: Using local variable for MOM
    mosId: seriesMosId,     // <--- FIX: Using local variable for MOS
    scoreSummary: {
      t1: { id: t1.id, name: t1.name, runs: firstInningsData.runs, wickets: firstInningsData.wickets },
      t2: { id: t2.id, name: t2.name, runs: finalRuns, wickets: endWickets }
    },
    timeline: finalTimeline || timeline,
    firstInningsTimeline: firstInningsData?.timeline,
    innings1: firstInningsData,
    innings2: {
      teamName: t2.name,
      runs: finalRuns,
      wickets: endWickets,
      overs: endOvers,
      balls: endBalls,
      battingStats: secondInningsBattingStats,
      bowlerStats: secondInningsBowlingStats,
      outPlayers: currentOutPlayers
    },
    battingStats: matchBattingStats,
    bowlerStats: matchBowlingStats,
    outPlayers: [...(firstInningsData?.outPlayers || []), ...currentOutPlayers]
  };
        setMatchHistory(prev => [...prev, finalMatchData]);
        setSelectedArchivedMatch(finalMatchData);
        // FIX: Tell Cloud the match is over
        saveToCloud({
            gameState: 'MATCH_OVER',
            winnerId: winnerId,
            finalResult: finalMatchData
        });
        setGameState('MATCH_OVER');
    }
};
const handleAddPlayerInMatch = (playerData, targetTeamId) => {
  let pid = playerData.id;
  if (!pid) {
    pid = generateId();
    const newPlayer = { ...playerData, id: pid };
    setPlayerPool(prev => [...prev, newPlayer]);
  }
  setSavedTeams(prev => prev.map(t => {
    if (t.id === targetTeamId) {
      if (t.players.includes(pid)) return t;
      return { ...t, players: [...t.players, pid] };
    }
    return t;
  }));
};

const handleExportData = () => {
  const backup = { playerPool, savedTeams, matchHistory, seriesConfig, timestamp: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cricpro_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.playerPool) setPlayerPool(parsed.playerPool);
        if (parsed.savedTeams) setSavedTeams(parsed.savedTeams);
        if (parsed.matchHistory) setMatchHistory(parsed.matchHistory);
        if (parsed.seriesConfig) setSeriesConfig(parsed.seriesConfig);
        alert("Data restored successfully!");
      } catch (err) { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // --- NEW: Handle Batsman Selection (Smart Logic) ---
  const handleBatsmanSelect = (playerId, isResuming) => {
    // 1. Handling Retired Player Resuming
    if (isResuming) {
        const saved = retiredHurtPlayers.find(p => p.id === playerId);
        const savedStats = saved ? saved.stats : { runs: 0, balls: 0, fours: 0, sixes: 0 };
        
        // Put them in the empty slot
        if (!strikerId) {
            setStrikerId(playerId);
            setStrikerStats(savedStats);
        } else {
            setNonStrikerId(playerId);
            setNonStrikerStats(savedStats);
        }
        setRetiredHurtPlayers(prev => prev.filter(p => p.id !== playerId));
    } 
    // 2. Handling Fresh Batsman
    else {
        // Smart Check: Fill ONLY the empty slot
        if (!strikerId) {
            setStrikerId(playerId);
            setStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
        } else {
            setNonStrikerId(playerId);
            setNonStrikerStats({ runs: 0, balls: 0, fours: 0, sixes: 0 });
        }

        // Add to Batting Order if new
        if (!battingOrder.includes(playerId)) {
            setBattingOrder(prev => [...prev, playerId]);
        }
    }

    setActiveModal(null);

    // 3. Trigger Bowler Selection if needed (Start of new over)
    if (balls === 0 && overs > 0 && currentOverHistory.length === 0) {
        setTimeout(() => setActiveModal('BOWLER'), 100);
    }
  };

// START OF PART 22
const striker = getPlayer(strikerId);
const nonStriker = getPlayer(nonStrikerId);
const bowler = getPlayer(currentBowlerId);

// AFTER (Seamless Pitch Black)
// --- NEW: HANDLE EXIT MATCH ---
  // This function safely closes the current match view without deleting data
  const handleExitMatch = () => {
    // 1. Confirm Intent
    if (!confirm("Exit to Main Menu? \n\nThe match is saved in the cloud. You can resume it anytime using the Resume feature.")) {
        return;
    }

    // 2. Clear the URL (Prevent auto-resume on refresh)
    // This removes '?matchId=...' from the address bar
    const cleanUrl = window.location.pathname;
    window.history.pushState({}, '', cleanUrl);

    // 3. Detach from Cloud Match (Stops the Firebase listener)
    setMatchId(null);

    // 4. Reset Local State to Safe Defaults (Clean the RAM)
    setGameState('SETUP');
    setRuns(0);
    setWickets(0);
    setOvers(0);
    setBalls(0);
    setTimeline([]);
    setCommentary([]);
    setStrikerId(null);
    setNonStrikerId(null);
    setCurrentBowlerId(null);
  };

  // ---------------------------------------------------------
return (
  
  <div className="min-h-screen bg-black text-slate-100 font-sans pb-24 selection:bg-orange-500/30">
     
      {/* MODALS */}
      {activeModal === 'PLAYER_MANAGER' && <PlayerManagerModal players={playerPool} setPlayers={setPlayerPool} onClose={() => setActiveModal(null)} />}
      {activeModal === 'TEAM_MANAGER' && <TeamManagerModal teams={savedTeams} setTeams={setSavedTeams} players={playerPool} onClose={() => setActiveModal(null)} />}
      {activeModal === 'ADD_LATE_PLAYER' && (
  <AddLatePlayerModal
    teams={savedTeams}
    allPlayers={playerPool}
    battingTeamId={getCurrentBattingTeamId()}
    bowlingTeamId={getCurrentBowlingTeamId()}
    onAdd={handleAddLatecomer}
    onClose={() => setActiveModal(null)}
  />
)}
      {activeModal === 'RANKINGS' && <RankingsModal matchSettings={matchSettings} players={playerPool} matchHistory={matchHistory} battingStats={battingStats} bowlerStats={bowlerStats} firstInningsData={firstInningsData} onClose={() => setActiveModal(null)} outPlayers={outPlayers} />}
      {activeModal === 'PROFILES' && <PlayerProfileModal players={playerPool} matchHistory={matchHistory} onClose={() => setActiveModal(null)} onResetProfile={handleResetPlayerProfile} />}
      {activeModal === 'MATCH_SETTINGS' && <MatchSettingsModal currentSettings={matchSettings} onUpdate={setMatchSettings} onClose={() => setActiveModal(null)} />}
      {activeModal === 'ARCHIVES' && <ArchivesModal matchHistory={matchHistory} teams={savedTeams} players={playerPool} onClose={() => setActiveModal(null)} onViewScorecard={(match) => { setSelectedArchivedMatch(match); setActiveModal('ARCHIVED_MATCH_DETAIL'); }} />}
      {activeModal === 'ARCHIVED_MATCH_DETAIL' && selectedArchivedMatch && <ArchivedMatchDetail match={selectedArchivedMatch} players={playerPool} onClose={() => setActiveModal('ARCHIVES')} />}
     
      {activeModal === 'RESET_CONFIRM' && (
        <Modal title="Reset All Stats" onClose={() => setActiveModal(null)}>
            <div className="space-y-4">
                <div className="text-center text-slate-300">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-2" />
                    <p>Are you sure you want to reset all player profiles and match history?</p>
                    <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setActiveModal(null)} className="flex-1">No, Cancel</Button>
                    <Button variant="danger" onClick={handleResetStats} className="flex-1">Yes, Reset</Button>
                </div>
            </div>
        </Modal>
      )}

      {activeModal === 'NO_BALL_OPTIONS' && (
        <Modal title="No Ball Runs" onClose={() => setActiveModal(null)}>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 6].map(r => (
              <button
                key={r}
                onClick={() => handleScore(r.toString(), r, false, 'NB')}
                className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white text-xl border border-slate-700"
              >
                NB + {r}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* --- NEW MATCH OVER SCREEN (START) --- */}

      {/* --- NEW MATCH OVER SCREEN (END) --- */}
      {activeModal === 'BYE_OPTIONS' && <Modal title="Byes/Leg Byes" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
              <p className="text-sm text-slate-400">Select Runs</p>
              <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(r => <button key={r} onClick={() => { handleScore(`${r}B`, r, true, 'B'); setActiveModal(null); }} className="p-3 bg-slate-800 rounded font-bold text-white border border-slate-700">B+{r}</button>)}</div>
              <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(r => <button key={r} onClick={() => { handleScore(`${r}LB`, r, true, 'LB'); setActiveModal(null); }} className="p-3 bg-slate-800 rounded font-bold text-white border border-slate-700">LB+{r}</button>)}</div>
          </div>
      </Modal>}
      
      {activeModal === 'WICKET_DETAIL' && <WicketModal squad={getBowlingSquad()} players={playerPool} striker={striker} nonStriker={nonStriker} onConfirm={(type, fielder, victim) => { confirmWicket(type, fielder, victim); }} onClose={() => setActiveModal(null)} />}
      
      {activeModal === 'RETIRE_OPTIONS' && <Modal title="Retire" onClose={() => setActiveModal(null)}><div className="space-y-4"><button onClick={() => { handleRetire('HURT'); }} className="w-full p-4 bg-orange-700/50 border border-orange-500 rounded-xl flex gap-4"><HeartPulse className="text-orange-400"/><div><div className="font-bold">Retire Hurt</div><div className="text-xs text-slate-300">Can return later</div></div></button></div></Modal>}
      {activeModal === 'OPENERS' && <OpenersModal squad={getBattingSquad()} teamName={savedTeams.find(t=>t.id === getCurrentBattingTeamId())?.name} onSelect={(sId, nsId) => { setStrikerId(sId); setNonStrikerId(nsId); setStrikerStats({runs: 0, balls: 0, fours: 0, sixes: 0}); setNonStrikerStats({runs: 0, balls: 0, fours: 0, sixes: 0}); setBattingOrder([sId, nsId]); setActiveModal('BOWLER'); }} onClose={() => {}} />}
      
      {(activeModal === 'SELECT_BATSMAN' || activeModal === 'CHANGE_BATSMAN') && (
        <PlayerSelectionModal 
            title={activeModal === 'CHANGE_BATSMAN' ? "Edit Batsman" : "New Batsman"} 
            squad={getBattingSquad()} 
            retiredHurtPlayers={retiredHurtPlayers} 
            excludeIds={[strikerId, nonStrikerId, ...outPlayers.map(o => o.playerId), ...retiredPlayers].filter(Boolean)} 
            onSelect={handleBatsmanSelect} 
            onClose={() => setActiveModal(null)} 
        />
      )}

{/* NEW: Change Non-Striker Modal */}
{activeModal === 'CHANGE_NON_STRIKER' && <PlayerSelectionModal title="Change Non-Striker" squad={getBattingSquad()} retiredHurtPlayers={retiredHurtPlayers} excludeIds={[strikerId, nonStrikerId, ...outPlayers.map(o => o.playerId), ...retiredPlayers]} onSelect={(pid, isResuming) => { setNonStrikerId(pid); setNonStrikerStats({runs: 0, balls: 0, fours: 0, sixes: 0}); if(!battingOrder.includes(pid)) setBattingOrder(prev => [...prev, pid]); setActiveModal(null); }} onClose={() => setActiveModal(null)} />}

{activeModal === 'BOWLER' && <BowlerSelectionModal currentOver={overs + 1} squad={getBowlingSquad()} lastBowlerId={lastBowlerId} maxOvers={matchSettings.maxOversPerBowler} onSelect={(pid) => { setCurrentBowlerId(pid); setActiveModal(null); }} onClose={() => {}} />}
      {/* --- NEW SHOT MAP MODAL START --- */}
      {activeModal === 'SHOT_MAP_INPUT' && (
        <ShotMapSelector 
            onSelect={(zone) => { 
                processScore(pendingScore.label, pendingScore.runValue, pendingScore.isLegal, pendingScore.extraType, zone);
                setActiveModal(null); 
                setPendingScore(null);
            }} 
            onClose={() => { 
                // If closed without selection, process with no direction
                processScore(pendingScore.label, pendingScore.runValue, pendingScore.isLegal, pendingScore.extraType, null);
                setActiveModal(null);
                setPendingScore(null);
            }} 
        />
      )}
      {/* --- NEW SHOT MAP MODAL END --- */}
      {activeModal === 'SCORECARD' && (
        <ScorecardModal 
            matchSettings={matchSettings} 
            teamName={savedTeams.find(t=>t.id === getCurrentBattingTeamId())?.name} 
            data={{ runs, wickets, overs, balls, strikerId, nonStrikerId, strikerStats, nonStrikerStats, outPlayers, bowlerStats, retiredHurtPlayers, extras }} 
            players={playerPool} 
            battingOrder={battingOrder} 
            onClose={() => setActiveModal(null)} 
        />
      )}
{activeModal === 'H2H' && <HeadToHeadModal players={playerPool} matchHistory={matchHistory} onClose={() => setActiveModal(null)} />}
      {/* SCREENS */}
      {gameState === 'SETUP' && <SetupScreen
    resumeId={resumeId} // <--- NEW PROP
    onResume={(id) => { // <--- NEW HANDLER
        setMatchId(id);
        const newUrl = `${window.location.pathname}?matchId=${id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }}
    teams={savedTeams}
    players={playerPool}
    onStart={startMatch}
    onManagePlayers={() => setActiveModal('PLAYER_MANAGER')}
    onManageTeams={() => setActiveModal('TEAM_MANAGER')}
    onOpenRankings={() => setActiveModal('RANKINGS')}
    onOpenProfiles={() => setActiveModal('PROFILES')}
    onOpenArchives={(mode) => {
        if(mode === 'H2H') setActiveModal('H2H');
        else setActiveModal('ARCHIVES');
    }}
    onRequestReset={() => setActiveModal('RESET_CONFIRM')}
    onExport={handleExportData}
    onImport={handleImportData}
/>}
      {gameState === 'TOSS' && <TossScreen team1={savedTeams.find(t => t.id === matchSettings.team1Id)} team2={savedTeams.find(t => t.id === matchSettings.team2Id)} onToss={(winnerId, choice) => { const batFirstId = choice === 'bat' ? winnerId : (winnerId === matchSettings.team1Id ? matchSettings.team2Id : matchSettings.team1Id); const batSecondId = batFirstId === matchSettings.team1Id ? matchSettings.team2Id : matchSettings.team1Id; setMatchSettings(prev => ({ ...prev, tossWinnerId: winnerId, tossChoice: choice, battingFirstId: batFirstId, battingSecondId: batSecondId })); setGameState('INNINGS_1'); setActiveModal('OPENERS'); }} />}
      {gameState === 'INNINGS_BREAK' && (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
    <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>

      {/* 1. HERO HEADER */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">{firstInningsData.teamName}</h2>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Innings Complete</div>
      </div>

      <div className="text-center mb-8">
        <div className="text-7xl font-black text-white leading-none flex items-baseline justify-center gap-1 drop-shadow-xl">
          {firstInningsData.runs}<span className="text-3xl text-slate-500 font-medium">/{firstInningsData.wickets}</span>
        </div>
        <div className="inline-block bg-white/5 px-4 py-1 rounded-full border border-white/5 mt-3">
          <span className="text-slate-400 text-xs font-bold uppercase mr-2">Overs</span>
          <span className="text-white font-mono text-sm font-bold">{firstInningsData.overs}.{firstInningsData.balls}</span>
        </div>
      </div>

      {/* 2. TARGET CARD (Refined) */}
      <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-xl p-4 border border-white/10 mb-6 text-center shadow-lg relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 blur-xl rounded-full"></div>
       
        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Target to Win</div>
        <div className="text-5xl font-black text-white tracking-tighter">{firstInningsData.runs + 1}</div>
        <div className="text-xs text-slate-400 font-medium mt-2 bg-black/40 inline-block px-3 py-1 rounded-lg border border-white/5">
          Required Rate: <span className="text-orange-400 font-bold">{((firstInningsData.runs + 1) / matchSettings.totalOvers).toFixed(2)}</span>
        </div>
      </div>

      {/* 3. NEW: TOP PERFORMERS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Top Batters Column */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
             <div className="w-1 h-3 bg-orange-500 rounded-full"></div> Top Batters
          </div>
          <div className="space-y-2">
            {Object.entries(firstInningsData.battingStats)
              .map(([id, s]) => ({...s, id, name: getPlayer(id).name}))
              .sort((a,b) => b.runs - a.runs)
              .slice(0, 2)
              .map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold truncate max-w-[80px]">{p.name}</span>
                  <span className="text-white font-mono">{p.runs} <span className="text-[9px] text-slate-600">({p.balls})</span></span>
                </div>
            ))}
             {Object.keys(firstInningsData.battingStats).length === 0 && <div className="text-[10px] text-slate-600 italic">No runs yet</div>}
          </div>
        </div>

        {/* Top Bowlers Column */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
             <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> Top Bowlers
          </div>
          <div className="space-y-2">
            {Object.entries(firstInningsData.bowlerStats)
              .map(([id, s]) => ({...s, id, name: getPlayer(id).name}))
              .sort((a,b) => b.wickets - a.wickets || a.runs - b.runs)
              .slice(0, 2)
              .map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold truncate max-w-[80px]">{p.name}</span>
                  <span className="text-white font-mono">{p.wickets}-{p.runs} <span className="text-[9px] text-slate-600">({getOversFromBalls(p.legalBalls)})</span></span>
                </div>
            ))}
            {Object.keys(firstInningsData.bowlerStats).length === 0 && <div className="text-[10px] text-slate-600 italic">No wickets yet</div>}
          </div>
        </div>
      </div>

      <Button
        onClick={() => {
          setRuns(0); setWickets(0); setBalls(0); setOvers(0);
          setOutPlayers([]); setBowlerStats({});
          setRetiredHurtPlayers([]); setStrikerId(null); setNonStrikerId(null); setCurrentBowlerId(null);
          setScoreAtLastWicket(0); setBallsAtLastWicket(0); setExtras({wd:0,nb:0,lb:0,b:0});
          setCommentary([]); setCurrentOverHistory([]); setTimeline([]); setGameState('INNINGS_2');
          setActiveModal('OPENERS');
        }}
        className="w-full py-4 text-lg font-black uppercase tracking-widest bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-orange-900/30 hover:scale-[1.02] transition-transform"
      >
        Start 2nd Innings
      </Button>
    </div>
  </div>
)}
      
{gameState === 'MATCH_OVER' && (
<div className="flex flex-col items-center justify-center min-h-screen pb-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/20 via-black to-black p-4">
 
  {/* 1. HERO WINNER BANNER */}
  <div className="text-center mb-8 animate-in zoom-in duration-500">
    <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-[0_0_50px_rgba(249,115,22,0.6)] mb-4">
      <Trophy size={40} className="text-white drop-shadow-md" />
    </div>
    <h1 className="text-sm font-bold text-orange-500 uppercase tracking-[0.3em] mb-2">Match Result</h1>
    <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase italic">
      {matchHistory[matchHistory.length-1]?.winnerId
        ? savedTeams.find(t => t.id === matchHistory[matchHistory.length-1].winnerId)?.name + " Won!"
        : "Match Drawn"}
    </div>
    <div className="text-slate-400 mt-2 font-mono text-sm">
      Match ended via {matchSettings.totalOvers} over contest
    </div>
  </div>

  {/* 2. MATCH SUMMARY GRID */}
  <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
     <div className="bg-neutral-900/80 p-4 rounded-2xl border border-orange-500/30 text-center">
        <div className="text-[10px] text-slate-500 uppercase font-bold">Winner</div>
        <div className="text-2xl font-black text-white">
           {matchHistory[matchHistory.length-1]?.scoreSummary?.t1?.id === matchHistory[matchHistory.length-1]?.winnerId
             ? matchHistory[matchHistory.length-1]?.scoreSummary?.t1?.runs + "/" + matchHistory[matchHistory.length-1]?.scoreSummary?.t1?.wickets
             : matchHistory[matchHistory.length-1]?.scoreSummary?.t2?.runs + "/" + matchHistory[matchHistory.length-1]?.scoreSummary?.t2?.wickets}
        </div>
     </div>
     <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 text-center grayscale">
        <div className="text-[10px] text-slate-500 uppercase font-bold">Runner Up</div>
        <div className="text-xl font-bold text-slate-400">
           {matchHistory[matchHistory.length-1]?.scoreSummary?.t1?.id !== matchHistory[matchHistory.length-1]?.winnerId
             ? matchHistory[matchHistory.length-1]?.scoreSummary?.t1?.runs + "/" + matchHistory[matchHistory.length-1]?.scoreSummary?.t1?.wickets
             : matchHistory[matchHistory.length-1]?.scoreSummary?.t2?.runs + "/" + matchHistory[matchHistory.length-1]?.scoreSummary?.t2?.wickets}
        </div>
     </div>
  </div>

  {/* 3. TOP PERFORMERS & AWARDS (Graph Removed) */}
  <div className="w-full max-w-sm mb-6 space-y-6">
   
    {/* NEW: Top Performers Summary */}
    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl">
      <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Star size={12} className="fill-orange-500"/> Top Performers
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {/* Top Batters */}
        <div>
          <div className="text-[9px] text-slate-500 font-bold uppercase mb-2">Batting</div>
          <div className="space-y-2">
            {Object.entries(matchHistory[matchHistory.length-1]?.battingStats || {})
              .map(([id, s]) => ({...s, id, name: getPlayer(id).name}))
              .sort((a,b) => b.runs - a.runs)
              .slice(0, 3)
              .map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 last:border-0">
                  <span className="text-white font-bold truncate w-20">{p.name}</span>
                  <span className="text-orange-400 font-mono">{p.runs}</span>
                </div>
            ))}
          </div>
        </div>
        {/* Top Bowlers */}
        <div>
          <div className="text-[9px] text-slate-500 font-bold uppercase mb-2">Bowling</div>
          <div className="space-y-2">
            {Object.entries(matchHistory[matchHistory.length-1]?.bowlerStats || {})
              .map(([id, s]) => ({...s, id, name: getPlayer(id).name}))
              .sort((a,b) => b.wickets - a.wickets || a.runs - b.runs)
              .slice(0, 3)
              .map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 last:border-0">
                  <span className="text-white font-bold truncate w-20">{p.name}</span>
                  <span className="text-emerald-400 font-mono">{p.wickets}/{p.runs}</span>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* MOM CARD */}
    {mom && (
      <div className="w-full relative group">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
         <div className="relative">
           <PlayerPerformanceCard title="Player of the Match" player={mom} stats={momStats} type="MATCH" />
         </div>
      </div>
    )}
   
    {/* MOS CARD */}
    {mos && (
       <PlayerPerformanceCard title="Player of the Series" player={mos} stats={mosStats} type="SERIES" />
    )}
  </div>

  {/* 4. SERIES STATUS & ACTIONS */}
  <div className="w-full max-w-sm space-y-3">
    {seriesConfig.active && (
      <div className="bg-neutral-900 p-4 rounded-xl border border-white/10 flex justify-between items-center mb-4">
        {/* TEAM 1 SCORE */}
        <div className="text-center">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            {/* Try to find name, fallback to matchSettings name, fallback to 'Team 1' */}
            {savedTeams.find(t => t.id === matchSettings.team1Id)?.name || 'Team 1'}
          </div>
          <div className="text-3xl font-black text-white">{seriesConfig.team1Wins}</div>
        </div>

        {/* VS BADGE */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-orange-500 bg-orange-900/10 px-2 py-1 rounded border border-orange-500/20">
            VS
          </div>
          <div className="text-[9px] text-slate-600 mt-1">Series</div>
        </div>

        {/* TEAM 2 SCORE */}
        <div className="text-center">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            {savedTeams.find(t => t.id === matchSettings.team2Id)?.name || 'Team 2'}
          </div>
          <div className="text-3xl font-black text-white">{seriesConfig.team2Wins}</div>
        </div>
      </div>
    )}

    {/* NEW: Scorecard & Stats Buttons Row */}
    <div className="grid grid-cols-2 gap-3">
      <Button
        onClick={() => {
          setSelectedArchivedMatch(matchHistory[matchHistory.length-1]);
          setActiveModal('ARCHIVED_MATCH_DETAIL');
        }}
        className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 border border-white/10 hover:border-blue-500/50"
      >
        <ClipboardList size={16}/> Scorecard
      </Button>

      <Button onClick={() => setActiveModal('RANKINGS')} className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 border border-white/10">
        <BarChart2 size={16}/> Full Stats
      </Button>
    </div>

    {seriesConfig.active && seriesConfig.matchesPlayed < (seriesConfig.type === 'SERIES_3' ? 3 : 5) ? (
       <Button onClick={nextMatchInSeries} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg shadow-green-900/20">
          <RefreshCw size={16}/> Next Match
       </Button>
    ) : (
       <Button variant="secondary" onClick={resetToHome} className="w-full py-4 text-orange-500 font-bold border-orange-500/20 bg-orange-950/10 hover:bg-orange-950/30">
          Back to Home
       </Button>
    )}
  </div>
</div>
)}
      {/* START OF PART 22 - PREMIUM LIVE GAMEPLAY (With High-Vis Retire Button) */}
{(gameState === 'INNINGS_1' || gameState === 'INNINGS_2') && (
   <>
      <div className="bg-neutral-900/80 backdrop-blur-xl p-4 shadow-2xl flex justify-between items-center sticky top-0 z-40 border-b border-white/10">
          <div className="flex flex-col">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-black text-lg tracking-tight text-white">CricBharath</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                  <MapPin size={10} className="text-orange-500"/> {matchSettings.venue}
              </div>
          </div>
          <div className="flex gap-2">
            {/* --- NEW: EXIT BUTTON --- */}
  <button 
    onClick={handleExitMatch} 
    className="w-10 h-10 flex items-center justify-center bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-colors border border-red-500/30 active:scale-90"
    title="Exit to Menu"
  >
    <LogOut size={18} />
  </button>
  <div className="flex gap-2">
  {/* 1. EXIT BUTTON */}
  <button 
    onClick={handleExitMatch} 
    className="w-10 h-10 flex items-center justify-center bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-colors border border-red-500/30 active:scale-90"
    title="Exit to Menu"
  >
    <LogOut size={18} />
  </button>

  {/* 2. UNDO BUTTON */}
  <button 
    onClick={undo} 
    className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-slate-300 hover:text-white hover:bg-neutral-700 rounded-full transition-colors border border-white/10 active:scale-90"
  >
    <Undo size={18}/>
  </button>

  {/* 3. ADD PLAYER BUTTON */}
  <button onClick={() => setActiveModal('ADD_LATE_PLAYER')} className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-emerald-400 hover:bg-neutral-700 rounded-full transition-colors border border-white/10 active:scale-90">
    <UserPlus size={18}/>
  </button>

  {/* 4. SCORECARD BUTTON */}
  <button onClick={() => setActiveModal('SCORECARD')} className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-blue-400 hover:bg-neutral-700 rounded-full transition-colors border border-white/10 active:scale-90">
    <ClipboardList size={18}/>
  </button>
</div>
 
  {/* NEW: ADD PLAYER BUTTON */}
  <button onClick={() => setActiveModal('ADD_LATE_PLAYER')} className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-emerald-400 hover:bg-neutral-700 rounded-full transition-colors border border-white/10 active:scale-90">
    <UserPlus size={18}/>
  </button>

  {/* SCORECARD BUTTON */}
  <button onClick={() => setActiveModal('SCORECARD')} className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-blue-400 hover:bg-neutral-700 rounded-full transition-colors border border-white/10 active:scale-90">
    <ClipboardList size={18}/>
  </button>
</div>
      </div>

      <div className="max-w-md mx-auto p-4 w-full animate-in slide-in-from-bottom-4 duration-500">
         
          {/* SCOREBOARD CARD */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-black/90 backdrop-blur-md border border-white/10 shadow-2xl shadow-orange-900/20 rounded-[2rem] p-6 text-center relative overflow-hidden group mb-5">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600"></div>
              {gameState === 'INNINGS_2' && target && (
                  <div className="mb-4 bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/5 flex justify-between items-center">
                      <div className="text-left"><div className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">Target {target}</div><div className="text-sm font-medium text-slate-300">Need <span className="text-white font-bold">{runsNeeded}</span> off <span className="text-white font-bold">{ballsRemaining}</span></div></div>
                      <div className="text-right"><div className="text-[10px] text-slate-500 uppercase font-bold">RRR</div><div className="text-lg font-black text-orange-500 leading-none">{rrr}</div></div>
                  </div>
              )}
              <div className="text-7xl font-black text-white tracking-tighter mb-1 drop-shadow-2xl flex items-baseline justify-center gap-1">{runs}<span className="text-slate-500 text-4xl font-medium">/{wickets}</span></div>
              <div className="flex justify-center items-center gap-3 text-sm mb-6">
                  <div className="bg-neutral-950/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm"><span className="text-slate-400 text-xs uppercase font-bold mr-2">Overs</span><span className="text-white font-mono text-lg font-bold">{overs}.{balls}</span></div>
                  <div className="bg-neutral-950/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm"><span className="text-slate-400 text-xs uppercase font-bold mr-2">CRR</span><span className="text-white font-mono text-lg font-bold">{crr}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-xl p-2.5 flex flex-col justify-center border border-white/5"><div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Partnership</div><div className="text-white font-bold font-mono text-sm">{currentPartnership} <span className="text-slate-500 font-normal">({currentPartnershipBalls})</span></div></div>
                  <div className="bg-white/5 rounded-xl p-2.5 flex flex-col justify-center border border-white/5"><div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Proj. Score</div><div className="text-orange-400 font-bold font-mono text-sm">{projectedScore}</div></div>
              </div>
          </div>

          {/* BATSMAN CARD */}
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-1 mb-4 shadow-xl overflow-hidden relative">
            <div className="flex items-center p-4 bg-gradient-to-r from-neutral-800 to-black relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-red-600 shadow-[0_0_10px_#f97316]"></div>
               <div className="relative"><PlayerAvatar player={striker} size="md" /><div className="absolute -bottom-1 -right-1 bg-black rounded-full border border-white/10 p-0.5"><Star size={10} className="text-orange-500 fill-orange-500 animate-spin-slow" /></div></div>
               <div className="ml-4 flex-1">
                  <div className="flex justify-between items-end mb-1"><span className="font-bold text-lg text-white tracking-tight">{striker.name === 'Unknown' ? 'Select Batsman' : striker.name}</span><span className="font-mono text-2xl text-white font-black leading-none">{strikerStats.runs}</span></div>
                  <div className="flex justify-between items-center"><div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><span>{strikerStats.fours} <span className="text-slate-600">4s</span></span><span>{strikerStats.sixes} <span className="text-slate-600">6s</span></span></div><span className="text-[10px] text-orange-400 font-mono font-bold">{strikerStats.balls}b</span></div>
               </div>
            </div>
            {(!matchSettings.lastManStanding || nonStrikerId) && (
               <div className="flex items-center p-3 bg-black/40 border-t border-white/5"><PlayerAvatar player={nonStriker} size="sm" /><div className="ml-4 flex-1 flex justify-between items-center opacity-60"><span className="font-medium text-sm text-slate-300">{nonStriker.name}</span><span className="font-mono text-sm text-slate-400 font-bold">{nonStrikerStats.runs} <span className="text-[10px] font-normal">({nonStrikerStats.balls})</span></span></div></div>
            )}
          </div>
{/* MANUAL SWAP BUTTON */}
          <div className="flex justify-end mb-4 pr-1">
             <button 
                 onClick={() => {
                     setStrikerId(nonStrikerId);
                     setNonStrikerId(strikerId);
                     const tempStats = strikerStats;
                     setStrikerStats(nonStrikerStats);
                     setNonStrikerStats(tempStats);
                 }}
                 disabled={!nonStrikerId}
                 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1 bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-full"
             >
                 <RefreshCw size={10} /> Swap Ends
             </button>
          </div>
          {/* BOWLER CARD - NOW CLICKABLE */}
  <div className="bg-neutral-900 border border-white/10 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <button
        onClick={() => setActiveModal('BOWLER')}
        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className="relative">
          <PlayerAvatar player={bowler} size="md" />
          <div className="absolute -bottom-1 -right-1 bg-neutral-800 rounded-full border border-white/10 p-1 group-hover:scale-110 transition-transform">
            <RefreshCw size={10} className="text-emerald-500" />
          </div>
        </div>
        <div>
          <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
            Current Bowler <Edit2 size={8} />
          </div>
          <div className="font-bold text-white text-lg leading-none group-hover:text-emerald-400 transition-colors">
            {bowler.name}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            {bowlerStats[currentBowlerId]?.wickets || 0}-{bowlerStats[currentBowlerId]?.runs || 0}
            <span className="opacity-50 ml-1">({getOversFromBalls(bowlerStats[currentBowlerId]?.legalBalls || 0)})</span>
          </div>
        </div>
      </button>
     
      <div className="flex gap-1.5 pl-2 border-l border-white/5">
        {currentOverHistory.slice(-5).map((val, i) => (
          <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-[10px] border shadow-md cursor-default
            ${val.includes('4') ? 'bg-black border-amber-500 text-amber-500' :
              val.includes('6') ? 'bg-gradient-to-br from-orange-500 to-red-600 border-orange-500 text-white' :
              val.includes('W') ? 'bg-red-600 border-red-500 text-white' : 'bg-neutral-800 border-white/10 text-slate-400'}`}>
            {val}
          </div>
        ))}
      </div>
    </div>
   
    <div className="pt-3 border-t border-white/5">
      <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1.5">
        <Mic size={10} className="text-orange-500"/> Commentary
      </div>
      <div className="text-sm text-slate-300 font-medium leading-snug line-clamp-1 italic">
        "{commentary.length > 0 ? commentary[0].text : "Ready..."}"
      </div>
    </div>
  </div>

          {/* CONTROL PAD - WITH HIGH-VIS RETIRE BUTTON */}
          <div className="grid grid-cols-4 gap-3">
            {[0,1,2,3,4,6].map(n => (
               <button key={n} onClick={() => handleScore(n.toString(), n)} disabled={!strikerId || (overs >= matchSettings.totalOvers)} className={`relative overflow-hidden h-16 rounded-2xl font-black text-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[4px] transition-all border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none ${n === 4 ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-900/50' : n === 6 ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-900/50 col-span-2' : 'bg-neutral-800 text-slate-200 hover:bg-neutral-700 shadow-black/50'}`}>{n}<div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 pointer-events-none"></div></button>
            ))}
            <button onClick={() => handleScore('Wd', 0, false, 'Wd')} className="h-14 bg-neutral-900 border border-white/10 text-orange-400 font-bold rounded-xl active:scale-95 transition-transform shadow-md">WD</button>
            <button onClick={() => setActiveModal('NO_BALL_OPTIONS')} className="h-14 bg-neutral-900 border border-white/10 text-orange-400 font-bold rounded-xl active:scale-95 transition-transform shadow-md">NB</button>
            <button onClick={() => setActiveModal('BYE_OPTIONS')} className="h-14 bg-neutral-900 border border-white/10 text-slate-400 font-bold rounded-xl active:scale-95 transition-transform shadow-md text-xs">EXT</button>
            <button onClick={() => setActiveModal('WICKET_DETAIL')} className="h-14 bg-gradient-to-br from-red-600 to-red-900 border border-red-500/50 text-white font-black rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-transform text-sm tracking-wider uppercase">OUT</button>
           
            {/* --- THE FIXED RETIRE BUTTON (Bright Red) --- */}
            <button onClick={() => handleRetire('HURT')} className="col-span-4 mt-3 py-4 bg-gradient-to-r from-red-600 to-red-800 border-2 border-red-500 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
               <HeartPulse size={18} className="animate-pulse text-white"/> Retire Batsman
            </button>
          </div>
      </div>
   </>
)}
    </div>
  );
}

export default App;