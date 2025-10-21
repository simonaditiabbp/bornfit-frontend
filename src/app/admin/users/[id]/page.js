'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserDetailPage() {
  const params = useParams();
  const { id } = params;
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '' });
  const [membershipForm, setMembershipForm] = useState({ start_date: '', end_date: '' });
  const [token, setToken] = useState('');
  const router = useRouter();
  useEffect(() => {
    const tokenData = localStorage.getItem('token');
    setToken(tokenData);
    if (!tokenData) {
      router.replace('/login');
      return;
    }
    // Helper fetch with 401 handling
    const fetchWith401 = async (url) => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tokenData}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
        throw new Error('Unauthorized');
      }
      return res.json();
    };
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const userRes = await fetchWith401(`${API_URL}/api/users/${id}`);
        const membershipRes = await fetchWith401(`${API_URL}/api/memberships`);
        const checkinsRes = await fetchWith401(`${API_URL}/api/checkins/user/${id}`);
        setUser(userRes);
        setMembership(membershipRes.find(m => m.user_id == id));
        setCheckins(checkinsRes);
        setForm({ name: userRes.name, email: userRes.email, role: userRes.role });
        setMembershipForm({
          start_date: membershipRes.find(m => m.user_id == id)?.start_date?.slice(0, 10) || '',
          end_date: membershipRes.find(m => m.user_id == id)?.end_date?.slice(0, 10) || '',
        });
      } catch (err) {
        // Sudah di-handle di fetchWith401
      }
      setLoading(false);
    };
    fetchDetail();
  }, [id, router]);

  const handleEdit = () => setEdit(true);
  const handleCancel = () => setEdit(false);

  const handleSave = async () => {
    // Update user
    await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    // Update membership
    if (membership) {
      await fetch(`${API_URL}/api/memberships/${membership.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(membershipForm),
      });
    }
    setEdit(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm('Yakin ingin menghapus member ini?')) {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace('/admin/users');
    }
  };

  return (
    <div className="max-w-xll mx-auto bg-white rounded-xl shadow p-8 mt-8">
      {loading ? (
        <div className="text-blue-500 text-center">Loading...</div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Detail Member</h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Nama</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.name}
              disabled={!edit}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              value={form.email}
              disabled={!edit}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Role</label>
            <select
              className="w-full p-2 border rounded"
              value={form.role}
              disabled={!edit}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="opscan">Opscan</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Membership Start</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={membershipForm.start_date}
              disabled={!edit}
              onChange={e => setMembershipForm(f => ({ ...f, start_date: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Membership End</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={membershipForm.end_date}
              disabled={!edit}
              onChange={e => setMembershipForm(f => ({ ...f, end_date: e.target.value }))}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1">Riwayat Checkin</label>
            <div className="max-h-56 overflow-y-auto border rounded p-2 bg-gray-50">
              <ul className="list-disc ml-6 text-sm">
                {checkins.map(c => (
                  <li key={c.id}>{new Date(c.checkin_time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex gap-2">
            {!edit ? (
              <>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold" onClick={handleEdit}>Edit</button>
                <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold" onClick={handleDelete}>Hapus</button>
              </>
            ) : (
              <>
                <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold" onClick={handleSave}>Simpan</button>
                <button className="bg-gray-400 text-white px-4 py-2 rounded font-semibold" onClick={handleCancel}>Batal</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
