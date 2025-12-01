"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaAngleRight, FaIdCard } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTSessionEditPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  
  const formatDateForInput = (isoString) => isoString ? isoString.split("T")[0] : "";

  useEffect(() => {
    // Fetch plans for dropdown
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/ptsessionplans`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataPlans = await res.json();
        if (res.ok) setPlans(dataPlans.data.plans);
      } catch {}
    };
    fetchPlans();
    // Fetch member & trainer for dropdown
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users?role=member&membership=active`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const resTrainer = await fetch(`${API_URL}/api/users?role=trainer`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataMember = await resMember.json();
        const dataTrainer = await resTrainer.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resTrainer.ok) setTrainers(dataTrainer.data.users);
      } catch {}
    };
    fetchUsers();
    const fetchSession = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/personaltrainersessions/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Gagal fetch session");
        const dataPTSessions = await res.json();
        console.log("data: ", dataPTSessions)
        setSession(dataPTSessions.data);
        setForm({
          pt_session_plan_id: dataPTSessions.data.pt_session_plan_id,
          user_member_id: dataPTSessions.data.user_member_id,
          user_pt_id: dataPTSessions.data.user_pt_id,
          start_date: dataPTSessions.data.start_date?.slice(0, 16),
          status: dataPTSessions.data.status
        });
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchSession();
  }, [id]);

  const handleEdit = () => {
    setEdit(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
    setForm({
      pt_session_plan_id: session.pt_session_plan_id,
      user_member_id: session.user_member_id,
      user_pt_id: session.user_pt_id,
      start_date: session.start_date?.slice(0, 16),
      status: session.status
    });
  };  

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`${API_URL}/api/personaltrainersessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pt_session_plan_id: Number(form.pt_session_plan_id),
          user_member_id: Number(form.user_member_id),
          user_pt_id: Number(form.user_pt_id),
          start_date: formatDateToISO(form.start_date),
          status: form.status,
          id: Number(id)
        })
      });
      if (!res.ok) throw new Error("Gagal update session");
      setSuccess("Session berhasil diupdate!");
      setEdit(false);
      setTimeout(() => window.location.reload(), 500);
    //   setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError("Gagal update session");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus session ini?')) return;
    setFormLoading(true);
    try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        await fetch(`${API_URL}/api/personaltrainersessions/${id}`, {
        method: 'DELETE',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
        });
        router.push('/admin/pt/session');
    } catch (err) {
      setError("Gagal menghapus session");
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }
  if (loading || !form) {
    return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;
  }

  return (
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaIdCard className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/pt/session" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2">PT Session</Link>
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
          <h1 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Edit PT Session</h1>      
          <div className="space-y-4 mb-4">
            <div>
              <label className="block font-medium mb-1 text-gray-200">Plan</label>
              <select
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`}
                value={form.pt_session_plan_id}
                onChange={e => setForm(f => ({ ...f, pt_session_plan_id: e.target.value }))}
                required
                disabled={!edit}
              >
                <option value="">Pilih Plan</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name || `Plan #${p.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-200">Member</label>
              <select
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`}
                value={form.user_member_id}
                onChange={e => setForm(f => ({ ...f, user_member_id: e.target.value }))}
                required
                disabled={!edit}
              >
                <option value="">Pilih Member</option>
                {members.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-200">Personal Trainer</label>
              <select
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`}
                value={form.user_pt_id}
                onChange={e => setForm(f => ({ ...f, user_pt_id: e.target.value }))}
                required
                disabled={!edit}
              >
                <option value="">Pilih PT</option>
                {trainers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-200">Start Date</label>
              <input type="datetime-local" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required disabled={!edit} />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-200">Status</label>
              <select className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required disabled={!edit}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
          {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
          <div className="flex justify-between mt-8">
            <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
              <Link href="/admin/pt/session">Back</Link>
            </div>
            <div className="flex gap-3">
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
                    onClick={handleSave}
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
        </div>
      </div>
    </div>
  );
}
