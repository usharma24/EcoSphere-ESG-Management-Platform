import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Zap, Award, Crown, CheckCircle2, Plus, X } from "lucide-react";

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
  Easy: "bg-[#E8F5E9] text-[#1B5E20]",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-600",
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
      setMessage("Joined the challenge!");
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't join this challenge.");
    }
  };

  const handleComplete = async (id: number) => {
    setMessage(null);
    try {
      const res = await apiClient.post(`/api/gamification/challenges/${id}/complete`);
      setMessage(`Challenge completed! +${res.data.xp_earned} XP`);
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Challenges & Rewards</h1>
          <p className="text-sm text-slate-500">Earn XP, climb the leaderboard, and unlock badges. You have {user?.xp} XP.</p>
        </div>
        {isAdmin && tab === "challenges" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
          >
            <Plus size={16} /> New Challenge
          </button>
        )}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3 text-sm text-[#1B5E20]">{message}</div>}

      <div className="flex gap-2 border-b border-slate-100">
        {[
          { key: "challenges", label: "Challenges", icon: <Zap size={15} /> },
          { key: "leaderboard", label: "Leaderboard", icon: <Crown size={15} /> },
          { key: "badges", label: "Badges", icon: <Award size={15} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "border-[#2E7D32] text-[#2E7D32]" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "challenges" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-slate-200 py-12 text-center text-slate-400">
              No challenges yet.
            </div>
          )}
          {challenges.map((c) => {
            const mine = myChallengeMap.get(c.id);
            return (
              <div key={c.id} className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_COLORS[c.difficulty] || "bg-slate-100 text-slate-600"}`}>
                    {c.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Zap size={13} /> {c.xp_reward} XP
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-800">{c.title}</h3>
                {c.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{c.description}</p>}
                <div className="mt-4">
                  {!mine && (
                    <button onClick={() => handleJoin(c.id)} className="w-full rounded-md bg-[#2E7D32] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1B5E20]">
                      Join Challenge
                    </button>
                  )}
                  {mine && mine.status !== "Completed" && (
                    <button onClick={() => handleComplete(c.id)} className="w-full rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600">
                      Mark Complete
                    </button>
                  )}
                  {mine && mine.status === "Completed" && (
                    <div className="flex items-center justify-center gap-1.5 rounded-md bg-[#E8F5E9] px-3 py-2 text-xs font-semibold text-[#1B5E20]">
                      <CheckCircle2 size={14} /> Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((entry) => (
                <tr key={entry.id} className={entry.full_name === user?.full_name ? "bg-[#E8F5E9]" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {entry.rank <= 3 ? <Crown size={15} className="inline text-amber-500 mr-1" /> : null}#{entry.rank}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{entry.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.role}</td>
                  <td className="px-4 py-3 font-semibold text-[#2E7D32]">{entry.xp} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "badges" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {badges.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-slate-200 py-12 text-center text-slate-400">
              No badges configured yet.
            </div>
          )}
          {badges.map((b) => {
            const earned = earnedBadgeIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`rounded-lg border p-5 text-center shadow-soft ${
                  earned ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-white opacity-60"
                }`}
              >
                <div className="text-3xl">{b.icon || "🏅"}</div>
                <h3 className="mt-2 text-sm font-semibold text-slate-800">{b.title}</h3>
                {b.description && <p className="mt-1 text-xs text-slate-500">{b.description}</p>}
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                  {earned ? "Unlocked" : `Needs ${b.rule_value} ${b.rule_metric}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">New Challenge</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">XP reward</label>
                  <input
                    type="number"
                    min={1}
                    value={form.xp_reward}
                    onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  >
                    {["Easy", "Medium", "Hard"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:opacity-60 transition-colors"
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
