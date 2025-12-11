"use client"
import { useEffect, useState } from 'react';
import DataTable from '../../class/plans/DataTable';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaPlus, FaDumbbell, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from '@/components/admin';
import ClassPurchaseDataTable from './DataTable';
import api from '@/utils/fetchClient';

export default function ClassPurchaseListPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/api/classpurchases?limit=${limit}&page=${page}&search=${encodeURIComponent(search)}`);
        if (Array.isArray(data.data?.purchases)) {
          setPurchases(data.data.purchases);
          setTotal(data.data.total || 0);
        } else {
          setPurchases([]);
          setTotal(0);
          setError(data.message || 'Gagal mengambil data');
        }
      } catch (err) {
        setPurchases([]);
        setTotal(0);
        setError(err.data?.message || 'Gagal mengambil data');
      }
      setLoading(false);
    };
    fetchPurchases();
  }, [page, limit, search]);

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Purchase'},
        ]}
      />
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search class/user..."
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          actionHref="/admin/class/classpurchase/insert"
          actionIcon={<FaPlus />}
          actionText="Add Purchase"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <ClassPurchaseDataTable
            data={purchases}
          />
        )}
      </PageContainer>
    </div>
  );
}
