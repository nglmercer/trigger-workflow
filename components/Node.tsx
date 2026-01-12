import React, { useState } from "react";
import { NodeType, WorkflowNode, Action } from "../types";
import Socket from "./Socket";
import ActionGalleryModal, { ActionTemplate } from "./ActionGalleryModal";
import ActionEditModal from "./ActionEditModal";
import ConditionGalleryModal, {
  ConditionTemplate,
} from "./ConditionGalleryModal";
import GiftSelector from "./selectors/GiftSelector";
import { giftService } from "../services/giftService";

interface NodeProps {
  node: WorkflowNode;
  onDrag: (id: string, x: number, y: number) => void;
  onUpdateData: (id: string, newData: any) => void;
  onToggleEnabled: (id: string) => void;
  onDelete: (id: string) => void;
  onSocketMouseDown: (
    id: string,
    side: "left" | "right",
    e: React.MouseEvent,
  ) => void;
  onSocketMouseEnter: (id: string, side: "left" | "right") => void;
  onSocketMouseLeave: () => void;
  isDraggingConnection: boolean;
}

// ValueInput component that conditionally uses GiftSelector for gift-related fields
const ValueInput: React.FC<{
  field: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ field, value, onChange, placeholder = "value", disabled = false }) => {
  const isGiftField = giftService.isGiftRelatedField(field);

  if (isGiftField) {
    return (
      <GiftSelector
        value={value}
        onChange={(newValue) => onChange(newValue)}
        placeholder={placeholder}
        disabled={disabled}
        allowManualInput={true}
      />
    );
  }

  return (
    <input
      className="flex-1 bg-slate-800 border-none text-[9px] text-slate-300 rounded px-2 py-0.5 outline-none font-mono"
      placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

const Node: React.FC<NodeProps> = ({
  node,
  onDrag,
  onUpdateData,
  onToggleEnabled,
  onDelete,
  onSocketMouseDown,
  onSocketMouseEnter,
  onSocketMouseLeave,
  isDraggingConnection,
}) => {
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  const [showGallery, setShowGallery] = useState(false);
  const [showConditionGallery, setShowConditionGallery] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(
    null,
  );

  const onMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(
        "button, input, select, textarea, [data-socket]",
      )
    )
      return;
    setDragging(true);
    setRel({
      x: e.pageX - node.position.x,
      y: e.pageY - node.position.y,
    });
    e.stopPropagation();
    e.preventDefault();
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      onDrag(node.id, e.pageX - rel.x, e.pageY - rel.y);
    };
    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, rel, node.id, onDrag]);

  const updateField = (key: string, value: any) => {
    onUpdateData(node.id, { ...node.data, [key]: value });
  };

  const addCondition = () => {
    const conditions = [...(node.data.conditions || [])];
    conditions.push({ field: "data.value", operator: "EQ", value: "test" });
    updateField("conditions", conditions);
  };

  const removeCondition = (index: number) => {
    const conditions = [...(node.data.conditions || [])];
    conditions.splice(index, 1);
    updateField("conditions", conditions);
  };

  const updateCondition = (index: number, key: string, value: any) => {
    const conditions = [...(node.data.conditions || [])];
    conditions[index] = { ...conditions[index], [key]: value };
    updateField("conditions", conditions);
  };

  const applyConditionTemplate = (template: ConditionTemplate) => {
    if (template.mode === "SIMPLE") {
      onUpdateData(node.id, {
        ...node.data,
        mode: template.mode,
        field: template.field,
        operator: template.operator,
        value: template.value,
      });
    } else {
      onUpdateData(node.id, {
        ...node.data,
        mode: template.mode,
        logic: template.logic || "AND",
        conditions: template.conditions || [],
      });
    }
    setShowConditionGallery(false);
  };

  const addAction = (template?: ActionTemplate) => {
    const actions = [...(node.data.actions || [])];
    if (template) {
      actions.push({
        type: template.type,
        details: template.defaultParams,
        label: template.label,
      });
    } else {
      actions.push({
        type: "STATE_SET",
        details: "key: value",
        params: { key: "new_key", value: true },
        label: "Manual Action",
      });
    }
    updateField("actions", actions);
    setShowGallery(false);
  };

  const removeAction = (index: number) => {
    const actions = [...(node.data.actions || [])];
    actions.splice(index, 1);
    updateField("actions", actions);
  };

  const handleUpdateAction = (
    index: number,
    updatedAction: Action & { label?: string },
  ) => {
    const actions = [...(node.data.actions || [])];
    actions[index] = updatedAction;
    updateField("actions", actions);
    setEditingActionIndex(null);
  };

  const accent = !node.enabled
    ? "#475569"
    : node.type === NodeType.TRIGGER
      ? "#a855f7"
      : node.type === NodeType.CONDITION
        ? "#3b82f6"
        : "#10b981";

  const conditionMode = node.data.mode || "SIMPLE";

  return (
    <div
      id={`node-${node.id}`}
      style={{ left: node.position.x, top: node.position.y }}
      className={`absolute w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all group ${
        dragging ? "z-50 scale-[1.02] border-white/20" : "z-10"
      } ${!node.enabled ? "opacity-70 grayscale-[0.3]" : ""}`}
      onMouseDown={onMouseDown}
    >
      {/* Header Container */}
      <div className="relative h-[68px] flex items-center justify-between px-4 border-b border-slate-800/50">
        <div className="absolute inset-y-0 -left-4 w-8 flex items-center justify-center pointer-events-none">
          <Socket
            id={`socket-left-${node.id}`}
            side="left"
            isDragging={isDraggingConnection}
            onMouseDown={(side, e) => onSocketMouseDown(node.id, side, e)}
            onMouseEnter={(side) => onSocketMouseEnter(node.id, side)}
            onMouseLeave={onSocketMouseLeave}
          />
        </div>
        <div className="absolute inset-y-0 -right-4 w-8 flex items-center justify-center pointer-events-none">
          <Socket
            id={`socket-right-${node.id}`}
            side="right"
            isDragging={isDraggingConnection}
            onMouseDown={(side, e) => onSocketMouseDown(node.id, side, e)}
            onMouseEnter={(side) => onSocketMouseEnter(node.id, side)}
            onMouseLeave={onSocketMouseLeave}
          />
        </div>

        <div className="flex items-center gap-3">
          <div
            className="size-8 rounded-lg flex items-center justify-center text-white shadow-lg transition-colors"
            style={{
              backgroundColor: accent,
              boxShadow: `0 4px 12px ${accent}40`,
            }}
          >
            <span className="material-symbols-outlined text-lg">
              {node.type === NodeType.TRIGGER
                ? "bolt"
                : node.type === NodeType.CONDITION
                  ? "call_split"
                  : "play_circle"}
            </span>
          </div>
          <div>
            <div
              className="font-bold text-[10px] uppercase tracking-wider leading-none mb-1 transition-colors"
              style={{ color: accent }}
            >
              {node.name}
            </div>
            <div className="text-[10px] text-slate-400 leading-none uppercase tracking-tight">
              {node.subtitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleEnabled(node.id)}
            className={`size-7 flex items-center justify-center rounded-md transition-all ${node.enabled ? "text-emerald-500 bg-emerald-500/10" : "text-slate-500 bg-slate-800"}`}
          >
            <span className="material-symbols-outlined text-base">
              {node.enabled ? "toggle_on" : "toggle_off"}
            </span>
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="size-7 flex items-center justify-center rounded-md text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
        {node.type === NodeType.TRIGGER && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500">
                  ID
                </label>
                <input
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 font-mono outline-none focus:ring-1 focus:ring-purple-500/50"
                  placeholder="metadata-id"
                  value={node.data.ruleId || ""}
                  onChange={(e) => updateField("ruleId", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500">
                  Priority
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none focus:ring-1 focus:ring-purple-500/50"
                  value={node.data.priority || 0}
                  onChange={(e) =>
                    updateField("priority", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500">
                Name
              </label>
              <input
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-purple-500/50 outline-none"
                placeholder="Detailed Rule Name"
                value={node.data.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500">
                Description
              </label>
              <textarea
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-purple-500/50 outline-none resize-none h-16"
                placeholder="What does this rule do?"
                value={node.data.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500">
                Event Type (ON)
              </label>
              <input
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono outline-none"
                placeholder="LOGIN_ATTEMPT"
                value={node.data.eventType || ""}
                onChange={(e) => updateField("eventType", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500">
                  Cooldown (ms)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none"
                  value={node.data.cooldown || 0}
                  onChange={(e) =>
                    updateField("cooldown", parseInt(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500">
                  Tags (csv)
                </label>
                <input
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none"
                  placeholder="tag1, tag2"
                  value={node.data.tags || ""}
                  onChange={(e) => updateField("tags", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {node.type === NodeType.CONDITION && (
          <div className="space-y-3">
            <div className="flex bg-slate-950/50 border border-slate-800 rounded-lg p-1">
              {["SIMPLE", "GROUP"].map((m) => (
                <button
                  key={m}
                  onClick={() => updateField("mode", m)}
                  className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-widest ${
                    conditionMode === m
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {conditionMode === "GROUP" && (
              <div className="flex bg-slate-950/50 border border-slate-800 rounded-lg p-1">
                {["AND", "OR"].map((logic) => (
                  <button
                    key={logic}
                    onClick={() => updateField("logic", logic)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                      node.data.logic === logic
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {logic}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => setShowConditionGallery(true)}
                className="w-full py-2 bg-blue-500/5 border border-dashed border-blue-500/20 rounded-lg text-[9px] text-blue-500/70 hover:text-blue-400 hover:border-blue-500/40 transition-all uppercase font-bold tracking-widest flex items-center justify-center gap-2 mb-2"
              >
                <span className="material-symbols-outlined text-sm">
                  auto_awesome
                </span>
                Condition Gallery
              </button>

              {conditionMode === "SIMPLE" ? (
                <div className="bg-slate-950/30 border border-slate-800 rounded-lg p-2 space-y-2 relative">
                  <input
                    className="w-full bg-transparent border-none p-0 text-[10px] text-slate-400 font-mono outline-none mb-1"
                    placeholder="field path (e.g. data.value)"
                    value={node.data.field || ""}
                    onChange={(e) => updateField("field", e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select
                      className="bg-slate-800 border-none text-[9px] text-slate-300 rounded px-1 py-0.5 outline-none font-mono"
                      value={node.data.operator || "EQ"}
                      onChange={(e) => updateField("operator", e.target.value)}
                    >
                      <option value="EQ">EQ</option>
                      <option value="==">==</option>
                      <option value="NEQ">NEQ</option>
                      <option value="GT">GT</option>
                      <option value="LT">LT</option>
                      <option value="CONTAINS">CONTAINS</option>
                      <option value="MATCHES">MATCHES</option>
                    </select>
                    <ValueInput
                      field={node.data.field || ""}
                      value={node.data.value}
                      onChange={(newValue) => updateField("value", newValue)}
                      placeholder="value"
                      disabled={!node.enabled}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {(node.data.conditions || []).map((cond: any, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-950/30 border border-slate-800 rounded-lg p-2 space-y-2 relative group/cond"
                    >
                      <button
                        onClick={() => removeCondition(i)}
                        className="absolute top-1 right-1 opacity-0 group-hover/cond:opacity-100 text-slate-600 hover:text-red-500 transition-all"
                      >
                        <span className="material-symbols-outlined text-xs">
                          close
                        </span>
                      </button>
                      <input
                        className="w-full bg-transparent border-none p-0 text-[10px] text-slate-400 font-mono outline-none mb-1"
                        placeholder="field"
                        value={cond.field}
                        onChange={(e) =>
                          updateCondition(i, "field", e.target.value)
                        }
                      />
                      <div className="flex gap-2">
                        <select
                          className="bg-slate-800 border-none text-[9px] text-slate-300 rounded px-1 py-0.5 outline-none font-mono"
                          value={cond.operator}
                          onChange={(e) =>
                            updateCondition(i, "operator", e.target.value)
                          }
                        >
                          <option value="EQ">EQ</option>
                          <option value="==">==</option>
                          <option value="NEQ">NEQ</option>
                          <option value="GT">GT</option>
                          <option value="LT">LT</option>
                          <option value="CONTAINS">CONTAINS</option>
                          <option value="MATCHES">MATCHES</option>
                        </select>
                        <ValueInput
                          field={cond.field}
                          value={cond.value}
                          onChange={(newValue) =>
                            updateCondition(i, "value", newValue)
                          }
                          placeholder="value"
                          disabled={!node.enabled}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addCondition}
                    className="w-full py-2 border border-dashed border-slate-800 rounded-lg text-[9px] text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-all uppercase font-bold tracking-widest"
                  >
                    + Add Sub-Condition
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {node.type === NodeType.ACTION && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Execution Mode
              </span>
              <select
                className="bg-slate-800 border-none text-[9px] text-slate-300 rounded px-2 py-0.5 outline-none font-mono"
                value={node.data.mode || "SINGLE"}
                onChange={(e) => updateField("mode", e.target.value)}
                disabled={!node.enabled}
              >
                <option value="SINGLE">SINGLE</option>
                <option value="SEQUENCE">SEQUENCE</option>
                <option value="ALL">ALL</option>
              </select>
            </div>

            <div className="space-y-3">
              {(node.data.actions || []).map((a: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setEditingActionIndex(i)}
                  className="relative group/action bg-slate-950/50 border border-slate-800 rounded-xl p-3 hover:border-emerald-500/40 hover:bg-slate-800/40 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="size-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">
                          play_arrow
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-100 uppercase truncate tracking-tight">
                        {a.type}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAction(i);
                      }}
                      className="opacity-0 group-hover/action:opacity-100 text-slate-600 hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-500/10"
                    >
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-500 mb-1.5 px-1 truncate font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">
                      info
                    </span>
                    {a.label || "Unlabeled Action"}
                  </div>
                  <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg p-2 text-[10px] text-slate-400 font-mono truncate line-clamp-1 opacity-60">
                    {a.details || "No parameters set."}
                  </div>

                  <div className="absolute inset-0 bg-emerald-500/0 group-hover/action:bg-emerald-500/[0.02] rounded-xl transition-colors pointer-events-none" />
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGallery(true)}
                  className="flex-1 py-2.5 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-xl text-[9px] text-emerald-500/70 hover:text-emerald-400 hover:border-emerald-500/40 transition-all uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    auto_awesome_motion
                  </span>{" "}
                  Gallery
                </button>
                <button
                  onClick={() => addAction()}
                  className="px-4 py-2.5 border border-dashed border-slate-800 rounded-xl text-[9px] text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-all uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    add
                  </span>{" "}
                  Manual
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-950/80 p-2.5 flex items-center justify-between text-[9px] text-slate-600 font-mono border-t border-slate-800/50">
        <span>UID: {node.id.split("-").pop()}</span>
      </div>

      {showGallery && (
        <ActionGalleryModal
          onClose={() => setShowGallery(false)}
          onSelect={(template) => addAction(template)}
        />
      )}

      {editingActionIndex !== null && (
        <ActionEditModal
          action={node.data.actions[editingActionIndex]}
          onClose={() => setEditingActionIndex(null)}
          onSave={(updated) => handleUpdateAction(editingActionIndex, updated)}
        />
      )}

      {showConditionGallery && (
        <ConditionGalleryModal
          onClose={() => setShowConditionGallery(false)}
          onSelect={applyConditionTemplate}
        />
      )}
    </div>
  );
};

export default Node;
