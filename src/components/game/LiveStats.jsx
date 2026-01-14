// File: src/components/game/LiveStats.js
import React, { useState } from 'react';
import { Crown, Award, Activity, Target, Shield, Search, ChevronRight } from 'lucide-react';
import { Modal, Button, PlayerAvatar } from '../common/UIComponents';
import { WagonWheel } from '../common/Visuals';
import { calculateMVPPoints, getOversFromBalls } from '../../utils/helpers';
import { VENUES } from '../../utils/constants';

// --- PLAYER PERFORMANCE CARD ---
export const PlayerPerformanceCard = ({ title, player, stats, type = 'MATCH' }) => {
    if (!player) return null;
    const safeStats = stats || {};
    const runs = safeStats.runs || 0;
    const balls = safeStats.balls || 0;
    const wickets = safeStats.wickets || 0;
    const bowlRuns = type === 'MATCH' ? (safeStats.runsConceded || safeStats.bowlRuns || 0) : (safeStats.runsConceded || 0);
    const fieldingPts = (safeStats.catches || 0) + (safeStats.runouts || 0) + (safeStats.stumpings || 0);

    const isSeries = type === 'SERIES';
    const accentColor = isSeries ? 'purple' : 'yellow';
    const bgGradient = isSeries ? 'from-purple-900/50 to-purple-600/20' : 'from-yellow-900/50 to-yellow-600/20';
    const borderColor = isSeries ? 'border-purple-500/30' : 'border-yellow-500/30';
    const Icon = isSeries ? Crown : Award;

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} border ${borderColor} w-full max-w-sm mx-auto shadow-2xl mb-6`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-${accentColor}-500`}></div>
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
            <div className="bg-black/20 p-3 grid grid-cols-3 divide-x divide-white/10">
                <div className="text-center px-1"><div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Batting</div><div className="text-sm font-bold text-white">{runs}<span className="text-[10px] text-slate-400 font-normal">({balls})</span></div></div>
                <div className="text-center px-1"><div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Bowling</div><div className="text-sm font-bold text-white">{wickets}<span className="text-[10px] text-slate-400 font-normal">/{bowlRuns}</span></div></div>
                <div className="text-center px-1"><div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Fielding</div><div className="text-sm font-bold text-white">{fieldingPts} <span className="text-[10px] text-slate-400 font-normal">acts</span></div></div>
            </div>
        </div>
    );
};

