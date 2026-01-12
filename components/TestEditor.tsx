import React, { useState } from "react";
import yaml from "js-yaml";
import { TestEvent } from "../types";

interface TestEditorProps {
  onRunTest: (test: TestEvent) => void;
  onClose: () => void;
}

const DEFAULT_TEST: TestEvent = {
  type: "tiktok.gift_received",
  data: {
    gift: {
      id: 16,
      name: "Galaxy",
      displayName: "🌌 Galaxy",
      coins: 500,
      type: "gift",
      repeatCount: 1,
    },
    user: {
      username: "test_viewer",
      userId: "123456789",
      displayId: "user123",
    },
    coins: 500,
    totalCoins: 500,
    giftId: 16,
    repeatCount: 1,
    groupId: 0,
  },
  globals: {
    streamTitle: "My Awesome Stream",
    viewerCount: 150,
    currency: "USDT",
  },
};

const TestEditor: React.FC<TestEditorProps> = ({ onRunTest, onClose }) => {
  const [content, setContent] = useState(yaml.dump(DEFAULT_TEST));
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    try {
      const parsed = yaml.load(content) as TestEvent;
      if (!parsed.type) throw new Error("Event type is required");
      setError(null);
      onRunTest(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 ring-1 ring-white/5 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-sm">
            science
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">
            YAML Test Engine
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
            Event Payload (YAML)
          </label>
          <textarea
            className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 focus:ring-1 focus:ring-primary/50 outline-none resize-none custom-scrollbar"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="Enter YAML event data..."
          />
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Quick Templates
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                setContent(
                  yaml.dump({
                    type: "tiktok.gift_received",
                    data: {
                      gift: {
                        id: 16,
                        name: "Galaxy",
                        coins: 500,
                        type: "gift",
                      },
                      user: { username: "test_user", userId: "123" },
                      coins: 500,
                    },
                  }),
                )
              }
              className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] text-purple-400 hover:bg-purple-500/20 transition-colors text-left"
            >
              🌌 Galaxy (500 coins)
            </button>
            <button
              onClick={() =>
                setContent(
                  yaml.dump({
                    type: "tiktok.gift_received",
                    data: {
                      gift: { id: 1, name: "Rose", coins: 1, type: "gift" },
                      user: { username: "test_user", userId: "123" },
                      coins: 1,
                    },
                  }),
                )
              }
              className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-[10px] text-pink-400 hover:bg-pink-500/20 transition-colors text-left"
            >
              🌹 Rose (1 coin)
            </button>
            <button
              onClick={() =>
                setContent(
                  yaml.dump({
                    type: "tiktok.gift_received",
                    data: {
                      gift: {
                        id: 20,
                        name: "TikTok Universe",
                        coins: 34999,
                        type: "gift",
                      },
                      user: { username: "test_user", userId: "123" },
                      coins: 34999,
                    },
                  }),
                )
              }
              className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 hover:bg-amber-500/20 transition-colors text-left"
            >
              🌟 Universe (34999 coins)
            </button>
            <button
              onClick={() =>
                setContent(
                  yaml.dump({
                    type: "tiktok.gift_received",
                    data: {
                      gift: {
                        id: 18,
                        name: "Train",
                        coins: 2888,
                        type: "gift",
                      },
                      user: { username: "vip_user", userId: "456" },
                      coins: 2888,
                    },
                  }),
                )
              }
              className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors text-left"
            >
              🚂 Train (2888 coins)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono">
            Error: {error}
          </div>
        )}

        <button
          onClick={handleRun}
          className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 uppercase text-[10px] tracking-widest"
        >
          <span className="material-symbols-outlined text-base">
            play_arrow
          </span>
          Interpret & Execute
        </button>
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-800">
        <p className="text-[9px] text-slate-500 leading-relaxed">
          Tip: Use quick templates to test different gift scenarios. The event
          should match your trigger's event type (e.g.,{" "}
          <span className="text-purple-400 font-mono">
            tiktok.gift_received
          </span>
          ).
        </p>
      </div>
    </div>
  );
};

export default TestEditor;
