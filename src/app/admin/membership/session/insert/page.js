// Insert Membership Session
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InsertMembershipSessionPage() {
  const searchParams = useSearchParams();
  const memberIdFromQuery = searchParams.get('member_id') || '';
  const [form, setForm] = useState({
    user_id: memberIdFromQuery,
    membership_plan_id: '',
    start_date: '',
    sales_type: 'new',
    additional_fee: '',
    discount_type: 'amount',
    discount_amount: '',
    discount_percent: '',
    extra_duration_days: '',
    note: '',
    referral_user_member_id: '',
    referral_user_staff_id: '',
    // status: 'active',
  });
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchDropdowns = async () => {
      try {
        const resUsers = await fetch(`${API_URL}/api/users?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resPlans = await fetch(`${API_URL}/api/membership-plans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resStaff = await fetch(`${API_URL}/api/users?exclude_role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const usersData = await resUsers.json();
        const plansData = await resPlans.json();
        const staffData = await resStaff.json();
        setUsers(usersData.data?.users || []);
        setPlans(plansData.data?.membershipPlans || []);
        setStaff(staffData.data?.users || []);
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
      let startDateIso = form.start_date;
      if (startDateIso && startDateIso.length === 10) {
        startDateIso = startDateIso + 'T00:00:00.000Z';
      }
      await fetch(`${API_URL}/api/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: Number(form.user_id),
          membership_plan_id: Number(form.membership_plan_id),
          start_date: startDateIso,
          sales_type: form.sales_type,
          additional_fee: form.additional_fee ? Number(form.additional_fee) : 0,
          discount_type: form.discount_type,
          discount_amount: form.discount_type === 'amount' && form.discount_amount !== '' ? Number(form.discount_amount) : null,
          discount_percent: form.discount_type === 'percent' && form.discount_percent !== '' ? Number(form.discount_percent) : null,
          extra_duration_days: form.extra_duration_days ? Number(form.extra_duration_days) : 0,
          note: form.note,
          // status: form.status ? form.status : '',
          referral_user_member_id: form.referral_user_member_id ? Number(form.referral_user_member_id) : null,
          referral_user_staff_id: form.referral_user_staff_id ? Number(form.referral_user_staff_id) : null,          
        })
      });
      router.push('/admin/membership/session');
    } catch (err) {
      setError('Gagal menyimpan session');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Create Membership Session</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Member <span className="text-red-600">*</span></label>
          <select name="user_id" value={form.user_id} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="">Pilih Member</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Plan <span className="text-red-600">*</span></label>
          <select name="membership_plan_id" value={form.membership_plan_id} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="">Pilih Plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Start Date <span className="text-red-600">*</span></label>
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required />
        </div>
        {/* <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">End Date <span className="text-red-600">*</span></label>
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required />
        </div> */}
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Sales Type <span className="text-red-600">*</span></label>
          <select name="sales_type" value={form.sales_type} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="new">New</option>
            <option value="renewal">Renewal</option>
            <option value="upgrade">Upgrade</option>
            <option value="downgrade">Downgrade</option>
          </select>
        </div>
        {/* <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Membership Status <span className="text-red-600">*</span></label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div> */}
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Final Price <span className="text-red-600">*</span></label>
          <input type="number" name="final_price" value={form.final_price || ''} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required />
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Referral Staff/Sales</label>
          <select name="referral_user_staff_id" value={form.referral_user_staff_id} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
            <option value="">Pilih Referral Staff/Sales</option>
            {staff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="mb-2">
          <label className="inline-flex items-center">
            <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">Show Additional Settings</span>
          </label>
        </div>
        {showAdditional && (
          <>
            <div>
              <label className="block font-medium text-gray-900 dark:text-white mb-1">Additional Fee</label>
              <input type="number" name="additional_fee" value={form.additional_fee} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block font-medium text-gray-900 dark:text-white mb-1">Discount Type</label>
              <select name="discount_type" value={form.discount_type} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="amount">Amount</option>
                <option value="percent">Percent</option>
              </select>
            </div>
            {form.discount_type === 'amount' && (
              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-1">Value Amount</label>
                <input type="number" name="discount_amount" value={form.discount_amount ?? ''} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
              </div>
            )}
            {form.discount_type === 'percent' && (
              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-1">Value Percent</label>
                <input type="number" name="discount_percent" value={form.discount_percent ?? ''} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
              </div>
            )}
            <div>
              <label className="block font-medium text-gray-900 dark:text-white mb-1">Extra Duration Days</label>
              <input type="number" name="extra_duration_days" value={form.extra_duration_days} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block font-medium text-gray-900 dark:text-white mb-1">Referral Member</label>
              <select name="referral_user_member_id" value={form.referral_user_member_id} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Pilih Referral Member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-900 dark:text-white mb-1">Note</label>
              <input type="text" name="note" value={form.note} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
          </>
        )}
        {/* <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
        <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded ml-2" onClick={() => router.push('/admin/membership/session')}>Cancel</button>
         */}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
          {loading ? "Saving..." : "Create Membership"}
        </button>
      </form>
    </div>
  );
}
