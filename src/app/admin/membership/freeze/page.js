"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaIdCard } from 'react-icons/fa';
import FreezeDataTable from "./DataTable";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FreezeMembershipPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchFreezes = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        
        if (search && search.trim() !== '') {
          // Search mode - client-side filtering for now
          let allMatches = null;
          try {
            const res = await fetch(`${API_URL}/api/membership-freezes?search=${encodeURIComponent(search)}`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            const arr = data.data?.freezes || [];
            if (Array.isArray(arr)) {
              allMatches = arr;
            }
          } catch (e) {
            // Fallback to all data and filter locally
          }

          if (!allMatches) {
            const allRes = await fetch(`${API_URL}/api/membership-freezes`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const allData = await allRes.json();
            const arr = allData.data?.freezes || [];
            if (Array.isArray(arr)) {
              allMatches = arr.filter(f =>
                (f.membership?.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (f.membership?.membershipPlan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (f.status || '').toLowerCase().includes(search.toLowerCase())
              );
            } else {
              allMatches = [];
            }
          }

          const start = (page - 1) * perPage;
          const pageSlice = allMatches.slice(start, start + perPage);
          setFreezes(pageSlice);
          setTotalRows(allMatches.length);
        } else {
          // Pagination mode
          const res = await fetch(`${API_URL}/api/membership-freezes?page=${page}&limit=${perPage}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          if (!res.ok) throw new Error("Gagal fetch freezes");
          const data = await res.json();
          const result = data.data || {};
          setFreezes(result.freezes || []);
          setTotalRows(result.total || 0);
        }
      } catch (err) {
        setFreezes([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchFreezes();
  }, [page, perPage, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership', href: '/admin/membership/session' },
          { label: 'Freeze Membership' }
        ]}
      />

      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/plan/status..."
          searchValue={searchInput}
          onSearchChange={e => setSearchInput(e.target.value)}
          actionHref="/admin/membership/freeze/insert"
          actionIcon={<FaPlus />}
          actionText="Freeze Membership"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <FreezeDataTable
            data={freezes}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            currentPage={page}
            onChangePage={setPage}
            onChangeRowsPerPage={newLimit => { setPerPage(newLimit); setPage(1); }}
            paginationRowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </PageContainer>
    </div>
  );
}
