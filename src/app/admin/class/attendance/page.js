"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassAttendanceDataTable from './DataTable';
import { FaPlus, FaDumbbell, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from '@/components/admin';
import api from '@/utils/fetchClient';

export default function ClassAttendancePage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
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
        const dataAttendances = await api.get(`/api/classattendances?${params.toString()}`);
        setAttendances(dataAttendances.data.attendances || []);
        setTotal(dataAttendances.data.total || 0);
      } catch (err) {
        setAttendances([]);
        if (err.isNetworkError) setBackendError(true);
      }
      setLoading(false);
    };
    fetchAll();
  }, [page, limit, search]);

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

  if (backendError) return <div className="text-red-400">Backend error</div>;

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Attendance' },
        ]}
      />
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/class/plan/status..."
          searchValue={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          actionHref="/admin/class/attendance/insert"
          actionIcon={<FaPlus />}
          actionText="Add Attendance"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <ClassAttendanceDataTable
            data={attendances}
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
