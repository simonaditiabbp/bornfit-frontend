"use client";
import { useCallback, useEffect, useState } from "react";
import BackendErrorFallback from "../../../../components/BackendErrorFallback";
import ClassPlansDataTable from "./DataTable";
import Link from "next/link";
import { FaPlus, FaFileInvoice, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from "@/components/admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (search && search.trim() !== '') {
        let allMatches = null;
        try {
          const resSearch = await fetch(`${API_URL}/api/eventplans?search=${encodeURIComponent(search)}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const dataEvent = await resSearch.json();
          const arr = dataEvent.data?.plans || [];
          if (Array.isArray(arr)) {
            allMatches = arr;
          }
        } catch (e) {
          // ignore and fallback
        }
        if (!allMatches) {
          const resAll = await fetch(`${API_URL}/api/eventplans`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const dataEvent = await resAll.json();
          const arr = dataEvent.data?.plans || [];
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
        const res = await fetch(`${API_URL}/api/eventplans?page=${page}&limit=${limit}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataEvent = await res.json();
        const arr = dataEvent.data?.plans || [];
        setPlans(Array.isArray(arr) ? arr : []);
        setTotal(dataEvent?.data?.total ?? 0);
      }
    } catch (err) {
      setBackendError(true);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/eventplans/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
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
          { icon: <FaFileInvoice className="w-3 h-3" />, label: 'Class Plans' }
        ]}
      />
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search plans..."
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
          />
        )}
      </PageContainer>
    </div>
  );
}
