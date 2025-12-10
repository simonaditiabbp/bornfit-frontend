"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';

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
      console.log("Fetched PT sessions: ", data);
      if (res.ok) setPTSessions(data.data.sessions);
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

  if (loading || !form) return <div className="text-center text-gray-800 dark:text-amber-300 font-medium mt-20">Loading...</div>;
  if (!booking) return <div className="text-center text-red-400 font-medium mt-20">Booking not found</div>;

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Booking', href: '/admin/pt/booking' },
        { label: 'Detail / Edit' }
      ]} />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">PT Booking Details</h1>
          <ActionButton
            variant="gray"
            href="/admin/pt/booking"
          >
            Back
          </ActionButton>
        </div>
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
        <div className="space-y-4 mb-4">
          <FormInput
            label="Member"
            type="select"
            value={form.user_member_id}
            onChange={e => setForm(f => ({ ...f, user_member_id: e.target.value, personal_trainer_session_id: '' }))}
            options={[
              { value: '', label: 'Pilih Member' },
              ...members.map(m => ({ value: m.id, label: m.name }))
            ]}
            required
            disabled={!edit}
          />
          <FormInput
            label="PT Session"
            type="select"
            value={form.personal_trainer_session_id}
            onChange={e => setForm(f => ({ ...f, personal_trainer_session_id: e.target.value }))}
            options={[
              { value: '', label: 'Pilih PT Session' },
              ...ptSessions.map(s => ({ value: s.id, label: s.name || `Session #${s.id}` }))
            ]}
            required
            disabled={!edit || !form.user_member_id || ptSessions.length === 0}
          />
          <FormInput
            label="Booking Time"
            type="datetime-local"
            value={form.booking_time}
            onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))}
            required
            disabled={!edit}
          />
          <FormInput
            label="Status"
            type="select"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'booked', label: 'Booked' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'completed', label: 'Completed' }
            ]}
            disabled={!edit}
          />
        </div>
        <div className="flex gap-3 mt-8 justify-start">
          {!edit ? (
            <>
              <ActionButton onClick={handleEdit} variant="primary">Edit</ActionButton>
              <ActionButton onClick={handleDelete} variant="danger" disabled={formLoading}>Delete</ActionButton>
            </>
          ) : (
            <>
              <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              <ActionButton onClick={handleCancel} variant="gray">Cancel</ActionButton>
            </>
          )}
        </div>
      </PageContainerInsert>
    </div>
  );
}
