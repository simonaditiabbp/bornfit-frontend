"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaAngleRight, FaFileInvoice } from 'react-icons/fa';
import Link from 'next/link';

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
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaFileInvoice className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/class/plans" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2">Class Plans</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FaAngleRight className="w-3 h-3 text-gray-400 mx-1" />
                <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2">Add Plan</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-600">
          <h1 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Add Class Plan</h1>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Name</label>
              <input name="name" type="text" value={form.name} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" required />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Access Type</label>
              <select name="access_type" value={form.access_type} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200">
                <option value="Regular">Regular</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Max Visitor</label>
              <input name="max_visitor" type="number" value={form.max_visitor} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" min={0} />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Minutes per Session</label>
              <input name="minutes_per_session" type="number" value={form.minutes_per_session} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" min={0} />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_monthly_session" name="unlimited_monthly_session" type="checkbox" checked={form.unlimited_monthly_session} onChange={e => setForm({ ...form, unlimited_monthly_session: e.target.checked })} />
              <label htmlFor="unlimited_monthly_session" className="block mb-0 text-gray-200">Unlimited Monthly Session</label>
            </div>
            {!form.unlimited_monthly_session && (
              <div className="mb-4">
                <label className="block mb-1 text-gray-200">Monthly Limit</label>
                <input name="monthly_limit" type="number" value={form.monthly_limit} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" min={0} />
              </div>
            )}
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_daily_session" name="unlimited_daily_session" type="checkbox" checked={form.unlimited_daily_session} onChange={e => setForm({ ...form, unlimited_daily_session: e.target.checked })} />
              <label htmlFor="unlimited_daily_session" className="block mb-0 text-gray-200">Unlimited Daily Session</label>
            </div>
            {!form.unlimited_daily_session && (
              <div className="mb-4">
                <label className="block mb-1 text-gray-200">Daily Limit</label>
                <input name="daily_limit" type="number" value={form.daily_limit} onChange={handleChange} className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" min={0} />
              </div>
            )}
            <div className="mb-4 flex items-center gap-2">
              <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="block mb-0 text-gray-200">Active</label>
            </div>
            <div className="flex justify-between mt-8">
              <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                <Link href="/admin/class/plans">Back</Link>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition" disabled={loading}>
                  {loading ? "Saving..." : "Create"}
                </button>
                <button type="button" className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition" onClick={() => router.push('/admin/class/plans')}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
