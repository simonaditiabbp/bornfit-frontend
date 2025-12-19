"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaIdCard } from 'react-icons/fa';
import api from '@/utils/fetchClient';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';

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
        const data = await api.get('/api/users?role=member&limit=10000');
        setMembers(data.data?.users || []);
      } catch (err) {
        // Silently fail - dropdown will be empty
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
        const data = await api.get('/api/memberships?role=member&limit=10000');
        const allMemberships = data.data?.memberships || [];
        // Filter active memberships for selected user
        const userMemberships = allMemberships.filter(m => 
          m.user_id === Number(form.from_user_id) && m.status === 'active'
        );
        setMemberships(userMemberships);
      } catch (err) {
        // Silently fail - dropdown will be empty
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
      await api.post('/api/membership-transfers', {
        from_membership_id: Number(form.from_membership_id),
        from_user_id: Number(form.from_user_id),
        to_user_id: Number(form.to_user_id),
        transfer_date: form.transfer_date ? new Date(form.transfer_date).toISOString() : new Date().toISOString(),
        fee: Number(form.fee) || 0,
        reason: form.reason || null
      });
      
      setSuccess("Berhasil transfer membership");
      setTimeout(() => {
        router.push("/admin/membership/transfer");
      }, 1500);
    } catch (err) {
      setError(err.data?.message || 'Failed to create membership transfer');
      console.log("error: ", err);
    }
    setLoading(false);
  };

  const selectedFromMember = members.length > 0 && form.from_user_id ? members.find(u => u.id === form.from_user_id) ?? null : null;
  const selectedToMember = members.length > 0 && form.to_user_id ? members.find(u => u.id === form.to_user_id) ?? null : null;

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
        
        <form className="space-y-4" onSubmit={handleSave}>
          <FormInput
            label="From Member"
            name="from_user_id"
            type="searchable-select"
            placeholder='Search Member'
            value={ selectedFromMember ? { value: selectedFromMember.id, label: selectedFromMember.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, from_user_id: opt?.value || '' }))
            }
            options={members.map(u => ({
              value: u.id,
              label: u.name
            }))}
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
            type="searchable-select"
            placeholder='Search Member'
            value={ selectedToMember ? { value: selectedToMember.id, label: selectedToMember.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, to_user_id: opt?.value || '' }))
            }
            options={members.map(u => ({
              value: u.id,
              label: u.name
            }))}
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

          {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
          {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}

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