// --- PLAYER PROFILE MODAL ---
export const PlayerProfileModal = ({ players, matchHistory, onClose, onResetProfile }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [venueFilter, setVenueFilter] = useState('ALL'); 

    const getPlayerStats = (pid) => {
        let stats = { matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, notOuts: 0, wickets: 0, overs: 0, runsConceded: 0, maidens: 0, catches: 0, runouts: 0, stumpings: 0, highestScore: 0, bestBowling: { wickets: 0, runs: 0 }, recentScores: [], shots: [] };

        matchHistory.forEach(m => {
            if (venueFilter !== 'ALL' && m.venue !== venueFilter) return;
            // Collect shots
            if (m.timeline) stats.shots.push(...m.timeline.filter(t => t.strikerId === pid && t.shotDirection));
            if (m.firstInningsTimeline) stats.shots.push(...m.firstInningsTimeline.filter(t => t.strikerId === pid && t.shotDirection));

            let played = false;
            if (m.battingStats && m.battingStats[pid]) {
                played = true;
                const b = m.battingStats[pid];
                stats.runs += b.runs; stats.balls += b.balls; stats.fours += b.fours; stats.sixes += b.sixes;
                if (b.runs >= 100) stats.hundreds++; else if (b.runs >= 50) stats.fifties++;
                if (b.runs > stats.highestScore) stats.highestScore = b.runs;
                const isOut = m.outPlayers.some(o => o.playerId === pid);
                if (!isOut) stats.notOuts++;
                stats.recentScores.push(`${b.runs}${!isOut ? '*' : ''}(${b.balls})`);
            }
            if (m.bowlerStats && m.bowlerStats[pid]) {
                played = true;
                const b = m.bowlerStats[pid];
                stats.runsConceded += b.runs; stats.wickets += b.wickets; stats.overs += (b.legalBalls || 0) / 6; stats.maidens += b.maidens || 0;
                if (b.wickets > stats.bestBowling.wickets || (b.wickets === stats.bestBowling.wickets && b.runs < stats.bestBowling.runs)) {
                    stats.bestBowling = { wickets: b.wickets, runs: b.runs };
                }
            }
            m.outPlayers.forEach(out => { if (out.fielderId === pid) { played = true; if (out.howOut === 'Caught') stats.catches++; if (out.howOut === 'Run Out') stats.runouts++; if (out.howOut === 'Stumped') stats.stumpings++; } });
            if (played) stats.matches++;
        });
        
        stats.recentScores = stats.recentScores.slice(-5).reverse();
        return stats;
    };

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const stats = selectedPlayer ? getPlayerStats(selectedPlayerId) : null;
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
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
                        <PlayerAvatar player={selectedPlayer} size="xl" />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                            <p className="text-slate-400">{selectedPlayer.role}</p>
                            <p className="text-xs text-slate-500 mt-1">{selectedPlayer.battingStyle} Bat • {selectedPlayer.bowlingStyle}</p>
                        </div>
                        <div className="w-full mt-2">
                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Filter by Venue</label>
                            <select className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white text-xs" value={venueFilter} onChange={e => setVenueFilter(e.target.value)}>
                                <option value="ALL">All Venues</option>{VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-4">
                            <Button variant="danger" onClick={handleResetClick} className="w-full text-xs bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-900/40">Reset Stats</Button>
                            <Button variant="secondary" onClick={() => setSelectedPlayerId(null)} className="w-full">Back to List</Button>
                        </div>
                    </div>
                    <div className="flex-1 space-y-6">
                        {stats.shots && stats.shots.length > 0 && <WagonWheel timeline={stats.shots} title={`${selectedPlayer.name}'s Scoring Areas`} />}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-sm font-bold text-blue-400 uppercase mb-4 flex items-center gap-2"><Activity size={16}/> Batting Career</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><div className="text-xs text-slate-500 uppercase">Runs</div><div className="text-2xl font-bold text-white">{stats.runs}</div></div>
                                <div><div className="text-xs text-slate-500 uppercase">Average</div><div className="text-2xl font-bold text-white">{stats.matches > stats.notOuts ? (stats.runs / (stats.matches - stats.notOuts)).toFixed(2) : stats.runs}</div></div>
                                <div><div className="text-xs text-slate-500 uppercase">High Score</div><div className="text-2xl font-bold text-white">{stats.highestScore}</div></div>
                                <div><div className="text-xs text-slate-500 uppercase">SR</div><div className="text-2xl font-bold text-white">{stats.balls > 0 ? ((stats.runs/stats.balls)*100).toFixed(1) : 0}</div></div>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                             <h3 className="text-sm font-bold text-green-400 uppercase mb-4 flex items-center gap-2"><Target size={16}/> Bowling Career</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><div className="text-xs text-slate-500 uppercase">Wickets</div><div className="text-2xl font-bold text-white">{stats.wickets}</div></div>
                                <div><div className="text-xs text-slate-500 uppercase">Best</div><div className="text-2xl font-bold text-white">{stats.bestBowling.wickets}/{stats.bestBowling.runs}</div></div>
                                <div><div className="text-xs text-slate-500 uppercase">Economy</div><div className="text-2xl font-bold text-white">{stats.overs > 0 ? (stats.runsConceded/stats.overs).toFixed(2) : 0}</div></div>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={18}/>
                        <input className="w-full bg-slate-800 border border-slate-700 p-3 pl-10 rounded-xl text-white" placeholder="Search player..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredPlayers.map(p => {
                             const s = getPlayerStats(p.id);
                             return (
                                <button key={p.id} onClick={() => setSelectedPlayerId(p.id)} className="bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-slate-700 hover:bg-slate-700 transition-colors text-left group">
                                    <PlayerAvatar player={p} />
                                    <div className="flex-1"><div className="font-bold text-white group-hover:text-blue-400">{p.name}</div><div className="text-xs text-slate-400">{s.matches} Matches • {s.runs} Runs • {s.wickets} Wkts</div></div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white"/>
                                </button>
                             );
                        })}
                    </div>
                </div>
            )}
        </Modal>
    );
};

