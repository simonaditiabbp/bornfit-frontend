"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaIdCard } from 'react-icons/fa';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';
import LoadingSpin from "@/components/admin/LoadingSpin";

export default function TransferMembershipEditPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [transfer, setTransfer] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

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

    const fetchTransfer = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const data = await api.get(`/api/membership-transfers/${id}`);
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
        const data = await api.get('/api/memberships?role=member&limit=10000');
        const allMemberships = data.data?.memberships || [];
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
  }, [form?.from_user_id, edit]);

  const handleEdit = () => {
    setEdit(true);
  };

  const handleCancel = () => {
    setEdit(false);
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
    try {
      await api.put(`/api/membership-transfers/${id}`, {
        from_membership_id: Number(form.from_membership_id),
        from_user_id: Number(form.from_user_id),
        to_user_id: Number(form.to_user_id),
        transfer_date: form.transfer_date ? new Date(form.transfer_date).toISOString() : null,
        fee: Number(form.fee) || 0,
        reason: form.reason || null,
        status: form.status
      });
      toast.success('Membership transfer updated successfully!');
      setEdit(false);
      // router.push('/admin/membership/transfer');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update membership transfer');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '⚠️ Delete Confirmation',
      html: 'Are you sure you want to delete this transfer?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    setFormLoading(true);
    try {
      await api.delete(`/api/membership-transfers/${id}`);
      toast.success('Membership transfer deleted successfully!');
      router.push('/admin/membership/transfer');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to delete membership transfer');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: '✅ Approve Transfer',
      html: 'Are you sure you want to approve this transfer?<br><br><span style="color: #059669;">The membership will be transferred to the target user.</span>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    setFormLoading(true);
    try {
      await api.post(`/api/membership-transfers/${id}/approve`);
      toast.success('Transfer approved successfully!', { duration: 5000 });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to approve transfer');
    }
    setFormLoading(false);
  };

  const handleReject = async () => {
    const result = await Swal.fire({
      title: '❌ Reject Transfer',
      html: 'Are you sure you want to reject this transfer?<br><br><span style="color: #f97316;">This will cancel the transfer request.</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Reject!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    setFormLoading(true);
    try {
      await api.post(`/api/membership-transfers/${id}/reject`);
      toast.success('Transfer rejected successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to reject transfer');
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }
    
  if (loading || !form) return <LoadingSpin />;

  const selectedFromMember = members.length > 0 && form.from_user_id ? members.find(u => u.id === form.from_user_id) ?? null : null;
  const selectedToMember = members.length > 0 && form.to_user_id ? members.find(u => u.id === form.to_user_id) ?? null : null;

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Transfer Membership Details</h1>
          <ActionButton href="/admin/membership/transfer" variant="gray">Back</ActionButton>
        </div>

        <div className="space-y-4 mb-4">
            <FormInput
              label="From Member"
              name="from_user_id"
              type="searchable-select"
              placeholder='Search Member'
              disabled={!edit}
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

            <FormInput
              label="To Member"
              name="to_user_id"
              type="searchable-select"
              placeholder='Search Member'
              disabled={!edit}
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
