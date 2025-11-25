// Halaman membership/plans
'use client';
import { useEffect, useState } from 'react';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import MembershipPlansDataTable from './DataTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/membership-plans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        setPlans(data.data?.membershipPlans || []);
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Membership Plans</h1>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search name/desc..."
          className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <a href="/admin/membership/plans/insert" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 ml-2">+ Add Plan</a>
      </div>
      {loading ? <div className="text-blue-600">Loading...</div> : (
        <div className="bg-white rounded-xl shadow p-6">
          <MembershipPlansDataTable data={filteredPlans} />
        </div>
      )}
    </div>
  );
}
