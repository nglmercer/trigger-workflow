import React, { useState, useRef } from "react";
import { LogEntry } from "../types";

interface DebuggerProps {
  logs: LogEntry[];
  onClose?: () => void;
  onClear?: () => void;
  onTogglePause?: () => void;
  isPaused?: boolean;
}

const Debugger: React.FC<DebuggerProps> = ({
  logs,
  onClose,
  onClear,
  onTogglePause,
  isPaused = false,
}) => {
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Filter logs based on level and search query
  const filteredLogs = logs.filter((log) => {
    // Filter by level
    if (filter !== "ALL" && log.level !== filter) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const message = log.message.toLowerCase();
      const details = log.details
        ? JSON.stringify(log.details).toLowerCase()
        : "";

      return (
        message.includes(query) ||
        log.level.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query) ||
        details.includes(query)
      );
    }

    return true;
  });

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (autoScroll && logContainerRef.current && filteredLogs.length > 0) {
      const container = logContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs.length, autoScroll, filteredLogs.length]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 shadow-2xl relative">
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">
            bug_report
          </span>
          <span className="font-bold text-sm text-slate-200">
            Execution Debugger
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isPaused ? "bg-amber-500" : "bg-green-500 animate-pulse"
              }`}
            ></span>
            <span className="text-[10px] uppercase font-bold text-slate-500">
              {isPaused ? "Paused" : "Live"}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-2 py-2 border-b border-slate-800 flex gap-2 bg-slate-900/50">
        <button
          onClick={onTogglePause}
          className={`flex-1 ${
            isPaused
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          } text-[10px] py-1.5 rounded transition-colors flex items-center justify-center gap-1 font-semibold uppercase tracking-wider`}
        >
          <span className="material-symbols-outlined text-base">
            {isPaused ? "play_arrow" : "pause"}
          </span>
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={onClear}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 text-[10px] py-1.5 rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 font-semibold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-base">delete</span>{" "}
          Clear
        </button>
      </div>

      <div className="px-2 py-2 border-b border-slate-800 flex gap-2 bg-slate-900/30">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
        >
          <option value="ALL">All Logs</option>
          <option value="TRIGGER">Triggers</option>
          <option value="CONDITION">Conditions</option>
          <option value="ACTION">Actions</option>
          <option value="ERROR">Errors</option>
          <option value="SUCCESS">Success</option>
        </select>

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Filter logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded outline-none focus:ring-1 focus:ring-blue-500/50 pl-8 font-mono placeholder-slate-600"
          />
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-sm">
            search
          </span>
        </div>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 text-[10px] font-semibold ${
            autoScroll
              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
              : "bg-slate-800 text-slate-500 border-slate-700"
          }`}
          title="Auto-scroll to bottom"
        >
          <span className="material-symbols-outlined text-base">
            arrow_downward
          </span>
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar bg-slate-950/50"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-40">
            <span className="material-symbols-outlined text-4xl">terminal</span>
            <span className="uppercase text-[10px] tracking-widest font-bold">
              {logs.length === 0 ? "Waiting for events..." : "No matching logs"}
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`relative pl-4 border-l-2 transition-colors ${
                log.level === "TRIGGER"
                  ? "border-trigger"
                  : log.level === "CONDITION"
                    ? "border-condition"
                    : log.level === "ACTION"
                      ? "border-emerald-500 border-dashed"
                      : "border-slate-800"
              } group`}
            >
              <div
                className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                  log.level === "TRIGGER"
                    ? "bg-trigger shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    : log.level === "CONDITION"
                      ? "bg-condition shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      : log.level === "ACTION"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-slate-600"
                }`}
              ></div>

              <div className="text-slate-500 text-[10px] mb-1">
                {log.timestamp}{" "}
                <span
                  className={`ml-2 font-bold ${
                    log.level === "TRIGGER"
                      ? "text-trigger"
                      : log.level === "CONDITION"
                        ? "text-blue-400"
                        : log.level === "ACTION"
                          ? "text-emerald-400"
                          : "text-slate-600"
                  }`}
                >
                  {log.level}
                </span>
              </div>

              <div className="bg-slate-900 rounded p-2.5 border border-slate-800/50 space-y-1.5 hover:border-slate-700 transition-colors">
                <div className="text-slate-300 font-medium">{log.message}</div>
                {log.details && (
                  <div className="text-[10px] leading-4 text-slate-500 overflow-hidden">
                    <pre className="mt-1 font-mono text-slate-500 bg-slate-950/50 p-2 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-4 text-slate-500">
            <span className="font-mono">
              {filteredLogs.length} / {logs.length} logs
            </span>
            {isPaused && (
              <span className="text-amber-500 font-semibold uppercase tracking-wider">
                ⏸ Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {filter !== "ALL" && (
              <button
                onClick={() => setFilter("ALL")}
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Clear filter
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">clear</span>
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debugger;
