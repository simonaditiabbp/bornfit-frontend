"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from '@/utils/fetchClient';
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaChalkboardTeacher } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import LoadingSpin from "@/components/admin/LoadingSpin";

export default function PTSessionEditPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  
  const formatDateForInput = (isoString) => isoString ? isoString.split("T")[0] : "";

  useEffect(() => {
    // Fetch plans, members, and trainers for dropdown
    const fetchDropdownData = async () => {
      try {
        const [dataPlans, dataMember, dataTrainer] = await Promise.all([
          api.get('/api/ptsessionplans?limit=10000'),
          api.get('/api/users?role=member&membership=active,pending&limit=10000'),
          api.get('/api/users?role=trainer&limit=10000')
        ]);
        setPlans(dataPlans.data.plans || []);
        setMembers(dataMember.data.users || []);
        setTrainers(dataTrainer.data.users || []);
      } catch {}
    };
    fetchDropdownData();
    const fetchSession = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const dataPTSessions = await api.get(`/api/personaltrainersessions/${id}`);
        console.log("data: ", dataPTSessions)
        setSession(dataPTSessions.data);
        setForm({
          pt_session_plan_id: dataPTSessions.data.pt_session_plan_id,
          user_member_id: dataPTSessions.data.user_member_id,
          user_pt_id: dataPTSessions.data.user_pt_id,
          start_date: dataPTSessions.data.start_date?.slice(0, 16),
          status: dataPTSessions.data.status
        });
      } catch (err) {
        if (err.isNetworkError) setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchSession();
  }, [id]);

  const handleEdit = () => {
    setEdit(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
    setForm({
      pt_session_plan_id: session.pt_session_plan_id,
      user_member_id: session.user_member_id,
      user_pt_id: session.user_pt_id,
      start_date: session.start_date?.slice(0, 16),
      status: session.status
    });
  };  

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/api/personaltrainersessions/${id}`, {
        pt_session_plan_id: Number(form.pt_session_plan_id),
        user_member_id: Number(form.user_member_id),
        user_pt_id: Number(form.user_pt_id),
        start_date: formatDateToISO(form.start_date),
        status: form.status,
        id: Number(id)
      });
      setSuccess("Session successfully updated!");
      setEdit(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError(err.data?.message || 'Failed to update session');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/personaltrainersessions/${id}`);
      router.push('/admin/pt/session');
    } catch (err) {
      setError(err.data?.message || "Failed to delete session");
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }
  
  if (loading || !form) return <LoadingSpin />;

  const selectedMember = members.length > 0 && form.user_member_id ? members.find(u => u.id === form.user_member_id) ?? null : null;
  const selectedPlan = plans.length > 0 && form.pt_session_plan_id ? plans.find(p => p.id === form.pt_session_plan_id) ?? null : null;
  const selectedTrainer = trainers.length > 0 && form.user_pt_id ? trainers.find(u => u.id === form.user_pt_id) ?? null : null;

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Detail / Edit' }
      ]} />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">PT Session Details</h1>
          <ActionButton
            variant="gray"
            href="/admin/pt/session"
          >
            Back
          </ActionButton>
        </div>      
          <div className="space-y-4 mb-4">
          <FormInput
            label="Plan"
            name="pt_session_plan_id"
            type="searchable-select"
            placeholder='Search Plan'
            disabled={!edit}
            value={ selectedPlan ? { value: selectedPlan.id, label: selectedPlan.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, pt_session_plan_id: opt?.value || '' }))
            }
            options={plans.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
          />
          <FormInput
            label="Member"
            name="user_member_id"
            type="searchable-select"
            placeholder='Search Member'
            disabled={!edit}
            value={ selectedMember ? { value: selectedMember.id, label: selectedMember.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, user_member_id: opt?.value || '' }))
            }
            options={members.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
          />
          <FormInput
            label="Personal Trainer"
            name="user_pt_id"
            type="searchable-select"
            placeholder='Search Member'
            disabled={!edit}
            value={ selectedTrainer ? { value: selectedTrainer.id, label: selectedTrainer.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, user_pt_id: opt?.value || '' }))
            }
            options={trainers.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
          />
          <FormInput
            label="Start Date"
            type="datetime-local"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            required
            disabled={!edit}
          />
          <FormInput
            label="Status"
            type="select"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' }
            ]}
            required
            disabled={!edit}
          />
        </div>
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
        <div className="flex gap-3 mt-8 justify-start">
          {!edit ? (
            <>
              <ActionButton onClick={handleEdit} variant="primary">Edit</ActionButton>
              <ActionButton onClick={handleDelete} variant="danger" disabled={formLoading}>Delete</ActionButton>
            </>
          ) : (
            <>
              <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              <ActionButton onClick={handleCancel} variant="gray">Cancel</ActionButton>
            </>
          )}
        </div>
      </PageContainerInsert>
    </div>
  );
}
