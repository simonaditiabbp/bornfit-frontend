"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaCalendarCheck } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    // Fetch plans for dropdown
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/ptsessionplans`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataPlans = await res.json();
        if (res.ok) setPlans(dataPlans.data.plans);
      } catch {}
    };
    fetchPlans();
    // Fetch member & trainer for dropdown
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users?role=member&membership=active`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const resTrainer = await fetch(`${API_URL}/api/users?role=trainer`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataMember = await resMember.json();
        const dataTrainer = await resTrainer.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resTrainer.ok) setTrainers(dataTrainer.data.users);
      } catch {}
    };
    fetchUsers();
    const fetchSession = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/personaltrainersessions/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Gagal fetch session");
        const dataPTSessions = await res.json();
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
        setBackendError(true);
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`${API_URL}/api/personaltrainersessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pt_session_plan_id: Number(form.pt_session_plan_id),
          user_member_id: Number(form.user_member_id),
          user_pt_id: Number(form.user_pt_id),
          start_date: formatDateToISO(form.start_date),
          status: form.status,
          id: Number(id)
        })
      });
      if (!res.ok) throw new Error("Gagal update session");
      setSuccess("Session berhasil diupdate!");
      setEdit(false);
      setTimeout(() => window.location.reload(), 500);
    //   setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError("Gagal update session");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus session ini?')) return;
    setFormLoading(true);
    try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        await fetch(`${API_URL}/api/personaltrainersessions/${id}`, {
        method: 'DELETE',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
        });
        router.push('/admin/pt/session');
    } catch (err) {
      setError("Gagal menghapus session");
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }
  if (loading || !form) {
    return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;
  }

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: FaCalendarCheck, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Detail / Edit' }
      ]} />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-amber-300">PT Session Details</h1>
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
            type="select"
            value={form.pt_session_plan_id}
            onChange={e => setForm(f => ({ ...f, pt_session_plan_id: e.target.value }))}
            options={[
              { value: '', label: 'Pilih Plan' },
              ...plans.map(p => ({ value: p.id, label: p.name || `Plan #${p.id}` }))
            ]}
            required
            disabled={!edit}
          />
          <FormInput
            label="Member"
            type="select"
            value={form.user_member_id}
            onChange={e => setForm(f => ({ ...f, user_member_id: e.target.value }))}
            options={[
              { value: '', label: 'Pilih Member' },
              ...members.map(u => ({ value: u.id, label: u.name }))
            ]}
            required
            disabled={!edit}
          />
          <FormInput
            label="Personal Trainer"
            type="select"
            value={form.user_pt_id}
            onChange={e => setForm(f => ({ ...f, user_pt_id: e.target.value }))}
            options={[
              { value: '', label: 'Pilih PT' },
              ...trainers.map(u => ({ value: u.id, label: u.name }))
            ]}
            required
            disabled={!edit}
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
