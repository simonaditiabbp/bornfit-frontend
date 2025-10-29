'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Html5Qrcode } from 'html5-qrcode';
import { format, differenceInDays, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useRouter } from 'next/navigation';
import BackendErrorFallback from '../../components/BackendErrorFallback';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BarcodePage() {
  const manualQrInputRef = useRef(null);
  const [user, setUser] = useState(null); // data member jika ditemukan
  const [scanMode, setScanMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // pesan dari backend atau status
  const [messageType, setMessageType] = useState('success'); // 'success' | 'error'
  const [scanner, setScanner] = useState(null);
  const [manualQr, setManualQr] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [backendError, setBackendError] = useState(false);
  const router = useRouter();

  // Handle response dari backend (dipakai oleh scan dan manual input)
  const handleQrResponse = async (qr_code) => {
    setLoading(true);
    setMessage('');
    setMessageType('success');
    const { latitude, longitude } = getUserLocation();
    try {
      const res = await fetch(`${API_URL}/api/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code, latitude, longitude }),
      });
      const result = await res.json();

      if (res.status === 201 && result.data) {
        // contoh struktural: result.data = { name, email, start_date, end_date, remaining_days, note, photo_url }
        setUser(result.data.user);
        setMessage(result.message || 'Check-in berhasil');
        setMessageType('success');
      } else {
        setUser(null);
        setMessage(result.message || 'Member tidak ditemukan');
        setMessageType('error');
      }
    } catch (err) {
      setUser(null);
      setMessage('Terjadi kesalahan saat check-in');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk input manual (dipanggil dari onChange)
  const handleManualInput = async (value) => {
    setManualQr(value);
    // jika ingin memanggil API hanya saat user selesai mengetik,
    // bisa ganti triggernya (mis. onBlur atau tombol submit). Di sini
    // kita memanggil kalau ada value (sesuai implementasimu sebelumnya).
    if (value) {
      await handleQrResponse(value);
      setManualQr('');
      // pastikan scanner tidak aktif
      if (scanner) {
        try { scanner.stop(); } catch (e) {}
        setScanner(null);
        setScanMode(false);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('Yakin ingin logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };


  // Keep manual QR input always focused
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (manualQrInputRef.current && document.activeElement !== manualQrInputRef.current) {
        manualQrInputRef.current.focus();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Cancel scan
  const handleCancelScan = () => {
    setMessage('');
    if (scanner) {
      try {
        scanner.stop();
      } catch (e) {}
      setScanner(null);
    }
    setScanMode(false);
  };

  // Retry scan (stop lalu start ulang)
  const handleRetryScan = () => {
    setMessage('');
    if (scanner) {
      try {
        scanner.stop();
      } catch (e) {}
      setScanner(null);
    }
    setScanMode(false);
    // beri waktu untuk render ulang elemen lalu start
    setTimeout(() => setScanMode(true), 200);
  };

  const startDate = user?.membership?.start_date
    ? format(parseISO(user.membership.start_date), "dd MMM yyyy", { locale: localeId })
    : "–";

  const endDate = user?.membership?.end_date
    ? format(parseISO(user.membership.end_date), "dd MMM yyyy", { locale: localeId })
    : null;

  const [remainingText, setRemainingText] = useState(null);
  const [remainingDays, setRemainingDays] = useState(null);
  const [diffMs, setDiffMs] = useState(null);

  useEffect(() => {
    if (user?.membership?.end_date) {
      const now = new Date();
      const rawExpiryDate = new Date(user.membership.end_date);
      const expiryDate = new Date(rawExpiryDate.getTime() - 7 * 60 * 60 * 1000);
      const diff = expiryDate - now;
      setDiffMs(diff);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setRemainingDays(days);
      let text = null;
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const d = Math.floor(totalSeconds / (3600 * 24));
        const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (d > 0) {
          text = `${d} days ${h} hours left`;
        } else if (h > 0) {
          text = `${h} hours ${m} minutes left`;
        } else {
          text = `${m} minutes ${s} seconds left`;
        }
      } else {
  text = 'Your membership has expired.';
      }
      setRemainingText(text);
    } else {
      setRemainingText(null);
      setRemainingDays(null);
      setDiffMs(null);
    }
  }, [user]);

  // Inisialisasi scanner saat scanMode true
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'opscan' && userObj.role !== 'admin') {
      router.replace('/login');
      return;
    }


    let mounted = true;
    if (scanMode && !scanner) {
      // Pastikan scanner sebelumnya sudah di-stop sebelum inisialisasi baru
      if (scanner) {
        try { scanner.stop(); } catch (e) { console.error('Error stopping previous scanner:', e); }
        setScanner(null);
      }
      // delay agar elemen #qr-reader ter-render dulu
      const t = setTimeout(() => {
        if (!mounted) return;
        const qrReaderElem = document.getElementById('qr-reader');
        if (!qrReaderElem) {
          console.error('Element #qr-reader not found');
          setMessage('Scanner tidak bisa dimuat. Coba reload halaman.');
          setMessageType('error');
          return;
        }
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCode
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            async (decodedText) => {
              if (!loading) {
                setManualQr(decodedText);
                setLoading(true);
                setMessage('');
                setMessageType('success');
                const { latitude, longitude } = getUserLocation();
                try {
                  const res = await fetch(`${API_URL}/api/checkins`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ qr_code: decodedText, latitude, longitude }),
                  });
                  const result = await res.json();
                  if (res.status === 201 && result.data) {
                    setUser(result.data.user);
                    setMessage(result.message || 'Check-in successful');
                    setMessageType('success');
                  } else {
                    setUser(null);
                    setMessage(result.message || 'Member not found');
                    setMessageType('error');
                  }
                  // Stop scanner after any check-in attempt (success or error)
                  try { await html5QrCode.stop(); } catch (e) { console.error('Error stopping scanner after check-in:', e); }
                  setScanner(null);
                  setScanMode(false);
                } catch (err) {
                  setUser(null);
              setMessage('An error occurred during check-in');
                  setMessageType('error');
                  try { await html5QrCode.stop(); } catch (e) { console.error('Error stopping scanner after error:', e); }
                  setScanner(null);
                  setScanMode(false);
                  console.error('Check-in error:', err);
                } finally {
                  setLoading(false);
                }
              }
            },
            (errorMessage) => {
              // Suppress normal parse errors and noisy library errors
              if (
                (typeof errorMessage === 'string' && errorMessage.includes('NotFoundException')) ||
                (typeof errorMessage === 'string' && errorMessage.includes('No MultiFormat Readers'))
              ) {
                // QR code not found or no readers available, normal during scanning, do not log or update state
                return;
              }
              setMessage('Failed to read QR code. Make sure your camera is not used by another app, or click Retry.');
              setMessageType('error');
              console.error('QR read error:', errorMessage);
            }
          )
          .then(() => {
            setScanner(html5QrCode);
          })
          .catch((err) => {
            setMessage('Tidak dapat mengakses kamera: ' + (err?.message || err));
            setMessageType('error');
            console.error('html5-qrcode start error:', err);
          });
      }, 300);

      return () => {
        mounted = false;
        clearTimeout(t);
      };
    }

    // cleanup ketika unmount atau scanMode berubah
    return () => {
      if (scanner) {
        try {
          scanner.stop();
        } catch (e) {}
        setScanner(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode]);

  // cek izin lokasi saat pertama kali dibuka
  useEffect(() => {
    if (navigator.geolocation && !localStorage.getItem('location_alerted')) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {
          alert('Location access is required! Please allow location in your browser.');
          localStorage.setItem('location_alerted', '1');
        }
      );
    }
  }, []);

  // Ambil lokasi user dari localStorage user login
  const getUserLocation = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return { latitude: null, longitude: null };
      const userObj = JSON.parse(userData);
      return {
        latitude: userObj.latitude ?? null,
        longitude: userObj.longitude ?? null,
      };
    } catch {
      return { latitude: null, longitude: null };
    }
  };

  // Ambil lokasi user saat halaman dibuka
  useEffect(() => {
    const { latitude, longitude } = getUserLocation();
    setLatitude(latitude);
    setLongitude(longitude);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userData || !token) {
          router.replace('/login');
          return;
        }
        const userObj = JSON.parse(userData);
        if (userObj.role !== 'opscan' && userObj.role !== 'admin') {
          router.replace('/login');
          return;
        }

        setLoading(true);
        const res = await fetch(`${API_URL}/api/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await res.json();
        if (res.status === 200 && result) {
          setUser(result.data);
        } else {
          setUser(null);
          // setMessage(result.message || 'User not found');
          // setMessageType('error');
        }
      } catch (err) {
        setBackendError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-2 py-8">
      {/* 🔴 Tombol Logout pojok kanan atas */}
      <div className="absolute top-4 right-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition-transform duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-log-out"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <h1 className="text-4xl font-extrabold mb-8 text-blue-700 drop-shadow-lg tracking-tight text-center">
        <span className="inline-block align-middle mr-2">
          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-camera"><rect x="3" y="7" width="34" height="26" rx="4" ry="4"/><circle cx="20" cy="22" r="7"/><path d="M8 7V5a4 4 0 0 1 4-4h4"/></svg>
        </span>
        Scan QRCode Member
      </h1>

      {/* ===== TAMPILAN AWAL: belum ada hasil check-in (atau user belum scan) ===== */}
      {!message && (
        <div className="bg-white/90 p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-blue-200 flex flex-col items-center animate-fade-in">
          {!scanMode && (
            <>
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-2xl font-bold mb-8 shadow-lg hover:scale-105 transition-transform duration-200 text-xl flex items-center gap-2"
                onClick={() => { setScanMode(true); setMessage(''); }}
                disabled={loading}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-camera"><rect x="3" y="7" width="18" height="13" rx="2" ry="2"/><circle cx="12" cy="15" r="3"/><path d="M5 7V5a2 2 0 0 1 2-2h2"/></svg>
                Start Check-in
              </button>

              <div className="mb-2 w-full">
                <input
                  type="text"
                  placeholder="Enter QR code manually"
                  className="w-full p-4 border-2 border-blue-300 rounded-xl text-lg tracking-widest text-center focus:outline-blue-500 bg-blue-50 placeholder:text-blue-300 shadow"
                  value={manualQr}
                  onChange={async (e) => handleManualInput(e.target.value)}
                  // disabled={loading}
                  autoFocus
                  ref={manualQrInputRef}
                />
                <div className="text-xs text-blue-500 mt-1">
                  You can enter the QR code manually if the scanner is not working
                </div>
              </div>
            </>
          )}

          {scanMode && (
            <div className="flex flex-col items-center justify-center w-full">
              <div
                id="qr-reader"
                style={{
                  width: '320px',
                  height: '320px',
                  margin: '0 auto',
                  borderRadius: '1.5rem',
                  border: '4px solid #3b82f6',
                  boxShadow: '0 0 24px #3b82f6a0',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#e0e7ff',
                }}
                className="animate-pulse"
              />
              <div className="flex gap-4 justify-center mt-6">
                <button
                  className="bg-gray-400 text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-gray-500 transition"
                  onClick={handleCancelScan}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition"
                  onClick={handleRetryScan}
                  disabled={loading}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-6 font-bold text-lg ${messageType === 'error' ? 'text-red-600' : 'text-green-600'} drop-shadow`}>
              {message}
            </div>
          )}
        </div>
      )}

      {/* ===== Layout hasil scan (full width card, grid 3 kolom responsif) ===== */}
      {message && (
        <div className={`bg-white/90 rounded-3xl shadow-2xl min-h-[75vh] w-full max-w-[1500px] border border-blue-200 p-16 grid grid-cols-1 md:grid-cols-3 gap-20 justify-center items-center animate-fade-in ${messageType === 'success' ? 'border-green-300' : 'border-red-300'}`}
          style={{ minHeight: '75vh', minWidth: '340px' }}
        >
          {/* kolom kiri: foto (tampil hanya jika success) */}
          {messageType === 'success' ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-96 h-96 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-600 font-medium overflow-hidden border-4 border-blue-300 shadow-2xl p-2">
                {user?.photo ? (
                  <Image src={user.photo.startsWith('http') ? user.photo : `${API_URL?.replace(/\/$/, '')}${user.photo}`} alt="Foto Member" width={300} height={300} className="w-full h-full object-cover scale-105 rounded-2xl" />
                ) : (
                  <span className="text-gray-400 text-lg">No photo available</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-72 h-72 flex items-center justify-center bg-gray-100 rounded-3xl border-4 border-red-200 shadow-xl">
                <svg width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-alert-triangle text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="48" y1="36" x2="48" y2="52"/><line x1="48" y1="68" x2="48.01" y2="68"/></svg>
              </div>
            </div>
          )}

          {/* kolom tengah: detail member (hanya jika success) */}
          <div className="text-left text-lg text-gray-700 flex flex-col justify-center">
            {messageType === 'success' ? (
              <>
                <p className="font-bold text-3xl text-blue-700 mb-4 leading-tight">{user?.name || '-'}</p>
                <p className="mb-2 text-lg"><span className="font-semibold">Email:</span> {user?.email || '-'}</p>
                <p className="mb-2 text-lg">
                  <span className="font-semibold whitespace-nowrap">Periode membership:</span>
                  <span className="whitespace-nowrap"> {startDate}{endDate ? ` - ${endDate}` : ""}</span>
                </p>
                {diffMs > 0 && remainingDays <= 7 && (
                  <>
                    <p className="text-red-600 font-bold text-lg mt-4">
                       Membership deadline: {remainingText}
                    </p>
                    <p className="mt-2 text-orange-600 text-base">
                      Please renew your membership soon by contacting admin 08123123123
                    </p>
                  </>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-center">
                <p className="mt-2 text-base text-orange-600 font-semibold">{message}</p>
                <p className="mt-2 text-sm text-gray-400">Please try to check-in again</p>
              </div>
            )}
          </div>

          {/* kolom kanan: tombol check-in / input manual / message */}
          <div className="flex flex-col text-lg items-center justify-center gap-4">
            <button
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow hover:scale-105 transition-transform duration-200 text-lg"
              onClick={() => { setScanMode(true); setMessage(''); }}
              disabled={loading}
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-camera"
              >
                <rect x="3" y="7" width="16" height="10" rx="2" ry="2" />
                <circle cx="11" cy="12" r="3" />
                <path d="M5 7V5a2 2 0 0 1 2-2h2" />
              </svg>
              Scan Again
            </button>
            <input
              type="text"
              placeholder="Input QR code manual"
              className="w-full p-3 border-2 border-blue-300 rounded-xl text-center focus:outline-blue-500 mb-2 bg-blue-50 placeholder:text-blue-300 shadow"
              value={manualQr}
              onChange={(e) => handleManualInput(e.target.value)}
              // disabled={loading}
              autoFocus
              ref={manualQrInputRef}
            />
          </div>
        </div>
      )}
    </div>
  );
}