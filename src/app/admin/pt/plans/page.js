"use client";
import { useCallback, useEffect, useState } from "react";
import BackendErrorFallback from "../../../../components/BackendErrorFallback";
import PTPlansDataTable from "./DataTable";
import Link from "next/link";
import { FaCog, FaPlus } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText, StyledDataTable } from '../../../../components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (search && search.trim() !== '') {
        let allMatches = null;
        try {
          // Try endpoint that may support searching and return an array
          const resSearch = await fetch(`${API_URL}/api/ptsessionplans?search=${encodeURIComponent(search)}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const sessionData = await resSearch.json();
          const arr = sessionData.data?.plans || [];
          if (Array.isArray(arr)) {
            allMatches = arr;
          }
        } catch (e) {
          // ignore and fallback
        }
        if (!allMatches) {
          // fallback: fetch all plans and filter client-side
          const resAll = await fetch(`${API_URL}/api/ptsessionplans`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const sessionPlansData = await resAll.json();
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
        // Paginate matches for the table UI
        const start = (page - 1) * limit;
        const pageSlice = allMatches.slice(start, start + limit);
        setPlans(pageSlice);
        setTotal(allMatches.length);
      } else {
        const res = await fetch(`${API_URL}/api/ptsessionplans?page=${page}&limit=${limit}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const sessionPlansData = await res.json();
        const arr = sessionPlansData.data?.plans || [];
        setPlans(arr);
        setTotal(sessionPlansData.data?.total || 0);
      }
    } catch (err) {
      setBackendError(true);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/ptsessionplans/${id}`, {
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
