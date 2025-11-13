"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


export default function PTBookingEditPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState(null);
  const [members, setMembers] = useState([]);
  const [ptSessions, setPTSessions] = useState([]);
  // Fetch members for dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch('http://localhost:3002/api/users/filter?role=member&membership=active', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) setMembers(await res.json());
    };
    fetchMembers();
  }, []);

  // Fetch PT sessions for selected member
  useEffect(() => {
    if (!form?.user_member_id) { setPTSessions([]); return; }
    const fetchPTSessions = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`http://localhost:3002/api/personaltrainersessions/member/${form.user_member_id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) setPTSessions(await res.json());
      else setPTSessions([]);
    };
    fetchPTSessions();
  }, [form?.user_member_id]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    fetch(`http://localhost:3002/api/ptsessionbookings/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(res => {
        // API returns single booking object
        const bookingObj = res;
        setBooking(bookingObj || null);
        if (bookingObj) {
          setForm({
            user_member_id: bookingObj.user_member_id,
            personal_trainer_session_id: bookingObj.personal_trainer_session_id,
            booking_time: bookingObj.booking_time?.slice(0,16),
            status: bookingObj.status
          });
        }
        setLoading(false);
      });
    setLoading(false);
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
      user_member_id: booking.user_member_id,
      personal_trainer_session_id: booking.personal_trainer_session_id,
      booking_time: booking.booking_time?.slice(0,16),
      status: booking.status
    });
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    if (!form.user_member_id || !form.personal_trainer_session_id || !form.booking_time || !form.status) {
      setError("Semua field wajib diisi.");
      setFormLoading(false);
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    try {
      const res = await fetch(`http://localhost:3002/api/ptsessionbookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_member_id: Number(form.user_member_id),
          personal_trainer_session_id: Number(form.personal_trainer_session_id),
          booking_time: formatDateToISO(form.booking_time),
          status: form.status
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Gagal update booking");
      } else {
        setSuccess("Booking berhasil diupdate!");
        setEdit(false);
      }
    } catch (err) {
      setError("Gagal update booking");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus booking ini?')) return;
    setFormLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    try {
      await fetch(`http://localhost:3002/api/ptsessionbookings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      router.push('/admin/pt/booking');
    } catch (err) {
      setError("Gagal menghapus booking");
    }
    setFormLoading(false);
  };

  if (loading || !form) return <div className="text-center text-blue-500">Loading...</div>;
  if (!booking) return <div className="text-center text-red-500">Booking not found</div>;

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Edit Booking</h2>
      <div className="space-y-4 mb-4">
        <div>
          <label className="block font-semibold mb-1">Member</label>
          <select className={`w-full border p-2 rounded ${edit ? '' : 'bg-gray-100'}`} value={form.user_member_id} onChange={e => setForm(f => ({ ...f, user_member_id: e.target.value, personal_trainer_session_id: '' }))} required disabled={!edit}>
            <option value="">Pilih Member</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">PT Session</label>
          <select className={`w-full border p-2 rounded ${edit ? '' : 'bg-gray-100'}`} value={form.personal_trainer_session_id} onChange={e => setForm(f => ({ ...f, personal_trainer_session_id: e.target.value }))} required disabled={!edit || !form.user_member_id || ptSessions.length === 0}>
            <option value="">Pilih PT Session</option>
            {ptSessions.map(s => (
              <option key={s.id} value={s.id}>{s.name || `Session #${s.id}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Booking Time</label>
          <input type="datetime-local" className={`w-full border p-2 rounded ${edit ? '' : 'bg-gray-100'}`} value={form.booking_time} onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} required disabled={!edit} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Status</label>
          <select className={`w-full border p-2 rounded ${edit ? '' : 'bg-gray-100'}`} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} disabled={!edit}>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
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
