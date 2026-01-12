
import React from 'react';
import { createPortal } from 'react-dom';
import { NodeType } from '../types';

interface CreationModalProps {
  onClose: () => void;
  onCreate: (type: NodeType) => void;
}

const CreationModal: React.FC<CreationModalProps> = ({ onClose, onCreate }) => {
  const options = [
    { type: NodeType.TRIGGER, label: 'Trigger', sub: 'Mandatory entry point for events', icon: 'bolt', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { type: NodeType.CONDITION, label: 'Condition Group', sub: 'Logical filters and gates', icon: 'call_split', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { type: NodeType.ACTION, label: 'Action Group', sub: 'Sequence or single tasks', icon: 'play_circle', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-3xl overflow-hidden ring-1 ring-white/10">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            Add Component
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 space-y-2">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => onCreate(opt.type)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-left group"
            >
              <div className={`size-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${opt.bg} ${opt.color}`}>
                <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-100 uppercase tracking-wide">{opt.label}</div>
                <div className="text-[11px] text-slate-500">{opt.sub}</div>
              </div>
              <span className="material-symbols-outlined text-slate-600 group-hover:text-slate-300 transition-colors">chevron_right</span>
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em]">Select a logic block to start</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreationModal;
