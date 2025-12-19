"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/fetchClient';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import LoadingSpin from '@/components/admin/LoadingSpin';

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
      try {
        const dataMembers = await api.get('/api/users?role=member&membership=active');
        setMembers(dataMembers.data.users || []);
      } catch {}
    };
    fetchMembers();
  }, []);

  // Fetch PT sessions for selected member
  useEffect(() => {
    if (!form?.user_member_id) { setPTSessions([]); return; }
    const fetchPTSessions = async () => {
      try {
        const data = await api.get(`/api/personaltrainersessions/member/${form.user_member_id}`);
        console.log("Fetched PT sessions: ", data);
        setPTSessions(data.data.sessions || []);
      } catch {
        setPTSessions([]);
      }
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
      try {
        const data = await api.get(`/api/ptsessionbookings/${id}`);
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
    try {
      await api.put(`/api/ptsessionbookings/${id}`, {
        user_member_id: Number(form.user_member_id),
        personal_trainer_session_id: Number(form.personal_trainer_session_id),
        booking_time: formatDateToISO(form.booking_time),
        status: form.status
      });
      setSuccess("Booking successfully updated!");
      setEdit(false);
    } catch (err) {
      setError(err.data?.message || 'Failed to update booking');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/ptsessionbookings/${id}`);
      router.push('/admin/pt/booking');
    } catch (err) {
      setError(err.data?.message || "Failed to delete booking");
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (loading || !form) return <LoadingSpin />;
  if (!booking) return <div className="text-center text-red-400 font-medium mt-20">Booking not found</div>;

  const selectedMember = members.length > 0 && form.user_member_id ? members.find(u => u.id === form.user_member_id) ?? null : null;
  const selectedPTSession = ptSessions.length > 0 && form.personal_trainer_session_id ? ptSessions.find(u => u.id === form.personal_trainer_session_id) ?? null : null;

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
        <div className="space-y-4 mb-4">
          <FormInput
            label="Member"
            name="user_member_id"
            type="searchable-select"
            placeholder='Search Member'
            disabled={!edit}
            value={ selectedMember ? { value: selectedMember.id, label: selectedMember.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, user_member_id: opt?.value || '' }))
            }
            options={members.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
          />
          <FormInput
            label="PT Session"
            name="personal_trainer_session_id"
            type="searchable-select"
            placeholder='Search PT Sesi'
            disabled={!edit}
            value={ selectedPTSession ? { value: selectedPTSession.id, label: selectedPTSession.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, personal_trainer_session_id: opt?.value || '' }))
            }
            options={ptSessions.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
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
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
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
