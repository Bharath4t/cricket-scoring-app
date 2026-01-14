// File: src/components/admin/Archives.js
import React, { useState } from 'react';
import { Calendar, Award, ClipboardList, Upload, Activity } from 'lucide-react';
import { Modal, PlayerAvatar } from '../common/UIComponents';
import { calculateMVPPoints, getOversFromBalls } from '../../utils/helpers';
import { WagonWheel, WormGraph } from '../common/Visuals';
import { VENUES } from '../../utils/constants';

// --- ARCHIVES LIST ---
export const ArchivesModal = ({ matchHistory, teams, players, onClose, onViewScorecard }) => {
    const getTeamName = (id) => teams.find(t => t.id === id)?.name || 'Unknown';
    const getPlayerName = (id) => players.find(p => p.id === id)?.name || 'Unknown';
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
                    const t1Name = match.scoreSummary?.t1?.name || 'Team 1';
                    const t2Name = match.scoreSummary?.t2?.name || 'Team 2';
                    const t1Score = match.scoreSummary?.t1 ? `${match.scoreSummary.t1.runs}/${match.scoreSummary.t1.wickets}` : 'N/A';
                    const t2Score = match.scoreSummary?.t2 ? `${match.scoreSummary.t2.runs}/${match.scoreSummary.t2.wickets}` : 'N/A';
                    const date = match.date ? new Date(match.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date';

                    return (
                        <div key={match.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                             <div className="flex-1 w-full">
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> {date} • {match.venue}</span>
                                     {match.momId && <span className="text-[10px] text-yellow-500 font-bold uppercase flex items-center gap-1"><Award size={10}/> MoM: {getPlayerName(match.momId)}</span>}
                                 </div>
                                 <div className="flex justify-between items-center mb-1"><span className="font-bold text-white">{t1Name}</span><span className="font-mono text-slate-300">{t1Score}</span></div>
                                 <div className="flex justify-between items-center"><span className="font-bold text-white">{t2Name}</span><span className="font-mono text-slate-300">{t2Score}</span></div>
                                 <div className="mt-3 text-xs text-blue-400 font-bold">Winner: {getTeamName(match.winnerId)}</div>
                             </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => onViewScorecard(match)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-bold flex items-center gap-2 w-full justify-center">
                                    <ClipboardList size={14}/> Scorecard
                                </button>
                                <button onClick={() => alert(`Match won by ${getTeamName(match.winnerId)}. Share feature coming soon!`)} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-xs font-bold flex items-center gap-2 w-full justify-center">
                                    <Upload size={14}/> Share Result
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

// --- ARCHIVED MATCH DETAIL ---
export const ArchivedMatchDetail = ({ match, players, onClose }) => {
    const getP = (id) => players.find(p => p.id === id) || { name: 'Unknown' };
    
    const renderInnings = (battingStats, bowlerStats, outPlayers, teamName, runs, wickets, overs) => {
        const batters = Object.keys(battingStats); 
        return (
            <div className="mb-6">
                 <div className="flex justify-between items-end border-b border-blue-500/30 pb-2 mb-3">
                     <h4 className="text-sm font-bold text-blue-400 uppercase">{teamName} Innings</h4>
                     <div className="text-lg font-bold text-white">{runs}/{wickets} <span className="text-xs text-slate-400 font-normal">({overs})</span></div>
                 </div>
                 {/* Batting Table */}
                 <div className="bg-slate-800/50 rounded border border-slate-700/50 mb-4">
                    <div className="grid grid-cols-5 gap-1 p-2 text-[10px] text-slate-400 font-bold border-b border-slate-700">
                        <div className="col-span-2">BATTER</div><div className="text-center">R</div><div className="text-center">B</div><div className="text-center">4s/6s</div>
                    </div>
                    {batters.map(pid => {
                        const stat = battingStats[pid];
                        const outInfo = outPlayers.find(o => o.playerId === pid);
                        const status = outInfo ? outInfo.howOut : `not out`;
                        return (
                            <div key={pid} className="grid grid-cols-5 gap-1 p-2 text-sm border-b border-slate-700/30 last:border-0">
                                <div className="col-span-2"><div className="text-white font-medium">{getP(pid).name}</div><div className="text-[9px] text-slate-500 truncate">{status}</div></div>
                                <div className="text-center font-bold text-white">{stat.runs}</div><div className="text-center text-slate-400">{stat.balls}</div><div className="text-center text-slate-400">{stat.fours}/{stat.sixes}</div>
                            </div>
                        )
                    })}
                 </div>
                 {/* Bowling Table */}
                 <div className="bg-slate-800/50 rounded border border-slate-700/50">
                    <div className="grid grid-cols-5 gap-1 p-2 text-[10px] text-slate-400 font-bold border-b border-slate-700">
                        <div className="col-span-2">BOWLER</div><div className="text-center">O</div><div className="text-center">R</div><div className="text-center">W</div>
                    </div>
                    {Object.keys(bowlerStats).map(pid => {
                        const stat = bowlerStats[pid];
                        return (
                            <div key={pid} className="grid grid-cols-5 gap-1 p-2 text-sm border-b border-slate-700/30 last:border-0">
                                <div className="col-span-2 text-white">{getP(pid).name}</div>
                                <div className="text-center">{getOversFromBalls(stat.legalBalls)}</div><div className="text-center">{stat.runs}</div><div className="text-center font-bold text-white">{stat.wickets}</div>
                            </div>
                        )
                    })}
                 </div>
            </div>
        );
    };

    return (
        <Modal title="Match Details" onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-6">
                 <div className="text-center mb-4">
                     <div className="text-xs text-slate-500 uppercase">{new Date(match.date).toDateString()} • {match.venue}</div>
                     <div className="text-xl font-bold text-white mt-1">Winner: {match.scoreSummary?.t1?.id === match.winnerId ? match.scoreSummary.t1.name : match.scoreSummary?.t2?.name}</div>
                     {(match.timeline || match.innings1?.timeline) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-4">
                            <WagonWheel timeline={[...(match.firstInningsTimeline || []), ...(match.timeline || [])]} />
                            {/* You can add WormGraph here if data is structured correctly */}
                        </div>
                     )}
                 </div>
                 {match.innings1 && renderInnings(match.innings1.battingStats || {}, match.innings1.bowlerStats || {}, match.innings1.outPlayers || [], match.innings1.teamName || "1st Innings", match.innings1.runs, match.innings1.wickets, `${match.innings1.overs}.${match.innings1.balls}`)}
                 {match.innings2 && renderInnings(match.innings2.battingStats || {}, match.innings2.bowlerStats || {}, match.innings2.outPlayers || [], match.innings2.teamName || "2nd Innings", match.innings2.runs, match.innings2.wickets, `${match.innings2.overs}.${match.innings2.balls}`)}
            </div>
        </Modal>
    );
};

// --- RANKINGS MODAL ---
export const RankingsModal = ({ matchSettings, players, matchHistory, battingStats, bowlerStats, firstInningsData, onClose, outPlayers: currentOutPlayers }) => {
    const [category, setCategory] = useState('BATTING'); 
    const [subFilter, setSubFilter] = useState('RUNS'); 
    const [venueFilter, setVenueFilter] = useState('ALL');

    const currentBatting = { ...battingStats, ...(firstInningsData?.battingStats || {}) };
    const currentBowling = { ...bowlerStats, ...(firstInningsData?.bowlerStats || {}) };
    const aggregatedPlayers = {};

    const mergeStats = (pid, bat, bowl, field) => {
        if (!aggregatedPlayers[pid]) aggregatedPlayers[pid] = { bat: { runs: 0, balls: 0, fours: 0, sixes: 0 }, bowl: { runs: 0, wickets: 0, overs: 0, legalBalls: 0 }, field: { catches: 0, runouts: 0, stumpings: 0 } };
        if(bat) { aggregatedPlayers[pid].bat.runs += bat.runs || 0; aggregatedPlayers[pid].bat.balls += bat.balls || 0; aggregatedPlayers[pid].bat.fours += bat.fours || 0; aggregatedPlayers[pid].bat.sixes += bat.sixes || 0; }
        if(bowl) { aggregatedPlayers[pid].bowl.runs += bowl.runs || 0; aggregatedPlayers[pid].bowl.wickets += bowl.wickets || 0; aggregatedPlayers[pid].bowl.legalBalls += bowl.legalBalls || 0; }
        if(field) { aggregatedPlayers[pid].field.catches += field.catches || 0; aggregatedPlayers[pid].field.runouts += field.runouts || 0; aggregatedPlayers[pid].field.stumpings += field.stumpings || 0; }
    };

    const processFielding = (outPlayers) => {
        const fieldStats = {};
        if(!outPlayers) return fieldStats;
        outPlayers.forEach(out => {
            if(out.fielderId) {
                if(!fieldStats[out.fielderId]) fieldStats[out.fielderId] = { catches: 0, runouts: 0, stumpings: 0 };
                if(out.howOut === 'Caught') fieldStats[out.fielderId].catches++;
                if(out.howOut === 'Run Out') fieldStats[out.fielderId].runouts++;
                if(out.howOut === 'Stumped') fieldStats[out.fielderId].stumpings++;
            }
        });
        return fieldStats;
    };

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
        return { ...aggregatedPlayers[pid], id: pid, name: pDetails?.name || 'Unknown', image: pDetails?.image };
    }).sort((a, b) => {
        if (category === 'MVP') return calculateMVPPoints(b.bat, b.bowl, b.field) - calculateMVPPoints(a.bat, a.bowl, a.field);
        if (category === 'BATTING') {
            if (subFilter === 'SR') { const srA = a.bat.balls > 0 ? (a.bat.runs / a.bat.balls) * 100 : 0; const srB = b.bat.balls > 0 ? (b.bat.runs / b.bat.balls) * 100 : 0; return srB - srA; }
            if (subFilter === '4s') return b.bat.fours - a.bat.fours;
            if (subFilter === '6s') return b.bat.sixes - a.bat.sixes;
            return b.bat.runs - a.bat.runs;
        }
        if (category === 'BOWLING') {
            if (subFilter === 'ECON') { const ovA = a.bowl.legalBalls/6; const ovB = b.bowl.legalBalls/6; const econA = ovA > 0 ? a.bowl.runs / ovA : 999; const econB = ovB > 0 ? b.bowl.runs / ovB : 999; if (ovA === 0) return 1; if (ovB === 0) return -1; return econA - econB; }
            return b.bowl.wickets - a.bowl.wickets;
        }
        if (category === 'FIELDING') {
            if (subFilter === 'CATCHES') return b.field.catches - a.field.catches;
            const ptsA = (a.field.catches*10) + (a.field.runouts*15) + (a.field.stumpings*10);
            const ptsB = (b.field.catches*10) + (b.field.runouts*15) + (b.field.stumpings*10);
            return ptsB - ptsA;
        }
        return 0;
    });

    return (
        <Modal title="Rankings" onClose={onClose}>
             <div className="mb-4">
                <label className="text-xs text-slate-400 mb-1 block">Venue Filter</label>
                <select className="w-full bg-slate-800 p-2 rounded text-white text-sm border border-slate-700" value={venueFilter} onChange={e => setVenueFilter(e.target.value)}>
                    <option value="ALL">All Venues</option>
                    {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setCategory('BATTING')} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${category==='BATTING'?'bg-blue-600 text-white':'bg-slate-800 text-slate-400'}`}>Batting</button>
                <button onClick={() => setCategory('BOWLING')} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${category==='BOWLING'?'bg-blue-600 text-white':'bg-slate-800 text-slate-400'}`}>Bowling</button>
                <button onClick={() => setCategory('FIELDING')} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${category==='FIELDING'?'bg-blue-600 text-white':'bg-slate-800 text-slate-400'}`}>Fielding</button>
                <button onClick={() => setCategory('MVP')} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${category==='MVP'?'bg-yellow-600 text-white':'bg-slate-800 text-slate-400'}`}>MVP</button>
             </div>
             {/* Subfilters simplified for brevity */}
             <div className="space-y-2">
                 {sortedPlayers.map((p, i) => {
                     let val = 0;
                     if (category === 'MVP') val = calculateMVPPoints(p.bat, p.bowl, p.field);
                     else if (category === 'BATTING') val = subFilter === 'SR' ? ((p.bat.runs/p.bat.balls||0)*100).toFixed(1) : subFilter === '4s' ? p.bat.fours : subFilter === '6s' ? p.bat.sixes : p.bat.runs;
                     else if (category === 'BOWLING') val = subFilter === 'ECON' ? ((p.bowl.runs/(p.bowl.legalBalls/6))||0).toFixed(2) : p.bowl.wickets;
                     else if (category === 'FIELDING') val = subFilter === 'CATCHES' ? p.field.catches : (p.field.catches*10 + p.field.runouts*15 + p.field.stumpings*10);
                     return (
                         <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${i === 0 ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-slate-700 bg-slate-800'}`}>
                             <div className="flex items-center gap-3">
                                 <span className={`font-mono font-bold text-lg w-6 text-center ${i < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>{i+1}</span>
                                 <PlayerAvatar player={p} size="sm" />
                                 <div><div className="font-bold text-white text-sm">{p.name}</div><div className="text-[10px] text-slate-500">{p.role}</div></div>
                             </div>
                             <div className="text-right"><span className="font-black text-xl text-white block">{val}</span><span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{category === 'BATTING' ? subFilter : category === 'BOWLING' ? subFilter : 'Pts'}</span></div>
                         </div>
                     );
                 })}
             </div>
        </Modal>
    );
};

// --- HEAD TO HEAD MODAL ---
export const HeadToHeadModal = ({ players, matchHistory, onClose }) => {
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

    return (
        <Modal title="Head-to-Head Analysis" onClose={onClose}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Batter</label>
                        <select className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value={batterId} onChange={e => setBatterId(e.target.value)}>
                            <option value="">Choose...</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                         {batter && <div className="flex justify-center pt-2"><PlayerAvatar player={batter} size="lg"/></div>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Bowler</label>
                        <select className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value={bowlerId} onChange={e => setBowlerId(e.target.value)}>
                            <option value="">Choose...</option>{players.filter(p => p.id !== batterId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {bowler && <div className="flex justify-center pt-2"><PlayerAvatar player={bowler} size="lg"/></div>}
                    </div>
                </div>
                {stats ? (
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-in fade-in zoom-in">
                        <div className="text-center mb-4">
                            <div className="text-slate-400 text-xs uppercase mb-1">Total Runs Scored</div>
                            <div className="text-4xl font-black text-white">{stats.runs} <span className="text-lg text-slate-500 font-medium">({stats.balls})</span></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-slate-900/50 p-2 rounded text-center"><div className="text-red-400 font-bold text-xl">{stats.outs}</div><div className="text-[10px] text-slate-500 uppercase">Dismissals</div></div>
                            <div className="bg-slate-900/50 p-2 rounded text-center"><div className="text-blue-400 font-bold text-xl">{stats.balls > 0 ? ((stats.runs/stats.balls)*100).toFixed(0) : 0}</div><div className="text-[10px] text-slate-500 uppercase">Strike Rate</div></div>
                            <div className="bg-slate-900/50 p-2 rounded text-center"><div className="text-green-400 font-bold text-xl">{stats.fours + stats.sixes}</div><div className="text-[10px] text-slate-500 uppercase">Boundaries</div></div>
                        </div>
                        <div className="text-center">
                            {stats.outs > 0 ? ( <div className="text-sm text-red-300">{bowler?.name} dominates! Avg: {(stats.runs/stats.outs).toFixed(1)}</div> ) : ( <div className="text-sm text-green-300">{batter?.name} has never been dismissed by {bowler?.name}.</div> )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-6 text-sm">Select both players to view their matchup history.</div>
                )}
            </div>
        </Modal>
    );
};