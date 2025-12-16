"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import LoadingSpin from "@/components/admin/LoadingSpin";
import api from '@/utils/fetchClient';

export default function ClassPlanEditPage() {
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const dataEvent = await api.get(`/api/eventplans/${id}`);
        const data = dataEvent.data || [];
        console.log('Fetched plan data:', data);
        const planForm = {
          name: data.name || "",
          access_type: data.access_type || "Regular",
          max_visitor: data.max_visitor || 0,
          minutes_per_session: data.minutes_per_session || 0,
          description: data.description || "",
          unlimited_monthly_session: data.unlimited_monthly_session || false,
          monthly_limit: data.monthly_limit || 0,
          unlimited_daily_session: data.unlimited_daily_session || false,
          daily_limit: data.daily_limit || 0,
          is_active: data.is_active ?? true
        };
        setForm(planForm);
        setInitialForm(planForm);
      } catch (err) {
        if (err.isNetworkError) setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchPlan();
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleEdit = () => {
    setEdit(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
    setForm(initialForm);
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/api/eventplans/${id}`, form);
      setSuccess('Plan updated');
      setEdit(false);
    } catch (err) {
      setError(err.data?.message || 'Failed to update plan');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/eventplans/${id}`);
      router.push('/admin/class/plans');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete plan');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (backendError) return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  if (loading || !form) return <LoadingSpin />;

  return (
    <div>
      <PageBreadcrumb
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/settings' },
          { label: 'Class Plans', href: '/admin/class/plans' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Class Plan Details</h1>
          <ActionButton
            variant="gray"
            href="/admin/class/plans"
          >
            Back
          </ActionButton>
        </div>     
        {success && <div className="text-green-400 mb-2">{success}</div>}
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <div className="space-y-4 mb-4">
          <FormInput
            label="Name"
            name="name"
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            disabled={!edit}
            required
          />
          <FormInput
            label="Access Type"
            name="access_type"
            type="select"
            value={form.access_type}
            onChange={e => setForm(f => ({ ...f, access_type: e.target.value }))}
            disabled={!edit}
            options={[
              { value: 'Regular', label: 'Regular' },
              { value: 'Premium', label: 'Premium' }
            ]}
          />
          <FormInput
            label="Max Visitor"
            name="max_visitor"
            type="number"
            value={form.max_visitor}
            onChange={e => setForm(f => ({ ...f, max_visitor: Number(e.target.value) }))}
            disabled={!edit}
          />
          <FormInput
            label="Minutes per Session"
            name="minutes_per_session"
            type="number"
            value={form.minutes_per_session}
            onChange={e => setForm(f => ({ ...f, minutes_per_session: Number(e.target.value) }))}
            disabled={!edit}
          />
          <FormInput
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            disabled={!edit}
          />
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_monthly_session" name="unlimited_monthly_session" type="checkbox" checked={form.unlimited_monthly_session} onChange={e => setForm({ ...form, unlimited_monthly_session: e.target.checked })} disabled={!edit} />
              <label htmlFor="unlimited_monthly_session" className="block mb-0 text-gray-800 dark:text-gray-200">Unlimited Monthly Session</label>
            </div>
          {!form.unlimited_monthly_session && (
            <FormInput
              label="Monthly Limit"
              name="monthly_limit"
              type="number"
              value={form.monthly_limit}
              onChange={handleChange}
              disabled={!edit}
            />
          )}
            <div className="mb-4 flex items-center gap-2">
              <input id="unlimited_daily_session" name="unlimited_daily_session" type="checkbox" checked={form.unlimited_daily_session} onChange={e => setForm({ ...form, unlimited_daily_session: e.target.checked })} disabled={!edit} />
              <label htmlFor="unlimited_daily_session" className="block mb-0 text-gray-800 dark:text-gray-200">Unlimited Daily Session</label>
            </div>
          {!form.unlimited_daily_session && (
            <FormInput
              label="Daily Limit"
              name="daily_limit"
              type="number"
              value={form.daily_limit}
              onChange={handleChange}
              disabled={!edit}
            />
          )}
            <div className="mb-4 flex items-center gap-2">
              <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} disabled={!edit} />
              <label htmlFor="is_active" className="block mb-0 text-gray-800 dark:text-gray-200">Active</label>
            </div>
          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <ActionButton variant="primary" onClick={handleEdit}>Edit</ActionButton>
                <ActionButton variant="danger" onClick={handleDelete} disabled={formLoading}>Delete</ActionButton>
              </>
            ) : (
              <>
                <ActionButton variant="primary" onClick={handleSave} disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</ActionButton>
                <ActionButton variant="gray" onClick={handleCancel}>Cancel</ActionButton>
              </>
            )}
          </div>
        </div>
      </PageContainerInsert>
    </div>
  );
}
