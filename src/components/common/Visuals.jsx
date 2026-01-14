// File: src/components/common/Visuals.js
import React, { useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { Modal } from './UIComponents'; // Importing from the same folder

// --- WAGON WHEEL INPUT ---
export const ShotMapSelector = ({ onSelect, onClose }) => {
  const btnBase = "absolute text-[9px] md:text-[10px] font-bold uppercase px-2 py-1 md:px-3 md:py-1.5 rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95 z-10 flex items-center justify-center whitespace-nowrap";
  const btnBlue = `${btnBase} bg-blue-600 border-blue-500 text-white`;
  const btnGreen = `${btnBase} bg-green-600 border-green-500 text-white`;
  const btnDark = `${btnBase} bg-slate-700/90 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-white`;

  return (
    <Modal title="Where was the shot played?" onClose={onClose}>
      <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-[360px] mx-auto overflow-hidden relative shadow-2xl mt-4 mb-4">
        <div className="relative w-full aspect-square flex items-center justify-center p-2">
          {/* Concentric Circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[95%] h-[95%] rounded-full border border-slate-400 absolute"></div>
              <div className="w-[65%] h-[65%] rounded-full border border-slate-500 absolute"></div>
              <div className="w-[35%] h-[35%] rounded-full border border-slate-600 absolute"></div>
          </div>
          {/* Pitch */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-24 bg-[#b0a999] rounded border-2 border-[#d0c9b9] shadow-inner z-0"></div>

          {/* Buttons */}
          <button onClick={() => onSelect('Third Man')} className={`${btnDark} top-[15%] left-[15%]`}>Third Man</button>
          <button onClick={() => onSelect('Behind')} className={`${btnDark} top-[8%] left-1/2 -translate-x-1/2`}>Behind</button>
          <button onClick={() => onSelect('Fine Leg')} className={`${btnDark} top-[15%] right-[15%]`}>Fine Leg</button>
          <button onClick={() => onSelect('Point')} className={`${btnDark} top-[35%] left-[5%]`}>Point</button>
          <button onClick={() => onSelect('Square Leg')} className={`${btnDark} top-[35%] right-[5%]`}>Square Leg</button>
          <button onClick={() => onSelect('Cover')} className={`${btnDark} bottom-[35%] left-[5%]`}>Cover</button>
          <button onClick={() => onSelect('Mid Wicket')} className={`${btnDark} bottom-[35%] right-[5%]`}>Mid Wicket</button>
          <button onClick={() => onSelect('Long Off')} className={`${btnGreen} bottom-[15%] left-[18%]`}>Long Off</button>
          <button onClick={() => onSelect('Straight')} className={`${btnBlue} bottom-[5%] left-1/2 -translate-x-1/2`}>Straight</button>
          <button onClick={() => onSelect('Long On')} className={`${btnGreen} bottom-[15%] right-[18%]`}>Long On</button>
        </div>
        <div className="text-center text-xs text-slate-500 p-3 bg-slate-900/50">Tap the boundary zone</div>
      </div>
    </Modal>
  );
};

// --- WAGON WHEEL DISPLAY ---
export const WagonWheel = ({ timeline, title = "Wagon Wheel" }) => {
  const [selectedZone, setSelectedZone] = useState(null);
  
  if (!timeline || timeline.length === 0) return null;
  const shots = timeline.filter(t => t.shotDirection);
  if (shots.length === 0) return <div className="text-center text-slate-500 text-xs p-4">No boundary data available.</div>;

  const zoneStats = {};
  shots.forEach(s => {
      const dir = s.shotDirection;
      if (!zoneStats[dir]) zoneStats[dir] = { fours: 0, sixes: 0, total: 0 };
      if (s.boundary === 4) zoneStats[dir].fours++;
      if (s.boundary === 6) zoneStats[dir].sixes++;
      zoneStats[dir].total++;
  });

  const zoneAngles = {
    'Straight': 90, 'Long On': 65, 'Long Off': 115, 'Mid Wicket': 25, 'Cover': 155,
    'Square Leg': 335, 'Point': 205, 'Fine Leg': 300, 'Third Man': 240, 'Behind': 270
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 relative">
      <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Activity size={12}/> {title}</h4>
      <div className="relative w-full aspect-square max-w-[300px] mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-full transform rotate-0 opacity-50 pointer-events-none">
          <circle cx="100" cy="100" r="98" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="92" y="80" width="16" height="40" fill="#44403c" rx="2" />
          {shots.map((shot, i) => {
            const angle = zoneAngles[shot.shotDirection] || 90;
            const rad = (angle * Math.PI) / 180;
            const x2 = 100 + 90 * Math.cos(rad);
            const y2 = 100 + 90 * Math.sin(rad);
            const color = shot.boundary === 6 ? '#22c55e' : '#3b82f6';
            return <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>;
          })}
        </svg>
        {Object.keys(zoneAngles).map((zone) => {
            const stat = zoneStats[zone];
            if (!stat) return null;
            const angle = zoneAngles[zone];
            const rad = (angle * Math.PI) / 180;
            const cx = 50 + (42 * Math.cos(rad));
            const cy = 50 + (42 * Math.sin(rad));
            return (
                <button key={zone} onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
                    className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:scale-110 z-10 ${selectedZone === zone ? 'bg-yellow-400 text-black scale-125' : 'bg-slate-700 text-white border border-slate-500'}`}
                    style={{ left: `${cx}%`, top: `${cy}%` }}>
                    {stat.total}
                </button>
            );
        })}
      </div>
      {/* Detail Popup */}
      {selectedZone && zoneStats[selectedZone] && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur border border-yellow-500 p-4 rounded-xl shadow-2xl z-20 w-48 text-center animate-in fade-in zoom-in duration-200">
              <div className="text-yellow-400 font-bold uppercase text-xs mb-2">{selectedZone}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-800 p-2 rounded"><div className="text-blue-400 font-bold">{zoneStats[selectedZone].fours}</div><div className="text-[9px] text-slate-500">FOURS</div></div>
                  <div className="bg-slate-800 p-2 rounded"><div className="text-green-400 font-bold">{zoneStats[selectedZone].sixes}</div><div className="text-[9px] text-slate-500">SIXES</div></div>
              </div>
              <button onClick={() => setSelectedZone(null)} className="mt-3 text-[10px] text-slate-400 underline">Close</button>
          </div>
      )}
    </div>
  );
};

// --- WORM GRAPH ---
export const WormGraph = ({ currentInningsData, previousInningsData, matchSettings }) => {
    const [view, setView] = useState('WORM'); 
    const width = 300;
    const height = 150;
    const totalBalls = matchSettings.totalOvers * 6;
    
    const getRunsPerOver = (history) => {
        const overs = [];
        let currentOverRuns = 0;
        history.forEach((ball, i) => {
            const prevTotal = i > 0 ? history[i-1].totalRuns : 0;
            currentOverRuns += (ball.totalRuns - prevTotal);
            if ((i + 1) % 6 === 0 || i === history.length - 1) {
                overs.push(currentOverRuns);
                currentOverRuns = 0;
            }
        });
        return overs;
    };

    const history = currentInningsData?.history || [];
    const prevHistory = previousInningsData?.timeline || [];
    const currentOvers = getRunsPerOver(history);

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

    return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><TrendingUp size={12}/> Match Analysis</h4>
                <div className="flex bg-slate-900 rounded p-1">
                    <button onClick={() => setView('WORM')} className={`px-2 py-1 text-[10px] rounded ${view==='WORM' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Worm</button>
                    <button onClick={() => setView('MANHATTAN')} className={`px-2 py-1 text-[10px] rounded ${view==='MANHATTAN' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Bar</button>
                </div>
            </div>
            <div className="relative h-[150px] w-full bg-slate-900/50 rounded border border-slate-700/30 overflow-hidden">
                {view === 'WORM' ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#334155" strokeDasharray="4" strokeWidth="1"/>
                        {prevHistory.length > 0 && <polyline points={createPoints(prevHistory)} fill="none" stroke="#64748b" strokeWidth="2" opacity="0.6" />}
                        <polyline points={createPoints(history)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                ) : (
                    <div className="flex items-end h-full gap-1 px-2 pb-2">
                        {currentOvers.map((runs, i) => (
                            <div key={i} className="flex-1 bg-blue-500 hover:bg-blue-400 transition-all rounded-t relative group" style={{ height: `${Math.min((runs / 25) * 100, 100)}%` }}>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-white opacity-0 group-hover:opacity-100">{runs}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};