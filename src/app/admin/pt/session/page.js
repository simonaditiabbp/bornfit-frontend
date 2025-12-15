"use client";
import PTSessionDataTable from "./DataTable";
import {QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from '@/utils/fetchClient';
import BackendErrorFallback from "@/components/BackendErrorFallback";
import { jsPDF } from "jspdf";
import { FaChalkboardTeacher, FaPlus } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText, StyledDataTable } from '@/components/admin';

export default function PTSessionListPage() {
  const [qrSession, setQrSession] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    // Fetch plans, members, trainers for display
    const fetchMeta = async () => {
      try {
        const [plansData, membersData, trainersData] = await Promise.all([
          api.get('/api/ptsessionplans'),
          api.get('/api/users?role=member&limit=9999'),
          api.get('/api/users?role=trainer&limit=9999')
        ]);
        setPlans(plansData.data?.plans || []);
        setMembers(membersData.data?.users || []);
        setTrainers(trainersData.data?.users || []);
      } catch {}
    };
    fetchMeta();
    const fetchSessions = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
        });
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        const sessionData = await api.get(`/api/personaltrainersessions/paginated?${params.toString()}`);
        const arr = sessionData.data?.sessions || [];
        setSessions(arr);
        setTotalRows(sessionData.data?.total || 0);
      } catch (err) {
        setSessions([]);
        if (err.isNetworkError) {
          setBackendError(true);
        }
      }
      setLoading(false);
    };
    fetchSessions();
  }, [page, perPage, search]);

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage, currentPageArg) => {
    const perPageNum = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPageNum || perPageNum === perPage) return;
    setPerPage(perPageNum);
    if (page !== 1) setPage(1);
  };

  // Debounce search input to avoid spamming the API
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchInput]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session' }
        ]}
      />
      
      <PageContainer>
        <PageHeader
          searchPlaceholder="Search member/plan/status..."
          searchValue={searchInput}
          onSearchChange={(e) => setSearchInput(e.target.value)}
          actionHref="/admin/pt/session/insert"
          actionIcon={<FaPlus />}
          actionText="Add PT Session"
        />
        {loading ? (
          <LoadingText />
        ) : (
          <PTSessionDataTable
            data={sessions}
            plans={plans}
            members={members}
            trainers={trainers}
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
      {/* Modal QR Code */}
      {qrSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center relative min-w-[340px]">
            <h2 className="text-2xl font-extrabold mb-4 text-blue-700 drop-shadow">QR Code for {qrSession.name || `Session #${qrSession.id}`}</h2>
            <div className="flex flex-col items-center justify-center">
              <div id="qr-download-area-session" className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-2 shadow">
                <QRCodeCanvas id="qr-canvas-session" value={qrSession.qr_code || qrSession.id?.toString() || ''} size={220} level="H" includeMargin={true} />
                <QRCodeSVG  id="qr-canvas-svg-session" value={qrSession.qr_code || qrSession.id?.toString() || ''} size={220} level="H" includeMargin={true}  style={{ display: 'none' }} />
              </div>
              <div className="mt-2 text-base text-blue-700 font-mono tracking-wider">{qrSession.qr_code || qrSession.id}</div>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
                  onClick={() => {
                    // Download PNG
                    const canvas = document.getElementById('qr-canvas-session');
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qrcode_session_${qrSession.qr_code || qrSession.id}.png`;
                    a.click();
                  }}
                >
                  Download PNG
                </button>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-700 transition-all"
                  onClick={() => {
                    // Download SVG
                    const svgElem = document.querySelector("#qr-download-area-session svg");
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
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `qrcode_session_${qrSession.qr_code || qrSession.id}.svg`;
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
                      const canvas = document.getElementById("qr-canvas-session");
                      if (!canvas) {
                      alert("QR canvas not found");
                      return;
                      }

                      const imgData = canvas.toDataURL("image/png");
                      const pdf = new jsPDF({
                      orientation: "portrait",
                      unit: "mm",
                      format: [80, 100], // small size like label
                      });

                      // Header
                      pdf.setFont("helvetica", "bold");
                      pdf.setFontSize(14);
                      pdf.text("QR CODE", 40, 10, { align: "center" });

                      // Gambar QR
                      pdf.addImage(imgData, "PNG", 15, 20, 50, 50);

                      // Kode QR di bawah gambar
                      pdf.setFont("courier", "normal");
                      pdf.setFontSize(12);
                      pdf.setTextColor(37, 99, 235); // blue color (#2563eb)
                      pdf.text(qrSession.qr_code, 40, 80, { align: "center" });

                      // Simpan PDF
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
