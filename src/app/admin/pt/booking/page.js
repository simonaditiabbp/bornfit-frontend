"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/utils/fetchClient';
import PTBookingDataTable from './DataTable';
import { FaChalkboardTeacher, FaPlus } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText, StyledDataTable } from '@/components/admin';

export default function PTBookingPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Initialize bookingTimeFilter from URL parameter
  const [bookingTimeFilter, setBookingTimeFilter] = useState(() => {
    const bookingTimeParam = searchParams.get('bookingTimeFilter');
    if (bookingTimeParam && ['today', 'this-week', 'this-month', 'all'].includes(bookingTimeParam)) {
      return bookingTimeParam;
    }
    return 'all';
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [backendError, setBackendError] = useState(false);

  // Auto-fill search input from URL query parameter
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchInput(decodeURIComponent(searchParam));
    }
  }, [searchParams]);

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
        if (bookingTimeFilter && bookingTimeFilter !== 'all') {
          params.append('bookingTimeFilter', bookingTimeFilter);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
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
  }, [page, limit, search, bookingTimeFilter, statusFilter]);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Search member/plan/status..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full max-w-xs p-2 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:border-amber-500 text-base"
            />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                if (page !== 1) setPage(1);
              }}
              className="p-2 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:outline-none text-base"
            >
              <option value="all">All Status</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={bookingTimeFilter}
              onChange={e => {
                setBookingTimeFilter(e.target.value);
                if (page !== 1) setPage(1);
              }}
              className="p-2 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:outline-none text-base"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
            </select>
          </div>
          <a
            href="/admin/pt/booking/create"
            className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 dark:from-amber-400 dark:to-amber-500 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
          >
            <FaPlus />
            New Booking
          </a>
        </div>
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
