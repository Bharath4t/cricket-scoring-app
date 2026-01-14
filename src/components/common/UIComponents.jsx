// File: src/components/common/UIComponents.js
import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ children, title, onClose, maxWidth = "max-w-md" }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
    <div className={`bg-slate-900 border border-slate-700 w-full ${maxWidth} rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ring-1 ring-white/10`}>
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
            {title}
        </h3>
        {onClose && <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors active:scale-90"><X size={20}/></button>}
      </div>
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "py-3.5 px-6 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg text-sm tracking-wide duration-200";
  const variants = {
    primary: "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-orange-900/20 border border-orange-400/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600",
    danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/20",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/20",
    outline: "border-2 border-slate-600 text-slate-300 hover:border-slate-400 bg-transparent hover:bg-slate-800/50"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

export const PlayerAvatar = ({ player, size = "md" }) => {
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