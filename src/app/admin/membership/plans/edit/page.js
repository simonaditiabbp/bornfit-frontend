// Edit Membership Plan
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';
import LoadingSpin from '@/components/admin/LoadingSpin';

export default function EditMembershipPlanPage() {
  const [form, setForm] = useState({
    name: '',
    duration_value: '',
    duration_unit: 'day',
    price: '',
    // Hide and set default values for these fields
    category: 'REGULAR',
    loyalty_point: 0,
    access_type: 'ALL',
    class_access_type: 'ALL',
    description: '',
    max_session: '',
    allow_unlimited_session: false,
    available_from: '',
    available_until: '',
    quota_max_sold: '',
    always_available: false,
    level: 1
  });
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const formatDateForInput = s => s ? new Date(new Date(s).getTime() - new Date().getTimezoneOffset()*60000) .toISOString().slice(0,16) : "";
  const formatDateOnlyForInput = s => s 
    ? new Date(new Date(s).getTime())
        .toISOString().slice(0, 10) // <-- Hanya mengambil YYYY-MM-DD
    : "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const planData = await api.get(`/api/membership-plans/${id}`);
        setForm(planData.data || null);
      } catch (err) {
        setError('Gagal fetch data');
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Helper for dynamic field visibility
  const showMaxSession = !form.allow_unlimited_session;
  const showQuotaMaxSold = !form.always_available;

  // Update allow_unlimited_session and always_available to also set default values
  const handleSelectChange = e => {
    const { name, value } = e.target;
    if (name === 'allow_unlimited_session') {
      setForm(f => ({
        ...f,
        allow_unlimited_session: value === 'true',
        max_session: value === 'true' ? 99999 : f.max_session
      }));
    } else if (name === 'always_available') {
      setForm(f => ({
        ...f,
        always_available: value === 'true',
        quota_max_sold: value === 'true' ? 99999 : f.quota_max_sold
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let availableFromIso = form.available_from;
      if (availableFromIso && availableFromIso.length === 10) {
          availableFromIso = availableFromIso + 'T00:00:00.000Z';
      }
      else if (availableFromIso && availableFromIso.length === 16) {
          availableFromIso = availableFromIso + ':00.000Z';
      }

      let availableUntilIso = form.available_until;
      if (availableUntilIso && availableUntilIso.length === 10) {
          availableUntilIso = availableUntilIso + 'T00:00:00.000Z';
      }
      else if (availableUntilIso && availableUntilIso.length === 16) {
          availableUntilIso = availableUntilIso + ':00.000Z';
      }
      
      await api.put(`/api/membership-plans/${id}`, {
        name: form.name,
        duration_value: Number(form.duration_value),
        duration_unit: form.duration_unit,
        price: Number(form.price),
        category: form.category,
        loyalty_point: Number(form.loyalty_point),
        description: form.description,
        access_type: form.access_type,
        class_access_type: form.class_access_type,
        max_session: form.max_session ? Number(form.max_session) : null,
        allow_unlimited_session: Boolean(form.allow_unlimited_session),
        available_from: availableFromIso || null,
        available_until: availableUntilIso || null,
        quota_max_sold: form.quota_max_sold ? Number(form.quota_max_sold) : null,
        always_available: Boolean(form.always_available),
        level: Number(form.level)
      });
      router.push('/admin/membership/plans');
    } catch (err) {
      setError(err.data?.message || 'Failed to update plan');
      console.log("error: ", err);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/membership-plans/${id}`);
      router.push('/admin/membership/plans');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete plan');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (loading || !form) return <LoadingSpin />;

  return (
    <div>        
      <PageBreadcrumb 
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/settings' },
          { label: 'Membership Plans', href: '/admin/membership/plans' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Edit Membership Plan</h1>
          <ActionButton href="/admin/membership/plans" variant="gray">Back</ActionButton>
        </div>
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
          
          <div className="space-y-4 mb-4">
            <FormInput
              label="Plan Name"
              placeholder="Enter plan name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              disabled={!edit}
              required
            />
           
           <div className="flex gap-2 items-center">
                <div className="flex-1">
                    <FormInput
                      label="Duration Value"
                      placeholder="Enter duration"
                      name="duration_value"
                      type="number"
                      value={form.duration_value}
                      onChange={handleChange}
                      disabled={!edit}
                      required
                    />
                </div>
                <div className="w-32">
                    <FormInput
                      label="Duration Unit"
                      name="duration_unit"
                      type="select"
                      value={form.duration_unit}
                      onChange={handleChange}
                      disabled={!edit}
                      options={[
                        { value: 'day', label: 'Day' },
                        { value: 'month', label: 'Month' }
                      ]}
                    />
                </div>
            </div>
            
            <FormInput
              label="Price"
              placeholder="Enter price"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              disabled={!edit}
              required
            />
            
            {/* Hidden fields with default values */}
            <input type="hidden" name="category" value={form.category} onChange={handleChange} />
            <input type="hidden" name="loyalty_point" value={form.loyalty_point} onChange={handleChange} />
            <input type="hidden" name="access_type" value={form.access_type} onChange={handleChange} />
            <input type="hidden" name="class_access_type" value={form.class_access_type} onChange={handleChange} />
            
            <FormInput
              label="Description"
              placeholder="Enter description"
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              disabled={!edit}
            />
            
            <FormInput
              label="Allow Unlimited Session"
              name="allow_unlimited_session"
              type="select"
              value={form.allow_unlimited_session ? 'true' : 'false'}
              onChange={handleSelectChange}
              disabled={!edit}
              options={[
                { value: 'false', label: 'Tidak' },
                { value: 'true', label: 'Ya' }
              ]}
            />
            
            {showMaxSession && (
              <FormInput
                label="Max Session"
                name="max_session"
                type="number"
                value={form.max_session || ''}
                onChange={handleChange}
                disabled={!edit}
              />
            )}
           {console.log('Rendering available_from:', form.available_from)}
           <div className="flex gap-2">
              <div className="flex-1">
                  <FormInput
                    label="Available From"
                    name="available_from"
                    type="date"
                    value={formatDateOnlyForInput(form.available_from) || ''}
                    onChange={handleChange}
                    disabled={!edit}
                  />
              </div>
              <div className="flex-1">
                  <FormInput
                    label="Available Until"
                    name="available_until"
                    type="date"
                    value={formatDateOnlyForInput(form.available_until) || ''}
                    onChange={handleChange}
                    disabled={!edit}
                  />
              </div>
            </div>
            
            <FormInput
              label="Always Available"
              name="always_available"
              type="select"
              value={form.always_available ? 'true' : 'false'}
              onChange={handleSelectChange}
              disabled={!edit}
              options={[
                { value: 'false', label: 'Tidak' },
                { value: 'true', label: 'Ya' }
              ]}
            />
            
            {showQuotaMaxSold && (
              <FormInput
                label="Quota Max Sold"
                name="quota_max_sold"
                type="number"
                value={form.quota_max_sold || ''}
                onChange={handleChange}
                disabled={!edit}
              />
            )}
            
            <FormInput
              label="Level"
              name="level"
              type="number"
              value={form.level || ''}
              onChange={handleChange}
              disabled={!edit}
              required
            />
          </div>

          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <ActionButton onClick={() => setEdit(true)} variant="primary">Edit</ActionButton>
                <ActionButton onClick={handleDelete} variant="danger" disabled={formLoading}>Delete</ActionButton>
              </>
            ) : (
              <>
                <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
                <ActionButton onClick={() => setEdit(false)} variant="gray">Cancel</ActionButton>
              </>
            )}
          </div>
      </PageContainerInsert>
    </div>
  );
}
