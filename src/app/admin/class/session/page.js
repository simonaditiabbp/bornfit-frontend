"use client";
import ClassSessionDataTable from "./DataTable";
import {QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { FaPlus, FaDumbbell, FaAngleRight } from 'react-icons/fa';
import { LoadingText, PageBreadcrumb, PageContainer, PageHeader } from "@/components/admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSessionListPage() {
  const [qrSession, setQrSession] = useState(null);
  console.log('[ClassSession] Render Parent');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState('all'); // 'all', 'recurring_patterns', 'instances', 'single'
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    console.log('[ClassSession] handleChangePage ->', pageNum);
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage, currentPageArg) => {
    const perPageNum = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPageNum || perPageNum === perPage) return;
    console.log('[ClassSession] handleChangeRowsPerPage ->', perPageNum, 'currentPageArg=', currentPageArg);
    setPerPage(perPageNum);
    if (page !== 1) setPage(1);
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resPlans = await fetch(`${API_URL}/api/eventplans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resMembers = await fetch(`${API_URL}/api/users/?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructors = await fetch(`${API_URL}/api/users/?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const plansData = await resPlans.json();
        const membersData = await resMembers.json();
        const instructorsData = await resInstructors.json();
        const arrPlans = plansData.data?.plans || [];
        const arrMembers = membersData.data?.users || [];
        const arrInstructors = instructorsData.data?.users || [];
        if (resPlans.ok) setPlans(arrPlans);
        if (resMembers.ok) setMembers(arrMembers);
        if (resInstructors.ok) setInstructors(arrInstructors);
      } catch {}
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setBackendError(false);
      
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          scheduleType: scheduleTypeFilter,
        });
        
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        
        console.log('[Fetch] API call:', params.toString());
        
        const res = await fetch(`${API_URL}/api/classes/paginated?${params.toString()}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        
        if (!res.ok) throw new Error("Gagal fetch classes");
        
        const classData = await res.json();
        const result = classData.data || {};
        setSessions(result.classes || []);
        setTotalRows(result.total || 0);
      } catch (err) {
        console.error('[Fetch] Error:', err);
        setSessions([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    
    fetchSessions();
  }, [page, perPage, search, scheduleTypeFilter]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);
  
  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [scheduleTypeFilter]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session' }
        ]}
      />
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search name/description..."
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          actionHref="/admin/class/session/insert"
          actionIcon={<FaPlus />}
          actionText="Add Class"
        />
        <div className="flex flex-col gap-4 mb-4">
        
        {/* Schedule Type Filter */}
        <div className="flex items-center gap-3">
          <span className="text-gray-300 font-medium">Filter by Type:</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setScheduleTypeFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  scheduleTypeFilter === 'all' 
                    ? 'bg-amber-400 text-gray-900' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Classes
              </button>
              <button
                onClick={() => { setScheduleTypeFilter('recurring_patterns'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  scheduleTypeFilter === 'recurring_patterns' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🔁 Recurring Patterns Only
              </button>
              <button
                onClick={() => { setScheduleTypeFilter('instances'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  scheduleTypeFilter === 'instances' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📅 Instances Only
              </button>
              <button
                onClick={() => { setScheduleTypeFilter('single'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  scheduleTypeFilter === 'single' 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Single Classes Only
              </button>
            </div>
          </div>
        </div>
        {loading ? (
          <LoadingText />
        ) : (
          <ClassSessionDataTable
            data={sessions}
            plans={plans}
            members={members}
            instructors={instructors}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            currentPage={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </PageContainer>
    </div>
  );
}
