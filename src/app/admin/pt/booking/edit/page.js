"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaAngleRight, FaCalendar } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      const res = await fetch(`${API_URL}/api/users?role=member&membership=active`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const dataMembers = await res.json();
      if (res.ok) setMembers(dataMembers.data.users);
    };
    fetchMembers();
  }, []);

  // Fetch PT sessions for selected member
  useEffect(() => {
    if (!form?.user_member_id) { setPTSessions([]); return; }
    const fetchPTSessions = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`${API_URL}/api/personaltrainersessions/member/${form.user_member_id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (res.ok) setPTSessions(data.data);
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
    const fetchBooking = async () => {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      try {
        const res = await fetch(`${API_URL}/api/ptsessionbookings/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        const bookingObj = data?.data;
        console.log("bookingObj: ", bookingObj);
        setBooking(bookingObj || null);
        if (bookingObj) {
          setForm({
            user_member_id: bookingObj.user_member_id,
            personal_trainer_session_id: bookingObj.personal_trainer_session_id,
            booking_time: bookingObj.booking_time?.slice(0,16),
            status: bookingObj.status
          });
        }
      } catch (err) {
        setBooking(null);
      }
      setLoading(false);
    };
    fetchBooking();
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
      const res = await fetch(`${API_URL}/api/ptsessionbookings/${id}`, {
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
      await fetch(`${API_URL}/api/ptsessionbookings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      router.push('/admin/pt/booking');
    } catch (err) {
      setError("Gagal menghapus booking");
    }
    setFormLoading(false);
  };

  if (loading || !form) return <div className="text-center text-amber-300 font-medium mt-20">Loading...</div>;
  if (!booking) return <div className="text-center text-red-400 font-medium mt-20">Booking not found</div>;

  return (
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaCalendar className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/pt/booking" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2">PT Booking</Link>
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
          <h2 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Edit Booking</h2>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block font-semibold mb-1 text-gray-200">Member</label>
              <select className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} value={form.user_member_id} onChange={e => setForm(f => ({ ...f, user_member_id: e.target.value, personal_trainer_session_id: '' }))} required disabled={!edit}>
                <option value="">Pilih Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-200">PT Session</label>
              <select className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} value={form.personal_trainer_session_id} onChange={e => setForm(f => ({ ...f, personal_trainer_session_id: e.target.value }))} required disabled={!edit || !form.user_member_id || ptSessions.length === 0}>
                <option value="">Pilih PT Session</option>
                {ptSessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name || `Session #${s.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-200">Booking Time</label>
              <input type="datetime-local" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} value={form.booking_time} onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} required disabled={!edit} />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-200">Status</label>
              <select className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'} text-gray-200`} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} disabled={!edit}>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
          {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
          <div className="flex justify-between mt-8">
            <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
              <Link href="/admin/pt/booking">Back</Link>
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
