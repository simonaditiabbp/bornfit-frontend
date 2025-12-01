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
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaCalendar className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/membership/schedules" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2 dark:text-gray-400">Membership Schedules</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FaAngleRight className="w-3 h-3 text-gray-400 mx-1" />
                <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2 dark:text-gray-400">Detail</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-600">
          <h2 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Edit Membership Schedule</h2>
          {success && <div className="text-green-400 mb-2">{success}</div>}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="space-y-4 mb-4">
            <div>
              <label className="block font-medium text-gray-200 mb-1">Member</label>
              <select name="user_id" value={form.user_id} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="">Pilih Member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Plan</label>
              <select name="membership_plan_id" value={form.membership_plan_id} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="">Pilih Plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Schedule Date</label>
              <input type="date" name="schedule_date" value={form.schedule_date} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit} />
            </div>
            {console.log("form", form)}
            <div>
              <label className="block font-medium text-gray-200 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex justify-between mt-8">
              <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                <Link href="/admin/membership/schedules">Back</Link>
              </div>
              <div className="flex gap-3">
                {!edit ? (
                  <>
                    <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={() => setEdit(true)}>Edit</button>
                    <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleDelete} disabled={formLoading}>Delete</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
                    <button type="button" className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={() => setEdit(false)}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
