"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaPlus, FaSnowflake, FaAngleRight } from 'react-icons/fa';
import FreezeDataTable from "./DataTable";
import BackendErrorFallback from "@/components/BackendErrorFallback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FreezeMembershipPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchFreezes = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        
        if (search && search.trim() !== '') {
          // Search mode - client-side filtering for now
          let allMatches = null;
          try {
            const res = await fetch(`${API_URL}/api/membership-freezes?search=${encodeURIComponent(search)}`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            const arr = data.data?.freezes || [];
            if (Array.isArray(arr)) {
              allMatches = arr;
            }
          } catch (e) {
            // Fallback to all data and filter locally
          }

          if (!allMatches) {
            const allRes = await fetch(`${API_URL}/api/membership-freezes`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const allData = await allRes.json();
            const arr = allData.data?.freezes || [];
            if (Array.isArray(arr)) {
              allMatches = arr.filter(f =>
                (f.membership?.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (f.membership?.membershipPlan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (f.status || '').toLowerCase().includes(search.toLowerCase())
              );
            } else {
              allMatches = [];
            }
          }

          const start = (page - 1) * perPage;
          const pageSlice = allMatches.slice(start, start + perPage);
          setFreezes(pageSlice);
          setTotalRows(allMatches.length);
        } else {
          // Pagination mode
          const res = await fetch(`${API_URL}/api/membership-freezes?page=${page}&limit=${perPage}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          if (!res.ok) throw new Error("Gagal fetch freezes");
          const data = await res.json();
          const result = data.data || {};
          setFreezes(result.freezes || []);
          setTotalRows(result.total || 0);
        }
      } catch (err) {
        setFreezes([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchFreezes();
  }, [page, perPage, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaSnowflake className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Freeze Membership</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search member/plan/status..."
          className="w-full max-w-md p-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-base bg-gray-700 text-gray-200 placeholder-gray-400"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); }}
        />
        <Link
          href="/admin/membership/freeze/insert"
          className="bg-amber-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Freeze Membership
        </Link>
      </div>

      <FreezeDataTable
        data={freezes}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        paginationPerPage={perPage}
        currentPage={page}
        onChangePage={setPage}
        onChangeRowsPerPage={newLimit => { setPerPage(newLimit); setPage(1); }}
        paginationRowsPerPageOptions={[10, 25, 50]}
      />
    </div>
  );
}
