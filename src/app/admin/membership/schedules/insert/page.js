// Insert Membership Schedule
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaAngleRight, FaCalendar } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InsertMembershipSchedulePage() {
  const [form, setForm] = useState({
    user_id: '',
    membership_plan_id: '',
    schedule_date: '',
    status: 'pending'
  });
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchDropdowns = async () => {
      try {
        const resUsers = await fetch(`${API_URL}/api/users?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resPlans = await fetch(`${API_URL}/api/membership-plans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const usersData = await resUsers.json();
        const plansData = await resPlans.json();
        setUsers(usersData.data?.users || []);
        setPlans(plansData.data?.membershipPlans || []);
      } catch {}
    };
    fetchDropdowns();
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-plan-schedules`, {
        method: 'POST',
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
      router.push('/admin/membership/schedules');
    } catch (err) {
      setError('Gagal menyimpan schedule');
    }
    setLoading(false);
  };

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
                <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2 dark:text-gray-400">Create</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-600">
          <h2 className="text-3xl font-bold mb-8 text-gray-200 text-center border-b border-gray-600 pb-3">Tambah Membership Schedule</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-200 mb-1">Member <span className="text-red-400">*</span></label>
              <select name="user_id" value={form.user_id} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required>
                <option value="">Pilih Member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Plan <span className="text-red-400">*</span></label>
              <select name="membership_plan_id" value={form.membership_plan_id} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required>
                <option value="">Pilih Plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Schedule Date <span className="text-red-400">*</span></label>
              <input type="date" name="schedule_date" value={form.schedule_date} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required />
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded">
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
              <button type="button" className="flex-1 bg-gray-600 text-white py-2 rounded font-bold hover:bg-gray-700" onClick={() => router.push('/admin/membership/schedules')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
