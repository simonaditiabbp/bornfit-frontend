"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PlanForm from "../PlanForm";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";

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
        duration: plan.duration || 0,
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
        const data = await res.json();
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
    return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;
  }
  if (!plan) {
    return <div className="text-red-600 text-center font-medium mt-20">Plan not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">PT Session Plan Detail</h1>      
      {editForm ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Name</label>
              <input type="text" className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required disabled={!edit} />
            </div>
            <div>
              <label className="block font-medium mb-1">Duration (days)</label>
              <input type="number" className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: Number(e.target.value) }))} required disabled={!edit} />
            </div>
            <div>
              <label className="block font-medium mb-1">Max Session</label>
              <input type="number" className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={editForm.max_session} onChange={e => setEditForm(f => ({ ...f, max_session: Number(e.target.value) }))} required disabled={!edit} />
            </div>
            <div>
              <label className="block font-medium mb-1">Price (Rp)</label>
              <input type="number" className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} required disabled={!edit} />
            </div>
            <div>
              <label className="block font-medium mb-1">Minutes/Session</label>
              <input type="number" className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={editForm.minutes_per_session} onChange={e => setEditForm(f => ({ ...f, minutes_per_session: Number(e.target.value) }))} required disabled={!edit} />
            </div>
            <div className="col-span-2">
              <label className="block font-medium mb-1">Description</label>
              <textarea className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required disabled={!edit} />
            </div>
          </div>
          {success && <div className="text-green-600 font-semibold mb-2">{success}</div>}
          {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
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
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-blue-600 text-center font-medium mt-20">Loading form...</div>
      )}
    </div>
  );
}

