"use client";
import { useCallback, useEffect, useState } from "react";
import BackendErrorFallback from "../../../../components/BackendErrorFallback";
import ClassPlansDataTable from "./DataTable";
import Link from "next/link";
import { FaPlus, FaCog, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from "@/components/admin";
import api from '@/utils/fetchClient';

export default function ClassPlansPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
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
      const dataEvent = await api.get(`/api/eventplans?${params.toString()}`);
      const arr = dataEvent.data?.plans || [];
      setPlans(Array.isArray(arr) ? arr : []);
      setTotal(dataEvent?.data?.total ?? 0);
    } catch (err) {
      setPlans([]);
      if (err.isNetworkError) setBackendError(true);
    }
    setLoading(false);
  }, [page, limit, search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

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

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/eventplans/${id}`);
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
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/class/plans' },
          { label: 'Class Plans' }
        ]}
      />
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search name/description..."
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          actionHref="/admin/class/plans/insert"
          actionIcon={<FaPlus />}
          actionText="Add Plan"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <ClassPlansDataTable
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
