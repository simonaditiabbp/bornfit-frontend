"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSessionEditPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [instructors, setInstructors] = useState([]);
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
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/eventplans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataPlans = await res.json();
        if (res.ok) setPlans(dataPlans.data.plans);
      } catch {}
    };
    fetchPlans();
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructor = await fetch(`${API_URL}/api/users?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataMember = await resMember.json();
        const dataInstructor = await resInstructor.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resInstructor.ok) setInstructors(dataInstructor.data.users);
      } catch {}
    };
    fetchUsers();
    const fetchSession = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/classes/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error("Gagal fetch class");
        const dataClass = await res.json();
        const data = dataClass.data;
        setSession(data);
        setForm({
          event_plan_id: data.event_plan_id || "",
          instructor_id: data.instructor_id || "",
          class_date: data.class_date ? data.class_date.slice(0, 10) : "",
          start_time: data.start_time ? data.start_time.slice(11, 16) : "",
          end_time: data.end_time ? data.end_time.slice(11, 16) : "",
          class_type: data.class_type || "Membership Only",
          total_manual_checkin: data.total_manual_checkin || 0,
          notes: data.notes || ""
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
      event_plan_id: session.event_plan_id || "",
      instructor_id: session.instructor_id || "",
      class_date: session.class_date ? session.class_date.slice(0, 10) : "",
      start_time: session.start_time ? session.start_time.slice(11, 16) : "",
      end_time: session.end_time ? session.end_time.slice(11, 16) : "",
      class_type: session.class_type || "Membership Only",
      total_manual_checkin: session.total_manual_checkin || 0,
      notes: session.notes || ""
    });
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const class_date_iso = form.class_date ? `${form.class_date}T00:00:00.000Z` : "";
      const start_time_iso = form.class_date && form.start_time ? `${form.class_date}T${form.start_time}:00.000Z` : "";
      const end_time_iso = form.class_date && form.end_time ? `${form.class_date}T${form.end_time}:00.000Z` : "";
      
      const res = await fetch(`${API_URL}/api/classes/${id}`, {
        method: "PUT",
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
          notes: form.notes,
          id: Number(id)
        })
      });
      if (!res.ok) throw new Error("Gagal update class");
      setSuccess("Class berhasil diupdate!");
      setEdit(false);
    } catch (err) {
      setError("Gagal update class");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus class ini?')) return;
    setFormLoading(true);
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        await fetch(`${API_URL}/api/classes/${id}`, {
        method: 'DELETE',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
        });
        router.push('/admin/class/session');
    } catch (err) {
      setError("Gagal menghapus class");
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
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 border-b pb-3">Edit Class</h1>
      <div className="space-y-4 mb-4">
        <div>
          <label className="block mb-1">Event Plan</label>
          <select name="event_plan_id" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.event_plan_id} onChange={e => setForm(f => ({ ...f, event_plan_id: e.target.value }))} required disabled={!edit}>
            <option value="">Pilih Event Plan</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Instructor</label>
          <select name="instructor_id" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))} required disabled={!edit}>
            <option value="">Pilih Instructor</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Class Date</label>
          <input name="class_date" type="date" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.class_date} onChange={e => setForm(f => ({ ...f, class_date: e.target.value }))} required disabled={!edit} />
        </div>
        <div>
          <label className="block mb-1">Start Time</label>
          <input name="start_time" type="time" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required disabled={!edit} />
        </div>
        <div>
          <label className="block mb-1">End Time</label>
          <input name="end_time" type="time" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required disabled={!edit} />
        </div>
        <div>
          <label className="block mb-1">Class Type</label>
          <select name="class_type" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.class_type} onChange={e => setForm(f => ({ ...f, class_type: e.target.value }))} required disabled={!edit}>
            <option value="Membership Only">Membership Only</option>
            <option value="Free">Free</option>
            <option value="Both">Both</option>
          </select>
        </div>
        {/* <div>
          <label className="block mb-1">Total Manual Checkin</label>
          <input name="total_manual_checkin" type="number" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.total_manual_checkin} onChange={e => setForm(f => ({ ...f, total_manual_checkin: e.target.value }))} required disabled={!edit} />
        </div> */}
        <div>
          <label className="block mb-1">Notes</label>
          <textarea name="notes" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={!edit} />
        </div>
      </div>
      {success && <div className="text-green-600 font-semibold mb-2">{success}</div>}
      {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
      <div className="flex gap-3 mt-8 justify-start">
        {!edit ? (
          <>
            <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleEdit}>Edit</button>
            <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleDelete}>Delete</button>
          </>
        ) : (
          <>
            <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" disabled={formLoading} onClick={handleSave}>{formLoading ? "Saving..." : "Save"}</button>
            <button type="button" className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleCancel}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
