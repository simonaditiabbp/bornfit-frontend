// Halaman membership/session
'use client';
import { useEffect, useState } from 'react';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import MembershipSessionDataTable from './DataTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function MembershipSessionPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/memberships`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        setSessions(data.data?.memberships || []);
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(s =>
    (s.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.membershipPlan?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Membership Sessions</h1>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search member/plan..."
          className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <a href="/admin/membership/session/insert" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 ml-2">+ Add Session</a>
      </div>
      {loading ? <div className="text-blue-600">Loading...</div> : (
        <div className="bg-white rounded-xl shadow p-6">
          <MembershipSessionDataTable data={filteredSessions} />
        </div>
      )}
    </div>
  );
}
