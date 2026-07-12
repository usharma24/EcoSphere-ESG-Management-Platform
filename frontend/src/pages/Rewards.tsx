import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Gift, Zap, Plus, X, Package, Sparkles } from "lucide-react";

interface Reward {
  id: number;
  name: string;
  description: string | null;
  cost_points: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
}

interface Redemption {
  id: number;
  reward_id: number;
  points_spent: number;
  redeemed_at: string;
}

const emptyForm = { name: "", description: "", cost_points: 100, stock: 10, image_url: "" };

const Rewards: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin" || user?.role === "ESG Manager";
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [currentXp, setCurrentXp] = useState(user?.xp ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, redRes] = await Promise.all([
        apiClient.get("/api/rewards/"),
        apiClient.get("/api/rewards/my-redemptions"),
      ]);
      setRewards(rRes.data);
      setRedemptions(redRes.data);
    } catch {
      setError("Couldn't load rewards catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRedeem = async (reward: Reward) => {
    setMessage(null);
    setError(null);
    try {
      const res = await apiClient.post(`/api/rewards/${reward.id}/redeem`);
      setMessage(`Redeemed "${reward.name}" successfully!`);
      setCurrentXp(res.data.remaining_xp);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't redeem this reward.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/api/rewards/", {
        ...form,
        cost_points: Number(form.cost_points),
        stock: Number(form.stock),
      });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Couldn't add reward.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="shimmer-skeleton h-10 w-48 rounded-xl" />
          <div className="shimmer-skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="shimmer-skeleton h-56 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Find reward name helper
  const getRewardName = (id: number) => {
    const match = rewards.find(r => r.id === id);
    return match ? match.name : `Reward Entry #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sustainability Rewards Marketplace</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            Redeem rewards using your earned XP points.
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-100/50 text-amber-700 shadow-sm ml-2">
              <Zap size={11} className="text-amber-500 fill-amber-500" /> {currentXp} XP Available
            </span>
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus size={16} /> Add Reward
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-750 font-semibold shadow-sm">{message}</div>
      )}

      {/* Grid of Catalog */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rewards.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200">
            <Gift className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No rewards available in the catalog yet.</p>
          </div>
        ) : (
          rewards.map((r) => {
            const canAfford = currentXp >= r.cost_points && r.stock > 0;
            return (
              <div key={r.id} className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <div>
                  <div className="flex h-36 items-center justify-center rounded-xl bg-slate-50 border border-slate-100/50 overflow-hidden relative">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <Gift size={28} className="text-slate-300" />
                    )}
                  </div>
                  
                  <h3 className="mt-4 font-bold text-slate-800 text-base leading-snug">{r.name}</h3>
                  {r.description && (
                    <p className="mt-2 text-xs font-semibold text-slate-400 line-clamp-2 leading-relaxed">{r.description}</p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="flex items-center gap-1.5 font-bold text-amber-600">
                      <Zap size={14} className="fill-amber-500" /> {r.cost_points} XP
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                      <Package size={14} className="text-slate-400" /> {r.stock} in stock
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={!canAfford}
                    className={`w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-md ${
                      canAfford
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/10"
                        : "bg-slate-100 text-slate-400 border border-slate-200/50 shadow-none cursor-not-allowed"
                    }`}
                  >
                    {r.stock <= 0 ? "Out of Stock" : currentXp < r.cost_points ? "Not Enough XP" : "Redeem"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Redemptions Log */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Redemption Log</h3>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-full">
            {redemptions.length} claimed
          </span>
        </div>

        {redemptions.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">No redemptions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Redeemed Item</th>
                  <th className="px-6 py-3">XP Spent</th>
                  <th className="px-6 py-3">Redemption Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {redemptions.map((red) => (
                  <tr key={red.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{getRewardName(red.reward_id)}</td>
                    <td className="px-6 py-3.5 font-bold text-amber-600">-{red.points_spent} XP</td>
                    <td className="px-6 py-3.5 text-slate-400 font-semibold">{new Date(red.redeemed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500 animate-spin" /> Add Reward Item
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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Reward Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tree Planting Certificate"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Explain what the reward is and how it gets delivered."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Cost (XP)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.cost_points}
                    onChange={(e) => setForm({ ...form, cost_points: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all outline-none font-medium text-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                {submitting ? "Saving..." : "Add Reward"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
