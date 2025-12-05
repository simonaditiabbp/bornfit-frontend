"use client";
import { useEffect, useState } from 'react';
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
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const fetchWith401 = async (url) => {
      const res = await fetch(url, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (res.status === 401) {
        setBookings([]);
        localStorage.removeItem('token');
        window.location.replace('/login');
      }
      return res.json();
    };

    const fetchAll = async () => {
      setLoading(true);
      try {
        if (search && search.trim() !== '') {
          let allMatches = null;
          try {
            // Try endpoint that may support searching and return an array
            const bookingsSearchRes = await fetch(`http://localhost:3002/api/ptsessionbookings?search=${encodeURIComponent(search)}`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const bookingData = await bookingsSearchRes.json();
            const arr = bookingData.data?.bookings || [];
            if (Array.isArray(arr)) {
              allMatches = arr;
            }
          } catch (e) {
            // ignore and fallback
          }

          if (!allMatches) {
            // fallback: fetch all bookings and filter client-side
            const allRes = await fetch(`http://localhost:3002/api/ptsessionbookings`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const bookingData = await allRes.json();
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

          // Paginate matches for the table UI
          const start = (page - 1) * limit;
          const pageSlice = allMatches.slice(start, start + limit);
          setBookings(pageSlice);
          setTotal(allMatches.length);
        } else {
          const bookingsRes = await fetch(`http://localhost:3002/api/ptsessionbookings/paginated?page=${page}&limit=${limit}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const bookingData = await bookingsRes.json();
          const result = bookingData.data || {};
          setBookings(result.bookings || []);
          setTotal(result.total || 0);
        }
      } catch (err) {
        setBookings([]);
        setBackendError(true);
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
        { icon: FaChalkboardTeacher, label: 'PT Session', href: '/admin/pt/session' },
        { label: 'Booking' }
      ]} />
      
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/plan/status..."
          searchValue={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          actionHref="/admin/pt/booking/create"
          actionIcon={FaPlus}
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
