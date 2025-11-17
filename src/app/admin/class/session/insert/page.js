"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSessionInsertPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/eventplans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (res.ok) setPlans(await res.json());
      } catch {}
    };
    fetchPlans();
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users/filter?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructor = await fetch(`${API_URL}/api/users/filter?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (resMember.ok) setMembers(await resMember.json());
        if (resInstructor.ok) setInstructors(await resInstructor.json());
      } catch {}
    };
    fetchUsers();
  }, []);

  const [form, setForm] = useState({
    event_plan_id: "",
    instructor_id: "",
    class_date: "",
    start_time: "",
    end_time: "",
    class_type: "Membership Only",
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
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      // Format ISO-8601 for class_date, start_time, end_time
      const class_date_iso = form.class_date ? `${form.class_date}T00:00:00.000Z` : "";
      const start_time_iso = form.class_date && form.start_time ? `${form.class_date}T${form.start_time}:00.000Z` : "";
      const end_time_iso = form.class_date && form.end_time ? `${form.class_date}T${form.end_time}:00.000Z` : "";
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
          end_time: end_time_iso,
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
    <div className="max-w-xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-2xl font-bold mb-8 text-blue-700 text-center">Tambah Class</h1>
      {success && <div className="text-green-600 font-semibold mb-2 text-center">{success}</div>}
      {error && <div className="text-red-600 font-semibold mb-2 text-center">{error}</div>}
      <form className="space-y-4" onSubmit={handleSave}>
        <div>
          <label className="block mb-1">Event Plan</label>
          <select name="event_plan_id" value={form.event_plan_id} onChange={e => setForm({ ...form, event_plan_id: e.target.value })} className="w-full border px-2 py-1 rounded">
            <option value="">Pilih Event Plan</option>
            {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">Instructor</label>
          <select name="instructor_id" value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} className="w-full border px-2 py-1 rounded">
            <option value="">Pilih Instructor</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">Class Date</label>
          <input name="class_date" type="date" value={form.class_date} onChange={e => setForm({ ...form, class_date: e.target.value })} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block mb-1">Start Time</label>
          <input name="start_time" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block mb-1">End Time</label>
          <input name="end_time" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block mb-1">Class Type</label>
          <select name="class_type" value={form.class_type} onChange={e => setForm({ ...form, class_type: e.target.value })} className="w-full border px-2 py-1 rounded">
            <option value="Membership Only">Membership Only</option>
            <option value="Free">Free</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Total Manual Checkin</label>
          <input name="total_manual_checkin" type="number" value={form.total_manual_checkin} onChange={e => setForm({ ...form, total_manual_checkin: e.target.value })} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border px-2 py-1 rounded" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {loading ? "Saving..." : "Create"}
          </button>
          <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => router.push('/admin/class/session')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
