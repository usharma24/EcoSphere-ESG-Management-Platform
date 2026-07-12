import React, { useEffect, useRef, useState } from "react";
import apiClient from "../api/client";
import { Sparkles, Send, Leaf, Users, Scale, Bot, User, Loader2 } from "lucide-react";

interface AiEntry {
  prompt: string;
  response: string;
  created_at: string;
}

const SUGGESTIONS = [
  { label: "Reduce Carbon Footprint", icon: <Leaf size={13} className="text-emerald-500" />, prompt: "How can we reduce our carbon emissions this quarter?" },
  { label: "Improve DEI Metrics", icon: <Users size={13} className="text-sky-500" />, prompt: "What are best practices to improve our DEI programs?" },
  { label: "Governance Posture", icon: <Scale size={13} className="text-amber-500" />, prompt: "How do we strengthen our governance and compliance posture?" },
];

const AiAdvisor: React.FC = () => {
  const [history, setHistory] = useState<AiEntry[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await apiClient.get("/api/ai/history");
      setHistory([...res.data].reverse());
    } catch {
      setError("Couldn't load your conversation history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sending]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    setPrompt("");
    try {
      const res = await apiClient.post("/api/ai/ask", { prompt: text });
      setHistory((h) => [...h, res.data]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "The advisor couldn't respond. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(prompt);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
        </div>
        <div className="shimmer-skeleton h-[calc(100vh-12rem)] rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      {/* Title */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight">
          <Sparkles className="text-emerald-500 fill-emerald-500/20 animate-pulse" size={24} /> AI ESG Advisor
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Receive data-driven sustainability advice and policy guidance in real time.</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-6 shadow-soft flex flex-col justify-between">
        {history.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100/50 mb-4 shadow-sm shadow-emerald-500/10">
              <Bot size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">Your Sustainability Consultant</h4>
            <p className="mt-2 text-sm text-slate-400 max-w-sm font-medium">
              Ask about corporate carbon reduction, DEI initiatives, policies alignment, or choose a topic:
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/40 hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
                >
                  {s.icon} <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message logs */}
        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {history.map((entry, idx) => (
            <div key={idx} className="space-y-4">
              {/* User prompt row */}
              <div className="flex justify-end items-start gap-2.5">
                <div className="max-w-[75%] rounded-2xl rounded-tr-none bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm leading-relaxed">
                  {entry.prompt}
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-350 border border-slate-700 shadow-sm">
                  <User size={14} className="text-slate-300" />
                </div>
              </div>
              {/* Bot response row */}
              <div className="flex justify-start items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/10">
                  <Bot size={14} />
                </div>
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-none bg-emerald-50/50 border border-emerald-100/50 px-5 py-3 text-sm font-medium text-slate-800 shadow-sm leading-relaxed">
                  {entry.response}
                </div>
              </div>
            </div>
          ))}
          
          {sending && (
            <div className="flex justify-start items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md">
                <Bot size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-emerald-55/10 border border-emerald-100/30 px-5 py-3 text-xs font-bold text-slate-400 flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-emerald-500" />
                <span>EcoSphere Advisor is compiling response...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a sustainability question..."
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-450 bg-white"
        />
        <button
          type="submit"
          disabled={sending || !prompt.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3.5 text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AiAdvisor;
