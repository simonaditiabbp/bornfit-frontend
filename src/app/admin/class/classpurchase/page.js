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

  const startNo = (page - 1) * limit;
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    { name: 'User', selector: row => row.user?.name || '-', sortable: true, cell: row => <span className="font-semibold">{row.user?.name || '-'}</span> },
    { name: 'Class', selector: row => row.class?.name || '-', sortable: true },
    { name: 'Price', selector: row => row.price, sortable: true },
    { name: 'Purchase Date', selector: row => row.purchase_date?.slice(0, 16).replace('T', ' ') || '-', sortable: true },
    { name: 'Actions', cell: row => (
      <Link href={`/admin/class/classpurchase/edit?id=${row.id}`} className="bg-gray-600 text-white px-5 py-1 rounded font-semibold hover:bg-gray-500">Detail</Link>
    ), ignoreRowClick: true }
  ];

  return (
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <FaFileInvoice className="w-3 h-3 me-2.5 text-amber-300" /> 
              <span className="ms-1 text-sm font-medium text-amber-300 md:ms-2 dark:text-amber-300">Class Purchases</span>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="m-5 p-5 bg-gray-800 border border-gray-600 rounded-lg">
        <div className="mb-4 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search user/class..."
            className="w-full max-w-xs p-2 border text-gray-100 bg-gray-700 border-amber-200 rounded focus:outline-none text-base"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <Link href="/admin/class/classpurchase/insert" className="flex items-center gap-2 bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500">
            <FaPlus className="inline-block" />
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
    </div>
  );
}
