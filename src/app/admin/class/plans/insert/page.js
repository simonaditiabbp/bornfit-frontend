"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPlanInsertPage() {
  const [form, setForm] = useState({
    name: "",
    access_type: "Regular",
    max_visitor: 0,
    minutes_per_session: 0,
    description: "",
    unlimited_monthly_session: true,
    monthly_limit: 0,
    unlimited_daily_session: true,
    daily_limit: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "unlimited_monthly_session") {
      setForm(f => ({
        ...f,
        unlimited_monthly_session: checked,
        monthly_limit: checked ? 999999 : f.monthly_limit
      }));
    } else if (name === "unlimited_daily_session") {
      setForm(f => ({
        ...f,
        unlimited_daily_session: checked,
        daily_limit: checked ? 999999 : f.daily_limit
      }));
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const payload = {
        name: form.name,
        access_type: form.access_type,
        max_visitor: parseInt(form.max_visitor, 10),
        minutes_per_session: parseInt(form.minutes_per_session, 10),
        description: form.description,
        unlimited_monthly_session: form.unlimited_monthly_session,
        monthly_limit: form.unlimited_monthly_session ? 999999 : parseInt(form.monthly_limit, 10),
        unlimited_daily_session: form.unlimited_daily_session,
        daily_limit: form.unlimited_daily_session ? 999999 : parseInt(form.daily_limit, 10),
        is_active: form.is_active
      };
      await fetch(`${API_URL}/api/eventplans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      router.push("/admin/class/plans");
    } catch (err) {
      setError("Gagal menyimpan plan");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Add Class Plan</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input name="name" type="text" value={form.name} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Access Type</label>
          <select name="access_type" value={form.access_type} onChange={handleChange} className="w-full border px-2 py-1 rounded">
            <option value="Regular">Regular</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Max Visitor</label>
          <input name="max_visitor" type="number" value={form.max_visitor} onChange={handleChange} className="w-full border px-2 py-1 rounded" min={0} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Minutes per Session</label>
          <input name="minutes_per_session" type="number" value={form.minutes_per_session} onChange={handleChange} className="w-full border px-2 py-1 rounded" min={0} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input id="unlimited_monthly_session" name="unlimited_monthly_session" type="checkbox" checked={form.unlimited_monthly_session} onChange={e => setForm({ ...form, unlimited_monthly_session: e.target.checked })} />
          <label htmlFor="unlimited_monthly_session" className="block mb-0">Unlimited Monthly Session</label>
        </div>
        {!form.unlimited_monthly_session && (
          <div className="mb-4">
            <label className="block mb-1">Monthly Limit</label>
            <input name="monthly_limit" type="number" value={form.monthly_limit} onChange={handleChange} className="w-full border px-2 py-1 rounded" min={0} />
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <input id="unlimited_daily_session" name="unlimited_daily_session" type="checkbox" checked={form.unlimited_daily_session} onChange={e => setForm({ ...form, unlimited_daily_session: e.target.checked })} />
          <label htmlFor="unlimited_daily_session" className="block mb-0">Unlimited Daily Session</label>
        </div>
        {!form.unlimited_daily_session && (
          <div className="mb-4">
            <label className="block mb-1">Daily Limit</label>
            <input name="daily_limit" type="number" value={form.daily_limit} onChange={handleChange} className="w-full border px-2 py-1 rounded" min={0} />
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          <label htmlFor="is_active" className="block mb-0">Active</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {loading ? "Saving..." : "Create"}
          </button>
          <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => router.push('/admin/class/plans')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
