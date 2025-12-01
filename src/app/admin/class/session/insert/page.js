"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaIdCard, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSessionInsertPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/eventplans?is_active=true`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        if (res.ok) setPlans(data.data.plans);

        const now = new Date();
        const format = (date) => date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const start = format(now);

        setForm(f => ({
          ...f,
          class_date: now.toISOString().slice(0,10),
          start_time: start,
        }));

      } catch {}
    };
    fetchPlans();
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users/?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructor = await fetch(`${API_URL}/api/users/?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataMember = await resMember.json();
        const dataInstructor = await resInstructor.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resInstructor.ok) setInstructors(dataInstructor.data.users);
      } catch {}
    };
    fetchUsers();
  }, []);

  const [form, setForm] = useState({
    event_plan_id: "",
    instructor_id: "",
    class_date: "",
    start_time: "",
    class_type: "membership_only",
    total_manual_checkin: 0,
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    console.log("form submit: ", form);
    console.log("class_type: ", form.class_type);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      // Format ISO-8601 for class_date, start_time
      const class_date_iso = form.class_date ? `${form.class_date}T00:00:00.000Z` : "";
      const start_time_iso = form.class_date && form.start_time ? `${form.class_date}T${form.start_time}:00.000Z` : "";
      const res = await fetch(`${API_URL}/api/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          event_plan_id: Number(form.event_plan_id),
          instructor_id: Number(form.instructor_id),
          class_date: class_date_iso,
          start_time: start_time_iso,
          class_type: form.class_type,
          total_manual_checkin: Number(form.total_manual_checkin),
          notes: form.notes
        }),
      });
      if (!res.ok) throw new Error("Gagal simpan");
      setSuccess("Berhasil simpan");
      router.push("/admin/class/session");
    } catch (err) {
      setError("Gagal simpan");
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaIdCard className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <Link href="/admin/class/session" className="text-gray-400 hover:text-amber-300 transition-colors">
          Class Session
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Create</span>
      </div>

      <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Create Detail Class</h1>
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block mb-1 text-gray-200">Event Plan</label>
            <select name="event_plan_id" value={form.event_plan_id} onChange={e => setForm({ ...form, event_plan_id: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200">
              <option value="">Pilih Event Plan</option>
              {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Instructor</label>
            <select name="instructor_id" value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200">
              <option value="">Pilih Instructor</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Class Date</label>
            <input name="class_date" type="date" value={form.class_date} onChange={e => setForm({ ...form, class_date: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" />
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Start Time</label>
            <input name="start_time" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" />
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Class Type</label>
            <select name="class_type" value={form.class_type} onChange={e => setForm({ ...form, class_type: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200">
              <option value="membership_only">Membership Only</option>
              <option value="free">Free</option>
              <option value="both">Both</option>
            </select>
          </div>
          {/* <div>
            <label className="block mb-1 text-gray-200">Total Manual Checkin</label>
            <input name="total_manual_checkin" type="number" value={form.total_manual_checkin} onChange={e => setForm({ ...form, total_manual_checkin: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" />
          </div> */}
          <div>
            <label className="block mb-1 text-gray-200">Notes</label>
            <textarea name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-amber-500" disabled={loading}>
              {loading ? "Saving..." : "Create"}
            </button>
            <button type="button" className="bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500" onClick={() => router.push('/admin/class/session')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
