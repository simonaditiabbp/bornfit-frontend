"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput, FormInputGroup } from '@/components/admin';
import api from '@/utils/fetchClient';
import LoadingSpin from "@/components/admin/LoadingSpin";

export default function FreezeMembershipEditPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [freeze, setFreeze] = useState(null);
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
        const data = await api.get('/api/users?role=member&limit=10000');
        setMembers(data.data?.users || []);
      } catch (err) {
        // Silently fail - dropdown will be empty
      }
    };
    fetchMembers();

    const fetchFreeze = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const data = await api.get(`/api/membership-freezes/${id}`);
        const freezeData = data.data;
        setFreeze(freezeData);
        setForm({
          membership_id: freezeData.membership_id || "",
          freeze_at: freezeData.freeze_at ? freezeData.freeze_at.slice(0, 10) : "",
          unfreeze_at: freezeData.unfreeze_at ? freezeData.unfreeze_at.slice(0, 10) : "",
          fee: freezeData.fee || "",
          status: freezeData.status || "active",
          reason: freezeData.reason || ""
        });
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };

    if (id) fetchFreeze();
  }, [id]);

  // Fetch active memberships when in edit mode
  useEffect(() => {
    if (!freeze?.membership?.user_id || !edit) {
      return;
    }

    const fetchMemberships = async () => {
      try {
        const data = await api.get('/api/memberships?role=member&limit=10000');
        const allMemberships = data.data?.memberships || [];
        const userMemberships = allMemberships.filter(m => 
          m.user_id === freeze.membership.user_id && m.status === 'active'
        );
        setMemberships(userMemberships);
      } catch (err) {
        // Silently fail - dropdown will be empty
        setMemberships([]);
      }
    };
    fetchMemberships();
  }, [freeze?.membership?.user_id, edit]);

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
      membership_id: freeze.membership_id || "",
      freeze_at: freeze.freeze_at ? freeze.freeze_at.slice(0, 10) : "",
      unfreeze_at: freeze.unfreeze_at ? freeze.unfreeze_at.slice(0, 10) : "",
      fee: freeze.fee || "",
      status: freeze.status || "active",
      reason: freeze.reason || ""
    });
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      // Convert date format to ISO-8601
      let freezeAtIso = form.freeze_at;
      if (freezeAtIso && freezeAtIso.length === 10) {
        freezeAtIso = freezeAtIso + "T00:00:00.000Z";
      }

      let unfreezeAtIso = form.unfreeze_at;
      if (unfreezeAtIso && unfreezeAtIso.length === 10) {
        unfreezeAtIso = unfreezeAtIso + "T00:00:00.000Z";
      }

      await api.put(`/api/membership-freezes/${id}`, {
        membership_id: Number(form.membership_id),
        freeze_at: freezeAtIso,
        unfreeze_at: unfreezeAtIso || null,
        fee: Number(form.fee) || 0,
        status: form.status,
        reason: form.reason || null
      });
      setSuccess("Freeze successfully updated!");
      setEdit(false);
    } catch (err) {
      setError(err.data?.message || 'Failed to update freeze');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this freeze?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/membership-freezes/${id}`);
      router.push('/admin/membership/freeze');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete freeze');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleUnfreeze = async () => {
    if (!confirm('Are you sure you want to unfreeze this membership?')) return;
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/api/membership-freezes/${id}/unfreeze`);
      setSuccess("Membership successfully unfrozen!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Failed to unfreeze membership");
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }  

  if (loading || !form) return <LoadingSpin />;

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Freeze Membership', href: '/admin/membership/freeze' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Freeze Membership Details</h1>
          <ActionButton href="/admin/membership/freeze" variant="gray">Back</ActionButton>
        </div>

        <div className="space-y-4 mb-4">
            <FormInput
              label="Member"
              value={freeze?.membership?.user?.name || 'N/A'}
              disabled
            />

            {edit ? (
              <FormInput
                label="Membership"
                name="membership_id"
                type="select"
                value={form.membership_id}
                onChange={e => setForm(f => ({ ...f, membership_id: e.target.value }))}
                options={[
                  { value: '', label: 'Select Membership' },
                  ...memberships.map(membership => ({
                    value: membership.id,
                    label: `${membership.membershipPlan?.name || 'Unknown Plan'} - Expires: ${membership.end_date ? new Date(membership.end_date).toLocaleDateString('id-ID') : 'N/A'}`
                  }))
                ]}
                required
              />
            ) : (
              <FormInput
                label="Membership"
                value={freeze?.membership?.membershipPlan?.name || 'N/A'}
                disabled
              />
            )}

            <FormInputGroup className="grid grid-cols-2 gap-4">
              <FormInput
                label="Freeze At"
                name="freeze_at"
                type="date"
                value={form.freeze_at}
                onChange={e => setForm(f => ({ ...f, freeze_at: e.target.value }))}
                disabled={!edit}
                required
              />

              <FormInput
                label="Unfreeze At"
                name="unfreeze_at"
                type="date"
                value={form.unfreeze_at}
                onChange={e => setForm(f => ({ ...f, unfreeze_at: e.target.value }))}
                disabled={!edit}
                required
              />
            </FormInputGroup>

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
              label="Status"
              name="status"
              type="select"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: 'active', label: 'Active' },
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
                {form?.status === 'active' && (
                  <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleUnfreeze} disabled={formLoading}>
                    {formLoading ? "Processing..." : "Unfreeze"}
                  </button>
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
