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
  const [searchInput, setSearchInput] = useState('');
  const router = useRouter();

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

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        const data = await api.get(`/api/classpurchases?${params.toString()}`);
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
          searchValue={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          actionHref="/admin/class/classpurchase/insert"
          actionIcon={<FaPlus />}
          actionText="Add Purchase"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <ClassPurchaseDataTable
            data={purchases}
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
