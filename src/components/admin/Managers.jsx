// File: src/components/admin/Managers.js
import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Camera, User, Users, BarChart2, Activity, Search, History, Download, Upload, RefreshCw, Trophy, MapPin, Check } from 'lucide-react';
import { Modal, Button, PlayerAvatar } from '../common/UIComponents';
import { generateId, compressImage } from '../../utils/helpers';
import { VENUES } from '../../utils/constants';

// --- PLAYER MANAGER ---
export const PlayerManagerModal = ({ players, setPlayers, onClose }) => {
    const [view, setView] = useState('LIST'); 
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({});

    const handleSave = () => {
        if (editId) {
            setPlayers(players.map(p => p.id === editId ? { ...formData, id: editId } : p));
        } else {
            setPlayers([...players, { ...formData, id: generateId() }]);
        }
        setView('LIST');
    };

    const handleDelete = (id) => {
        if(confirm("Delete player? This might break teams containing this player.")) {
            setPlayers(players.filter(p => p.id !== id));
        }
    };

    const handleImageUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await compressImage(e.target.files[0]);
            setFormData({ ...formData, image: base64 });
        }
    };

    return (
        <Modal title="Player Manager" onClose={onClose} maxWidth="max-w-2xl">
            {view === 'LIST' ? (
                <div className="space-y-4">
                    <Button onClick={() => { setFormData({ name: '', role: 'Batsman', battingStyle: 'Right', bowlingStyle: 'Right Arm Seam' }); setEditId(null); setView('EDIT'); }}>
                        <Plus size={18}/> Add New Player
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {players.map(p => (
                            <div key={p.id} className="bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-slate-700">
                                <PlayerAvatar player={p} />
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold truncate text-white">{p.name}</div>
                                    <div className="text-xs text-slate-400 truncate">{p.role}</div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setFormData(p); setEditId(p.id); setView('EDIT'); }} className="p-2 hover:bg-slate-700 rounded text-blue-400"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-slate-700 rounded text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <PlayerAvatar player={formData} size="lg" />
                            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Camera className="text-white" size={24}/>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                    <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Player Name" />
                    <div className="grid grid-cols-2 gap-4">
                        <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicketkeeper</option>
                        </select>
                        <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={formData.battingStyle} onChange={e => setFormData({...formData, battingStyle: e.target.value})}>
                            <option>Right</option><option>Left</option>
                        </select>
                    </div>
                    <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={formData.bowlingStyle} onChange={e => setFormData({...formData, bowlingStyle: e.target.value})}>
                         <option>Right Arm Seam</option><option>Right Arm Spin</option><option>Left Arm Seam</option><option>Left Arm Spin</option><option>None</option>
                    </select>
                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setView('LIST')}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!formData.name}>Save Player</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

// --- TEAM MANAGER ---
export const TeamManagerModal = ({ teams, setTeams, players, onClose }) => {
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
                    <Button onClick={() => { setFormData({ name: '', players: [] }); setEditId(null); setView('EDIT'); }}>
                        <Plus size={18}/> Create New Team
                    </Button>
                    <div className="space-y-2">
                        {teams.map(t => (
                            <div key={t.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                                <div><div className="font-bold text-lg text-white">{t.name}</div><div className="text-xs text-slate-400">{t.players.length} Players</div></div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setFormData(t); setEditId(t.id); setView('EDIT'); }} className="p-2 bg-slate-700 rounded text-blue-400"><Edit2 size={16}/></button>
                                    <button onClick={() => setTeams(teams.filter(x => x.id !== t.id))} className="p-2 bg-slate-700 rounded text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 h-full flex flex-col">
                    <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Team Name" />
                    <div className="flex-1 min-h-[300px] flex flex-col">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2">Select Squad ({formData.players?.length || 0})</label>
                        <div className="flex-1 overflow-y-auto bg-slate-800/50 rounded-xl p-2 border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {players.map(p => {
                                const isSelected = formData.players?.includes(p.id);
                                return (
                                    <button key={p.id} onClick={() => togglePlayerInTeam(p.id)} className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-white bg-white text-blue-600' : 'border-slate-500'}`}>{isSelected && <Check size={12}/>}</div>
                                        <PlayerAvatar player={p} size="sm" />
                                        <span className="truncate text-sm font-medium">{p.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setView('LIST')}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!formData.name}>Save Team</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

// --- SETUP SCREEN ---
export const SetupScreen = ({ teams, players, onStart, onManagePlayers, onManageTeams, onOpenRankings, onOpenProfiles, onExport, onImport, onOpenArchives, onRequestReset }) => {
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
    const team1Players = teams.find(t=>t.id===t1Id)?.players || [];
    const team2Players = teams.find(t=>t.id===t2Id)?.players || [];

    const handleOversChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setOvers(val);
        setMaxOversPerBowler(Math.max(1, Math.ceil(val / 5)));
    };

    return (
        <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-900/20 rotate-3 transform hover:rotate-6 transition-transform"><Trophy className="w-10 h-10 text-white"/></div>
                <h1 className="text-4xl font-black text-white mb-2">CricBharath</h1>
                <p className="text-slate-400">Professional Cricket Scoring</p>
                <div className="mt-2 inline-block px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-500 font-mono">v2.0 (Modular)</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
                <Button variant="secondary" onClick={onManagePlayers} className="text-xs"><User size={16}/> Players</Button>
                <Button variant="secondary" onClick={onManageTeams} className="text-xs"><Users size={16}/> Teams</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
                 <Button variant="secondary" onClick={onOpenRankings} className="text-xs bg-slate-800"><BarChart2 size={16}/> Rankings</Button>
                 <Button variant="secondary" onClick={onOpenProfiles} className="text-xs bg-slate-800"><Activity size={16}/> Profiles</Button>
                 <Button variant="secondary" onClick={() => onOpenArchives('H2H')} className="col-span-2 text-xs bg-slate-800 border border-slate-700 text-blue-300"><Search size={16}/> Head-to-Head Analysis</Button>
            </div>

             <div className="grid grid-cols-2 gap-3 mb-4">
                 <Button variant="secondary" onClick={onOpenArchives} className="w-full text-xs bg-slate-800 border border-slate-700"><History size={16}/> Archives</Button>
                 <Button variant="danger" onClick={onRequestReset} className="w-full text-xs bg-red-900/20 border border-red-800 hover:bg-red-900/40 text-red-400"><Trash2 size={16}/> Reset Stats</Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
                <button onClick={onExport} className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-xs font-bold uppercase tracking-wide transition-colors border border-slate-700 shadow-sm"><Download size={16} className="text-blue-400" /> Backup</button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-xs font-bold uppercase tracking-wide transition-colors border border-slate-700 shadow-sm"><Upload size={16} className="text-green-400" /> Restore</button>
                <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><RefreshCw size={12}/> Match Setup</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400">Tournament / Series Type</label>
                        <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={seriesType} onChange={e => setSeriesType(e.target.value)}>
                            <option value="SINGLE">Single Match</option><option value="SERIES_3">3-Match Series</option><option value="SERIES_5">5-Match Series</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-xs text-slate-400">Home Team</label>
                            <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={t1Id} onChange={e => setT1Id(e.target.value)}>
                                <option value="">Select...</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Away Team</label>
                            <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={t2Id} onChange={e => setT2Id(e.target.value)}>
                                <option value="">Select...</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Joker / Common Player</label>
                        <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={jokerId} onChange={e => setJokerId(e.target.value)} disabled={!t1Id || !t2Id}>
                            <option value="">None</option>
                            {players.filter(p => !team1Players.includes(p.id) && !team2Players.includes(p.id)).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-slate-400">Overs</label><input type="number" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={overs} onChange={handleOversChange} /></div>
                        <div><label className="text-xs text-slate-400">Max Overs/Bowler</label><input type="number" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={maxOversPerBowler} onChange={e => setMaxOversPerBowler(e.target.value)} /></div>
                    </div>
                    
                    <div>
                        <label className="text-xs text-slate-400">Venue</label>
                        <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white mt-1" value={venue} onChange={e => setVenue(e.target.value)}>
                            {VENUES.map(v => <option key={v} value={v}>{v}</option>)}<option value="Custom">Custom</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                        <input type="checkbox" className="w-5 h-5 accent-blue-500" checked={lastManStanding} onChange={e => setLastManStanding(e.target.checked)} />
                        <label className="text-sm text-white">Last Man Standing Rule</label>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700 mt-3">
                         <input type="checkbox" className="w-5 h-5 accent-green-500" checked={trackShots} onChange={e => setTrackShots(e.target.checked)} />
                         <div><div className="text-sm text-white font-bold">Track Boundary Shots</div><div className="text-[10px] text-slate-400">Map 4s & 6s (Straight, Long On, etc)</div></div>
                    </div>
                    <Button onClick={() => onStart({ team1Id: t1Id, team2Id: t2Id, totalOvers: parseInt(overs), venue, jokerId, lastManStanding, seriesType, maxOversPerBowler: parseInt(maxOversPerBowler), trackShots })} disabled={!t1Id || !t2Id || t1Id === t2Id}>Start Match</Button>
                </div>
            </div>
        </div>
    );
};