"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChalkboardTeacher } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '@/utils/fetchClient';
import { PageBreadcrumb, PageContainerInsert, FormInput, FormActions } from '@/components/admin';

export default function PTBookingCreatePage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [ptSessions, setPTSessions] = useState([]);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  const getNowForDatetimeLocal = () => {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };
  
  const initialFormState = {
    user_member_id: '',
    personal_trainer_session_id: '',
    booking_time: getNowForDatetimeLocal(),
    status: 'booked'
  };
  
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  
  const handleReset = () => {
    setForm(initialFormState);
    setPTSessions([]);
  };
  
  // Fetch members for dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const dataUser = await api.get('/api/users?role=member&membership=active,pending&limit=10000');
        setMembers(dataUser.data.users || []);
      } catch {}
    };
    fetchMembers();
  }, []);

  // Fetch PT sessions for selected member
  useEffect(() => {
    if (!form.user_member_id) { setPTSessions([]); setForm(f => ({...f, personal_trainer_session_id: ''})); return; }
    const fetchPTSessions = async () => {
      try {
        const dataPTSessions = await api.get(`/api/personaltrainersessions/member/${form.user_member_id}`);
        console.log("dataPTSessions: ", dataPTSessions.data.sessions);
        setPTSessions(dataPTSessions.data.sessions || []);
      } catch {
        setPTSessions([]);
      }
    };
    fetchPTSessions();
  }, [form.user_member_id]);
  
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.user_member_id || !form.personal_trainer_session_id || !form.booking_time || !form.status) {
      toast.error('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/ptsessionbookings', {
        user_member_id: Number(form.user_member_id),
        personal_trainer_session_id: Number(form.personal_trainer_session_id),
        booking_time: formatDateToISO(form.booking_time),
        status: form.status
      });
      toast.success('PT booking created successfully!');
      router.push('/admin/pt/booking');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create PT booking');
      console.log("error: ", err);
    }
    setLoading(false);
  };

  const selectedMember = members.length > 0 && form.user_member_id ? members.find(u => u.id === form.user_member_id) ?? null : null;
  const selectedPTSession = ptSessions.length > 0 && form.personal_trainer_session_id ? ptSessions.find(u => u.id === form.personal_trainer_session_id) ?? null : null;

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Booking', href: '/admin/pt/booking' },
        { label: 'Create' }
      ]} />
      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create PT Booking</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Member"
            name="user_member_id"
            type="searchable-select"
            placeholder='Search Member'
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
            placeholder='Search PT Session'
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
            disabled={!form.user_member_id || ptSessions.length === 0}
          />
          <FormInput
            label="Booking Time"
            type="datetime-local"
            value={form.booking_time}
            onChange={e => setForm(f => ({...f, booking_time: e.target.value}))}
            required
          />
          <FormInput
            label="Status"
            type="select"
            value={form.status}
            onChange={e => setForm(f => ({...f, status: e.target.value}))}
            options={[
              { value: 'booked', label: 'Booked' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'completed', label: 'Completed' }
            ]}
          />

          <FormActions
            onSubmit={() => {}}
            onReset={handleReset}
            cancelHref="/admin/pt/booking"
            isLoading={loading}
            isFormSubmit={true}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
