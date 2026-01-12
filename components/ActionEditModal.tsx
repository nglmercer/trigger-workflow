
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Action } from '../types';
import ActionGalleryModal, { ActionTemplate } from './ActionGalleryModal';

interface ActionEditModalProps {
  action: Action & { label?: string };
  onClose: () => void;
  onSave: (updatedAction: Action & { label?: string }) => void;
}

const ActionEditModal: React.FC<ActionEditModalProps> = ({ action, onClose, onSave }) => {
  const [type, setType] = useState(action.type);
  const [details, setDetails] = useState(action.details || '');
  const [label, setLabel] = useState(action.label || '');
  const [showGallery, setShowGallery] = useState(false);

  const handleSave = () => {
    onSave({ type, details, label });
  };

  const handleSelectTemplate = (template: ActionTemplate) => {
    setType(template.type);
    setDetails(template.defaultParams);
    setLabel(template.label);
    setShowGallery(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0a101d] border border-slate-800/60 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header minimalista */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-slate-800/20 bg-slate-900/20">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Parameters Configuration</h2>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Action Type */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Action Type</label>
              <button 
                onClick={() => setShowGallery(true)}
                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors group"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome_motion</span>
                Change Template
              </button>
            </div>
            <input 
              className="w-full bg-[#0d1425] border border-slate-800/80 rounded-xl px-4 py-3.5 text-xs text-slate-100 font-mono outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>

          {/* Descriptive Label */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Descriptive Label</label>
            <input 
              className="w-full bg-[#0d1425] border border-slate-800/80 rounded-xl px-4 py-3.5 text-xs text-slate-400 outline-none focus:border-emerald-500/50 transition-colors"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Trigger TikTok Alert"
            />
          </div>

          {/* Parameters (YAML) */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Parameters (YAML)</label>
            <div className="relative min-h-[160px]">
              <textarea 
                className="w-full h-full min-h-[160px] bg-[#0d1425] border border-slate-800/80 rounded-xl p-4 text-[12px] text-emerald-400 font-mono resize-none outline-none focus:border-emerald-500/50 transition-all custom-scrollbar leading-relaxed"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions con Botón Sólido */}
        <div className="p-5 bg-[#080d16] border-t border-slate-800/50 flex justify-end gap-3 items-center">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0a101d] rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Apply Changes
          </button>
        </div>
      </div>

      {showGallery && (
        <ActionGalleryModal 
          onClose={() => setShowGallery(false)} 
          onSelect={handleSelectTemplate} 
        />
      )}
    </div>,
    document.body
  );
};

export default ActionEditModal;
