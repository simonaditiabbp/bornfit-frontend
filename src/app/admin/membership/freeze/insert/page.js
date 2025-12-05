"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput, FormInputGroup } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FreezeMembershipInsertPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  
  const getDefaultUnfreezeDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  };

  const initialFormState = {
    membership_id: "",
    freeze_at: new Date().toISOString().slice(0, 10),
    unfreeze_at: getDefaultUnfreezeDate(),
    fee: "",
    status: "active",
    reason: ""
  };

  const [form, setForm] = useState(initialFormState);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleReset = () => {
    setForm(initialFormState);
    setSelectedMemberId("");
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

  // Fetch active memberships when member changes
  useEffect(() => {
    if (!selectedMemberId) {
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
            m.user_id === Number(selectedMemberId) && m.status === 'active'
          );
          setMemberships(userMemberships);
        }
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
        setMemberships([]);
      }
    };
    fetchMemberships();
  }, [selectedMemberId]);

  // Calculate default unfreeze date (30 days from freeze)
  useEffect(() => {
    if (form.freeze_at && !form.unfreeze_at) {
      const freezeDate = new Date(form.freeze_at);
      freezeDate.setDate(freezeDate.getDate() + 30);
      setForm(prev => ({ ...prev, unfreeze_at: freezeDate.toISOString().slice(0, 10) }));
    }
  }, [form.freeze_at, form.unfreeze_at]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-freezes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          membership_id: Number(form.membership_id),
          freeze_at: form.freeze_at ? new Date(form.freeze_at).toISOString() : new Date().toISOString(),
          unfreeze_at: form.unfreeze_at ? new Date(form.unfreeze_at).toISOString() : null,
          fee: Number(form.fee) || 0,
          status: form.status,
          reason: form.reason || null
        }),
      });
      
      if (!res.ok) throw new Error("Gagal freeze membership");
      
      setSuccess("Berhasil freeze membership");
      setTimeout(() => {
        router.push("/admin/membership/freeze");
      }, 1500);
    } catch (err) {
      setError("Gagal freeze membership");
    }
    setLoading(false);
  };

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Freeze Membership', href: '/admin/membership/freeze' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Freeze Membership</h1>
        
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        
        <form className="space-y-4" onSubmit={handleSave}>
          <FormInput
            label="Member"
            name="member_id"
            type="select"
            value={selectedMemberId}
            onChange={e => {
              setSelectedMemberId(e.target.value);
              setForm({ ...form, membership_id: "" });
            }}
            options={[
              { value: '', label: 'Select Member' },
              ...members.map(member => ({ value: member.id, label: `${member.name} - ${member.email}` }))
            ]}
            required
          />

          <div>
            <FormInput
              label="Active Membership"
              name="membership_id"
              type="select"
              value={form.membership_id}
              onChange={e => setForm({ ...form, membership_id: e.target.value })}
              options={[
                { value: '', label: 'Select Membership' },
                ...memberships.map(membership => ({
                  value: membership.id,
                  label: `${membership.membershipPlan?.name || 'Unknown Plan'} - Expires: ${membership.end_date ? new Date(membership.end_date).toLocaleDateString('id-ID') : 'N/A'}`
                }))
              ]}
              disabled={!selectedMemberId}
              required
            />
            {!selectedMemberId && (
              <p className="text-sm text-gray-400 mt-1">Please select member first</p>
            )}
          </div>

          <FormInputGroup className="grid grid-cols-2 gap-4">
            <FormInput
              label="Freeze At"
              name="freeze_at"
              type="date"
              value={form.freeze_at}
              onChange={e => setForm({ ...form, freeze_at: e.target.value })}
              required
            />

            <FormInput
              label="Unfreeze At"
              name="unfreeze_at"
              type="date"
              value={form.unfreeze_at}
              onChange={e => setForm({ ...form, unfreeze_at: e.target.value })}
              required
            />
          </FormInputGroup>

          <FormInput
            label="Freeze Fee (IDR)"
            name="fee"
            type="number"
            value={form.fee}
            onChange={e => setForm({ ...form, fee: e.target.value })}
            placeholder="e.g., 50000"
            required
            min="0"
          />

          <FormInput
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            required
          />

          <FormInput
            label="Reason"
            name="reason"
            type="textarea"
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            placeholder="Reason for freezing..."
          />

          <FormActions
            onReset={handleReset}
            cancelHref="/admin/membership/freeze"
            isSubmitting={loading}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
