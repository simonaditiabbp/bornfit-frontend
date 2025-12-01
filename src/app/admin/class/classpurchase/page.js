"use client"
import { useEffect, useState } from 'react';
import DataTable from '../../class/plans/DataTable';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaPlus, FaFileInvoice, FaAngleRight } from 'react-icons/fa';

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
        <button className="px-3 py-1 rounded bg-amber-400 text-gray-900 font-semibold hover:bg-amber-500 mr-2" onClick={() => router.push(`/admin/class/classpurchase/edit?id=${row.id}`)}>Edit</button>
      </>
    ), ignoreRowClick: true }
  ];

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaFileInvoice className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Class Purchases</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Cari user/class..."
          className="w-full max-w-md p-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-base bg-gray-700 text-gray-200 placeholder-gray-400"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <Link
          href="/admin/class/classpurchase/insert"
          className="bg-amber-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Add Purchase
        </Link>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
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
