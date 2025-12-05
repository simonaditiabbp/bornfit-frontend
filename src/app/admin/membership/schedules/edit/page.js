// Edit Membership Schedule
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaAngleRight, FaCalendar } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchData = async () => {
      setLoading(true);
      try {
        const resSchedule = await fetch(`${API_URL}/api/membership-plan-schedules/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resUsers = await fetch(`${API_URL}/api/users?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resPlans = await fetch(`${API_URL}/api/membership-plans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const scheduleData = await resSchedule.json();
        const usersData = await resUsers.json();
        const plansData = await resPlans.json();
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-plan-schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: Number(form.user_id),
          membership_plan_id: Number(form.membership_plan_id),
          schedule_date: form.schedule_date,
          status: form.status
        })
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-plan-schedules/${id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      router.push('/admin/membership/schedules');
    } catch (err) {
      setError('Gagal menghapus schedule');
    }
    setFormLoading(false);
  };

  if (loading || !form) return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;

  return (
    <div>
      <div className="p-5">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
          <FaCalendar className="text-amber-300" />
          <Link href="/admin/membership/session" className="text-gray-400 hover:text-amber-300 transition-colors">
            Membership
          </Link>
          <FaAngleRight className="text-gray-500 text-xs" />
          <Link href="/admin/membership/schedules" className="text-gray-400 hover:text-amber-300 transition-colors">
            Membership Schedules
          </Link>
          <FaAngleRight className="text-amber-300 text-xs" />
          <span className="text-amber-300 font-medium">Detail / Edit</span>
        </div>

        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-700">
          <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
            <h1 className="text-3xl font-bold text-amber-300">Edit Membership Schedule</h1>
            <Link href="/admin/membership/schedules" className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors">
              Back
            </Link>
          </div>
          {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
          {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block mb-1 text-gray-200">Member</label>
              <select name="user_id" value={form.user_id} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} required disabled={!edit}>
                <option value="">Pilih Member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-200">Plan</label>
              <select name="membership_plan_id" value={form.membership_plan_id} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} required disabled={!edit}>
                <option value="">Pilih Plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-200">Schedule Date</label>
              <input type="date" name="schedule_date" value={form.schedule_date} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} required disabled={!edit} />
            </div>
            <div>
              <label className="block mb-1 text-gray-200">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} disabled={!edit}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <button type="button" className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-6 py-2 rounded-lg font-semibold transition" onClick={() => setEdit(true)}>Edit</button>
                <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleDelete} disabled={formLoading}>Delete</button>
              </>
            ) : (
              <>
                <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
                <button type="button" className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={() => setEdit(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
