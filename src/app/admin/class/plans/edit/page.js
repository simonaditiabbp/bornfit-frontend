"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaAngleRight, FaFileInvoice } from 'react-icons/fa';
import Link from 'next/link';

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
        const dataEvent = await res.json();
        const data = dataEvent.data || [];
        console.log('Fetched plan data:', data);
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
  if (loading || !form) return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;

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
                <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2">Detail</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-600">
          <h1 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Edit Class Plan</h1>
          {success && <div className="text-green-400 mb-2">{success}</div>}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          {/* <form onSubmit={e => { e.preventDefault(); handleSave(); }}> */}
          <div className="space-y-4 mb-4">
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Name</label>
              <input name="name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} required disabled={!edit} />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Access Type</label>
              <select name="access_type" value={form.access_type} onChange={e => setForm(f => ({ ...f, access_type: e.target.value }))} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} disabled={!edit}>
                <option value="Regular">Regular</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Max Visitor</label>
              <input name="max_visitor" type="number" value={form.max_visitor} onChange={e => setForm(f => ({ ...f, max_visitor: Number(e.target.value) }))} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} min={0} disabled={!edit} />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Minutes per Session</label>
              <input name="minutes_per_session" type="number" value={form.minutes_per_session} onChange={e => setForm(f => ({ ...f, minutes_per_session: Number(e.target.value) }))} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} min={0} disabled={!edit} />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-200">Description</label>
              <textarea name="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} disabled={!edit} />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_monthly_session" name="unlimited_monthly_session" type="checkbox" checked={form.unlimited_monthly_session} onChange={e => setForm({ ...form, unlimited_monthly_session: e.target.checked })} disabled={!edit} />
              <label htmlFor="unlimited_monthly_session" className="block mb-0 text-gray-200">Unlimited Monthly Session</label>
            </div>
            {!form.unlimited_monthly_session && (
              <div className="mb-4">
                <label className="block mb-1 text-gray-200">Monthly Limit</label>
                <input name="monthly_limit" type="number" value={form.monthly_limit} onChange={handleChange} className={`w-full border p-3 rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} min={0} disabled={!edit} />
              </div>
            )}
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_daily_session" name="unlimited_daily_session" type="checkbox" checked={form.unlimited_daily_session} onChange={e => setForm({ ...form, unlimited_daily_session: e.target.checked })} disabled={!edit} />
              <label htmlFor="unlimited_daily_session" className="block mb-0 text-gray-200">Unlimited Daily Session</label>
            </div>
            {!form.unlimited_daily_session && (
              <div className="mb-4">
                <label className="block mb-1 text-gray-200">Daily Limit</label>
                <input name="daily_limit" type="number" value={form.daily_limit} onChange={handleChange} className={`w-full border p-3 rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} min={0} disabled={!edit} />
              </div>
            )}
            <div className="mb-4 flex items-center gap-2">
              <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} disabled={!edit} />
              <label htmlFor="is_active" className="block mb-0 text-gray-200">Active</label>
            </div>
            <div className="flex justify-between mt-8">
              <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                <Link href="/admin/class/plans">Back</Link>
              </div>
              <div className="flex gap-3">
                {!edit ? (
                  <>
                    <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={handleEdit}>Edit</button>
                    <button type="button" className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition" onClick={handleDelete} disabled={formLoading}>Delete</button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={handleSave} disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</button>
                    <button type="button" className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition" onClick={handleCancel}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          {/* </form> */}
          </div>
        </div>
      </div>
    </div>
  );
}
