"use client";
import { useCallback, useEffect, useState } from "react";
import api from '@/utils/fetchClient';
import BackendErrorFallback from "../../../../components/BackendErrorFallback";
import PTPlansDataTable from "./DataTable";
import Link from "next/link";
import { FaCog, FaPlus } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText, StyledDataTable } from '../../../../components/admin';

export default function PTPlansPage() {
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      if (search && search.trim() !== '') {
        let allMatches = null;
        try {
          const sessionData = await api.get(`/api/ptsessionplans?search=${encodeURIComponent(search)}`);
          const arr = sessionData.data?.plans || [];
          if (Array.isArray(arr)) {
            allMatches = arr;
          }
        } catch (e) {
          // ignore and fallback
        }
        if (!allMatches) {
          const sessionPlansData = await api.get('/api/ptsessionplans');
          const arr = sessionPlansData.data?.plans || [];
          if (Array.isArray(arr)) {
            allMatches = arr.filter(p =>
              (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
              (p.description || '').toLowerCase().includes(search.toLowerCase())
            );
          } else {
            allMatches = [];
          }
        }
        const start = (page - 1) * limit;
        const pageSlice = allMatches.slice(start, start + limit);
        setPlans(pageSlice);
        setTotal(allMatches.length);
      } else {
        const sessionPlansData = await api.get(`/api/ptsessionplans?page=${page}&limit=${limit}`);
        const arr = sessionPlansData.data?.plans || [];
        setPlans(arr);
        setTotal(sessionPlansData.data?.total || 0);
      }
    } catch (err) {
      if (err.isNetworkError) {
        setBackendError(true);
      }
    }
    setLoading(false);
  }, [page, limit, search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Debounce search input to avoid spamming the API
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(search);
      setPage(1);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [search]);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newPerPage) => {
    setLimit(newPerPage);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/ptsessionplans/${id}`);
      await fetchPlans();
    } catch (err) {
      alert('Gagal menghapus plan');
    }
    setLoading(false);
  };

  console.log("Rendered with plans:", plans);

  const filteredPlans = plans.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/pt/plans' },
          { label: 'PT Plans' }
        ]}
      />
      
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search name/description..."
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          actionHref="/admin/pt/plans/insert"
          actionIcon={<FaPlus />}
          actionText="Add Plan"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <PTPlansDataTable
            data={filteredPlans}
          />
        )}
      </PageContainer>
    </div>
  );
}
