"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTSessionEditPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainners, setTrainners] = useState([]);
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

  useEffect(() => {
    // Fetch plans for dropdown
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/ptsessionplans`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (res.ok) setPlans(await res.json());
      } catch {}
    };
    fetchPlans();
    // Fetch member & trainner for dropdown
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users/filter?role=member&membership=active`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const resTrainner = await fetch(`${API_URL}/api/users/filter?role=trainner`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (resMember.ok) setMembers(await resMember.json());
        if (resTrainner.ok) setTrainners(await resTrainner.json());
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
        const data = await res.json();
        setSession(data);
        setForm({
          pt_session_plan_id: data.pt_session_plan_id,
          user_member_id: data.user_member_id,
          user_pt_id: data.user_pt_id,
          join_date: data.join_date?.slice(0, 16),
          status: data.status
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
      join_date: session.join_date?.slice(0, 16),
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
          join_date: formatDateToISO(form.join_date),
          status: form.status,
          id: Number(id)
        })
      });
      if (!res.ok) throw new Error("Gagal update session");
      setSuccess("Session berhasil diupdate!");
      setEdit(false);
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
    return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-2xl font-bold mb-8 text-blue-700 text-center">Edit PT Session</h1>      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Plan</label>
          <select
            className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`}
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
          <label className="block font-medium mb-1">Member</label>
          <select
            className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`}
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
          <label className="block font-medium mb-1">Personal Trainer</label>
          <select
            className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`}
            value={form.user_pt_id}
            onChange={e => setForm(f => ({ ...f, user_pt_id: e.target.value }))}
            required
            disabled={!edit}
          >
            <option value="">Pilih PT</option>
            {trainners.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Join Date</label>
          <input type="datetime-local" className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} required disabled={!edit} />
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select className={`w-full border rounded px-3 py-2 ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required disabled={!edit}>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
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
            {/* <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
              onClick={() => router.push("/admin/pt/session")}
            >
              Cancel
            </button> */}
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
  );
}
