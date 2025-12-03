// Insert Membership Session
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaAngleRight, FaIdCard } from 'react-icons/fa';
import Link from 'next/link';

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
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaIdCard className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/membership/session" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2 dark:text-gray-400">Membership Details</Link>
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
          <h1 className="text-3xl font-bold mb-8 text-gray-200 text-center border-b border-gray-600 pb-3">Create Membership Session</h1>
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
              <label className="block font-medium text-gray-200 mb-1">Start Date <span className="text-red-400">*</span></label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required />
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Sales Type <span className="text-red-400">*</span></label>
              <select name="sales_type" value={form.sales_type} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required>
                <option value="new">New</option>
                <option value="renewal">Renewal</option>
                <option value="upgrade">Upgrade</option>
                <option value="downgrade">Downgrade</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Final Price <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  name="final_price" 
                  value={form.final_price || 0} 
                  onChange={handleChange} 
                  className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => {
                    const selectedPlan = plans.find(p => p.id === Number(form.membership_plan_id));
                    if (selectedPlan) {
                      console.log("selectedPlan.price: ", selectedPlan.price);
                      setForm(f => ({ ...f, final_price: selectedPlan.price ? selectedPlan.price : 0 }));
                    }
                  }}
                  className="bg-amber-600 text-white px-4 py-2 rounded font-medium hover:bg-amber-700 whitespace-nowrap"
                  disabled={!form.membership_plan_id}
                >
                  Plan Price
                </button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Referral Staff/Sales</label>
              <select name="referral_user_staff_id" value={form.referral_user_staff_id} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded">
                <option value="">Pilih Referral Staff/Sales</option>
                {staff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
                <span className="font-medium text-gray-200">Show Additional Settings</span>
              </label>
            </div>
            {showAdditional && (
              <>
                <div>
                  <label className="block font-medium text-gray-200 mb-1">Additional Fee</label>
                  <input type="number" name="additional_fee" value={form.additional_fee} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
                </div>
                <div>
                  <label className="block font-medium text-gray-200 mb-1">Discount Type</label>
                  <select name="discount_type" value={form.discount_type} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded">
                    <option value="amount">Amount</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>
                {form.discount_type === 'amount' && (
                  <div>
                    <label className="block font-medium text-gray-200 mb-1">Value Amount</label>
                    <input type="number" name="discount_amount" value={form.discount_amount ?? ''} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
                  </div>
                )}
                {form.discount_type === 'percent' && (
                  <div>
                    <label className="block font-medium text-gray-200 mb-1">Value Percent</label>
                    <input type="number" name="discount_percent" value={form.discount_percent ?? ''} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
                  </div>
                )}
                <div>
                  <label className="block font-medium text-gray-200 mb-1">Extra Duration Days</label>
                  <input type="number" name="extra_duration_days" value={form.extra_duration_days} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
                </div>
                <div>
                  <label className="block font-medium text-gray-200 mb-1">Referral Member</label>
                  <select name="referral_user_member_id" value={form.referral_user_member_id} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded">
                    <option value="">Pilih Referral Member</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-200 mb-1">Note</label>
                  <input type="text" name="note" value={form.note} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
                </div>
              </>
            )}
            <div className="flex gap-3 mt-6">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
                {loading ? "Saving..." : "Create Membership"}
              </button>
              <button type="button" className="flex-1 bg-gray-600 text-white py-2 rounded font-bold hover:bg-gray-700" onClick={() => router.push('/admin/membership/session')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
