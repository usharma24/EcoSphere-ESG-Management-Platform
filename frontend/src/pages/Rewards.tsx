import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Gift, Zap, Plus, X, Package } from "lucide-react";

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
      setMessage(`Redeemed "${reward.name}"!`);
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rewards Catalog</h1>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Zap size={14} className="text-amber-500" /> You have <span className="font-semibold text-slate-700">{currentXp} XP</span> to spend
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] transition-colors"
          >
            <Plus size={16} /> Add Reward
          </button>
        )}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3 text-sm text-[#1B5E20]">{message}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-slate-200 py-12 text-center text-slate-400">
            No rewards available yet.
          </div>
        )}
        {rewards.map((r) => {
          const canAfford = currentXp >= r.cost_points && r.stock > 0;
          return (
            <div key={r.id} className="rounded-lg border border-slate-100 bg-white p-5 shadow-soft">
              <div className="flex h-32 items-center justify-center rounded-md bg-slate-50">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.name} className="h-full w-full rounded-md object-cover" />
                ) : (
                  <Gift size={32} className="text-slate-300" />
                )}
              </div>
              <h3 className="mt-3 font-semibold text-slate-800">{r.name}</h3>
              {r.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{r.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Zap size={13} /> {r.cost_points} XP
                </span>
                <span className="flex items-center gap-1">
                  <Package size={13} /> {r.stock} in stock
                </span>
              </div>
              <button
                onClick={() => handleRedeem(r)}
                disabled={!canAfford}
                className="mt-4 w-full rounded-md bg-[#2E7D32] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1B5E20] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {r.stock <= 0 ? "Out of Stock" : currentXp < r.cost_points ? "Not Enough XP" : "Redeem"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-100 bg-white shadow-soft">
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">My Redemptions</h2>
        {redemptions.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-400">No redemptions yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {redemptions.map((red) => (
                <tr key={red.id}>
                  <td className="px-5 py-3 text-slate-600">Reward #{red.reward_id}</td>
                  <td className="px-5 py-3 font-semibold text-amber-600">-{red.points_spent} XP</td>
                  <td className="px-5 py-3 text-slate-400">{new Date(red.redeemed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Add Reward</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  <label className="mb-1 block text-xs font-medium text-slate-600">Cost (XP)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.cost_points}
                    onChange={(e) => setForm({ ...form, cost_points: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B5E20] disabled:opacity-60 transition-colors"
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
