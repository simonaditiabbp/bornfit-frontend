"use client"
import { useEffect, useState } from 'react';
import DataTable from '../../class/plans/DataTable';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPurchaseListPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/classpurchases?limit=${limit}&page=${page}&search=${encodeURIComponent(search)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.data?.purchases)) {
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
        setError('Gagal mengambil data');
      }
      setLoading(false);
    };
    fetchPurchases();
  }, [page, limit, search]);

  const columns = [
    { name: 'ID', selector: row => row.id, sortable: true },
    { name: 'User', selector: row => row.user?.name || '-', sortable: true },
    { name: 'Class', selector: row => row.class?.name || '-', sortable: true },
    { name: 'Price', selector: row => row.price, sortable: true },
    { name: 'Purchase Date', selector: row => row.purchase_date?.slice(0, 16).replace('T', ' ') || '-', sortable: true },
    { name: 'Aksi', cell: row => (
      <>
        <button className="px-3 py-1 rounded bg-blue-500 text-white mr-2" onClick={() => router.push(`/admin/class/classpurchase/edit/${row.id}`)}>Edit</button>
      </>
    ), ignoreRowClick: true }
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Class Purchases</h1>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Cari user/class..."
          className="border rounded p-2 w-64"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => router.push('/admin/class/classpurchase/insert')}>Tambah Purchase</button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <DataTable
        columns={columns}
        data={purchases}
        pagination
        paginationServer
        paginationTotalRows={total}
        paginationPerPage={limit}
        currentPage={page}
        onChangePage={setPage}
        onChangeRowsPerPage={setLimit}
        paginationRowsPerPageOptions={[10, 25, 50]}
      />
    </div>
  );
}
