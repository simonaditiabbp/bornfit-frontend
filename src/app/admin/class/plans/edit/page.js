"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPlanEditPage() {
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/eventplans/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error('Gagal fetch plan');
        const data = await res.json();
        const planForm = {
          name: data.name || "",
          access_type: data.access_type || "Regular",
          max_visitor: data.max_visitor || 0,
          minutes_per_session: data.minutes_per_session || 0,
          description: data.description || "",
          unlimited_monthly_session: data.unlimited_monthly_session || false,
          monthly_limit: data.monthly_limit || 0,
          unlimited_daily_session: data.unlimited_daily_session || false,
          daily_limit: data.daily_limit || 0,
          is_active: data.is_active ?? true
        };
        setForm(planForm);
        setInitialForm(planForm);
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchPlan();
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleEdit = () => {
    setEdit(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
    setForm(initialForm);
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/eventplans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Gagal update');
      setSuccess('Plan updated');
      setEdit(false);
    } catch (err) {
      setError('Gagal update plan');
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/eventplans/${id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      router.push('/admin/class/plans');
    } catch (err) {
      setError('Gagal menghapus plan');
    }
    setFormLoading(false);
  };

  if (backendError) return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  if (loading || !form) return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Edit Class Plan</h1>
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {/* <form onSubmit={e => { e.preventDefault(); handleSave(); }}> */}
      <div className="space-y-4 mb-4">
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input name="name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Access Type</label>
          <select name="access_type" value={form.access_type} onChange={e => setForm(f => ({ ...f, access_type: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit}>
            <option value="Regular">Regular</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Max Visitor</label>
          <input name="max_visitor" type="number" value={form.max_visitor} onChange={e => setForm(f => ({ ...f, max_visitor: Number(e.target.value) }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} min={0} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Minutes per Session</label>
          <input name="minutes_per_session" type="number" value={form.minutes_per_session} onChange={e => setForm(f => ({ ...f, minutes_per_session: Number(e.target.value) }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} min={0} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Unlimited Monthly Session</label>
          <input name="unlimited_monthly_session" type="checkbox" checked={form.unlimited_monthly_session} onChange={e => setForm(f => ({ ...f, unlimited_monthly_session: e.target.checked }))} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Monthly Limit</label>
          <input name="monthly_limit" type="number" value={form.monthly_limit} onChange={e => setForm(f => ({ ...f, monthly_limit: Number(e.target.value) }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} min={0} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Unlimited Daily Session</label>
          <input name="unlimited_daily_session" type="checkbox" checked={form.unlimited_daily_session} onChange={e => setForm(f => ({ ...f, unlimited_daily_session: e.target.checked }))} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Daily Limit</label>
          <input name="daily_limit" type="number" value={form.daily_limit} onChange={e => setForm(f => ({ ...f, daily_limit: Number(e.target.value) }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} min={0} disabled={!edit} />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Active</label>
          <input name="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} disabled={!edit} />
        </div>
        <div className="flex gap-2">
          {!edit ? (
            <>
              <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleEdit}>Edit</button>
              <button type="button" className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDelete} disabled={formLoading}>Delete</button>
            </>
          ) : (
            <>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave} disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</button>
              <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      {/* </form> */}
      </div>
    </div>
  );
}
