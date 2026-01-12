import React from "react";

interface HUDProps {
  nodeCount: number;
  onAddNode: () => void;
  onDeploy: () => void;
  isDeploying: boolean;
}

export const TopHUD: React.FC<{ nodeCount: number }> = ({ nodeCount }) => (
  <div className="fixed top-6 left-6 flex items-center gap-4 z-40">
    <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl p-3 rounded-2xl flex items-center gap-4 ring-1 ring-white/5">
      <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
        <span className="material-symbols-outlined text-xl">account_tree</span>
      </div>
      <div>
        <h1 className="text-sm font-bold leading-none mb-1 text-slate-100">
          Agnostic Trigger
        </h1>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
          <span className="text-[9px] font-mono text-emerald-400 tracking-[0.1em] uppercase font-bold">
            Engine Connected
          </span>
        </div>
      </div>
    </div>

    <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl px-5 py-2.5 rounded-2xl flex items-center gap-6 ring-1 ring-white/5">
      <div className="text-center">
        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em]">
          Workflow Nodes
        </div>
        <div className="text-xs font-mono font-bold text-slate-100">
          {nodeCount}
        </div>
      </div>
      <div className="w-px h-6 bg-slate-700/50"></div>
      <div className="text-center">
        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em]">
          Latency
        </div>
        <div className="text-xs font-mono font-bold text-emerald-500 italic tracking-tight">
          12ms
        </div>
      </div>
    </div>
  </div>
);

export const RightHUD: React.FC<{
  onDeploy: () => void;
  isDeploying: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}> = ({ onDeploy, isDeploying, onZoomIn, onZoomOut, zoom }) => (
  <div className="fixed top-6 right-6 flex items-center gap-3 z-40 transition-all">
    <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl p-1.5 rounded-2xl flex items-center gap-1 ring-1 ring-white/5">
      <button
        onClick={onZoomIn}
        className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
        title="Zoom In"
      >
        <span className="material-symbols-outlined">zoom_in</span>
      </button>
      <div className="text-[10px] font-mono font-bold text-slate-400 w-10 text-center">
        {Math.round(zoom * 100)}%
      </div>
      <button
        onClick={onZoomOut}
        className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined">zoom_out</span>
      </button>
    </div>
    <button
      onClick={onDeploy}
      disabled={isDeploying}
      className={`${isDeploying ? "bg-slate-700" : "bg-primary hover:bg-blue-600"} transition-all text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xl shadow-primary/20 disabled:cursor-not-allowed ring-1 ring-white/10`}
    >
      <span
        className={`material-symbols-outlined text-lg ${isDeploying ? "animate-spin" : ""}`}
      >
        {isDeploying ? "progress_activity" : "rocket_launch"}
      </span>
      <span className="uppercase tracking-widest">
        {isDeploying ? "Simulating..." : "Run Simulation"}
      </span>
    </button>
  </div>
);

export const BottomLeftHUD: React.FC<{ onAddNode: () => void }> = ({
  onAddNode,
}) => (
  <div className="flex flex-col gap-3">
    <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl p-2 rounded-2xl space-y-2 ring-1 ring-white/5">
      <button
        onClick={onAddNode}
        className="size-11 flex items-center justify-center rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all group relative"
      >
        <span className="material-symbols-outlined">add</span>
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-all shadow-lg whitespace-nowrap pointer-events-none uppercase font-bold tracking-widest">
          Add Node
        </span>
      </button>
      <button className="size-11 flex items-center justify-center rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all">
        <span className="material-symbols-outlined">category</span>
      </button>
    </div>
    <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl p-2 rounded-2xl ring-1 ring-white/5">
      <button className="size-11 flex items-center justify-center rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white transition-all">
        <span className="material-symbols-outlined">help</span>
      </button>
    </div>
  </div>
);
