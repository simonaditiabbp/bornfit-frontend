"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaExchangeAlt, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TransferMembershipInsertPage() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  
  const [form, setForm] = useState({
    from_membership_id: "",
    from_user_id: "",
    to_user_id: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    fee: "",
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
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaExchangeAlt className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <Link href="/admin/membership/transfer" className="text-gray-400 hover:text-amber-300 transition-colors">
          Transfer Membership
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Create</span>
      </div>

      <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Transfer Membership</h1>
        
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block mb-1 text-gray-200">From Member *</label>
            <select 
              name="from_user_id" 
              value={form.from_user_id} 
              onChange={e => setForm({ ...form, from_user_id: e.target.value, from_membership_id: "" })} 
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
              name="from_membership_id" 
              value={form.from_membership_id} 
              onChange={e => setForm({ ...form, from_membership_id: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              required
              disabled={!form.from_user_id}
            >
              <option value="">Select Membership</option>
              {memberships.map(membership => (
                <option key={membership.id} value={membership.id}>
                  {membership.membershipPlan?.name || 'Unknown Plan'}
                  {' (' + (membership.start_date ? new Date(membership.start_date).toLocaleDateString('id-ID') : 'N/A') + ' - ' + (membership.end_date ? new Date(membership.end_date).toLocaleDateString('id-ID') : 'N/A') + ')'}
                </option>
              ))}
            </select>
            {!form.from_user_id && (
              <p className="text-sm text-gray-400 mt-1">Please select from member first</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-gray-200">To Member *</label>
            <select 
              name="to_user_id" 
              value={form.to_user_id} 
              onChange={e => setForm({ ...form, to_user_id: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              required
            >
              <option value="">Select Member</option>
              {members
                .filter(m => m.id !== Number(form.from_user_id))
                .map(member => (
                  <option key={member.id} value={member.id}>{member.name} - {member.email}</option>
                ))
              }
            </select>
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Transfer Fee (IDR) *</label>
            <input 
              name="fee" 
              type="number" 
              min="0"
              value={form.fee} 
              onChange={e => setForm({ ...form, fee: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              placeholder="e.g., 100000"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Transfer Date *</label>
            <input 
              name="transfer_date" 
              type="date" 
              value={form.transfer_date} 
              onChange={e => setForm({ ...form, transfer_date: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-200">Reason</label>
            <textarea 
              name="reason" 
              value={form.reason} 
              onChange={e => setForm({ ...form, reason: e.target.value })} 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
              rows="3"
              placeholder="Reason for transfer..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              type="submit" 
              className="bg-amber-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-amber-500" 
              disabled={loading}
            >
              {loading ? "Saving..." : "Transfer"}
            </button>
            <button 
              type="button" 
              className="bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500" 
              onClick={() => router.push('/admin/membership/transfer')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
