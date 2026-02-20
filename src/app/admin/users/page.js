'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { jsPDF } from "jspdf";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BackendErrorFallback from '../../../components/BackendErrorFallback';
import { FaPlus, FaSyncAlt, FaUser } from 'react-icons/fa';
import CreateUserModal from '../../../components/CreateUserModal';
import api from '@/utils/fetchClient';
import UsersDataTable from "./DataTable";
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '@/components/admin';

dayjs.extend(utc);
dayjs.extend(timezone);

// Fungsi format
function formatCheckinTime(datetime) {
  if (!datetime) return '-';
    return dayjs.utc(datetime).format('DD/MM/YYYY [pukul] HH:mm');
}

// Komponen cell untuk kolom Renewal
function RenewalActionsCell({ row, membership }) {
  const isExpired = membership && membership.end_date && new Date(membership.end_date) < new Date();
  const isMember = row.role === 'member';
  const [showActions, setShowActions] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  // Get sender email from localStorage
  let senderEmail = '';
  if (typeof window !== 'undefined') {
    try {
      const userData = localStorage.getItem('user');
      if (userData) senderEmail = JSON.parse(userData).email;
    } catch {}
  }
  const handleSendEmail = async () => {
    setEmailLoading(true);
    try {
      await api.post(`/api/memberships/user/${row.id}/send-renew-email`, {
        membershipId: membership.id,
        senderEmail: senderEmail,
      });
      alert('Renewal email sent successfully!');
    } catch (err) {
      alert(err.data?.message || 'Error sending email.');
    } finally {
      setEmailLoading(false);
    }
  };
  const handleSendWA = () => {
    alert(`WhatsApp renewal sent to ${row.phone || '-'} from 08123123`);
  };
  return (
    <div className="flex flex-col items-center">
      <button
        className={`bg-yellow-500 text-white px-3 py-1 rounded font-semibold hover:bg-yellow-600 ${isExpired && isMember ? '' : 'opacity-50 cursor-not-allowed'}`}
        disabled={!(isExpired && isMember)}
        onClick={() => setShowActions(v => !v)}
      >
        Reminder
      </button>
      {showActions && (
        <div className="flex gap-2 mt-2">
          <button
            className={`bg-blue-500 text-white px-2 py-1 rounded font-semibold hover:bg-blue-700 text-xs flex items-center justify-center ${emailLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleSendEmail}
            disabled={emailLoading}
          >
            {emailLoading ? (
              <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            ) : null}
            Send Email
          </button>
          <button
            className="bg-green-500 text-white px-2 py-1 rounded font-semibold hover:bg-green-700 text-xs"
            onClick={handleSendWA}
          >
            Send WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrUser, setQrUser] = useState(null);
  const [createUser, setCreateUser] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    if (process.env.NODE_ENV !== 'production') console.debug('[UsersPage] handleChangePage ->', pageNum);
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage, currentPageArg) => {
    const perPage = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPage) return;
    if (perPage === limit) return;
    if (process.env.NODE_ENV !== 'production') console.debug('[UsersPage] handleChangeRowsPerPage ->', perPage, 'currentPageArg=', currentPageArg);
    setLimit(perPage);
    if (page !== 1) setPage(1);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        if (search && search.trim() !== '') {
          let allMatches = null;
          try {
            // Try endpoint that may support searching and return an array
            const usersSearchRes = await api.get(`/api/users?search=${encodeURIComponent(search)}`);
            if (Array.isArray(usersSearchRes.data.users)) {
              allMatches = usersSearchRes.data.users;
            }
          } catch (e) {
            // ignore and fallback
          }

          if (!allMatches) {
            // fallback: fetch all users and filter client-side
            const allRes = await api.get('/api/users');
            if (Array.isArray(allRes.data.users)) {
              allMatches = allRes.data.users.filter(u =>
                (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(search.toLowerCase())
              );
            } else {
              allMatches = [];
            }
          }

          // Paginate matches for the table UI
          const start = (page - 1) * limit;
          const pageSlice = allMatches.slice(start, start + limit);
          setUsers(pageSlice);
          setTotal(allMatches.length);
          setHasNext(start + limit < allMatches.length);
          setHasPrev(page > 1);
        } else {
          const searchQuery = '';
          const usersRes = await api.get(`/api/users?page=${page}&limit=${limit}${searchQuery}`);
          setUsers(Array.isArray(usersRes.data.users) ? usersRes.data.users : []);
          setTotal(usersRes.data.total || 0);
          setHasNext(usersRes.hasNext || false);
          setHasPrev(usersRes.hasPrev || false);
        }
        // memberships and checkins can still be fetched all at once (or paginated if needed)
        const membershipsRes = await api.get('/api/memberships?limit=10000');
        const checkinsRes = await api.get('/api/checkins');
        setMemberships(membershipsRes.data.memberships);
        setCheckins(checkinsRes);
      } catch (err) {
        setUsers([]);
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchAll();
  }, [page, limit, search]);

  // Debounce search input to avoid spamming the API
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Helper: get membership status & last checkin
  const getMembership = userId => memberships.find(m => m.user_id === userId);
  const getLastCheckin = userId => {
    const userCheckins = checkins.filter(c => c.user_id === userId);
    if (userCheckins.length === 0) return null;
    return userCheckins.reduce((a, b) => new Date(a.checkin_time) > new Date(b.checkin_time) ? a : b);
  };

  // Kolom untuk DataTable
  const startNo = (page - 1) * limit;
  const columns = [
    { name: 'No', cell: (row, i) => startNo + i + 1, width: '70px', center: "true" },
    {
      name: 'Name',
      cell: row => <span className="font-semibold">{row.name}</span>,
      sortable: true,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
    },
    // {
    //   name: 'Status',
    //   cell: row => {
    //     const membership = getMembership(row.id);
    //     return membership && membership.is_active ? (
    //       <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
    //     ) : (
    //       <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Inactive</span>
    //     );
    //   },
    // },
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
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
          <button
            className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-700 "
            onClick={() => setQrUser(row)}
          >
            Generate QR
          </button>
          <button
            className="bg-gray-400 text-white px-3 py-1 rounded-md font-semibold hover:bg-gray-500 "
            onClick={() => router.push(`/admin/users/${row.id}`)}
          >
            Edit
          </button>
          <button
            className="bg-purple-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-purple-700 "
            onClick={() => router.push(`/admin/member-profile/${row.id}`)}
          >
            Details
          </button>
        </div>
      ),
    },
    {
      name: 'Renewal',
      cell: row => <RenewalActionsCell row={row} membership={getMembership(row.id)} />,
      width: '150px',
    },
  ];

  // Filter data by search (client-side for current page)
  const filteredUsers = Array.isArray(users) ? users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaUser className="w-3 h-3" />, label: 'User Data' }
        ]}
      />
      
        <PageContainer>
          <div className="flex items-center justify-between mb-6">
            <input
              type="text"
              placeholder="Search name/email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full max-w-xs p-2 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:border-amber-500 text-base"
            />
          <button 
            onClick={() => setCreateUser(true)}
            className="flex items-center gap-2 bg-gray-600 dark:bg-amber-400 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-amber-500">
            <FaPlus className="inline-block" />
            Create
          </button>          
        </div>
        {loading ? (
          <LoadingText />
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
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              paginationRowsPerPageOptions={[10,25,50]}
            />
          </>
        )}
      </PageContainer>
      
      {/* Modal QR Code */}
        {qrUser && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setQrUser(null)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl text-center relative max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button di pojok kanan atas */}
              <button
                onClick={() => setQrUser(null)}
                className="absolute top-4 right-4 z-10 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full p-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header with Branding */}
              <div className="bg-gradient-to-r from-gray-900 to-amber-500 py-6 px-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Image src="/logo.svg" alt="BornFit Logo" width={48} height={48} />
                  <h1 className="text-3xl font-black text-white tracking-tight">BORNFIT GYM</h1>
                </div>
                <p className="text-white/90 font-medium">Member Access QR Code</p>
              </div>

              {/* Body - Scrollable */}
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">{qrUser.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Scan to check in at the gym</p>
                
                {/* QR Code Container - Ukuran lebih kecil */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <div id="qr-download-area" className="relative bg-white p-4 rounded-2xl border-4 border-amber-400 shadow-lg">
                    <QRCodeCanvas 
                      id="qr-canvas" 
                      value={qrUser.qr_code || ''} 
                      size={220}
                      level="H" 
                      includeMargin={true}
                      style={{ background: 'transparent' }}
                      imageSettings={{
                        src: '/logo.svg',
                        height: 45,
                        width: 45,
                      }}
                    />
                    {/* Hidden SVG for download */}
                    <div style={{ display: 'none' }}>
                      <QRCodeSVG  
                        id="qr-canvas-svg" 
                        value={qrUser.qr_code || ''} 
                        size={300} 
                        level="H" 
                        includeMargin={true}
                        style={{ background: 'transparent' }}
                        imageSettings={{
                          src: '/logo.svg',
                          height: 60,
                          width: 60,
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Member ID */}
                  <div className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Member ID</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-mono font-semibold">{qrUser.qr_code}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(qrUser.qr_code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-gray-900 px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions - Compact */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">📱 How to use:</p>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 text-left space-y-0.5">
                    <li>• Show this QR code at gym entrance</li>
                    <li>• Keep your QR code secure</li>
                    <li>• Do not share with others</li>
                  </ul>
                </div>

                {/* Download Buttons - Compact */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm"
                    onClick={() => {
                      const canvas = document.getElementById('qr-canvas');
                      const url = canvas.toDataURL('image/png');
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `BornFit_QR_${qrUser.name.replace(/\s/g, '_')}.png`;
                      a.click();
                    }}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    PNG
                  </button>
                  
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm"
                    onClick={() => {
                      const svgElem = document.getElementById("qr-canvas-svg");
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
                      a.download = `BornFit_QR_${qrUser.name.replace(/\s/g, '_')}.svg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);

                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    SVG
                  </button>
                  
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm"
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
                        format: "a4",
                      });

                      const pageWidth = pdf.internal.pageSize.getWidth();
                      const pageHeight = pdf.internal.pageSize.getHeight();

                      // Header with branding color
                      pdf.setFillColor(236, 193, 33); // #ECC121 amber color
                      pdf.rect(0, 0, pageWidth, 30, 'F');
                      
                      pdf.setTextColor(255, 255, 255);
                      pdf.setFont("helvetica", "bold");
                      pdf.setFontSize(28);
                      pdf.text("BORNFIT GYM", pageWidth / 2, 15, { align: "center" });
                      
                      pdf.setFontSize(12);
                      pdf.text("Member Access QR Code", pageWidth / 2, 23, { align: "center" });

                      // User name
                      pdf.setTextColor(0, 0, 0);
                      pdf.setFont("helvetica", "bold");
                      pdf.setFontSize(18);
                      pdf.text(qrUser.name, pageWidth / 2, 45, { align: "center" });

                      pdf.setFont("helvetica", "normal");
                      pdf.setFontSize(11);
                      pdf.setTextColor(100, 100, 100);
                      pdf.text("Scan to check in at the gym", pageWidth / 2, 52, { align: "center" });

                      // QR Code (centered, larger)
                      const qrSize = 100;
                      const qrX = (pageWidth - qrSize) / 2;
                      pdf.addImage(imgData, "PNG", qrX, 65, qrSize, qrSize);

                      // Instructions box
                      pdf.setDrawColor(59, 130, 246); // blue
                      pdf.setFillColor(239, 246, 255); // light blue
                      pdf.roundedRect(20, 175, pageWidth - 40, 35, 3, 3, 'FD');
                      
                      pdf.setTextColor(30, 64, 175);
                      pdf.setFont("helvetica", "bold");
                      pdf.setFontSize(11);
                      pdf.text("📱 How to use:", 25, 183);
                      
                      pdf.setFont("helvetica", "normal");
                      pdf.setFontSize(9);
                      pdf.text("• Show this QR code at gym entrance", 25, 190);
                      pdf.text("• Keep your QR code secure", 25, 196);
                      pdf.text("• Do not share with others", 25, 202);

                      // Footer
                      pdf.setTextColor(150, 150, 150);
                      pdf.setFontSize(9);
                      pdf.text(`Member ID: ${qrUser.qr_code}`, pageWidth / 2, pageHeight - 20, { align: "center" });
                      pdf.setFontSize(8);
                      pdf.text(`Generated on ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, pageHeight - 15, { align: "center" });

                      pdf.save(`BornFit_QR_${qrUser.name.replace(/\s/g, '_')}.pdf`);
                    }}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF
                  </button>
                </div>

                {/* Close Button */}
                <button
                  className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-lg font-semibold transition-all"
                  onClick={() => setQrUser(null)}
                >
                  Close
                </button>
              </div>

              {/* Footer decoration */}
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-2"></div>
            </div>
          </div>
        )}

      <CreateUserModal 
        isOpen={createUser} 
        onClose={() => setCreateUser(false)} 
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}
