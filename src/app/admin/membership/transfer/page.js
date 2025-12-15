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

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage, currentPageArg) => {
    const perPageNum = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPageNum || perPageNum === perPage) return;
    setPerPage(perPageNum);
    if (page !== 1) setPage(1);
  };

  useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      setBackendError(false);
      
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
        });
        
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        
        const data = await api.get(`/api/membership-transfers?${params.toString()}`);
        setTransfers(data.data?.transfers || []);
        setTotalRows(data.data?.total || 0);
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
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
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
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </PageContainer>            
    </div>
  );
}
