// Insert Membership Session
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput, FormInputGroup } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InsertMembershipSessionPage() {
  const searchParams = useSearchParams();
  const memberIdFromQuery = searchParams.get('member_id') || '';
  
  const initialFormState = {
    user_id: memberIdFromQuery,
    membership_plan_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    sales_type: 'new',
    additional_fee: '',
    discount_type: 'amount',
    discount_amount: '',
    discount_percent: '',
    extra_duration_days: '',
    note: '',
    referral_user_member_id: '',
    referral_user_staff_id: '',
  };
  
  const [form, setForm] = useState(initialFormState);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);
  const router = useRouter();

  const handleReset = () => {
    setForm(initialFormState);
    setShowAdditional(false);
    setError('');
  };

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
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        {/* <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700"> */}
          <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Create Membership Session</h1>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Member"
              name="user_id"
              type="select"
              value={form.user_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Pilih Member' },
                ...users.map(u => ({ value: u.id, label: u.name }))
              ]}
              required
            />
            <FormInput
              label="Plan"
              name="membership_plan_id"
              type="select"
              value={form.membership_plan_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Pilih Plan' },
                ...plans.map(p => ({ value: p.id, label: p.name }))
              ]}
              required
            />
            <FormInput
              label="Start Date"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Sales Type"
              name="sales_type"
              type="select"
              value={form.sales_type}
              onChange={handleChange}
              options={[
                { value: 'new', label: 'New' },
                { value: 'renewal', label: 'Renewal' },
                { value: 'upgrade', label: 'Upgrade' },
                { value: 'downgrade', label: 'Downgrade' }
              ]}
              required
            />
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
            <FormInput
              label="Referral Staff/Sales"
              name="referral_user_staff_id"
              type="select"
              value={form.referral_user_staff_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Pilih Referral Staff/Sales' },
                ...staff.map(u => ({ value: u.id, label: u.name }))
              ]}
            />
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
                <span className="font-medium text-gray-200">Show Additional Settings</span>
              </label>
            </div>
            {showAdditional && (
              <>
                <FormInput
                  label="Additional Fee"
                  name="additional_fee"
                  type="number"
                  value={form.additional_fee}
                  onChange={handleChange}
                />
                <FormInput
                  label="Discount Type"
                  name="discount_type"
                  type="select"
                  value={form.discount_type}
                  onChange={handleChange}
                  options={[
                    { value: 'amount', label: 'Amount' },
                    { value: 'percent', label: 'Percent' }
                  ]}
                />
                {form.discount_type === 'amount' && (
                  <FormInput
                    label="Value Amount"
                    name="discount_amount"
                    type="number"
                    value={form.discount_amount ?? ''}
                    onChange={handleChange}
                  />
                )}
                {form.discount_type === 'percent' && (
                  <FormInput
                    label="Value Percent"
                    name="discount_percent"
                    type="number"
                    value={form.discount_percent ?? ''}
                    onChange={handleChange}
                  />
                )}
                <FormInput
                  label="Extra Duration Days"
                  name="extra_duration_days"
                  type="number"
                  value={form.extra_duration_days}
                  onChange={handleChange}
                />
                <FormInput
                  label="Referral Member"
                  name="referral_user_member_id"
                  type="select"
                  value={form.referral_user_member_id}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Pilih Referral Member' },
                    ...users.map(u => ({ value: u.id, label: u.name }))
                  ]}
                />
                <FormInput
                  label="Note"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                />
              </>
            )}
            <FormActions
              onReset={handleReset}
              cancelHref="/admin/membership/session"
              isSubmitting={loading}
            />
          </form>
        {/* </div> */}
      </PageContainerInsert>
    </div>
  );
}
