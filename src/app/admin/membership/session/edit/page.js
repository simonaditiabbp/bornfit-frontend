// Edit Membership Session
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaAngleRight, FaIdCard } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditMembershipSessionPage() {
  const [form, setForm] = useState(null);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [edit, setEdit] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  const formatDateForInput = (isoString) => isoString ? isoString.split("T")[0] : "";

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchData = async () => {
      setLoading(true);
      try {
        const resSession = await fetch(`${API_URL}/api/memberships/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resUsers = await fetch(`${API_URL}/api/users?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resUserStaff = await fetch(`${API_URL}/api/users?exclude_role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resPlans = await fetch(`${API_URL}/api/membership-plans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const sessionData = await resSession.json();
        const usersData = await resUsers.json();
        const usersDataStaff = await resUserStaff.json();
        const plansData = await resPlans.json();
        setForm(sessionData.data || null);
        setUsers(usersData.data?.users || []);
        setStaff(usersDataStaff.data?.users || []);
        setPlans(plansData.data?.membershipPlans || []);
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
      let startDateIso = form.start_date;
      if (startDateIso && startDateIso.length === 10) {
        startDateIso = startDateIso + 'T00:00:00.000Z';
      }
      await fetch(`${API_URL}/api/memberships/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: Number(form.user_id),
          membership_plan_id: Number(form.membership_plan_id),
          start_date: startDateIso,
          // end_date: form.end_date,
          sales_type: form.sales_type,
          additional_fee: form.additional_fee ? Number(form.additional_fee) : 0,
          discount_type: form.discount_type,
          discount_amount: form.discount_type === 'amount' && form.discount_amount !== '' ? Number(form.discount_amount) : null,
          discount_percent: form.discount_type === 'percent' && form.discount_percent !== '' ? Number(form.discount_percent) : null,
          extra_duration_days: form.extra_duration_days ? Number(form.extra_duration_days) : 0,
          note: form.note,
          referral_user_member_id: form.referral_user_member_id ? Number(form.referral_user_member_id) : null,
          referral_user_staff_id: form.referral_user_staff_id ? Number(form.referral_user_staff_id) : null,
          status: form.status,
          is_active: form.is_active,
          final_price: Number(form.final_price)
        })
      });
      setSuccess('Session updated');
      setEdit(false);
      // setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError('Gagal update session');
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus session ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/memberships/${id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      router.push('/admin/membership/session');
    } catch (err) {
      setError('Gagal menghapus session');
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
                <FaIdCard className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/membership/session" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2 dark:text-gray-400">Membership Details</Link>
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
          <h2 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Membership Session Details</h2>
          {success && <div className="text-green-400 mb-2">{success}</div>}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="space-y-4 mb-4">
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Member <span className="text-red-400">*</span></label>
              <select name="user_id" value={form.user_id} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="">Pilih Member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Plan <span className="text-red-400">*</span></label>
              <select name="membership_plan_id" value={form.membership_plan_id} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="">Pilih Plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Start Date <span className="text-red-400">*</span></label>
              <input type="date" name="start_date" value={formatDateForInput(form.start_date)} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit} />
            </div>
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Sales Type <span className="text-red-400">*</span></label>
              <select name="sales_type" value={form.sales_type} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="new">New</option>
                <option value="renewal">Renewal</option>
                <option value="upgrade">Upgrade</option>
                <option value="downgrade">Downgrade</option>
              </select>
            </div>
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Status <span className="text-red-400">*</span></label>
              <select name="status" value={form.status} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Is Active <span className="text-red-400">*</span></label>
              <select name="is_active" value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit}>
                <option value="true">Ya</option>
                <option value="false">Tidak</option>
              </select>
            </div>
            <div>
              <label className={`block font-medium text-gray-200 mb-1`}>Final Price <span className="text-red-400">*</span></label>
              <input type="number" name="final_price" value={form.final_price || ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} required disabled={!edit} />
            </div>
            <div>
                  <label className={`block font-medium text-gray-200 mb-1`}>Referral Staff/Sales</label>
                  <select name="referral_user_staff_id" value={form.referral_user_staff_id || ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit}>
                    <option value="">Pilih Referral Staff/Sales</option>
                    {staff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
                <span className="font-medium text-gray-200">View Additional Settings</span>
              </label>
            </div>
            {showAdditional && (
              <>
                <div>
                  <label className={`block font-medium text-gray-200 mb-1`}>Additional Fee</label>
                  <input type="number" name="additional_fee" value={form.additional_fee || ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit} />
                </div>
                <div>
                  <label className="block font-medium text-gray-200 mb-1">Discount Type</label>
                  <select name="discount_type" value={form.discount_type} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit}>
                    <option value="amount">Amount</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>
                {form.discount_type === 'amount' && (
                  <div>
                    <label className="block font-medium text-gray-200 mb-1">Value Amount</label>
                    <input type="number" name="discount_amount" value={form.discount_amount ?? ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit} />
                  </div>
                )}
                {form.discount_type === 'percent' && (
                  <div>
                    <label className="block font-medium text-gray-200 mb-1">Value Percent</label>
                    <input type="number" name="discount_percent" value={form.discount_percent ?? ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit} />
                  </div>
                )}
                <div>
                  <label className={`block font-medium text-gray-200 mb-1`}>Extra Duration Days</label>
                  <input type="number" name="extra_duration_days" value={form.extra_duration_days || ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit} />
                </div>
                <div>
                  <label className={`block font-medium text-gray-200 mb-1`}>Referral Member</label>
                  <select name="referral_user_member_id" value={form.referral_user_member_id || ''} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit}>
                    <option value="">Pilih Referral Member</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block font-medium text-gray-200 mb-1`}>Note</label>
                  <input type="text" name="note" value={form.note} onChange={handleChange} className={`w-full p-3 text-gray-200 border rounded-lg ${edit ? 'bg-gray-700 border-gray-200' : 'bg-gray-700 border-gray-600'}`} disabled={!edit} />
                </div>
              </>
            )}
            <div className="flex justify-between mt-8">
              <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                <Link href="/admin/membership/session">Back</Link>
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
