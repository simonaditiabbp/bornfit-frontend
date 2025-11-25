"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PTBookingCreatePage() {
  const [user_member_id, setUserMemberId] = useState('');
  const [personal_trainer_session_id, setPTSessionId] = useState('');
  const [members, setMembers] = useState([]);
  const [ptSessions, setPTSessions] = useState([]);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  // Fetch members for dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      // const res = await fetch('http://localhost:3002/api/users/filter?role=member&membership=active', {
      const res = await fetch('http://localhost:3002/api/users/?role=member&membership=active', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const dataUser = await res.json();
      if (res.ok) setMembers(dataUser.data.users);
    };
    fetchMembers();
  }, []);

  // Fetch PT sessions for selected member
  useEffect(() => {
    if (!user_member_id) { setPTSessions([]); setPTSessionId(''); return; }
    const fetchPTSessions = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`http://localhost:3002/api/personaltrainersessions/member/${user_member_id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const dataPTSessions = await res.json();
      console.log("dataPTSessions: ", dataPTSessions);
      if (res.ok) setPTSessions(dataPTSessions.data || []);
      else setPTSessions([]);
    };
    fetchPTSessions();
  }, [user_member_id]);
  const [booking_time, setBookingTime] = useState('');
  const [status, setStatus] = useState('booked');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!user_member_id || !personal_trainer_session_id || !booking_time || !status) {
      setError("Semua field wajib diisi.");
      return;
    }
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    try {
      const res = await fetch('http://localhost:3002/api/ptsessionbookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_member_id: Number(user_member_id),
          personal_trainer_session_id: Number(personal_trainer_session_id),
          booking_time: formatDateToISO(booking_time),
          status
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Gagal membuat booking");
      } else {
        setSuccess("Booking berhasil dibuat!");
        setTimeout(() => router.push('/admin/pt/booking'), 1200);
      }
    } catch (err) {
      setError("Gagal membuat booking");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-blue-700 text-center">Booking Baru</h2>
      <form onSubmit={handleSubmit} className="space-y-4">        
        <div>
          <label className="block font-semibold mb-1">Member</label>
          <select className="w-full border border-gray-300 p-2 rounded" value={user_member_id} onChange={e => setUserMemberId(e.target.value)} required>
            <option value="">Pilih Member</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">PT Session</label>
          <select className="w-full border border-gray-300 p-2 rounded" value={personal_trainer_session_id} onChange={e => setPTSessionId(e.target.value)} required disabled={!user_member_id || ptSessions.length === 0}>
            <option value="">Pilih PT Session</option>
            {ptSessions.map(s => (
              <option key={s.id} value={s.id}>{s.name || `Session #${s.id}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Booking Time</label>
          <input type="datetime-local" className="w-full border border-gray-300 p-2 rounded" value={booking_time} onChange={e => setBookingTime(e.target.value)} required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Status</label>
          <select className="w-full border border-gray-300 p-2 rounded" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
        {success && <div className="text-green-600 font-semibold mb-2">{success}</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700" disabled={loading}>{loading ? 'Saving...' : 'Save Booking'}</button>
      </form>
    </div>
  );
}
