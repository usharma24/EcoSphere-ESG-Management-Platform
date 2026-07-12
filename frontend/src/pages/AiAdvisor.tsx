import React, { useEffect, useRef, useState } from "react";
import apiClient from "../api/client";
import { Sparkles, Send, Leaf, Users, Scale } from "lucide-react";

interface AiEntry {
  prompt: string;
  response: string;
  created_at: string;
}

const SUGGESTIONS = [
  { label: "Reduce carbon emissions", icon: <Leaf size={14} />, prompt: "How can we reduce our carbon emissions this quarter?" },
  { label: "Improve DEI programs", icon: <Users size={14} />, prompt: "What are best practices to improve our DEI programs?" },
  { label: "Governance compliance", icon: <Scale size={14} />, prompt: "How do we strengthen our governance and compliance posture?" },
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <Sparkles className="text-[#2E7D32]" size={22} /> AI ESG Advisor
        </h1>
        <p className="text-sm text-slate-500">Ask for data-driven sustainability recommendations.</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
        {history.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles size={32} className="text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Ask the AI advisor about carbon, social impact, or governance.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#2E7D32] hover:text-[#2E7D32] transition-colors"
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {history.map((entry, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-lg rounded-tr-none bg-[#2E7D32] px-4 py-2.5 text-sm text-white">
                  {entry.prompt}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-lg rounded-tl-none bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                  {entry.response}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg rounded-tl-none bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
                Thinking...
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about carbon reduction, DEI, or governance..."
          className="flex-1 rounded-md border border-slate-200 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !prompt.trim()}
          className="flex items-center gap-2 rounded-md bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:opacity-60 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AiAdvisor;