// --- SCORECARD MODAL ---
export const ScorecardModal = ({ matchSettings, teamName, data, players, onClose, battingOrder }) => {
    const getP = (id) => players.find(p => p.id === id) || { name: 'Unknown' };
    const extras = data.extras || { wd: 0, nb: 0, lb: 0, b: 0 };
    
    return (
        <Modal title="Scorecard" onClose={onClose} maxWidth="max-w-2xl">
             <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                    <div><h2 className="text-xl font-bold text-white">{teamName}</h2><p className="text-slate-400 text-xs">{data.overs}.{data.balls} Overs</p></div>
                    <div className="text-3xl font-bold text-yellow-400">{data.runs}/{data.wickets}</div>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Batting</h4>
                    <div className="bg-slate-800/50 rounded border border-slate-700/50 mb-2">
                        <div className="grid grid-cols-7 gap-1 p-2 text-[10px] text-slate-400 font-bold border-b border-slate-700">
                            <div className="col-span-2">BATTER</div><div className="text-center">R</div><div className="text-center">B</div><div className="text-center">4s</div><div className="text-center">6s</div><div className="text-center font-bold text-blue-400">SR</div>
                        </div>
                        {battingOrder.map(pid => {
                            const p = getP(pid);
                            let stats = null;
                            let status = '';
                            let className = 'grid grid-cols-7 gap-1 p-2 text-sm border-b border-slate-700/30 last:border-0';
                            let howOutText = '';

                            if (pid === data.strikerId) { stats = data.strikerStats; status = '*'; className += ' bg-green-900/20'; }
                            else if (pid === data.nonStrikerId) { stats = data.nonStrikerStats; className += ' bg-green-900/10'; }
                            else {
                                const outData = data.outPlayers.find(o => o.playerId === pid);
                                if (outData) {
                                    stats = outData; className += ' opacity-60';
                                    const bowlerName = outData.bowlerId ? getP(outData.bowlerId).name : '';
                                    const fielderName = outData.fielderId ? getP(outData.fielderId).name : '';
                                    howOutText = outData.howOut === 'Caught' ? `c ${fielderName} b ${bowlerName}` : outData.howOut;
                                } else {
                                    const retiredHurt = data.retiredHurtPlayers.find(rh => rh.id === pid);
                                    if (retiredHurt) { stats = retiredHurt.stats; status = '(RH)'; className += ' bg-orange-900/10 opacity-75'; }
                                }
                            }
                            if (!stats) return null; 
                            return (
                                <div key={pid} className={className}>
                                     <div className="col-span-2"><div className={`text-white flex items-center gap-1 ${status === '*' ? 'font-bold' : ''}`}>{p.name} <span className={status === '*' ? 'text-green-400' : 'text-orange-400 text-[10px]'}>{status}</span></div>{howOutText && <div className="text-[10px] text-slate-400">{howOutText}</div>}</div>
                                     <div className="text-center font-bold text-yellow-400">{stats.runs}</div><div className="text-center text-slate-400">{stats.balls}</div><div className="text-center text-slate-400">{stats.fours || 0}</div><div className="text-center text-slate-400">{stats.sixes || 0}</div><div className="text-center font-bold text-blue-300">{stats.balls > 0 ? ((stats.runs/stats.balls)*100).toFixed(1) : '0.0'}</div>
                                </div>
                            );
                        })}
                        <div className="p-2 text-xs text-slate-400 border-t border-slate-700 bg-slate-800/80">Extras: {extras.wd}wd, {extras.nb}nb, {extras.lb}lb, {extras.b}b</div>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Bowling</h4>
                    <div className="bg-slate-800/50 rounded border border-slate-700/50">
                        <div className="grid grid-cols-5 gap-2 p-2 text-[10px] text-slate-400 font-bold border-b border-slate-700">
                            <div className="col-span-2">BOWLER</div><div className="text-center">O</div><div className="text-center">R</div><div className="text-center">W</div>
                        </div>
                        {Object.entries(data.bowlerStats).map(([id, stats]) => (
                            <div key={id} className="grid grid-cols-5 gap-2 p-2 text-sm border-b border-slate-700/30 last:border-0">
                                <div className="col-span-2 text-white">{getP(id).name}</div><div className="text-center">{getOversFromBalls(stats.legalBalls)}</div><div className="text-center">{stats.runs}</div><div className="text-center font-bold text-yellow-400">{stats.wickets}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};