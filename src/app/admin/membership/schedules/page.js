// Halaman membership/schedules
'use client';
import { useEffect, useState } from 'react';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import MembershipSchedulesDataTable from './DataTable';
import { FaPlus, FaCalendar } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function MembershipSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/membership-plan-schedules`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        setSchedules(data.data?.membershipPlanSchedules || []);
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter(s =>
    (s.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.membershipPlan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.status || '').toLowerCase().includes(search.toLowerCase())
  );

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  return (
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <FaCalendar className="w-3 h-3 me-2.5 text-amber-300" /> 
              <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2 dark:text-gray-400">Membership Schedules</span>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="m-5 p-5 bg-gray-800 border border-gray-600 rounded-lg">
        <div className="mb-4 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search member/plan/status..."
            className="w-full max-w-xs p-2 border text-gray-100 bg-gray-700 border-amber-200 rounded focus:outline-none text-base"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Link href="/admin/membership/schedules/insert" className="flex items-center gap-2 bg-amber-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-500">
            <FaPlus className="inline-block" />
            Add Schedule
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-amber-300">Loading...</div>
        ) : (
          <MembershipSchedulesDataTable data={filteredSchedules} />
        )}
      </div>
    </div>
  );
}
