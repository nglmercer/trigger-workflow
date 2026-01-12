
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export interface ActionTemplate {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultParams: string;
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'tiktok_tts',
    type: 'TTS_SPEECH',
    label: 'TikTok TTS Alert',
    description: 'Convertir mensaje de chat o regalo en voz para el stream.',
    icon: 'record_voice_over',
    color: 'text-pink-400',
    defaultParams: 'text: "{user} ha enviado un {gift}!"\nvoice: "es_mx_002"\nvolume: 1.0\nqueue: true'
  },
  {
    id: 'visual_alert',
    type: 'OVERLAY_ALERT',
    label: 'Visual Overlay',
    description: 'Mostrar una animación personalizada en OBS/StreamElements.',
    icon: 'filter_frames',
    color: 'text-blue-400',
    defaultParams: 'animation: "bounceIn"\nduration: 5000\nimage: "https://cdn.live/gift_anim.webp"\nsound: "alert.mp3"'
  },
  {
    id: 'sfx_player',
    type: 'SFX_PLAY',
    label: 'Sound Effect',
    description: 'Reproducir un efecto de sonido instantáneo.',
    icon: 'volume_up',
    color: 'text-orange-400',
    defaultParams: 'file: "airhorn.mp3"\nvolume: 0.7\nspatial: false'
  },
  {
    id: 'stream_log',
    type: 'STREAM_LOG',
    label: 'Dashboard Log',
    description: 'Registrar el evento en el panel privado del streamer.',
    icon: 'list_alt',
    color: 'text-emerald-400',
    defaultParams: 'message: "Evento de {user} procesado correctamente"\nlevel: "success"\nicon: "gift"'
  },
  {
    id: 'mod_action',
    type: 'MOD_COMMAND',
    label: 'Auto Mod',
    description: 'Enviar un comando automático al chat (ej: agradecer regalo).',
    icon: 'gavel',
    color: 'text-purple-400',
    defaultParams: 'message: "¡Gracias {user} por el {gift}! Eres un crack."\ndelay: 1000'
  }
];

interface ActionGalleryModalProps {
  onClose: () => void;
  onSelect: (template: ActionTemplate) => void;
}

const ActionGalleryModal: React.FC<ActionGalleryModalProps> = ({ onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = ACTION_TEMPLATES.filter(t => 
    t.label.toLowerCase().includes(search.toLowerCase()) || 
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-4xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">stream</span>
              Live Stream Gallery
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">TikTok & Twitch Automation Templates</p>
          </div>
          <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-950/30">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600">search</span>
            <input 
              autoFocus
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="Search stream actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-4">
          {filtered.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="group flex flex-col p-5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 transition-all text-left relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`size-12 rounded-xl flex items-center justify-center bg-slate-900 shadow-inner group-hover:scale-110 transition-transform ${template.color}`}>
                  <span className="material-symbols-outlined text-2xl">{template.icon}</span>
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-600 bg-slate-950 px-2 py-1 rounded">
                  {template.type}
                </div>
              </div>
              <div className="font-bold text-slate-100 text-sm mb-1">{template.label}</div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4 line-clamp-2">{template.description}</p>
              <div className="mt-auto flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                Add to Workflow <span className="material-symbols-outlined text-sm ml-1">add_circle</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Optimized for TikTok Live Studio</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActionGalleryModal;
