"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import Link from "next/link";
import { FaSnowflake, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

    const fetchFreeze = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/membership-freezes/${id}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (!res.ok) throw new Error("Gagal fetch freeze");
        
        const data = await res.json();
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
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/memberships?role=member`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok) {
          const allMemberships = data.data?.memberships || [];
          const userMemberships = allMemberships.filter(m => 
            m.user_id === freeze.membership.user_id && m.status === 'active'
          );
          setMemberships(userMemberships);
        }
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-freezes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          membership_id: Number(form.membership_id),
          freeze_at: form.freeze_at,
          unfreeze_at: form.unfreeze_at || null,
          fee: Number(form.fee) || 0,
          status: form.status,
          reason: form.reason || null
        })
      });
      if (!res.ok) throw new Error("Gagal update freeze");
      setSuccess("Freeze berhasil diupdate!");
      setEdit(false);
    } catch (err) {
      setError("Gagal update freeze");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus freeze ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-freezes/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      router.push('/admin/membership/freeze');
    } catch (err) {
      setError("Gagal menghapus freeze");
    }
    setFormLoading(false);
  };

  const handleUnfreeze = async () => {
    if (!confirm('Unfreeze membership ini?')) return;
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/membership-freezes/${id}/unfreeze`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Gagal unfreeze");
      setSuccess("Membership berhasil di-unfreeze!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Gagal unfreeze membership");
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
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaSnowflake className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <Link href="/admin/membership/freeze" className="text-gray-400 hover:text-amber-300 transition-colors">
          Freeze Membership
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Edit</span>
      </div>

      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-700">
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-amber-300">Edit Freeze Membership</h1>
          <Link href="/admin/membership/freeze" className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors">
            Back
          </Link>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block mb-1 text-gray-200">Member</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg bg-gray-900 text-gray-400 border-gray-700"
              value={freeze?.membership?.user?.name || 'N/A'}
              disabled
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Membership</label>
            {edit ? (
              <select 
                name="membership_id" 
                className="w-full p-3 border rounded-lg bg-gray-700 text-gray-200 border-gray-600"
                value={form.membership_id} 
                onChange={e => setForm(f => ({ ...f, membership_id: e.target.value }))} 
                required
              >
                <option value="">Select Membership</option>
                {memberships.map(membership => (
                  <option key={membership.id} value={membership.id}>
                    {membership.membershipPlan?.name || 'Unknown Plan'} - 
                    Expires: {membership.end_date ? new Date(membership.end_date).toLocaleDateString('id-ID') : 'N/A'}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                className="w-full p-3 border rounded-lg bg-gray-900 text-gray-400 border-gray-700"
                value={freeze?.membership?.membershipPlan?.name || 'N/A'}
                disabled
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-gray-200">Freeze At</label>
              <input 
                name="freeze_at" 
                type="date" 
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                value={form.freeze_at} 
                onChange={e => setForm(f => ({ ...f, freeze_at: e.target.value }))} 
                required 
                disabled={!edit} 
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-200">Unfreeze At</label>
              <input 
                name="unfreeze_at" 
                type="date" 
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                value={form.unfreeze_at} 
                onChange={e => setForm(f => ({ ...f, unfreeze_at: e.target.value }))} 
                required 
                disabled={!edit} 
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Fee (IDR)</label>
            <input 
              name="fee" 
              type="number" 
              min="0"
              className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              value={form.fee} 
              onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} 
              required 
              disabled={!edit} 
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Status</label>
            <select 
              name="status" 
              className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              value={form.status} 
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))} 
              required 
              disabled={!edit}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Reason</label>
            <textarea 
              name="reason" 
              className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
              value={form.reason} 
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} 
              disabled={!edit}
              rows="3"
            />
          </div>
        </div>

        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
        
        <div className="flex gap-3 mt-8 justify-start">
          {!edit ? (
            <>
              <button type="button" className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-6 py-2 rounded-lg font-semibold transition" onClick={handleEdit}>Edit</button>
              {form?.status === 'active' && (
                <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleUnfreeze} disabled={formLoading}>
                  {formLoading ? "Processing..." : "Unfreeze"}
                </button>
              )}
              <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleDelete}>Delete</button>
            </>
          ) : (
            <>
              <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" disabled={formLoading} onClick={handleSave}>{formLoading ? "Saving..." : "Save"}</button>
              <button type="button" className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
