'use client';
import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { format, differenceInDays, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BarcodePage() {
  const [user, setUser] = useState(null); // data member jika ditemukan
  const [scanMode, setScanMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // pesan dari backend atau status
  const [messageType, setMessageType] = useState('success'); // 'success' | 'error'
  const [scanner, setScanner] = useState(null);
  const [manualQr, setManualQr] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
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

  const now = new Date();
  const rawExpiryDate = new Date(user?.membership?.end_date);
  const expiryDate = new Date(rawExpiryDate.getTime() - 7 * 60 * 60 * 1000);
  let diffMs = expiryDate - now;
  let remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let remainingText = null;

  if (user?.membership?.end_date) {
    // const today = new Date();
    // remainingDays = differenceInDays(parseISO(user.membership.end_date), today);
    if (diffMs > 0 ) {
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        remainingText = `${days} hari ${hours} jam lagi`;
      } else if (hours > 0) {
        remainingText = `${hours} jam ${minutes} menit lagi`;
      } else {
        remainingText = `${minutes} menit ${seconds} detik lagi`;
      }
    } else {
      remainingText = 'Membership Anda telah berakhir.';
    }
  }

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
                    setMessage(result.message || 'Check-in berhasil');
                    setMessageType('success');
                  } else {
                    setUser(null);
                    setMessage(result.message || 'Member tidak ditemukan');
                    setMessageType('error');
                  }
                  // Stop scanner after any check-in attempt (success or error)
                  try { await html5QrCode.stop(); } catch (e) { console.error('Error stopping scanner after check-in:', e); }
                  setScanner(null);
                  setScanMode(false);
                } catch (err) {
                  setUser(null);
                  setMessage('Terjadi kesalahan saat check-in');
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
              // Hanya log error parse (NotFoundException) di console, jangan update state message agar tidak spam looping
              if (typeof errorMessage === 'string' && errorMessage.includes('NotFoundException')) {
                // QR code belum ditemukan, ini normal, jangan update state
                // console.debug('QR read error:', errorMessage);
                return;
              }
              // Untuk error lain (fatal), baru tampilkan pesan ke user
              setMessage('Gagal membaca QR code. Pastikan kamera tidak digunakan aplikasi lain, atau klik Retry.');
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
          alert('Akses lokasi diperlukan! Silakan izinkan lokasi di browser Anda.');
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-8 text-blue-700 drop-shadow">
        Scan QRCode Member
      </h1>

      {/* ===== TAMPILAN AWAL: belum ada hasil check-in (atau user belum scan) ===== */}
      {!message && (
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg text-center border border-blue-200">
          {!scanMode && (
            <>
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-xl font-bold mb-6 shadow hover:scale-105 transition-transform duration-200"
                onClick={() => { setScanMode(true); setMessage(''); }}
                disabled={loading}
              >
                <span className="inline-block align-middle mr-2">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-camera"><rect x="3" y="7" width="18" height="13" rx="2" ry="2"/><circle cx="12" cy="15" r="3"/><path d="M5 7V5a2 2 0 0 1 2-2h2"/></svg>
                </span>
                Check-in
              </button>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Input QR code manual"
                  className="w-full p-3 border-2 border-blue-300 rounded-xl mt-2 text-lg tracking-widest text-center focus:outline-blue-500"
                  value={manualQr}
                  onChange={async (e) => handleManualInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <div className="text-xs text-blue-500 mt-1">
                  QR code bisa diinput manual jika scanner bermasalah
                </div>
              </div>
            </>
          )}

          {scanMode && (
            <div className="mb-6 flex flex-col items-center justify-center">
              <div
                id="qr-reader"
                style={{
                  width: '340px',
                  height: '340px',
                  margin: '0 auto',
                  borderRadius: '1.5rem',
                  border: '4px solid #3b82f6',
                  boxShadow: '0 0 24px #3b82f6a0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="animate-pulse"
              />
              <div className="flex gap-4 justify-center mt-4">
                <button
                  className="bg-gray-400 text-white px-5 py-2 rounded-xl font-semibold shadow hover:bg-gray-500"
                  onClick={handleCancelScan}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:bg-blue-700"
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
        <div className="bg-white rounded-2xl shadow-lg min-h-screen w-full border border-blue-200 p-8 grid grid-cols-1 md:grid-cols-3 gap-6 justify-center items-center">
          {/* <div className="min-h-screen w-full flex justify-center items-center bg-gray-50 px-6 py-10"> */}

          {/* kolom kiri: foto (tampil hanya jika success) */}
          {messageType === 'success' ? (
            <div className="flex items-center justify-center">
              <div className="w-120 h-120 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 font-medium overflow-hidden">
                {user?.photo ? (
                  <img src={user.photo.startsWith('http') ? user.photo : `${API_URL?.replace(/\/$/, '')}${user.photo}`} alt="Foto Member" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">Tidak ada foto</span>
                )}
              </div>
            </div>
          ) : (
            // kalau error, kosongkan kolom kiri agar layout kanan tetap di kolom 3
            <div />
          )}

          {/* kolom tengah: detail member (hanya jika success) */}
          <div className="text-left text-lg text-gray-700">
            {messageType === 'success' ? (
              <>
                <p><strong>Nama:</strong> {user?.name || '-'}</p>
                <p><strong>Email:</strong> {user?.email || '-'}</p>
                <p>
                  <strong>Periode membership:</strong>&nbsp;
                  {startDate} {endDate ? ` - ${endDate}` : ""}
                </p>                
                {diffMs > 0 && remainingDays <= 7 && (
                  <>
                    <p className="text-red-600">
                       <strong>Tenggat membership:</strong> {remainingText}
                    </p>
                    <p className="mt-2 text-orange-600">
                      Segera perpanjang membership anda dengan menghubungi admin 08123123123
                    </p>
                  </>
                )}
              </>
            ) : (
              // jika error, tampil area penjelasan/placeholder (atau kosong)
              <div className="text-gray-500">
                {/* kosongkan atau beri instruksi */}
                {/* <p><strong>Tidak ada data member yang ditampilkan atau terjadi error</strong></p> */}
                <p className="mt-2 text-sm text-orange-600">Silahkan Check-In kembali</p>
              </div>
            )}

            {/* pesan hasil (tetap di tengah kolom agar readable) */}
            {/* {message && ( */}
              {/* // <div className={`mt-4 font-semibold ${messageType === 'error' ? 'text-red-600' : 'text-green-600'}`}> */}
                {/* {user ? null : message} */}
              {/* </div> */}
            {/* // )} */}
          </div>

          {/* kolom kanan: tombol check-in / input manual / message */}
          <div className="flex flex-col text-lg items-center justify-center">
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-xl font-bold mb-4 shadow hover:scale-105 transition-transform duration-200"
              onClick={() => { setScanMode(true); setMessage(''); }}
              disabled={loading}
            >
              Check-in
            </button>

            <input
              type="text"
              placeholder="Input QR code manual"
              className="w-full p-3 border-2 border-blue-300 rounded-xl text-center focus:outline-blue-500 mb-4"
              value={manualQr}
              onChange={(e) => handleManualInput(e.target.value)}
              disabled={loading}
            />

            <div className="text-center">
              <div className={`font-medium ${messageType === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}