"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TransferMembershipEditPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [transfer, setTransfer] = useState(null);
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

    const fetchTransfer = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/membership-transfers/${id}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (!res.ok) throw new Error("Gagal fetch transfer");
        
        const data = await res.json();
        const transferData = data.data;
        setTransfer(transferData);
        setForm({
          from_membership_id: transferData.from_membership_id || "",
          from_user_id: transferData.from_user_id || "",
          to_user_id: transferData.to_user_id || "",
          transfer_date: transferData.transfer_date ? transferData.transfer_date.slice(0, 10) : "",
          fee: transferData.fee || "",
          reason: transferData.reason || "",
          status: transferData.status || "pending"
        });
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };

    if (id) fetchTransfer();
  }, [id]);

  // Fetch active memberships when from_user changes in edit mode
  useEffect(() => {
    if (!form?.from_user_id || !edit) {
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
  }, [form?.from_user_id, edit]);

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
      from_membership_id: transfer.from_membership_id || "",
      from_user_id: transfer.from_user_id || "",
      to_user_id: transfer.to_user_id || "",
      transfer_date: transfer.transfer_date ? transfer.transfer_date.slice(0, 10) : "",
      fee: transfer.fee || "",
      reason: transfer.reason || "",
      status: transfer.status || "pending"
    });
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-transfers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          from_membership_id: Number(form.from_membership_id),
          from_user_id: Number(form.from_user_id),
          to_user_id: Number(form.to_user_id),
          transfer_date: form.transfer_date,
          fee: Number(form.fee) || 0,
          reason: form.reason || null,
          status: form.status
        })
      });
      if (!res.ok) throw new Error("Gagal update transfer");
      setSuccess("Transfer berhasil diupdate!");
      setEdit(false);
    } catch (err) {
      setError("Gagal update transfer");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus transfer ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-transfers/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      router.push('/admin/membership/transfer');
    } catch (err) {
      setError("Gagal menghapus transfer");
    }
    setFormLoading(false);
  };

  const handleApprove = async () => {
    if (!confirm('Approve transfer ini? Membership akan dipindahkan ke user tujuan.')) return;
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-transfers/${id}/approve`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Gagal approve transfer");
      setSuccess("Transfer berhasil diapprove!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Gagal approve transfer");
    }
    setFormLoading(false);
  };

  const handleReject = async () => {
    if (!confirm('Reject transfer ini?')) return;
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-transfers/${id}/reject`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Gagal reject transfer");
      setSuccess("Transfer berhasil direject!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Gagal reject transfer");
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
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Transfer Membership', href: '/admin/membership/transfer' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-amber-300">Edit Transfer Membership</h1>
          <ActionButton href="/admin/membership/transfer" variant="gray">Back</ActionButton>
        </div>

        <div className="space-y-4 mb-4">
            {edit ? (
              <FormInput
                label="From Member"
                name="from_user_id"
                type="select"
                value={form.from_user_id}
                onChange={e => setForm(f => ({ ...f, from_user_id: e.target.value, from_membership_id: "" }))}
                options={[
                  { value: '', label: 'Select Member' },
                  ...members.map(member => ({ value: member.id, label: `${member.name} - ${member.email}` }))
                ]}
                required
              />
            ) : (
              <FormInput
                label="From Member"
                value={transfer?.fromUser?.name || 'N/A'}
                disabled
              />
            )}

            <div>
              {edit ? (
                <FormInput
                  label="Membership"
                  name="from_membership_id"
                  type="select"
                  value={form.from_membership_id}
                  onChange={e => setForm(f => ({ ...f, from_membership_id: e.target.value }))}
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
              ) : (
                <FormInput
                  label="Membership"
                  value={transfer?.fromMembership?.membershipPlan?.name || 'N/A'}
                  disabled
                />
              )}
            </div>

            {edit ? (
              <FormInput
                label="To Member"
                name="to_user_id"
                type="select"
                value={form.to_user_id}
                onChange={e => setForm(f => ({ ...f, to_user_id: e.target.value }))}
                options={[
                  { value: '', label: 'Select Member' },
                  ...members.filter(m => m.id !== Number(form.from_user_id)).map(member => ({ value: member.id, label: `${member.name} - ${member.email}` }))
                ]}
                required
              />
            ) : (
              <FormInput
                label="To Member"
                value={transfer?.toUser?.name || 'N/A'}
                disabled
              />
            )}

            <FormInput
              label="Fee (IDR)"
              name="fee"
              type="number"
              value={form.fee}
              onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
              disabled={!edit}
              required
              min="0"
            />

            <FormInput
              label="Transfer Date"
              name="transfer_date"
              type="date"
              value={form.transfer_date}
              onChange={e => setForm(f => ({ ...f, transfer_date: e.target.value }))}
              disabled={!edit}
              required
            />

            <FormInput
              label="Status"
              name="status"
              type="select"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              disabled={!edit}
              required
            />

            <FormInput
              label="Reason"
              name="reason"
              type="textarea"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              disabled={!edit}
            />
          </div>

          {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
          {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
          
          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <ActionButton onClick={handleEdit} variant="primary">Edit</ActionButton>
                {form?.status === 'pending' && (
                  <>
                    <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleApprove} disabled={formLoading}>
                      {formLoading ? "Processing..." : "Approve"}
                    </button>
                    <button type="button" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleReject} disabled={formLoading}>
                      {formLoading ? "Processing..." : "Reject"}
                    </button>
                  </>
                )}
                <ActionButton onClick={handleDelete} variant="danger">Delete</ActionButton>
              </>
            ) : (
              <>
                <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" disabled={formLoading} onClick={handleSave}>{formLoading ? "Saving..." : "Save"}</button>
                <ActionButton onClick={handleCancel} variant="gray">Cancel</ActionButton>
              </>
            )}
          </div>
      </PageContainerInsert>
    </div>
  );
}
