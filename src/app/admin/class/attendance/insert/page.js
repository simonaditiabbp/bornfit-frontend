"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InsertAttendancePage() {
  const [form, setForm] = useState({
    class_id: "",
    member_id: "",
    checked_in_at: "",
    status: "Booked",
    created_by: "",
    updated_by: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const router = useRouter();

  // Fetch classes and members on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const resClasses = await fetch(`${API_URL}/api/classes`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resMembers = await fetch(`${API_URL}/api/users?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataClasses = await resClasses.json();
        const dataMembers = await resMembers.json();
        if (resClasses.ok) setClasses(dataClasses.data.classes);
        if (resMembers.ok) setMembers(dataMembers.data.users);
      } catch {}
    };
    fetchData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      // Format checked_in_at to ISO-8601 (add seconds and Z)
      let checkedInAtIso = form.checked_in_at;
      if (checkedInAtIso && checkedInAtIso.length === 16) {
        checkedInAtIso = checkedInAtIso + ':00.000Z';
      }
      await fetch(`${API_URL}/api/classattendances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          class_id: Number(form.class_id),
          member_id: Number(form.member_id),
          checked_in_at: checkedInAtIso,
          status: form.status,
        }),
      });
      router.push("/admin/class/attendance");
    } catch (err) {
      setError("Gagal menyimpan attendance");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-blue-700 text-center">Add Attendance</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block mb-1">Class</label>
          <select name="class_id" value={form.class_id} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="">Pilih Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name ? cls.name : `Class #${cls.id}`}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Member</label>
          <select name="member_id" value={form.member_id} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="">Pilih Member</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name ? m.name : `Member #${m.id}`}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Checked In At</label>
          <input name="checked_in_at" type="datetime-local" value={form.checked_in_at} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
            <option value="Booked">Booked</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "Saving..." : "Create"}
        </button>
        <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded ml-2" onClick={() => router.push('/admin/class/attendance')}>
          Cancel
        </button>
      </form>
    </div>
  );
}
