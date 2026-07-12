import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Zap, Award, Crown, CheckCircle2, Plus, X, Sparkles } from "lucide-react";

interface Challenge {
  id: number;
  title: string;
  description: string | null;
  xp_reward: number;
  category: string;
  difficulty: string;
  is_active: boolean;
}

interface UserChallenge {
  id: number;
  challenge_id: number;
  status: string;
  challenge: Challenge | null;
}

interface LeaderboardEntry {
  rank: number;
  id: number;
  full_name: string;
  xp: number;
  role: string;
}

interface Badge {
  id: number;
  title: string;
  description: string | null;
  icon: string;
  rule_metric: string;
  rule_value: number;
}

interface UserBadge {
  id: number;
  badge_id: number;
  badge: Badge | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700 border border-emerald-100/50",
  Medium: "bg-amber-50 text-amber-700 border border-amber-100/50",
  Hard: "bg-rose-50 text-rose-700 border border-rose-100/50",
};

const emptyForm = { title: "", description: "", xp_reward: 50, category: "general", difficulty: "Easy" };

const Gamification: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin" || user?.role === "ESG Manager";
  const [tab, setTab] = useState<"challenges" | "leaderboard" | "badges">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [chRes, myChRes, lbRes, bRes, myBRes] = await Promise.all([
        apiClient.get("/api/gamification/challenges"),
        apiClient.get("/api/gamification/my-challenges"),
        apiClient.get("/api/gamification/leaderboard"),
        apiClient.get("/api/gamification/badges"),
        apiClient.get("/api/gamification/my-badges"),
      ]);
      setChallenges(chRes.data);
      setMyChallenges(myChRes.data);
      setLeaderboard(lbRes.data);
      setBadges(bRes.data);
      setMyBadges(myBRes.data);
    } catch {
      setError("Couldn't load gamification data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const myChallengeMap = new Map(myChallenges.map((mc) => [mc.challenge_id, mc]));

  const handleJoin = async (id: number) => {
    setMessage(null);
    try {
      await apiClient.post(`/api/gamification/challenges/${id}/join`);
      setMessage("Joined the challenge successfully!");
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't join this challenge.");
    }
  };

  const handleComplete = async (id: number) => {
    setMessage(null);
    try {
      const res = await apiClient.post(`/api/gamification/challenges/${id}/complete`);
      setMessage(`Challenge completed successfully! +${res.data.xp_earned} XP`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't complete this challenge.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/api/gamification/challenges", { ...form, xp_reward: Number(form.xp_reward) });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't create challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  const earnedBadgeIds = new Set(myBadges.map((b) => b.badge_id));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
          <div className="shimmer-skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="shimmer-skeleton h-10 w-96 rounded-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-44 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Eco-Challenges & Achievements</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            Earn experience points (XP) to climb ranks, unlock premium badges and claim carbon reward points.
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-100/50 text-emerald-700 shadow-sm ml-2">
              <Zap size={11} className="text-amber-500 fill-amber-500 animate-pulse" /> {user?.xp} XP Accumulated
            </span>
          </p>
        </div>
        {isAdmin && tab === "challenges" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus size={16} /> New Challenge
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold shadow-sm">{message}</div>
      )}

      {/* Tabs list bar */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {[
          { key: "challenges", label: "Challenges", icon: <Zap size={15} /> },
          { key: "leaderboard", label: "Leaderboard", icon: <Crown size={15} /> },
          { key: "badges", label: "Badges Registry", icon: <Award size={15} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer ${
              tab === t.key
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content view: Challenges */}
      {tab === "challenges" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {challenges.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200">
              <Zap className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
              <p className="text-sm text-slate-400">No active challenges available at the moment.</p>
            </div>
          ) : (
            challenges.map((c) => {
              const mine = myChallengeMap.get(c.id);
              return (
                <div key={c.id} className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <div>
                    <div className="flex items-start justify-between">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${DIFFICULTY_COLORS[c.difficulty] || "bg-slate-100 text-slate-600"}`}>
                        {c.difficulty}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                        <Zap size={14} className="fill-amber-500" /> {c.xp_reward} XP
                      </span>
                    </div>
                    
                    <h3 className="mt-4 font-bold text-slate-800 text-base leading-snug">{c.title}</h3>
                    {c.description && (
                      <p className="mt-2 text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">{c.description}</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50">
                    {!mine && (
                      <button
                        onClick={() => handleJoin(c.id)}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        Join Challenge
                      </button>
                    )}
                    {mine && mine.status !== "Completed" && (
                      <button
                        onClick={() => handleComplete(c.id)}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                      >
                        Mark Complete
                      </button>
                    )}
                    {mine && mine.status === "Completed" && (
                      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100/50 py-2.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={15} /> Completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab content view: Leaderboard */}
      {tab === "leaderboard" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company-wide ESG Leaderboard</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Updated hourly
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Department Role</th>
                  <th className="px-6 py-3.5 text-right">XP Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.map((entry) => {
                  const isMe = entry.full_name === user?.full_name;
                  let rankDecorator = null;
                  if (entry.rank === 1) rankDecorator = <Crown size={14} className="inline text-yellow-500 fill-yellow-500 mr-1 animate-bounce" />;
                  else if (entry.rank === 2) rankDecorator = <Crown size={14} className="inline text-slate-400 fill-slate-300 mr-1" />;
                  else if (entry.rank === 3) rankDecorator = <Crown size={14} className="inline text-amber-600 fill-amber-700 mr-1" />;

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isMe
                          ? "bg-emerald-50/60 border-l-4 border-emerald-500 font-bold hover:bg-emerald-50"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {rankDecorator}
                        <span>#{entry.rank}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{entry.full_name}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{entry.role}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 text-right">{entry.xp} XP</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content view: Badges */}
      {tab === "badges" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {badges.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200">
              <Award className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No achievements configured yet.</p>
            </div>
          ) : (
            badges.map((b) => {
              const earned = earnedBadgeIds.has(b.id);
              return (
                <div
                  key={b.id}
                  className={`glass-card p-6 text-center rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] border ${
                    earned
                      ? "border-amber-300/40 bg-amber-50/40 ring-1 ring-amber-400/10 shadow-soft"
                      : "opacity-60 border-slate-100 bg-white"
                  }`}
                >
                  {earned && (
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-bl-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white font-bold text-[9px] shadow-sm">
                      ✔
                    </div>
                  )}
                  <div className="text-4xl filter drop-shadow-md select-none">{b.icon || "🏅"}</div>
                  <h3 className="mt-3 font-bold text-slate-800 text-sm">{b.title}</h3>
                  {b.description && <p className="mt-1 text-xs font-semibold text-slate-400 leading-snug line-clamp-2">{b.description}</p>}
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {earned ? "Unlocked" : `Required: ${b.rule_value} ${b.rule_metric}`}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500 animate-spin" /> Launch ESG Challenge
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Challenge Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Bring your own reusable mug"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Goals and instructions for complete verification."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">XP Reward</label>
                  <input
                    type="number"
                    min={1}
                    value={form.xp_reward}
                    onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium bg-white"
                  >
                    {["Easy", "Medium", "Hard"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                {submitting ? "Saving..." : "Create Challenge"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gamification;
