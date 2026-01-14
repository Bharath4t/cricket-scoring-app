// File: src/components/game/MatchFlow.js
import React, { useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { Modal, Button, PlayerAvatar } from '../common/UIComponents';
import { DISMISSAL_TYPES } from '../../utils/constants';

// --- MATCH SETTINGS MODAL ---
export const MatchSettingsModal = ({ currentSettings, onUpdate, onClose }) => {
    const [lms, setLms] = useState(currentSettings.lastManStanding);
    const [maxOvers, setMaxOvers] = useState(currentSettings.maxOversPerBowler);

    const handleSave = () => {
        onUpdate(prev => ({ ...prev, lastManStanding: lms, maxOversPerBowler: parseInt(maxOvers) }));
        onClose();
    };

    return (
        <Modal title="In-Match Settings" onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div><div className="font-bold text-white">Last Man Standing</div><div className="text-xs text-slate-400">Allow last batter to play alone</div></div>
                    <input type="checkbox" className="w-6 h-6 accent-blue-500 rounded cursor-pointer" checked={lms} onChange={e => setLms(e.target.checked)} />
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="font-bold text-white mb-2">Max Overs Per Bowler</div>
                    <input type="number" className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg text-white font-mono text-lg" value={maxOvers} onChange={e => setMaxOvers(e.target.value)} />
                    <p className="text-xs text-slate-500 mt-2">Changes apply immediately.</p>
                </div>
                <Button onClick={handleSave}>Update Settings</Button>
            </div>
        </Modal>
    );
};

// --- TOSS SCREEN ---
export const TossScreen = ({ team1, team2, onToss }) => {
    const [isFlipping, setIsFlipping] = useState(false);
    const [result, setResult] = useState(null); 
    const [callingTeamId, setCallingTeamId] = useState(team1?.id || '');
    const [callSide, setCallSide] = useState(''); 
    const [rotation, setRotation] = useState(0); 

    const handleFlip = () => {
        if (!callingTeamId || !callSide) return alert("Please select who is calling and what they call!");
        setIsFlipping(true);
        const newRotation = rotation + 1800 + (Math.random() * 360); 
        setRotation(newRotation);

        setTimeout(() => {
            const finalSide = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
            const callingTeam = [team1, team2].find(t => t.id === callingTeamId);
            const didWin = finalSide === callSide;
            const winner = didWin ? callingTeam : [team1, team2].find(t => t.id !== callingTeamId);
            setRotation(newRotation + (finalSide === 'HEADS' ? 0 : 180) - (newRotation % 360));
            setIsFlipping(false);
            setResult({ winner, side: finalSide });
        }, 2500); 
    };

    if (!team1 || !team2) return null; 

    return (
        <div className="p-8 pt-20 text-center max-w-md mx-auto flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white mb-8">Toss Time!</h2>
            <div className="relative w-40 h-40 mb-12" style={{ perspective: '1000px' }}>
                <div onClick={!isFlipping && !result ? handleFlip : undefined} className="w-full h-full absolute transition-transform duration-[2500ms] ease-out cursor-pointer" style={{ transformStyle: 'preserve-3d', transform: `rotateY(${rotation}deg)` }}>
                    <div className="absolute w-full h-full rounded-full bg-yellow-400 border-8 border-yellow-600 flex items-center justify-center shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                         <div className="border-4 border-yellow-500/50 rounded-full w-32 h-32 flex items-center justify-center"><span className="text-6xl font-black text-yellow-800 drop-shadow-md">H</span></div>
                    </div>
                    <div className="absolute w-full h-full rounded-full bg-slate-300 border-8 border-slate-500 flex items-center justify-center shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                         <div className="border-4 border-slate-400/50 rounded-full w-32 h-32 flex items-center justify-center"><span className="text-6xl font-black text-slate-700 drop-shadow-md">T</span></div>
                    </div>
                </div>
            </div>

            {!result && !isFlipping && (
                <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <p className="text-slate-400 text-xs mb-3 uppercase font-bold tracking-wider">Who is calling?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setCallingTeamId(team1.id)} className={`flex-1 p-3 rounded-lg border transition-all ${callingTeamId === team1.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>{team1.name}</button>
                            <button onClick={() => setCallingTeamId(team2.id)} className={`flex-1 p-3 rounded-lg border transition-all ${callingTeamId === team2.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>{team2.name}</button>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <p className="text-slate-400 text-xs mb-3 uppercase font-bold tracking-wider">What do they call?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setCallSide('HEADS')} className={`flex-1 p-3 rounded-lg border transition-all ${callSide === 'HEADS' ? 'bg-yellow-600 border-yellow-400 text-white shadow-lg shadow-yellow-900/50' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>HEADS</button>
                            <button onClick={() => setCallSide('TAILS')} className={`flex-1 p-3 rounded-lg border transition-all ${callSide === 'TAILS' ? 'bg-yellow-600 border-yellow-400 text-white shadow-lg shadow-yellow-900/50' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>TAILS</button>
                        </div>
                    </div>
                    <Button onClick={handleFlip} disabled={!callingTeamId || !callSide} className="w-full py-4 text-lg">Flip Coin</Button>
                </div>
            )}

            {isFlipping && <div className="text-yellow-400 font-bold text-xl animate-pulse mt-8">Flipping...</div>}

            {result && (
                <div className="animate-in fade-in zoom-in duration-500 w-full mt-4">
                    <div className="mb-6 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                        <div className="text-yellow-400 font-black text-5xl mb-2 drop-shadow-lg">{result.side}</div>
                        <div className="text-slate-300 text-lg"><span className="text-white font-bold text-xl">{result.winner.name}</span> won the toss!</div>
                    </div>
                    <p className="text-slate-400 mb-4 text-sm font-bold uppercase">What do they choose?</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onToss(result.winner.id, 'bat')} className="p-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white text-lg shadow-xl shadow-blue-900/30 border border-blue-400/50 active:scale-95 transition-all">Bat First</button>
                        <button onClick={() => onToss(result.winner.id, 'bowl')} className="p-6 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-white text-lg shadow-xl shadow-green-900/30 border border-green-400/50 active:scale-95 transition-all">Bowl First</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- OPENERS SELECTION ---
export const OpenersModal = ({ squad, teamName, onSelect }) => {
    const [s1, setS1] = useState('');
    const [s2, setS2] = useState('');
    return (
        <Modal title={`Openers for ${teamName}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs text-slate-500 uppercase font-bold">Striker</label>
                    <div className="grid grid-cols-2 gap-2">{squad.map(p => (<button key={`s1-${p.id}`} onClick={() => setS1(p.id)} className={`p-2 rounded-lg flex items-center gap-2 text-left ${s1 === p.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}><PlayerAvatar player={p} size="sm" /> <span className="text-sm truncate">{p.name}</span></button>))}</div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs text-slate-500 uppercase font-bold">Non-Striker</label>
                    <div className="grid grid-cols-2 gap-2">{squad.filter(p => p.id !== s1).map(p => (<button key={`s2-${p.id}`} onClick={() => setS2(p.id)} className={`p-2 rounded-lg flex items-center gap-2 text-left ${s2 === p.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}><PlayerAvatar player={p} size="sm" /> <span className="text-sm truncate">{p.name}</span></button>))}</div>
                </div>
                <Button disabled={!s1 || !s2} onClick={() => onSelect(s1, s2)}>Start Innings</Button>
            </div>
        </Modal>
    );
};

// --- NEXT BATSMAN SELECTION ---
export const PlayerSelectionModal = ({ title, squad, excludeIds, retiredHurtPlayers, onSelect, onClose }) => {
    const retiredIds = retiredHurtPlayers ? retiredHurtPlayers.map(r => r.id) : [];
    const allExcluded = [...excludeIds, ...retiredIds];
    const available = squad.filter(p => !allExcluded.includes(p.id));
    
    return (
        <Modal title={title} onClose={onClose}>
            <div className="space-y-4">
                {retiredHurtPlayers && retiredHurtPlayers.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-orange-400 uppercase mb-2">Resume Innings (Retired Hurt)</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {retiredHurtPlayers.map(rh => {
                                const p = squad.find(pl => pl.id === rh.id) || { name: 'Unknown' };
                                return (
                                    <button key={rh.id} onClick={() => onSelect(rh.id, true)} className="flex items-center justify-between p-3 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-500/50 rounded-lg text-left group transition-colors">
                                        <div className="flex items-center gap-3"><PlayerAvatar player={p} /><div><div className="font-medium text-white">{p.name}</div><div className="text-xs text-orange-300">{rh.stats.runs}* ({rh.stats.balls})</div></div></div>
                                        <div className="text-xs bg-orange-600 text-white px-2 py-1 rounded">Resume</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Fresh Batsmen</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {available.length === 0 && <p className="text-center text-slate-500 py-4">No fresh players available</p>}
                        {available.map(p => (
                            <button key={p.id} onClick={() => onSelect(p.id, false)} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left group transition-colors">
                                <PlayerAvatar player={p} />
                                <div><div className="font-medium text-white group-hover:text-blue-400">{p.name}</div><div className="text-xs text-slate-400">{p.role}</div></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// --- NEXT BOWLER SELECTION ---
export const BowlerSelectionModal = ({ currentOver, squad, lastBowlerId, onSelect, bowlerStats, maxOvers }) => {
    const statsMap = bowlerStats || {};
    const safeSquad = squad || [];
    const limit = maxOvers || Infinity; 
    
    const availableBowlers = safeSquad.filter(p => {
        if (p.id === lastBowlerId) return false;
        const stats = statsMap[p.id] || { legalBalls: 0 };
        const oversBowled = Math.floor(stats.legalBalls / 6);
        return oversBowled < limit;
    });

    return (
        <Modal title={`Bowler for Over ${currentOver}`}>
            <div className="grid grid-cols-1 gap-2">
                {availableBowlers.length === 0 && <p className="text-center text-slate-500">No bowlers available within limit ({limit}).</p>}
                {availableBowlers.map(p => (
                    <button key={p.id} onClick={() => onSelect(p.id)} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left group transition-colors">
                        <PlayerAvatar player={p} />
                        <div><div className="font-medium text-white group-hover:text-blue-400">{p.name}</div><div className="text-xs text-slate-400">{p.bowlingStyle}</div></div>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

// --- WICKET MODAL ---
export const WicketModal = ({ squad, onConfirm, onClose }) => {
    const [type, setType] = useState('Caught');
    const [fielder, setFielder] = useState('');
    const needsFielder = ['Caught', 'Run Out', 'Stumped'].includes(type);
    const validSquad = squad || [];

    return (
        <Modal title="Wicket Details" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-slate-400 mb-2 block">Dismissal Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {DISMISSAL_TYPES.map(t => (
                            <button key={t} onClick={() => setType(t)} className={`text-xs p-2 rounded border ${type === t ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{t}</button>
                        ))}
                    </div>
                </div>
                {needsFielder && (
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Select Fielder</label>
                        <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={fielder} onChange={e => setFielder(e.target.value)}>
                            <option value="">Select Fielder...</option>{validSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}
                <Button onClick={() => onConfirm(type, fielder)} disabled={needsFielder && !fielder}>Confirm Wicket</Button>
            </div>
        </Modal>
    );
};