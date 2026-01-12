import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export interface ConditionTemplate {
  id: string;
  mode: 'SIMPLE' | 'GROUP';
  label: string;
  description: string;
  icon: string;
  color: string;
  field: string;
  operator: string;
  value: any;
  logic?: 'AND' | 'OR';
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

const CONDITION_TEMPLATES: ConditionTemplate[] = [
  {
    id: 'gift_specific',
    mode: 'SIMPLE',
    label: 'Gift por ID',
    description: 'Filtrar por un regalo específico usando su ID único.',
    icon: 'card_giftcard',
    color: 'text-purple-400',
    field: 'data.gift.id',
    operator: 'EQ',
    value: '1'
  },
  {
    id: 'gift_name',
    mode: 'SIMPLE',
    label: 'Gift por Nombre',
    description: 'Filtrar por el nombre del regalo (ej: "Rose", "Panda").',
    icon: 'label',
    color: 'text-blue-400',
    field: 'data.gift.name',
    operator: 'EQ',
    value: 'Rose'
  },
  {
    id: 'high_value',
    mode: 'SIMPLE',
    label: 'High Value Gifts',
    description: 'Filtrar regalos con valor igual o mayor a X coins.',
    icon: 'diamond',
    color: 'text-yellow-400',
    field: 'data.coins',
    operator: 'GTE',
    value: 100
  },
  {
    id: 'premium_gifts',
    mode: 'GROUP',
    label: 'Premium Bundle',
    description: 'Filtrar regalos premium (Galaxy, Yacht, Ferrari, etc.).',
    icon: 'workspace_premium',
    color: 'text-amber-400',
    logic: 'OR',
    conditions: [
      { field: 'data.gift.id', operator: 'EQ', value: '16' }, // Galaxy
      { field: 'data.gift.id', operator: 'EQ', value: '17' }, // Yacht
      { field: 'data.gift.id', operator: 'EQ', value: '23' }  // Ferrari
    ]
  },
  {
    id: 'super_rare',
    mode: 'GROUP',
    label: 'Super Rare Gifts',
    description: 'Filtrar los regalos más raros del stream (Train, Jet, Universe).',
    icon: 'stars',
    color: 'text-pink-400',
    logic: 'OR',
    conditions: [
      { field: 'data.gift.id', operator: 'EQ', value: '18' }, // Train
      { field: 'data.gift.id', operator: 'EQ', value: '19' }, // Jet
      { field: 'data.gift.id', operator: 'EQ', value: '20' }  // TikTok Universe
    ]
  },
  {
    id: 'medium_tier',
    mode: 'GROUP',
    label: 'Medium Tier Gifts',
    description: 'Filtrar regalos de nivel medio (100-1000 coins).',
    icon: 'category',
    color: 'text-emerald-400',
    logic: 'AND',
    conditions: [
      { field: 'data.coins', operator: 'GTE', value: 100 },
      { field: 'data.coins', operator: 'LTE', value: 1000 }
    ]
  },
  {
    id: 'sticker_only',
    mode: 'SIMPLE',
    label: 'Stickers Only',
    description: 'Filtrar solo los stickers (valor bajo, masivos).',
    icon: 'sticker_2',
    color: 'text-cyan-400',
    field: 'data.gift.type',
    operator: 'EQ',
    value: 'sticker'
  },
  {
    id: 'user_specific_gift',
    mode: 'GROUP',
    label: 'User & Gift Combo',
    description: 'Filtrar por usuario Y gift específico simultáneamente.',
    icon: 'person_add',
    color: 'text-indigo-400',
    logic: 'AND',
    conditions: [
      { field: 'data.user.username', operator: 'EQ', value: 'specific_user' },
      { field: 'data.gift.id', operator: 'EQ', value: '1' }
    ]
  },
  {
    id: 'excluded_gifts',
    mode: 'GROUP',
    label: 'Excluir Low Tier',
    description: 'Filtrar todos EXCEPTO los regalos de bajo valor (< 5 coins).',
    icon: 'block',
    color: 'text-red-400',
    logic: 'OR',
    conditions: [
      { field: 'data.coins', operator: 'GTE', value: 5 },
      { field: 'data.gift.type', operator: 'NEQ', value: 'sticker' }
    ]
  },
  {
    id: 'combo_alerts',
    mode: 'GROUP',
    label: 'Combo Gifts',
    description: 'Filtrar regalos que se pueden combinar (x2, x5, x10).',
    icon: 'auto_awesome',
    color: 'text-violet-400',
    logic: 'OR',
    conditions: [
      { field: 'data.gift.id', operator: 'IN', value: '1,2,3' },
      { field: 'data.gift.id', operator: 'IN', value: '4,5,6' }
    ]
  }
];

interface ConditionGalleryModalProps {
  onClose: () => void;
  onSelect: (template: ConditionTemplate) => void;
}

const ConditionGalleryModal: React.FC<ConditionGalleryModalProps> = ({ onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = CONDITION_TEMPLATES.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.field.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-4xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">call_split</span>
              Condition Gallery
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Pre-built Filter Templates</p>
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
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="Search condition templates..."
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
              className="group flex flex-col p-5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/30 transition-all text-left relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`size-12 rounded-xl flex items-center justify-center bg-slate-900 shadow-inner group-hover:scale-110 transition-transform ${template.color}`}>
                  <span className="material-symbols-outlined text-2xl">{template.icon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-mono font-bold text-slate-600 bg-slate-950 px-2 py-1 rounded">
                    {template.mode}
                  </div>
                  {template.logic && (
                    <div className="text-[10px] font-mono font-bold text-blue-500/70 bg-blue-500/10 px-2 py-1 rounded">
                      {template.logic}
                    </div>
                  )}
                </div>
              </div>
              <div className="font-bold text-slate-100 text-sm mb-1">{template.label}</div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4 line-clamp-2">{template.description}</p>

              <div className="mt-auto space-y-2">
                <div className="text-[10px] text-slate-600 font-mono bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-800/50 truncate">
                  {template.field}
                </div>
                <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
                  Add Condition <span className="material-symbols-outlined text-sm ml-1">add_circle</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            {CONDITION_TEMPLATES.length} Templates Available
          </p>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            Auto-detects gift fields
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConditionGalleryModal;
