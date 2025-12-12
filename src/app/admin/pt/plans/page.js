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
    setBackendError(false);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search && search.trim() !== '') {
        params.append('search', search);
      }
      const sessionPlansData = await api.get(`/api/ptsessionplans?${params.toString()}`);
      const arr = sessionPlansData.data?.plans || [];
      setPlans(arr);
      setTotal(sessionPlansData.data?.total || 0);
    } catch (err) {
      setPlans([]);
      if (err.isNetworkError) {
        setBackendError(true);
      }
    }
    setLoading(false);
  }, [page, limit, search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage, currentPageArg) => {
    const perPageNum = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPageNum || perPageNum === limit) return;
    setLimit(perPageNum);
    if (page !== 1) setPage(1);
  };

  // Debounce search input to avoid spamming the API
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(search);
      setPage(1);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [search]);

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
            data={plans}
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={limit}
            currentPage={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </PageContainer>
    </div>
  );
}
