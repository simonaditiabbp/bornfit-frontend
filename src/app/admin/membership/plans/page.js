'use client';
import { useEffect, useState } from 'react';
import api from '@/utils/fetchClient';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import MembershipPlansDataTable from './DataTable';
import { FaPlus, FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '../../../../components/admin';

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const data = await api.get('/api/membership-plans');
        setPlans(data.data?.membershipPlans || []);
      } catch (err) {
        if (err.isNetworkError) {
          setBackendError(true);
        }
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
      <PageBreadcrumb 
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/membership/plans' },
          { label: 'Membership Plans' }
        ]}
      />
      
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search name/desc..."
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
          actionHref="/admin/membership/plans/insert"
          actionIcon={<FaPlus />}
          actionText="Add Plan"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <MembershipPlansDataTable data={filteredPlans} />
        )}
      </PageContainer>
    </div>
  );
}
