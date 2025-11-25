"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import BackendErrorFallback from "../../../../../components/BackendErrorFallback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTSessionInsertPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainners, setTrainners] = useState([]);
  // Fetch member & trainner for dropdown
  useEffect(() => {
    // Fetch plans for dropdown
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/ptsessionplans`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok) setPlans(data.data.plans);
      } catch {}
    };
    fetchPlans();
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users?role=member&membership=active`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const resTrainner = await fetch(`${API_URL}/api/users?role=trainner`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataMember = await resMember.json();
        const dataTrainner = await resTrainner.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resTrainner.ok) setTrainners(dataTrainner.data.users);
      } catch {}
    };
    fetchUsers();
  }, []);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  const [form, setForm] = useState({
    pt_session_plan_id: "",
    user_member_id: "",
    user_pt_id: "",
    start_date: "",
    status: "aktif"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`${API_URL}/api/personaltrainersessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pt_session_plan_id: Number(form.pt_session_plan_id),
          user_member_id: Number(form.user_member_id),
          user_pt_id: Number(form.user_pt_id),
          start_date: formatDateToISO(form.start_date),
          status: form.status
        })
      });
      if (!res.ok) throw new Error("Gagal insert session");
      setSuccess("Session berhasil ditambahkan!");
      setTimeout(() => router.push("/admin/pt/session"), 1200);
    } catch (err) {
      setError("Gagal insert session");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Tambah PT Session</h1>
      {success && <div className="text-green-600 font-semibold mb-2 text-center">{success}</div>}
      {error && <div className="text-red-600 font-semibold mb-2 text-center">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Plan</label>
          <select
            className="w-full border border-gray-300 p-2 rounded"
            value={form.pt_session_plan_id}
            onChange={e => setForm(f => ({ ...f, pt_session_plan_id: e.target.value }))}
            required
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
            className="w-full border border-gray-300 p-2 rounded"
            value={form.user_member_id}
            onChange={e => setForm(f => ({ ...f, user_member_id: e.target.value }))}
            required
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
            className="w-full border border-gray-300 p-2 rounded"
            value={form.user_pt_id}
            onChange={e => setForm(f => ({ ...f, user_pt_id: e.target.value }))}
            required
          >
            <option value="">Pilih PT</option>
            {trainners.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Start Date</label>
          <input type="datetime-local" className="w-full border border-gray-300 p-2 rounded" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select className="w-full border border-gray-300 p-2 rounded" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-8 justify-start">
        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          disabled={loading}
          onClick={handleSave}
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
          onClick={() => router.push("/admin/pt/session")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
