"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PTBookingDataTable from './DataTable';

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
            const arr = await bookingsSearchRes.json();
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
            const arr = await allRes.json();
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
          const result = await bookingsRes.json();
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Booking PT Session</h1>
        <Link href="/admin/pt/booking/create" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700">+ Booking Baru</Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search member/plan/status..."
          className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); }}
        />
      </div>
      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
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
  );
}
