"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaSnowflake, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FreezeMembershipInsertPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  
  const [form, setForm] = useState({
    membership_id: "",
    freeze_at: new Date().toISOString().slice(0, 10),
    unfreeze_at: "",
    fee: "",
    status: "active",
    reason: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

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
        <span className="text-gray-200 font-medium">Create</span>
      </div>

      <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Freeze Membership</h1>
        
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block mb-1 text-gray-200">Member *</label>
            <select 
              name="member_id" 
              value={selectedMemberId} 
              onChange={e => {
                setSelectedMemberId(e.target.value);
                setForm({ ...form, membership_id: "" });
              }} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              required
            >
              <option value="">Select Member</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name} - {member.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Active Membership *</label>
            <select 
              name="membership_id" 
              value={form.membership_id} 
              onChange={e => setForm({ ...form, membership_id: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              required
              disabled={!selectedMemberId}
            >
              <option value="">Select Membership</option>
              {memberships.map(membership => (
                <option key={membership.id} value={membership.id}>
                  {membership.membershipPlan?.name || 'Unknown Plan'} - 
                  Expires: {membership.end_date ? new Date(membership.end_date).toLocaleDateString('id-ID') : 'N/A'}
                </option>
              ))}
            </select>
            {!selectedMemberId && (
              <p className="text-sm text-gray-400 mt-1">Please select member first</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-gray-200">Freeze At *</label>
              <input 
                name="freeze_at" 
                type="date" 
                value={form.freeze_at} 
                onChange={e => setForm({ ...form, freeze_at: e.target.value })} 
                className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-200">Unfreeze At *</label>
              <input 
                name="unfreeze_at" 
                type="date" 
                value={form.unfreeze_at} 
                onChange={e => setForm({ ...form, unfreeze_at: e.target.value })} 
                className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Freeze Fee (IDR) *</label>
            <input 
              name="fee" 
              type="number" 
              min="0"
              value={form.fee} 
              onChange={e => setForm({ ...form, fee: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              placeholder="e.g., 50000"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Status *</label>
            <select 
              name="status" 
              value={form.status} 
              onChange={e => setForm({ ...form, status: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              required
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
              value={form.reason} 
              onChange={e => setForm({ ...form, reason: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              rows="3"
              placeholder="Reason for freezing..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              type="submit" 
              className="bg-amber-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-amber-500" 
              disabled={loading}
            >
              {loading ? "Saving..." : "Freeze"}
            </button>
            <button 
              type="button" 
              className="bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500" 
              onClick={() => router.push('/admin/membership/freeze')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
