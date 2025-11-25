"use client";
import { useCallback, useEffect, useState } from "react";
import BackendErrorFallback from "../../../../components/BackendErrorFallback";
import ClassPlansDataTable from "./DataTable";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPlansPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (search && search.trim() !== '') {
        let allMatches = null;
        try {
          const resSearch = await fetch(`${API_URL}/api/eventplans?search=${encodeURIComponent(search)}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const dataEvent = await resSearch.json();
          const arr = dataEvent.data?.plans || [];
          if (Array.isArray(arr)) {
            allMatches = arr;
          }
        } catch (e) {
          // ignore and fallback
        }
        if (!allMatches) {
          const resAll = await fetch(`${API_URL}/api/eventplans`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const dataEvent = await resAll.json();
          const arr = dataEvent.data?.plans || [];
          if (Array.isArray(arr)) {
            allMatches = arr.filter(p =>
              (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
              (p.description || '').toLowerCase().includes(search.toLowerCase())
            );
          } else {
            allMatches = [];
          }
        }
        const start = (page - 1) * limit;
        const pageSlice = allMatches.slice(start, start + limit);
        setPlans(pageSlice);
        setTotal(allMatches.length);
      } else {
        const res = await fetch(`${API_URL}/api/eventplans?page=${page}&limit=${limit}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const dataEvent = await res.json();
        const arr = dataEvent.data?.plans || [];
        setPlans(Array.isArray(arr) ? arr : []);
        setTotal(dataEvent?.data?.total ?? 0);
      }
    } catch (err) {
      setBackendError(true);
    }
    setLoading(false);
  }, [page, limit, search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newPerPage) => {
    setLimit(newPerPage);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/eventplans/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      await fetchPlans();
    } catch (err) {
      alert('Gagal menghapus plan');
    }
    setLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  const startNo = (page - 1) * limit;
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { name: 'Name', selector: row => row.name, sortable: true, cell: row => <span className="font-semibold">{row.name}</span> },
    { name: 'Max Visitors', selector: row => row.max_visitor, sortable: true, cell: row => `${row.max_visitor} people` },
    { name: 'Minutes/Session', selector: row => row.minutes_per_session, sortable: true, cell: row => `${row.minutes_per_session} minutes` },
    { name: 'Description', selector: row => row.description, sortable: false },
    {
      name: 'Actions',
      cell: row => (
         <Link href={`/admin/class/plans/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Class Plans</h1>
        <Link href="/admin/class/plans/insert" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700">+ Add Plan</Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search name/description..."
          className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); }}
        />
      </div>
      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : (
        <ClassPlansDataTable
          columns={columns}
          data={plans}
          pagination
          paginationServer
          paginationTotalRows={total}
          paginationPerPage={limit}
          currentPage={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
          paginationRowsPerPageOptions={[10,25,50]}
        />
      )}
    </div>
  );
}
