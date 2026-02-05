'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaIdCard } from 'react-icons/fa';
import api from '@/utils/fetchClient';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput, FormInputGroup } from '@/components/admin';

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
    const fetchDropdowns = async () => {
      try {
        const [usersData, plansData, staffData] = await Promise.all([
          api.get('/api/users?role=member&limit=10000'),
          api.get('/api/membership-plans?limit=10000'),
          api.get('/api/users?role=admin,trainer,instructor,opscan&limit=10000')
        ]);
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
      let startDateIso = form.start_date;
      if (startDateIso && startDateIso.length === 10) {
        startDateIso = startDateIso + 'T00:00:00.000Z';
      }
      await api.post('/api/memberships', {
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
        referral_user_member_id: form.referral_user_member_id ? Number(form.referral_user_member_id) : null,
        referral_user_staff_id: form.referral_user_staff_id ? Number(form.referral_user_staff_id) : null,          
      });
      router.push('/admin/membership/session');
    } catch (err) {
      setError(err.data?.message || 'Failed to add membership session');
      console.log("error: ", err);
    }
    setLoading(false);
  };

  const selectedUser = users.length > 0 && form.user_id ? users.find(u => u.id === form.user_id) ?? null : null;
  const selectedPlan = plans.length > 0 && form.membership_plan_id ? plans.find(p => p.id === form.membership_plan_id) ?? null : null;
  const selectedStaffRefferal = staff.length > 0 && form.referral_user_staff_id ? staff.find(s => s.id === form.referral_user_staff_id) ?? null : null;
  const selectedMemberReferral = users.length > 0 && form.referral_user_member_id ? users.find(u => u.id === form.referral_user_member_id) ?? null : null;

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
          <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create Membership Session</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Member"
              name="user_id"
              type="searchable-select"
              placeholder='Search Member'
              value={ selectedUser ? { value: selectedUser.id, label: selectedUser.name }
                    : null }
              onChange={(opt) =>
                setForm(prev => ({ ...prev, user_id: opt?.value || '' }))
              }
              options={users.map(u => ({
                value: u.id,
                label: u.name
              }))}
              required
            />
            <FormInput
              label="Plan"
              name="membership_plan_id"
              type="searchable-select"
              placeholder='Search Plan'
              value={ selectedPlan ? { value: selectedPlan.id, label: selectedPlan.name }
                    : null }
              onChange={(opt) =>
                setForm(prev => ({ ...prev, membership_plan_id: opt?.value || '' }))
              }
              options={plans.map(u => ({
                value: u.id,
                label: u.name
              }))}
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
              <label className="block font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">Final Price <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  name="final_price" 
                  value={form.final_price || 0} 
                  onChange={handleChange} 
                  className="flex-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 p-2 rounded font-medium text-sm" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => {
                    const selectedPlan = plans.find(p => p.id === Number(form.membership_plan_id));
                    if (selectedPlan) {
                      setForm(f => ({ ...f, final_price: selectedPlan.price ? selectedPlan.price : 0 }));
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-semibold transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!form.membership_plan_id}
                >
                  Plan Price
                </button>
              </div>
            </div>
            <FormInput
              label="Referral Staff/Sales"
              name="referral_user_staff_id"
              type="searchable-select"
              placeholder='Select Referral Staff/Sales'
              value={ selectedStaffRefferal ? { value: selectedStaffRefferal.id, label: selectedStaffRefferal.name }
                    : null }
              onChange={(opt) =>
                setForm(prev => ({ ...prev, referral_user_staff_id: opt?.value || '' }))
              }
              options={staff.map(s => ({
                value: s.id,
                label: s.name
              }))}
            />
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Show Additional Settings</span>
              </label>
            </div>
            {showAdditional && (
              <>
                <FormInput
                  label="Additional Fee"
                  placeholder="Enter additional fee"
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
                    placeholder="Enter value amount"
                    name="discount_amount"
                    type="number"
                    value={form.discount_amount ?? ''}
                    onChange={handleChange}
                  />
                )}
                {form.discount_type === 'percent' && (
                  <FormInput
                    label="Value Percent (%)"
                    placeholder="Enter value percent"
                    name="discount_percent"
                    type="number"
                    value={form.discount_percent ?? ''}
                    onChange={handleChange}
                  />
                )}
                <FormInput
                  label="Extra Duration Days"
                  placeholder="Enter extra duration days"
                  name="extra_duration_days"
                  type="number"
                  value={form.extra_duration_days}
                  onChange={handleChange}
                />
                <FormInput
                  label="Referral Member"
                  name="referral_user_member_id"
                  type="searchable-select"
                  placeholder='Select Referral Member'
                  value={ selectedMemberReferral ? { value: selectedMemberReferral.id, label: selectedMemberReferral.name }
                        : null }
                  onChange={(opt) =>
                    setForm(prev => ({ ...prev, referral_user_member_id: opt?.value || '' }))
                  }
                  options={users.map(u => ({
                    value: u.id,
                    label: u.name
                  }))}
                />
                <FormInput
                  label="Note"
                  placeholder="Enter a note"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                />
              </>
            )}
          {error && <div className="text-red-400 mb-2">{error}</div>}

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
