"use client";
import { useEffect, useState } from 'react';
import api from '@/utils/fetchClient';
import PTBookingDataTable from './DataTable';
import { FaChalkboardTeacher, FaPlus } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText, StyledDataTable } from '@/components/admin';

export default function PTBookingPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [bookings, setBookings] = useState([]);
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
        const bookingData = await api.get(`/api/ptsessionbookings/paginated?${params.toString()}`);
        const result = bookingData.data || {};
        setBookings(result.bookings || []);
        setTotal(result.total || 0);
      } catch (err) {
        setBookings([]);
        if (err.isNetworkError) {
          setBackendError(true);
        }
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

  // Debounce search input to avoid spamming the API
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchInput]);

  return (
    <div>
      <PageBreadcrumb items={[
        { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Booking' }
      ]} />
      
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/plan/status..."
          searchValue={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          actionHref="/admin/pt/booking/create"          
          actionIcon={<FaPlus />}
          actionText="New Booking"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <PTBookingDataTable
            data={bookings}
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
