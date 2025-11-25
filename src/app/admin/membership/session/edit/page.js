// Edit Membership Session
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditMembershipSessionPage() {
  const [form, setForm] = useState(null);
  const [users, setUsers] = useState([]);
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
        const resPlans = await fetch(`${API_URL}/api/membership-plans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const sessionData = await resSession.json();
        const usersData = await resUsers.json();
        const plansData = await resPlans.json();
        setForm(sessionData.data || null);
        setUsers(usersData.data?.users || []);
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
          end_date: form.end_date,
          sales_type: form.sales_type,
          additional_fee: form.additional_fee ? Number(form.additional_fee) : 0,
          discount_type: form.discount_type,
          discount_amount: form.discount_type === 'amount' && form.discount_amount !== '' ? Number(form.discount_amount) : null,
          discount_percent: form.discount_type === 'percent' && form.discount_percent !== '' ? Number(form.discount_percent) : null,
          extra_duration_days: form.extra_duration_days ? Number(form.extra_duration_days) : 0,
          note: form.note,
          referral_user_id: form.referral_user_id ? Number(form.referral_user_id) : null,
          status: form.status,
          is_active: form.is_active
        })
      });
      setSuccess('Session updated');
      setEdit(false);
      setTimeout(() => window.location.reload(), 500);
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

  if (loading || !form) return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-blue-700 border-b pb-3">Membership Session Details</h2>
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="space-y-4 mb-4">
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Member <span className="text-red-600">*</span></label>
          <select name="user_id" value={form.user_id} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="">Pilih Member</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Plan <span className="text-red-600">*</span></label>
          <select name="membership_plan_id" value={form.membership_plan_id} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="">Pilih Plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Start Date <span className="text-red-600">*</span></label>
          <input type="date" name="start_date" value={formatDateForInput(form.start_date)} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>End Date <span className="text-red-600">*</span></label>
          <input type="date" name="end_date" value={formatDateForInput(form.end_date)} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
        {/* <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>End Date <span className="text-red-600">*</span></label>
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div> */}
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Sales Type <span className="text-red-600">*</span></label>
          <select name="sales_type" value={form.sales_type} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="new">New</option>
            <option value="renewal">Renewal</option>
            <option value="upgrade">Upgrade</option>
            <option value="downgrade">Downgrade</option>
          </select>
        </div>
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Status <span className="text-red-600">*</span></label>
          <select name="status" value={form.status} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Is Active <span className="text-red-600">*</span></label>
          <select name="is_active" value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit}>
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
          </select>
        </div>
        <div>
          <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Final Price <span className="text-red-600">*</span></label>
          <input type="number" name="final_price" value={form.final_price || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
        <div className="mb-2">
          <label className="inline-flex items-center">
            <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">View Additional Settings</span>
          </label>
        </div>
        {showAdditional && (
          <>
            <div>
              <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Additional Fee</label>
              <input type="number" name="additional_fee" value={form.additional_fee || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
            </div>
            <div>
              <label className="block font-medium text-gray-900 dark:text-white mb-1">Discount Type</label>
              <select name="discount_type" value={form.discount_type} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit}>
                <option value="amount">Amount</option>
                <option value="percent">Percent</option>
              </select>
            </div>
            {form.discount_type === 'amount' && (
              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-1">Value Amount</label>
                <input type="number" name="discount_amount" value={form.discount_amount ?? ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
              </div>
            )}
            {form.discount_type === 'percent' && (
              <div>
                <label className="block font-medium text-gray-900 dark:text-white mb-1">Value Percent</label>
                <input type="number" name="discount_percent" value={form.discount_percent ?? ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
              </div>
            )}
            <div>
              <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Extra Duration Days</label>
              <input type="number" name="extra_duration_days" value={form.extra_duration_days || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
            </div>
            <div>
              <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Referral User</label>
              <select name="referral_user_id" value={form.referral_user_id || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit}>
                <option value="">Pilih Referral</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`block font-medium text-gray-900 dark:text-white mb-1`}>Note</label>
              <input type="text" name="note" value={form.note} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
            </div>
          </>
        )}
        <div className="flex gap-2 mt-4">
          {!edit ? (
            <>
              <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setEdit(true)}>Edit</button>
              <button type="button" className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDelete} disabled={formLoading}>Delete</button>
            </>
          ) : (
            <>
              <button type="button" className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setEdit(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
