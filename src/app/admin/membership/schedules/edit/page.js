// Edit Membership Schedule
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCalendar } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';
import LoadingSpin from '@/components/admin/LoadingSpin';

export default function EditMembershipSchedulePage() {
  const [form, setForm] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scheduleData, usersData, plansData] = await Promise.all([
          api.get(`/api/membership-plan-schedules/${id}`),
          api.get('/api/users?role=member'),
          api.get('/api/membership-plans')
        ]);
        setForm(scheduleData.data || null);
        console.log('scheduleData:', scheduleData.data);
        setUsers(usersData.data?.users || []);
        setPlans(plansData.data?.plans || []);
      } catch (err) {
        setError('Gagal fetch data');
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setFormLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/membership-plan-schedules/${id}`, {
        user_id: Number(form.user_id),
        membership_plan_id: Number(form.membership_plan_id),
        schedule_date: form.schedule_date,
        status: form.status
      });
      setSuccess('Schedule updated');
      setEdit(false);
    } catch (err) {
      setError('Gagal update schedule');
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus schedule ini?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/membership-plan-schedules/${id}`);
      router.push('/admin/membership/schedules');
    } catch (err) {
      setError('Gagal menghapus schedule');
    }
    setFormLoading(false);
  };

  if (loading || !form) return <LoadingSpin />;

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaCalendar className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Schedules', href: '/admin/membership/schedules' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Edit Schedule</h1>
          <ActionButton href="/admin/membership/schedules" variant="gray">Back</ActionButton>
        </div>
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
        
        <div className="space-y-4 mb-4">
          <FormInput
            label="Member"
            name="user_id"
            type="select"
            value={form.user_id}
            onChange={handleChange}
            disabled={!edit}
            required
            options={[
              { value: '', label: 'Pilih Member' },
              ...users.map(u => ({ value: u.id, label: u.name }))
            ]}
          />
          
          <FormInput
            label="Plan"
            name="membership_plan_id"
            type="select"
            value={form.membership_plan_id}
            onChange={handleChange}
            disabled={!edit}
            required
            options={[
              { value: '', label: 'Pilih Plan' },
              ...plans.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          
          <FormInput
            label="Schedule Date"
            name="schedule_date"
            type="date"
            value={form.schedule_date}
            onChange={handleChange}
            disabled={!edit}
            required
          />
          
          <FormInput
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={handleChange}
            disabled={!edit}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
        </div>

        <div className="flex gap-3 mt-8 justify-start">
          {!edit ? (
            <>
              <ActionButton onClick={() => setEdit(true)} variant="primary">Edit</ActionButton>
              <ActionButton onClick={handleDelete} variant="danger" disabled={formLoading}>Delete</ActionButton>
            </>
          ) : (
            <>
              <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              <ActionButton onClick={() => setEdit(false)} variant="gray">Cancel</ActionButton>
            </>
          )}
        </div>
      </PageContainerInsert>
    </div>
  );
}
