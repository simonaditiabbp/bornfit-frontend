"use client";
import ClassSessionDataTable from "./DataTable";
import {QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import Link from "next/link";
import { jsPDF } from "jspdf";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSessionListPage() {
  const [qrSession, setQrSession] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
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

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resPlans = await fetch(`${API_URL}/api/eventplans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resMembers = await fetch(`${API_URL}/api/users/?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructors = await fetch(`${API_URL}/api/users/?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        // const resMembers = await fetch(`${API_URL}/api/users/filter?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        // const resInstructors = await fetch(`${API_URL}/api/users/filter?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
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
    const fetchSessions = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        if (search && search.trim() !== '') {
          let allMatches = null;
          try {
            const sessionsSearchRes = await fetch(`${API_URL}/api/classes?search=${encodeURIComponent(search)}`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const sessionsData = await sessionsSearchRes.json();
            const arr = sessionsData.data?.classes || [];
            if (Array.isArray(arr)) {
              allMatches = arr;
            }
          } catch (e) {
            // ignore and fallback
          }
          if (!allMatches) {
            const allRes = await fetch(`${API_URL}/api/classes`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            const allData = await allRes.json();
            const arr = allData.data?.classes || [];
            if (Array.isArray(arr)) {
              allMatches = arr.filter(s =>
                (s.user_member?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.class_plan?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.status || '').toLowerCase().includes(search.toLowerCase())
              );
            } else {
              allMatches = [];
            }
          }
          const start = (page - 1) * perPage;
          const pageSlice = allMatches.slice(start, start + perPage);
          setSessions(pageSlice);
          setTotalRows(allMatches.length);
        } else {
          const res = await fetch(`${API_URL}/api/classes/paginated?page=${page}&limit=${perPage}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          if (!res.ok) throw new Error("Gagal fetch classes");
          const classData = await res.json();
          const result = classData.data || {};
          setSessions(result.classes|| []);
          setTotalRows(result.total || 0);
        }
      } catch (err) {
        setSessions([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchSessions();
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
    return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Class List</h1>
        <Link
          href="/admin/class/session/insert"
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
        >
          Tambah Class
        </Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search member/plan/status..."
          className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); }}
        />
      </div>
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
        onChangePage={setPage}
        onChangeRowsPerPage={newLimit => { setPerPage(newLimit); setPage(1); }}
        paginationRowsPerPageOptions={[10, 25, 50]}
      />

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
