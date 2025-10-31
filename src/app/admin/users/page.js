'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const UsersDataTable = dynamic(() => import('./DataTable'), { ssr: false });
import { jsPDF } from "jspdf";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BackendErrorFallback from '../../../components/BackendErrorFallback';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

dayjs.extend(utc);
dayjs.extend(timezone);

// Fungsi format
function formatCheckinTime(datetime) {
  if (!datetime) return '-';
    return dayjs.utc(datetime).format('DD/MM/YYYY [pukul] HH:mm');
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrUser, setQrUser] = useState(null);
  const [token, setToken] = useState('');
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only admin can access
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    if (!userData || !tokenData) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    setToken(tokenData);
    if (userObj.role !== 'admin') {
      router.replace('/barcode');
      return;
    }
    // Helper fetch with 401 handling
    const fetchWith401 = async (url) => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tokenData}` } });
      if (res.status === 401) {
        setUsers([]);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
        // throw new Error('Unauthorized');
      }
      return res.json();
    };
    // Fetch paginated users and other data
    const fetchAll = async () => {
      setLoading(true);
      try {
        const usersRes = await fetchWith401(`${API_URL}/api/users/paginated?page=${page}&limit=${limit}`);
        setUsers(Array.isArray(usersRes.users) ? usersRes.users : []);
        setTotal(usersRes.total || 0);
        setHasNext(usersRes.hasNext || false);
        setHasPrev(usersRes.hasPrev || false);
        // memberships and checkins can still be fetched all at once (or paginated if needed)
        const [membershipsRes, checkinsRes] = await Promise.all([
          fetchWith401(`${API_URL}/api/memberships`),
          fetchWith401(`${API_URL}/api/checkins`),
        ]);
        setMemberships(membershipsRes);
        setCheckins(checkinsRes);
      } catch (err) {
        setUsers([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchAll();
  }, [router, page, limit]);

  // Helper: get membership status & last checkin
  const getMembership = userId => memberships.find(m => m.user_id === userId);
  const getLastCheckin = userId => {
    const userCheckins = checkins.filter(c => c.user_id === userId);
    if (userCheckins.length === 0) return null;
    return userCheckins.reduce((a, b) => new Date(a.checkin_time) > new Date(b.checkin_time) ? a : b);
  };

  // Kolom untuk DataTable
  const columns = [
    {
  name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => <span className="font-semibold">{row.name}</span>,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
    },
    {
      name: 'Status',
      cell: row => {
        const membership = getMembership(row.id);
        return membership && membership.is_active ? (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
        ) : (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Inactive</span>
        );
      },
    },
    {
  name: 'Last Check-in',
      cell: row => {
        const lastCheckin = getLastCheckin(row.id);
        return lastCheckin ? formatCheckinTime(lastCheckin.checkin_time) : '-';
      },
    },
    {
  name: 'Actions',
      cell: row => (
        <div className="flex gap-2 justify-center">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
            onClick={() => setQrUser(row)}
          >
            Generate QR
          </button>
          <button
            className="bg-gray-400 text-white px-3 py-1 rounded font-semibold hover:bg-gray-500"
            onClick={() => router.push(`/admin/users/${row.id}`)}
          >
            Detail
          </button>
        </div>
      ),
    },
  ];

  // Filter data by search (client-side for current page)
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">User Data</h1>
            <Link href="/admin/users/create" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700">+ Create New User</Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search name/email..."
          className="w-full max-w-xs p-2 border border-blue-300 rounded focus:outline-blue-500 text-base"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : (
        <>
          <UsersDataTable
            columns={columns}
            data={filteredUsers}
            setQrUser={setQrUser}
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={limit}
            currentPage={page}
            onChangePage={setPage}
          />
        </>
      )}
      {/* Modal QR Code */}
      {qrUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center relative min-w-[340px]">
            <h2 className="text-2xl font-extrabold mb-4 text-blue-700 drop-shadow">QR Code for {qrUser.name}</h2>
            <div className="flex flex-col items-center justify-center">
              <div id="qr-download-area" className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-2 shadow">
                <QRCodeCanvas id="qr-canvas" value={qrUser.qr_code || ''} size={220} level="H" includeMargin={true} />
                <QRCodeSVG  id="qr-canvas-svg" value={qrUser.qr_code || ''} size={220} level="H" includeMargin={true}  style={{ display: 'none' }} />
              </div>
              <div className="mt-2 text-base text-blue-700 font-mono tracking-wider">{qrUser.qr_code}</div>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
                  onClick={() => {
                    // Download PNG
                    const canvas = document.getElementById('qr-canvas');
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qrcode_${qrUser.qr_code}.png`;
                    a.click();
                  }}
                >
                  Download PNG
                </button>
                <button
                    className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-700 transition-all"
                    onClick={() => {
                        // Download SVG
                        const svgElem = document.querySelector("#qr-download-area svg");
                        if (!svgElem) {
                        alert("SVG element not found");
                        return;
                        }

                        const serializer = new XMLSerializer();
                        let svgStr = serializer.serializeToString(svgElem);

                        // Tambahkan XML header biar valid SVG
                        if (!svgStr.startsWith('<?xml')) {
                        svgStr = '<?xml version="1.0" standalone="no"?>\r\n' + svgStr;
                        }

                        const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
                        const url = URL.createObjectURL(blob);

                        // Buat elemen <a> untuk download
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `qrcode_${qrUser.qr_code}.svg`;
                        document.body.appendChild(a); // penting: tambahkan ke DOM
                        a.click();
                        document.body.removeChild(a); // bersihkan lagi

                        // Lepaskan URL object setelah delay singkat
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                    >
                    Download SVG
                </button>
                <button
                    className="bg-red-600 text-white px-3 py-1 rounded font-semibold hover:bg-red-700 transition-all"
                    onClick={async () => {
                        const canvas = document.getElementById("qr-canvas");
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
                        pdf.text(qrUser.qr_code, 40, 80, { align: "center" });

                        // Simpan PDF
                        pdf.save(`${qrUser.qr_code}.pdf`);
                    }}
                    >
                    Download PDF
              </button>
              </div>
              <button
                className="mt-8 bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
                onClick={() => setQrUser(null)}
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
