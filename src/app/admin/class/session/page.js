"use client";
import ClassSessionDataTable from "./DataTable";
import {QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { FaPlus, FaIdCard, FaAngleRight } from 'react-icons/fa';

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
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaIdCard className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Class Session</span>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          {console.log('[ClassSession] Render Search Input')}
          <input
            type="text"
            placeholder="Search member/plan/status..."
            className="w-full max-w-md p-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-base bg-gray-700 text-gray-200 placeholder-gray-400"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setPage(1); }}
          />
          <Link
            href="/admin/class/session/insert"
            className="bg-amber-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Tambah Class
          </Link>
        </div>
        
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
      {console.log('[ClassSession] Render DataTable')}
      {loading ? (
        <div className="text-amber-300 text-center font-medium mt-8">Loading data...</div>
      ) : (
        <ClassSessionDataTable
          data={sessions}
          plans={plans}
          members={members}
          instructors={instructors}
          setQrSession={setQrSession}
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

      {/* Modal QR Code */}
      {qrSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center relative min-w-[340px]">
            <h2 className="text-2xl font-extrabold mb-4 text-blue-700 drop-shadow">QR Code for {qrSession.name || `Class #${qrSession.id}`}</h2>
            <div className="flex flex-col items-center justify-center">
              <div id="qr-download-area-class" className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-2 shadow">
                <QRCodeCanvas id="qr-canvas-class" value={qrSession.qr_code || qrSession.id?.toString() || ''} size={220} level="H" includeMargin={true} />
                <QRCodeSVG  id="qr-canvas-svg-class" value={qrSession.qr_code || qrSession.id?.toString() || ''} size={220} level="H" includeMargin={true}  style={{ display: 'none' }} />
              </div>
              <div className="mt-2 text-base text-blue-700 font-mono tracking-wider">{qrSession.qr_code || qrSession.id}</div>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
                  onClick={() => {
                    const canvas = document.getElementById('qr-canvas-class');
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qrcode_class_${qrSession.qr_code || qrSession.id}.png`;
                    a.click();
                  }}
                >
                  Download PNG
                </button>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-700 transition-all"
                  onClick={() => {
                    const svgElem = document.querySelector("#qr-download-area-class svg");
                    if (!svgElem) {
                      alert("SVG element not found");
                      return;
                    }
                    const serializer = new XMLSerializer();
                    let svgStr = serializer.serializeToString(svgElem);
                    if (!svgStr.startsWith('<?xml')) {
                      svgStr = '<?xml version="1.0" standalone="no"?>\r\n' + svgStr;
                    }
                    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qrcode_class_${qrSession.qr_code || qrSession.id}.svg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Download SVG
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded font-semibold hover:bg-red-700 transition-all"
                  onClick={async () => {
                      const canvas = document.getElementById("qr-canvas-class");
                      if (!canvas) {
                      alert("QR canvas not found");
                      return;
                      }

                      const imgData = canvas.toDataURL("image/png");
                      const pdf = new jsPDF({
                      orientation: "portrait",
                      unit: "mm",
                      format: [80, 100],
                      });

                      pdf.setFont("helvetica", "bold");
                      pdf.setFontSize(14);
                      pdf.text("QR CODE", 40, 10, { align: "center" });
                      pdf.addImage(imgData, "PNG", 15, 20, 50, 50);
                      pdf.setFont("courier", "normal");
                      pdf.setFontSize(12);
                      pdf.setTextColor(37, 99, 235);
                      pdf.text(qrSession.qr_code, 40, 80, { align: "center" });
                      pdf.save(`${qrSession.qr_code}.pdf`);
                  }}
                  >Download PDF
                </button>
              </div>
              <button
                  className="mt-8 bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
                  onClick={() => setQrSession(null)}
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
