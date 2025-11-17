"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditAttendancePage() {
  const [form, setForm] = useState(null);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/classattendances/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error('Gagal fetch attendance');
        const data = await res.json();
        const attForm = {
          class_id: data.class_id || "",
          member_id: data.member_id || "",
          checked_in_at: data.checked_in_at ? data.checked_in_at.slice(0, 16) : "",
          status: data.status || "Booked",
          created_by: data.created_by || "",
          updated_by: data.updated_by || ""
        };
        setForm(attForm);
        setInitialForm(attForm);
      } catch (err) {
        setError("Gagal fetch attendance");
      }
      setLoading(false);
    };
    const fetchDropdowns = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const resClasses = await fetch(`${API_URL}/api/classes`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resMembers = await fetch(`${API_URL}/api/users/filter?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (resClasses.ok) setClasses(await resClasses.json());
        if (resMembers.ok) setMembers(await resMembers.json());
      } catch {}
    };
    if (id) {
      fetchAttendance();
      fetchDropdowns();
    }
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
    setForm(initialForm);
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      let checkedInAtIso = form.checked_in_at;
      if (checkedInAtIso && checkedInAtIso.length === 16) {
        checkedInAtIso = checkedInAtIso + ':00.000Z';
      }
      await fetch(`${API_URL}/api/classattendances/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          class_id: Number(form.class_id),
          member_id: Number(form.member_id),
          checked_in_at: checkedInAtIso,
          status: form.status,
          created_by: form.created_by,
          updated_by: form.updated_by
        }),
      });
      setSuccess("Attendance updated");
      setEdit(false);
    } catch (err) {
      setError("Gagal update attendance");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus attendance ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/classattendances/${id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      router.push('/admin/class/attendance');
    } catch (err) {
      setError('Gagal menghapus attendance');
    }
    setFormLoading(false);
  };

  if (loading || !form) return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Edit Attendance</h2>
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {/* <form onSubmit={e => { e.preventDefault(); handleSave(); }}> */}
      <div className="space-y-4 mb-4">
        <div className="mb-2">
          <label className="block mb-1">Class</label>
          <select name="class_id" value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="">Pilih Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name ? cls.name : `Class #${cls.id}`}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Member</label>
          <select name="member_id" value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="">Pilih Member</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name ? m.name : `Member #${m.id}`}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Checked In At</label>
          <input name="checked_in_at" type="datetime-local" value={form.checked_in_at} onChange={e => setForm(f => ({ ...f, checked_in_at: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Status</label>
          <select name="status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={`w-full border px-2 py-1 rounded ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit}>
            <option value="Booked">Booked</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex gap-2 mt-4">
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
