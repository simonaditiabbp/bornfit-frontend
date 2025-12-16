"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from '@/utils/fetchClient';
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import LoadingSpin from "@/components/admin/LoadingSpin";

export default function PTPlanEditPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState(null);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  useEffect(() => {
    if (plan && !editForm) {
      setEditForm({
        name: plan.name || "",
        duration_value: plan.duration_value || 0,
        max_session: plan.max_session || 0,
        price: plan.price || 0,
        minutes_per_session: plan.minutes_per_session || 0,
        description: plan.description || "",
      });
    }
  }, [plan, editForm]);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const dataPlan = await api.get(`/api/ptsessionplans/${id}`);
        const data = dataPlan.data;
        console.log("dataPlan: ", dataPlan)
        setPlan(data || null);
      } catch (err) {
        if (err.isNetworkError) setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchPlan();
  }, [id, edit]);

  const handleEdit = () => {
    setEdit(true);
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
  };

  const handleSave = async (form) => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/api/ptsessionplans/${id}`, { ...form });
      setSuccess("Plan updated successfully!");
      setEdit(false);
    } catch (err) {
      setError(err.data?.message || 'Failed to update plan');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/ptsessionplans/${id}`);
      router.push('/admin/pt/plans');
    } catch (err) {
      setError(err.data?.message || "Failed to delete plan");
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }
  if (loading || !editForm) return <LoadingSpin />;

  if (!plan) {
    return <div className="text-red-400 text-center font-medium mt-20">Plan not found</div>;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/settings' },
          { label: 'PT Plans', href: '/admin/pt/plans' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">PT Session Plan Details</h1>
          <ActionButton href="/admin/pt/plans" variant="gray">Back</ActionButton>
        </div>
        {editForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Name"
                name="name"
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                disabled={!edit}
                required
              />
              
              <FormInput
                label="Duration (days)"
                name="duration_value"
                type="number"
                value={editForm.duration_value}
                onChange={e => setEditForm(f => ({ ...f, duration_value: Number(e.target.value) }))}
                disabled={!edit}
                required
              />
              
              <FormInput
                label="Max Session"
                name="max_session"
                type="number"
                value={editForm.max_session}
                onChange={e => setEditForm(f => ({ ...f, max_session: Number(e.target.value) }))}
                disabled={!edit}
                required
              />
              
              <FormInput
                label="Price (Rp)"
                name="price"
                type="number"
                value={editForm.price}
                onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                disabled={!edit}
                required
              />
              
              <FormInput
                label="Minutes/Session"
                name="minutes_per_session"
                type="number"
                value={editForm.minutes_per_session}
                onChange={e => setEditForm(f => ({ ...f, minutes_per_session: Number(e.target.value) }))}
                disabled={!edit}
                required
              />
              
              <div className="col-span-2">
                <FormInput
                  label="Description"
                  name="description"
                  type="textarea"
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  disabled={!edit}
                  required
                />
              </div>
            </div>
            {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
            {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
            <div className="flex gap-3 mt-8 justify-start">
              {!edit ? (
                <>
                  <ActionButton onClick={handleEdit} variant="primary">Edit</ActionButton>
                  <ActionButton onClick={handleDelete} variant="danger">Delete</ActionButton>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    disabled={formLoading}
                    onClick={() => handleSave(editForm)}
                  >
                    {formLoading ? "Saving..." : "Save"}
                  </button>
                  <ActionButton onClick={handleCancel} variant="gray">Cancel</ActionButton>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-800 dark:text-amber-300 text-center font-medium mt-20">Loading form...</div>
        )}
      </PageContainerInsert>
    </div>
  );
}

