"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaAngleRight, FaFileInvoice } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTPlanEditPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState(null);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  useEffect(() => {
    if (plan && !editForm) {
      setEditForm({
        name: plan.name || "",
        duration_value: plan.duration_value || 0,
        max_session: plan.max_session || 0,
        price: plan.price || 0,
        minutes_per_session: plan.minutes_per_session || 0,
        description: plan.description || "",
      });
    }
  }, [plan, editForm]);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/ptsessionplans/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const dataPlan = await res.json();
        const data = dataPlan.data;
        console.log("dataPlan: ", dataPlan)
        setPlan(data || null);
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchPlan();
  }, [id, edit]);

  const handleEdit = () => {
    setEdit(true);
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
  };

  const handleSave = async (form) => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/ptsessionplans/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...form }),
      });
      if (!res.ok) throw new Error("Gagal update plan");
      setSuccess("Plan updated successfully!");
      setEdit(false);
    } catch (err) {
      setError("Gagal update plan");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/ptsessionplans/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      router.push('/admin/pt/plans');
    } catch (err) {
      setError("Gagal menghapus plan");
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }
  if (loading) {
    return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;
  }
  if (!plan) {
    return <div className="text-red-400 text-center font-medium mt-20">Plan not found</div>;
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaFileInvoice className="text-amber-300" />
        <Link href="/admin/pt/plans" className="text-gray-400 hover:text-amber-300 transition-colors">
          PT Plans
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <Link href="/admin/pt/plans" className="text-gray-400 hover:text-amber-300 transition-colors">
          PT Plans List
        </Link>
        <FaAngleRight className="text-amber-300 text-xs" />
        <span className="text-amber-300 font-medium">Detail / Edit</span>
      </div>

      <div className="p-5">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-700">
          <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
            <h1 className="text-3xl font-bold text-amber-300">PT Session Plan Details</h1>
            <Link href="/admin/pt/plans" className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors">
              Back
            </Link>
          </div>      
          {editForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-200">Name</label>
                  <input type="text" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required disabled={!edit} />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-200">Duration (days)</label>
                  <input type="number" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={editForm.duration_value} onChange={e => setEditForm(f => ({ ...f, duration_value: Number(e.target.value) }))} required disabled={!edit} />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-200">Max Session</label>
                  <input type="number" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={editForm.max_session} onChange={e => setEditForm(f => ({ ...f, max_session: Number(e.target.value) }))} required disabled={!edit} />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-200">Price (Rp)</label>
                  <input type="number" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} required disabled={!edit} />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-200">Minutes/Session</label>
                  <input type="number" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={editForm.minutes_per_session} onChange={e => setEditForm(f => ({ ...f, minutes_per_session: Number(e.target.value) }))} required disabled={!edit} />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium mb-1 text-gray-200">Description</label>
                  <textarea className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required disabled={!edit} />
                </div>
              </div>
              {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
              {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
              <div className="flex gap-3 mt-8 justify-start">
                {!edit ? (
                  <>
                    <button
                      type="button"
                      className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-6 py-2 rounded-lg font-semibold transition"
                      onClick={handleEdit}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                      disabled={formLoading}
                      onClick={() => handleSave(editForm)}
                    >
                      {formLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-amber-300 text-center font-medium mt-20">Loading form...</div>
          )}
        </div>
      </div>
    </div>
  );
}

