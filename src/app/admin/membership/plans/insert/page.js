// Insert Membership Plan
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput, FormInputGroup } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InsertMembershipPlanPage() {
  const getDefaultAvailableUntil = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  };

  const initialFormState = {
    name: '',
    duration_value: '',
    duration_unit: 'day',
    price: '',
    category: 'REGULAR',
    loyalty_point: 0,
    access_type: 'ALL',
    class_access_type: 'ALL',
    description: '',
    max_session: '',
    allow_unlimited_session: true,
    available_from: new Date().toISOString().slice(0, 10),
    available_until: getDefaultAvailableUntil(),
    quota_max_sold: '',
    always_available: true,
    level: 1
  };
  
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleReset = () => {
    setForm(initialFormState);
    setError('');
  };

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
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
        })
      });
      router.push('/admin/membership/plans');
    } catch (err) {
      setError('Gagal menyimpan plan');
    }
    setLoading(false);
  };

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/settings' },
          { label: 'Membership Plans', href: '/admin/membership/plans' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Create Membership Plan</h1>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Plan"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <FormInputGroup>
            <div className="flex-1">
              <FormInput
                label="Duration Value"
                name="duration_value"
                type="number"
                value={form.duration_value}
                onChange={handleChange}
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
                options={[
                  { value: 'day', label: 'Day' },
                  { value: 'month', label: 'Month' }
                ]}
              />
            </div>
          </FormInputGroup>

          <FormInput
            label="Harga"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
          />

          <FormInput
            label="Keterangan"
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          <FormInput
            label="Allow Unlimited Session"
            name="allow_unlimited_session"
            type="select"
            value={form.allow_unlimited_session ? 'true' : 'false'}
            onChange={handleSelectChange}
            options={[
              { value: 'false', label: 'Tidak' },
              { value: 'true', label: 'Ya' }
            ]}
            required
          />

          {showMaxSession && (
            <FormInput
              label="Max Session"
              name="max_session"
              type="number"
              value={form.max_session || ''}
              onChange={handleChange}
            />
          )}

          <FormInputGroup>
            <div className="flex-1">
              <FormInput
                label="Available From"
                name="available_from"
                type="date"
                value={form.available_from}
                onChange={handleChange}
              />
            </div>
            <div className="flex-1">
              <FormInput
                label="Available Until"
                name="available_until"
                type="date"
                value={form.available_until}
                onChange={handleChange}
              />
            </div>
          </FormInputGroup>

          <FormInput
            label="Always Available"
            name="always_available"
            type="select"
            value={form.always_available ? 'true' : 'false'}
            onChange={handleSelectChange}
            options={[
              { value: 'false', label: 'Tidak' },
              { value: 'true', label: 'Ya' }
            ]}
            required
          />

          {showQuotaMaxSold && (
            <FormInput
              label="Quota Max Sold"
              name="quota_max_sold"
              type="number"
              value={form.quota_max_sold || ''}
              onChange={handleChange}
            />
          )}

          <FormInput
            label="Level"
            name="level"
            type="number"
            value={form.level}
            onChange={handleChange}
            required
          />

          <FormActions
            onReset={handleReset}
            cancelHref="/admin/membership/plans"
            isSubmitting={loading}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}