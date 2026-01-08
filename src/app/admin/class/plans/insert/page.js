"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';

export default function ClassPlanInsertPage() {
  const initialFormState = {
    name: "",
    access_type: "Regular",
    max_visitor: 0,
    minutes_per_session: 0,
    description: "",
    unlimited_monthly_session: true,
    monthly_limit: 0,
    unlimited_daily_session: true,
    daily_limit: 0,
    is_active: true
  };
  
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleReset = () => {
    setForm(initialFormState);
    setError("");
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "unlimited_monthly_session") {
      setForm(f => ({
        ...f,
        unlimited_monthly_session: checked,
        monthly_limit: checked ? 999999 : f.monthly_limit
      }));
    } else if (name === "unlimited_daily_session") {
      setForm(f => ({
        ...f,
        unlimited_daily_session: checked,
        daily_limit: checked ? 999999 : f.daily_limit
      }));
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        access_type: form.access_type,
        max_visitor: parseInt(form.max_visitor, 10),
        minutes_per_session: parseInt(form.minutes_per_session, 10),
        description: form.description,
        unlimited_monthly_session: form.unlimited_monthly_session,
        monthly_limit: form.unlimited_monthly_session ? 999999 : parseInt(form.monthly_limit, 10),
        unlimited_daily_session: form.unlimited_daily_session,
        daily_limit: form.unlimited_daily_session ? 999999 : parseInt(form.daily_limit, 10),
        is_active: form.is_active
      };
      await api.post('/api/eventplans', payload);
      router.push("/admin/class/plans");
    } catch (err) {
      setError(err.data?.message || 'Failed to add plan');
      console.log("error: ", err);
    }
    setLoading(false);
  }

  return (
    <div>
      <PageBreadcrumb
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/settings' },
          { label: 'Class Plans', href: '/admin/class/plans' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create Class Plan</h1>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Plan Name"
            placeholder="Enter plan name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Access Type"
            name="access_type"
            type="select"
            value={form.access_type}
            onChange={handleChange}
            options={[
              { value: 'Regular', label: 'Regular' },
              { value: 'Premium', label: 'Premium' }
            ]}
          />
          <FormInput
            label="Max Visitor"
            placeholder="Enter max visitor"
            name="max_visitor"
            type="number"
            value={form.max_visitor}
            onChange={handleChange}
          />
          <FormInput
            label="Minutes per Session"
            placeholder="Enter minutes per session"
            name="minutes_per_session"
            type="number"
            value={form.minutes_per_session}
            onChange={handleChange}
          />
          <FormInput
            label="Description"
            placeholder="Enter description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={handleChange}
          />
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_monthly_session" name="unlimited_monthly_session" type="checkbox" checked={form.unlimited_monthly_session} onChange={e => setForm({ ...form, unlimited_monthly_session: e.target.checked })} />
              <label htmlFor="unlimited_monthly_session" className="block mb-0 text-gray-800 dark:text-gray-200">Unlimited Monthly Session</label>
            </div>
          {!form.unlimited_monthly_session && (
            <FormInput
              label="Monthly Limit"
              placeholder="Enter monthly limit"
              name="monthly_limit"
              type="number"
              value={form.monthly_limit}
              onChange={handleChange}
            />
          )}
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_daily_session" name="unlimited_daily_session" type="checkbox" checked={form.unlimited_daily_session} onChange={e => setForm({ ...form, unlimited_daily_session: e.target.checked })} />
              <label htmlFor="unlimited_daily_session" className="block mb-0 text-gray-800 dark:text-gray-200">Unlimited Daily Session</label>
            </div>
          {!form.unlimited_daily_session && (
            <FormInput
              label="Daily Limit"
              placeholder="Enter daily limit"
              name="daily_limit"
              type="number"
              value={form.daily_limit}
              onChange={handleChange}
            />
          )}
            <div className="mb-4 flex items-center gap-2">
              <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="block mb-0 text-gray-800 dark:text-gray-200">Active</label>
            </div>
          <FormActions
            onReset={handleReset}
            cancelHref="/admin/class/plans"
            loading={loading}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
