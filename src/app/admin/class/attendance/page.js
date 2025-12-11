"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClassAttendanceDataTable from './DataTable';
import { FaPlus, FaDumbbell, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from '@/components/admin';
import api from '@/utils/fetchClient';

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
    const fetchAll = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        if (search && search.trim() !== '') {
          let allMatches = null;
          try {
            const dataAttendances = await api.get(`/api/classattendances?search=${encodeURIComponent(search)}`);
            if (Array.isArray(dataAttendances.data.attendances)) allMatches = dataAttendances.data.attendances;
          } catch (e) {}

          if (!allMatches) {
            const dataAttendances = await api.get('/api/classattendances');
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
          const dataAttendances = await api.get(`/api/classattendances?page=${page}&limit=${limit}`);
          setAttendances(dataAttendances.data.attendances || []);
          setTotal(dataAttendances.data.total || 0);
        }
      } catch (err) {
        setAttendances([]);
        if (err.isNetworkError) setBackendError(true);
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
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Attendance' },
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
