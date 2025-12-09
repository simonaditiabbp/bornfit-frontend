"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassAttendanceDataTable from './DataTable';
import { FaPlus, FaCheckCircle, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassAttendancePage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [attendances, setAttendances] = useState([]);
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
        setAttendances([]);
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
            const resSearch = await fetch(`${API_URL}/api/classattendances?search=${encodeURIComponent(search)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            const dataAttendances = await resSearch.json();
            if (Array.isArray(dataAttendances.data.attendances)) allMatches = dataAttendances.data.attendances;
          } catch (e) {}

          if (!allMatches) {
            const resAll = await fetch(`${API_URL}/api/classattendances`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            const dataAttendances = await resAll.json();
            if (Array.isArray(dataAttendances.data.attendances)) {
              allMatches = dataAttendances.data.attendances.filter(b =>
                (b.user_member?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.class_plan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.status || '').toLowerCase().includes(search.toLowerCase())
              );
            } else allMatches = [];
          }

          const start = (page - 1) * limit;
          const pageSlice = allMatches.slice(start, start + limit);
          setAttendances(pageSlice);
          setTotal(allMatches.length);
        } else {
          const res = await fetch(`${API_URL}/api/classattendances?page=${page}&limit=${limit}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
          const dataAttendances = await res.json();
          setAttendances(dataAttendances.data.attendances || []);
          setTotal(dataAttendances.data.total || 0);
        }
      } catch (err) {
        setAttendances([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchAll();
  }, [page, limit, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  if (backendError) return <div className="text-red-400">Backend error</div>;

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaCheckCircle className="w-3 h-3" />, label: 'Class Attendance' }
        ]}
      />
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/class/plan/status..."
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          actionHref="/admin/class/attendance/insert"
          actionIcon={<FaPlus />}
          actionText="Add Attendance"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <ClassAttendanceDataTable
            data={attendances}
          />
        )}
      </PageContainer>
    </div>
  );
}
