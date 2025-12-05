// Halaman membership/session
'use client';
import { useEffect, useState } from 'react';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import MembershipSessionDataTable from './DataTable';
import { FaPlus, FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '../../../../components/admin';

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
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership' }
        ]}
      />
      
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/plan..."
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
          actionHref="/admin/membership/session/insert"
          actionIcon={<FaPlus />}
          actionText="Add Session"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <MembershipSessionDataTable data={filteredSessions} />
        )}
      </PageContainer>
    </div>
  );
}
