"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TransferMembershipInsertPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  
  const initialFormState = {
    from_membership_id: "",
    from_user_id: "",
    to_user_id: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    fee: "",
    reason: ""
  };
  
  const [form, setForm] = useState(initialFormState);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleReset = () => {
    setForm(initialFormState);
    setMemberships([]);
    setError("");
    setSuccess("");
  };

  // Fetch members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/users?role=member`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok) setMembers(data.data?.users || []);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };
    fetchMembers();
  }, []);

  // Fetch active memberships when from_user changes
  useEffect(() => {
    if (!form.from_user_id) {
      setMemberships([]);
      return;
    }

    const fetchMemberships = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/memberships?role=member`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok) {
          const allMemberships = data.data?.memberships || [];
          // Filter active memberships for selected user
          const userMemberships = allMemberships.filter(m => 
            m.user_id === Number(form.from_user_id) && m.status === 'active'
          );
          setMemberships(userMemberships);
        }
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
        setMemberships([]);
      }
    };
    fetchMemberships();
  }, [form.from_user_id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          from_membership_id: Number(form.from_membership_id),
          from_user_id: Number(form.from_user_id),
          to_user_id: Number(form.to_user_id),
          transfer_date: form.transfer_date ? new Date(form.transfer_date).toISOString() : new Date().toISOString(),
          fee: Number(form.fee) || 0,
          reason: form.reason || null
        }),
      });
      
      if (!res.ok) throw new Error("Gagal transfer membership");
      
      setSuccess("Berhasil transfer membership");
      setTimeout(() => {
        router.push("/admin/membership/transfer");
      }, 1500);
    } catch (err) {
      setError("Gagal transfer membership");
    }
    setLoading(false);
  };

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Transfer Membership', href: '/admin/membership/transfer' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create Transfer Membership</h1>
        
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        
        <form className="space-y-4" onSubmit={handleSave}>
          <FormInput
            label="From Member"
            name="from_user_id"
            type="select"
            value={form.from_user_id}
            onChange={e => setForm({ ...form, from_user_id: e.target.value, from_membership_id: "" })}
            options={[
              { value: '', label: 'Select Member' },
              ...members.map(member => ({ value: member.id, label: `${member.name} - ${member.email}` }))
            ]}
            required
          />

          <div>
            <FormInput
              label="Active Membership"
              name="from_membership_id"
              type="select"
              value={form.from_membership_id}
              onChange={e => setForm({ ...form, from_membership_id: e.target.value })}
              options={[
                { value: '', label: 'Select Membership' },
                ...memberships.map(membership => ({
                  value: membership.id,
                  label: `${membership.membershipPlan?.name || 'Unknown Plan'} (${membership.start_date ? new Date(membership.start_date).toLocaleDateString('id-ID') : 'N/A'} - ${membership.end_date ? new Date(membership.end_date).toLocaleDateString('id-ID') : 'N/A'})`
                }))
              ]}
              disabled={!form.from_user_id}
              required
            />
            {!form.from_user_id && (
              <p className="text-sm text-gray-400 mt-1">Please select from member first</p>
            )}
          </div>

          <FormInput
            label="To Member"
            name="to_user_id"
            type="select"
            value={form.to_user_id}
            onChange={e => setForm({ ...form, to_user_id: e.target.value })}
            options={[
              { value: '', label: 'Select Member' },
              ...members
                .filter(m => m.id !== Number(form.from_user_id))
                .map(member => ({ value: member.id, label: `${member.name} - ${member.email}` }))
            ]}
            required
          />

          <FormInput
            label="Transfer Fee (IDR)"
            name="fee"
            type="number"
            value={form.fee}
            onChange={e => setForm({ ...form, fee: e.target.value })}
            placeholder="e.g., 100000"
            required
            min="0"
          />

          <FormInput
            label="Transfer Date"
            name="transfer_date"
            type="date"
            value={form.transfer_date}
            onChange={e => setForm({ ...form, transfer_date: e.target.value })}
            required
          />

          <FormInput
            label="Reason"
            name="reason"
            type="textarea"
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            placeholder="Reason for transfer..."
          />

          <FormActions
            onReset={handleReset}
            cancelHref="/admin/membership/transfer"
            isSubmitting={loading}
          />
        </form>
      </PageContainerInsert>      
    </div>
  );
}
