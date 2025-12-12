"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaIdCard } from 'react-icons/fa';
import api from '@/utils/fetchClient';
import FreezeDataTable from "./DataTable";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '@/components/admin';

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
    const fetchFreezes = async () => {
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
        
        const data = await api.get(`/api/membership-freezes?${params.toString()}`);
        setFreezes(data.data?.freezes || []);
        setTotalRows(data.data?.total || 0);
      } catch (err) {
        setFreezes([]);
        if (err.isNetworkError) {
          setBackendError(true);
        }
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
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </PageContainer>
    </div>
  );
}
