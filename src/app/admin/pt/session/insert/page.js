"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaChalkboardTeacher } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '@/utils/fetchClient';
import { PageBreadcrumb, PageContainerInsert, FormInput, FormActions } from '@/components/admin';

export default function PTSessionInsertPage() {
  const searchParams = useSearchParams();
  const memberIdFromQuery = searchParams.get('member_id') || '';
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  // Fetch member & trainer for dropdown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, membersData, trainersData] = await Promise.all([
          api.get('/api/ptsessionplans?limit=10000'),
          api.get('/api/users?role=member&membership=active,pending&limit=10000'),
          api.get('/api/users?role=trainer&limit=10000')
        ]);
        setPlans(plansData.data.plans || []);
        setMembers(membersData.data.users || []);
        setTrainers(trainersData.data.users || []);
      } catch {}
    };
    fetchData();
  }, []);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  
  const initialFormState = {
    pt_session_plan_id: "",
    user_member_id: memberIdFromQuery ? Number(memberIdFromQuery) : "",
    user_pt_id: "",
    start_date: new Date().toISOString().slice(0, 10),
    status: "active"
  };
  
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleReset = () => {
    setForm(initialFormState);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/personaltrainersessions', {
        pt_session_plan_id: Number(form.pt_session_plan_id),
        user_member_id: Number(form.user_member_id),
        user_pt_id: Number(form.user_pt_id),
        start_date: formatDateToISO(form.start_date),
        // status: form.status
      });
      toast.success('PT session created successfully!');
      router.push("/admin/pt/session");
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create PT session');
      console.log("error: ", err);
    }
    setLoading(false);
  };

  const selectedMember = members.length > 0 && form.user_member_id ? members.find(u => u.id === form.user_member_id) ?? null : null;
  const selectedPlan = plans.length > 0 && form.pt_session_plan_id ? plans.find(p => p.id === form.pt_session_plan_id) ?? null : null;
  const selectedTrainer = trainers.length > 0 && form.user_pt_id ? trainers.find(u => u.id === form.user_pt_id) ?? null : null;

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Create' }
      ]} />
      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create PT Session</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <FormInput
            label="Plan"
            name="pt_session_plan_id"
            type="searchable-select"
            placeholder='Search Plan'
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
            placeholder='Search Trainer'
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
            type="date"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            required
          />
          {/* <FormInput
            label="Status"
            type="select"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' }
            ]}
            required
          /> */}
          <FormActions
            onReset={handleReset}
            cancelHref="/admin/pt/session"
            isSubmitting={loading}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
