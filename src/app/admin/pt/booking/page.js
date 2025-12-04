"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PTBookingDataTable from './DataTable';
import { FaPlus, FaCalendar, FaAngleRight } from 'react-icons/fa';

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
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaCalendar className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/pt/booking" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2">PT Booking</Link>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search member/plan/status..."
            className="w-full max-w-xs p-2 border border-amber-200 rounded focus:outline-amber-300 text-base bg-gray-800 text-gray-200"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); }}
          />
          <Link href="/admin/pt/booking/create" className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 py-2 rounded font-semibold flex items-center gap-2">
            <FaPlus className="inline-block" /> New Booking
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-amber-300">Loading...</div>
        ) : (
          <PTBookingDataTable
            data={bookings}
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={limit}
            currentPage={page}
            onChangePage={setPage}
            onChangeRowsPerPage={newLimit => { setLimit(newLimit); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
