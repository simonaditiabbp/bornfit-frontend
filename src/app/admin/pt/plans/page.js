"use client";
import { useCallback, useEffect, useState } from "react";
import BackendErrorFallback from "../../../../components/BackendErrorFallback";
import PTPlansDataTable from "./DataTable";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTPlansPage() {
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
      const res = await fetch(`${API_URL}/api/ptsessionplans?page=${page}&limit=${limit}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
  const data = await res.json();
  console.log('PTSessionPlans API response:', data);
  setPlans(Array.isArray(data) ? data : []);
  setTotal(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      setBackendError(true);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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
      await fetch(`${API_URL}/api/ptsessionplans/${id}`, {
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

  const columns = [
    { name: 'Name', selector: row => row.name, sortable: true, cell: row => <span className="font-semibold">{row.name}</span> },
    { name: 'Duration', selector: row => row.duration, sortable: true, cell: row => `${row.duration} hari` },
    { name: 'Max Session', selector: row => row.max_session, sortable: true },
    { name: 'Price', selector: row => row.price, sortable: true, cell: row => `Rp.${row.price.toLocaleString()}` },
    { name: 'Minutes/Session', selector: row => row.minutes_per_session, sortable: true, cell: row => `${row.minutes_per_session} menit` },
    { name: 'Description', selector: row => row.description, sortable: false },
    {
      name: 'Actions',
      cell: row => (
         <Link href={`/admin/pt/plans/edit?id=${row.id}`} className="bg-gray-400 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
        // <div className="flex gap-2 justify-center">
        //   <Link href={`/admin/pt/plans/edit?id=${row.id}`} className="bg-yellow-400 text-white px-3 py-1 rounded font-semibold hover:bg-yellow-500">Edit</Link>
        //   <button className="bg-red-500 text-white px-3 py-1 rounded font-semibold hover:bg-red-600" onClick={() => handleDelete(row.id)}>Delete</button>
        // </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">PT Session Plans</h1>
        <Link href="/admin/pt/plans/insert" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700">+ Add Plan</Link>
      </div>
      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : (
        <PTPlansDataTable
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
