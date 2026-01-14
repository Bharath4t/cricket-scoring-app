import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { useSearchParams } from 'react-router-dom';
import { Activity, MapPin, Calendar, User, Shield, Target } from 'lucide-react';

const MatchView = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. LIVE SYNC LOGIC ---
  useEffect(() => {
    if (!matchId) {
        setLoading(false);
        return;
    }

    const unsub = onSnapshot(doc(db, "matches", matchId), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [matchId]);

  if (!matchId) return <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">No Match ID provided in URL.</div>;
  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">Loading Live Score...</div>;
  if (!data) return <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">Match not found.</div>;

  // Helper to get player name safely
  const getP = (id) => {
      if (!data.playerPool) return { name: 'Unknown' };
      return data.playerPool.find(p => p.id === id) || { name: 'Unknown' };
  };

  const striker = getP(data.strikerId);
  const nonStriker = getP(data.nonStrikerId);
  const bowler = getP(data.currentBowlerId);
  const battingTeam = data.savedTeams?.find(t => t.id === (data.gameState === 'INNINGS_1' ? data.matchSettings.battingFirstId : data.matchSettings.battingSecondId))?.name || "Batting Team";

  // Calculations
  const crr = data.overs > 0 ? (data.runs / (data.overs + data.balls/6)).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans p-4 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
              <span className="font-black text-lg tracking-tight text-white uppercase italic">Live Match</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
              ID: {matchId.slice(0,6)}...
          </div>
      </div>

      {/* 1. MAIN SCOREBOARD */}
      <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border border-white/10 rounded-[2rem] p-6 text-center relative overflow-hidden shadow-2xl mb-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
          
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">{battingTeam}</div>
          <div className="text-7xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">
              {data.runs}<span className="text-4xl text-slate-500 font-medium">/{data.wickets}</span>
          </div>
          
          <div className="flex justify-center gap-4 mb-4">
              <div className="bg-white/5 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                  <span className="text-slate-400 text-[10px] font-bold uppercase mr-2">Overs</span>
                  <span className="text-white font-mono text-lg font-bold">{data.overs}.{data.balls}</span>
              </div>
              <div className="bg-white/5 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                  <span className="text-slate-400 text-[10px] font-bold uppercase mr-2">CRR</span>
                  <span className="text-white font-mono text-lg font-bold">{crr}</span>
              </div>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
             <MapPin size={12}/> {data.matchSettings?.venue || 'Ground'}
          </div>
      </div>

      {/* 2. BATSMEN CARD */}
      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-4 mb-4 backdrop-blur-md">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity size={12} className="text-orange-500"/> Batting
          </h4>
          
          {/* Striker */}
          <div className="flex justify-between items-center mb-3 p-2 bg-gradient-to-r from-orange-900/20 to-transparent border-l-2 border-orange-500 rounded-r-lg">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs">{striker.name[0]}</div>
                  <div>
                      <div className="font-bold text-white text-sm">{striker.name} <span className="text-orange-500">*</span></div>
                      <div className="text-[10px] text-slate-500">{striker.battingStyle}</div>
                  </div>
              </div>
              <div className="text-right">
                  <div className="font-mono font-black text-xl text-white leading-none">{data.battingStats?.[data.strikerId]?.runs || 0}</div>
                  <div className="text-[10px] text-slate-500">{data.battingStats?.[data.strikerId]?.balls || 0} balls</div>
              </div>
          </div>

          {/* Non-Striker */}
          {data.nonStrikerId && (
              <div className="flex justify-between items-center p-2 opacity-80">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs">{nonStriker.name[0]}</div>
                      <div>
                          <div className="font-bold text-slate-300 text-sm">{nonStriker.name}</div>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="font-mono font-bold text-lg text-slate-300 leading-none">{data.battingStats?.[data.nonStrikerId]?.runs || 0}</div>
                      <div className="text-[10px] text-slate-500">{data.battingStats?.[data.nonStrikerId]?.balls || 0} balls</div>
                  </div>
              </div>
          )}
      </div>

      {/* 3. BOWLER CARD */}
      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target size={12} className="text-emerald-500"/> Bowling
          </h4>
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs">{bowler.name[0]}</div>
                  <div>
                      <div className="font-bold text-white text-sm">{bowler.name}</div>
                      <div className="text-[10px] text-slate-500">{bowler.bowlingStyle}</div>
                  </div>
              </div>
              <div className="flex gap-4 text-center">
                  <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Wkts</div>
                      <div className="font-mono font-black text-emerald-500 text-lg">{data.bowlerStats?.[data.currentBowlerId]?.wickets || 0}</div>
                  </div>
                  <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Runs</div>
                      <div className="font-mono font-bold text-white text-lg">{data.bowlerStats?.[data.currentBowlerId]?.runs || 0}</div>
                  </div>
                  <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Ov</div>
                      <div className="font-mono text-slate-400 text-lg">
                          {Math.floor((data.bowlerStats?.[data.currentBowlerId]?.legalBalls || 0)/6)}.{(data.bowlerStats?.[data.currentBowlerId]?.legalBalls || 0)%6}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* FOOTER */}
      <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Powered by CricBharath</p>
      </div>
    </div>
  );
};

export default MatchView;