"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaIdCard } from 'react-icons/fa';
import api from '@/utils/fetchClient';
import TransferDataTable from "./DataTable";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '@/components/admin';

export default function TransferMembershipPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        if (search && search.trim() !== '') {
          // Search mode - client-side filtering for now
          let allMatches = null;
          try {
            const data = await api.get(`/api/membership-transfers?search=${encodeURIComponent(search)}`);
            const arr = data.data?.transfers || [];
            if (Array.isArray(arr)) {
              allMatches = arr;
            }
          } catch (e) {
            // Fallback to all data and filter locally
          }

          if (!allMatches) {
            const allData = await api.get('/api/membership-transfers');
            const arr = allData.data?.transfers || [];
            if (Array.isArray(arr)) {
              allMatches = arr.filter(t =>
                (t.fromUser?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (t.toUser?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (t.fromMembership?.membershipPlan?.name || '').toLowerCase().includes(search.toLowerCase())
              );
            } else {
              allMatches = [];
            }
          }

          const start = (page - 1) * perPage;
          const pageSlice = allMatches.slice(start, start + perPage);
          setTransfers(pageSlice);
          setTotalRows(allMatches.length);
        } else {
          // Pagination mode
          const data = await api.get(`/api/membership-transfers?page=${page}&limit=${perPage}`);
          const result = data.data || {};
          setTransfers(result.transfers || []);
          setTotalRows(result.total || 0);
        }
      } catch (err) {
        setTransfers([]);
        if (err.isNetworkError) {
          setBackendError(true);
        }
      }
      setLoading(false);
    };
    fetchTransfers();
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
          { label: 'Transfer Membership' }
        ]}
      />

      <PageContainer>
        <PageHeader
          searchPlaceholder="Search from member/to member/plan..."
          searchValue={searchInput}
          onSearchChange={e => setSearchInput(e.target.value)}
          actionHref="/admin/membership/transfer/insert"
          actionIcon={<FaPlus />}
          actionText="Transfer Membership"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <TransferDataTable
            data={transfers}
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
