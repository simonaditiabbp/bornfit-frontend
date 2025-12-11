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
      try {
        if (search && search.trim() !== '') {
          let allMatches = null;
          try {
            const bookingData = await api.get(`/api/ptsessionbookings?search=${encodeURIComponent(search)}`);
            const arr = bookingData.data?.bookings || [];
            if (Array.isArray(arr)) {
              allMatches = arr;
            }
          } catch (e) {
            // ignore and fallback
          }

          if (!allMatches) {
            const bookingData = await api.get('/api/ptsessionbookings');
            const arr = bookingData.data?.bookings || [];
            if (Array.isArray(arr)) {
              allMatches = arr.filter(b =>
                (b.user_member?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.pt_session_plan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.status || '').toLowerCase().includes(search.toLowerCase())
              );
            } else {
              allMatches = [];
            }
          }

          const start = (page - 1) * limit;
          const pageSlice = allMatches.slice(start, start + limit);
          setBookings(pageSlice);
          setTotal(allMatches.length);
        } else {
          const bookingData = await api.get(`/api/ptsessionbookings/paginated?page=${page}&limit=${limit}`);
          const result = bookingData.data || {};
          setBookings(result.bookings || []);
          setTotal(result.total || 0);
        }
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
          />
        )}
      </PageContainer>
    </div>
  );
}
