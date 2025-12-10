"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaChalkboardTeacher } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormInput, FormActions } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTSessionInsertPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  // Fetch member & trainer for dropdown
  useEffect(() => {
    // Fetch plans for dropdown
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/ptsessionplans`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok) setPlans(data.data.plans);
      } catch {}
    };
    fetchPlans();
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
  }, []);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  
  const initialFormState = {
    pt_session_plan_id: "",
    user_member_id: "",
    user_pt_id: "",
    start_date: new Date().toISOString().slice(0, 10),
    status: "active"
  };
  
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  
  const handleReset = () => {
    setForm(initialFormState);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const res = await fetch(`${API_URL}/api/personaltrainersessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pt_session_plan_id: Number(form.pt_session_plan_id),
          user_member_id: Number(form.user_member_id),
          user_pt_id: Number(form.user_pt_id),
          start_date: formatDateToISO(form.start_date),
          status: form.status
        })
      });
      if (!res.ok) throw new Error("Gagal insert session");
      setSuccess("Session berhasil ditambahkan!");
      setTimeout(() => router.push("/admin/pt/session"), 1200);
    } catch (err) {
      setError("Gagal insert session");
    }
    setLoading(false);
  };

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Create' }
      ]} />
      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create PT Session</h1>
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        <div className="space-y-4">
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
          />
          <FormInput
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            required
          />
          <FormInput
            label="Status"
            type="select"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' }
            ]}
            required
          />
        </div>
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        <FormActions
          onSubmit={handleSave}
          onReset={handleReset}
          cancelHref="/admin/pt/session"
          submitText="Create PT Session"
          isLoading={loading}
        />
      </PageContainerInsert>
    </div>
  );
}
