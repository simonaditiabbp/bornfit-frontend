// Edit Membership Session
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';
import LoadingSpin from '@/components/admin/LoadingSpin';

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionData, usersData, usersDataStaff, plansData] = await Promise.all([
          api.get(`/api/memberships/${id}`),
          api.get('/api/users?role=member&limit=10000'),
          api.get('/api/users?exclude_role=member&limit=10000'),
          api.get('/api/membership-plans?&limit=10000')
        ]);
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
      let startDateIso = form.start_date;
      if (startDateIso && startDateIso.length === 10) {
        startDateIso = startDateIso + 'T00:00:00.000Z';
      }
      await api.put(`/api/memberships/${id}`, {
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
      });
      setSuccess('Session updated');
      setEdit(false);
      // setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError(err.data?.message || 'Failed to update membership session');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/memberships/${id}`);
      router.push('/admin/membership/session');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete membership session');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (loading || !form) return <LoadingSpin />;

  const selectedUser = users.length > 0 && form.user_id ? users.find(u => u.id === form.user_id) ?? null : null;
  const selectedPlan = plans.length > 0 && form.membership_plan_id ? plans.find(p => p.id === form.membership_plan_id) ?? null : null;
  const selectedStaff = staff.length > 0 && form.referral_user_staff_id ? staff.find(s => s.id === form.referral_user_staff_id) ?? null : null;

  return (
    <div>      
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
          <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Membership Session Details</h1>
            <ActionButton
              href="/admin/membership/session"
              variant="gray"
            >
              Back
            </ActionButton>
          </div>          
          <div className="space-y-4 mb-4">
            <FormInput
              label="Member"
              name="user_id"
              type="searchable-select"
              placeholder='Search Member'
              disabled={!edit}
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
              disabled={!edit}
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
              value={formatDateForInput(form.start_date)}
              onChange={handleChange}
              disabled={!edit}
              required
            />
            
            <FormInput
              label="Sales Type"
              name="sales_type"
              type="select"
              value={form.sales_type}
              onChange={handleChange}
              disabled={!edit}
              required
              options={[
                { value: 'new', label: 'New' },
                { value: 'renewal', label: 'Renewal' },
                { value: 'upgrade', label: 'Upgrade' },
                { value: 'downgrade', label: 'Downgrade' }
              ]}
            />
            
            <FormInput
              label="Status"
              name="status"
              type="select"
              value={form.status}
              onChange={handleChange}
              disabled={!edit}
              required
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' }
              ]}
            />
            
            <FormInput
              label="Is Active"
              name="is_active"
              type="select"
              value={form.is_active ? 'true' : 'false'}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
              disabled={!edit}
              required
              options={[
                { value: 'true', label: 'Ya' },
                { value: 'false', label: 'Tidak' }
              ]}
            />
            
            <div>
              <label className={`block font-medium text-gray-800 dark:text-gray-200 mb-1`}>Final Price <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <input type="number" name="final_price" value={form.final_price || ''} onChange={handleChange} className={`flex-1 p-3 border rounded-lg ${edit ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700'}`} required disabled={!edit} />
                <button
                  type="button"
                  onClick={() => {
                    const selectedPlan = plans.find(p => p.id === Number(form.membership_plan_id));
                    if (selectedPlan) {
                      setForm(f => ({ ...f, final_price: selectedPlan.price }));
                    }
                  }}
                  disabled={!form.membership_plan_id || !edit}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!edit}
              value={ selectedStaff ? { value: selectedStaff.id, label: selectedStaff.name }
                    : null }
              onChange={(opt) =>
                setForm(prev => ({ ...prev, referral_user_staff_id: opt?.value || '' }))
              }
              options={staff.map(s => ({
                value: s.id,
                label: s.name
              }))}
              required
            />
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={showAdditional} onChange={e => setShowAdditional(e.target.checked)} className="mr-2" />
                <span className="font-medium text-gray-800 dark:text-gray-200">View Additional Settings</span>
              </label>
            </div>
            {showAdditional && (
              <>
                <FormInput
                  label="Additional Fee"
                  name="additional_fee"
                  type="number"
                  value={form.additional_fee || ''}
                  onChange={handleChange}
                  disabled={!edit}
                />
                
                <FormInput
                  label="Discount Type"
                  name="discount_type"
                  type="select"
                  value={form.discount_type}
                  onChange={handleChange}
                  disabled={!edit}
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
                    disabled={!edit}
                  />
                )}
                {form.discount_type === 'percent' && (
                  <FormInput
                    label="Value Percent"
                    name="discount_percent"
                    type="number"
                    value={form.discount_percent ?? ''}
                    onChange={handleChange}
                    disabled={!edit}
                  />
                )}
                
                <FormInput
                  label="Extra Duration Days"
                  name="extra_duration_days"
                  type="number"
                  value={form.extra_duration_days || ''}
                  onChange={handleChange}
                  disabled={!edit}
                />
                
                <FormInput
                  label="Referral Member"
                  name="referral_user_member_id"
                  type="searchable-select"
                  placeholder='Select Referral Member'
                  disabled={!edit}
                  value={ selectedUser ? { value: selectedUser.id, label: selectedUser.name }
                        : null }
                  onChange={(opt) =>
                    setForm(prev => ({ ...prev, referral_user_member_id: opt?.value || '' }))
                  }
                  options={users.map(u => ({
                    value: u.id,
                    label: u.name
                  }))}
                  required
                />
                
                <FormInput
                  label="Note"
                  name="note"
                  type="text"
                  value={form.note}
                  onChange={handleChange}
                  disabled={!edit}
                />
              </>
            )}
          {success && <div className="text-green-400 mb-2">{success}</div>}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <ActionButton onClick={() => setEdit(true)} variant="primary">Edit</ActionButton>
                <ActionButton onClick={handleDelete} variant="danger" disabled={formLoading}>Delete</ActionButton>
              </>
            ) : (
              <>
                <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
                <ActionButton onClick={() => setEdit(false)} variant="gray">Cancel</ActionButton>
              </>
            )}
          </div>
        </div>
      </PageContainerInsert>
    </div>
  );
}
