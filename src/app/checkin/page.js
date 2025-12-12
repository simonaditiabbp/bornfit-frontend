'use client';
import { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import BookingDataTable from './BookingDataTable';
import Image from 'next/image';
import { Html5Qrcode } from 'html5-qrcode';
import { format, differenceInDays, parseISO } from "date-fns";
import { id, enUS } from "date-fns/locale";
import { useRouter } from 'next/navigation';
import BackendErrorFallback from '../../components/BackendErrorFallback';
import { formatInTimeZone } from "date-fns-tz";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BarcodePage() {
    const [result, setResult] = useState(null);
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
  const [latestCheckin, setLatestCheckin] = useState(null);
  const router = useRouter();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const [buffer, setBuffer] = useState("");
  const timerRef = useRef(null);

  // Modal state for booking class
    // Modal state for booking PT session
    const [showPTModal, setShowPTModal] = useState(false);
    const [availablePTSessions, setAvailablePTSessions] = useState([]);
    const [ptTotalRows, setPTTotalRows] = useState(0);
    const [ptPage, setPTPage] = useState(1);
    const [ptLimit, setPTLimit] = useState(10);
    const [bookingPTLoading, setBookingPTLoading] = useState(false);
    const [bookingPTError, setBookingPTError] = useState("");
    const [bookingPTSuccess, setBookingPTSuccess] = useState("");
    const [ptSearch, setPTSearch] = useState("");
    const ptSearchDebounceRef = useRef(null);
    // Handler for Booking PT Session button
    const fetchAvailablePTSessions = async (page = 1, limit = 10, search = "") => {
      setBookingPTLoading(true);
      setBookingPTError("");
      setBookingPTSuccess("");
      try {
        // API sudah sesuai: /api/personaltrainersessions/member/:id
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        const res = await fetch(`${API_URL}/api/personaltrainersessions/member/${user.id}?${params.toString()}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.data?.sessions)) {
          setAvailablePTSessions(data.data.sessions);
          setPTTotalRows(data.data.total); // total = jumlah data
          setPTPage(page);
          setPTLimit(limit);
        } else {
          setAvailablePTSessions([]);
          setPTTotalRows(0);
          setBookingPTError(data.message || "Tidak ada PT session tersedia");
        }
      } catch (err) {
        setAvailablePTSessions([]);
        setPTTotalRows(0);
        setBookingPTError("Gagal mengambil data PT session");
      }
      setBookingPTLoading(false);
    };

    const handleBookingPTSession = () => {
      if (!user?.id) return;
      setShowPTModal(true);
      fetchAvailablePTSessions(1, ptLimit, ptSearch);
    };

    const handlePTTablePageChange = (page) => {
      fetchAvailablePTSessions(page, ptLimit, ptSearch);
    };
    const handlePTTableRowsPerPageChange = (newLimit, page) => {
      setPTLimit(newLimit);
      fetchAvailablePTSessions(page, newLimit, ptSearch);
    };

    // Search input change handler with debounce
    const handlePTSearchChange = (e) => {
      const value = e.target.value;
      setPTSearch(value);
      if (ptSearchDebounceRef.current) clearTimeout(ptSearchDebounceRef.current);
      ptSearchDebounceRef.current = setTimeout(() => {
        fetchAvailablePTSessions(1, ptLimit, value);
      }, 400);
    };

    // Handler for booking a PT session
    const handleBookPTSession = async (sessionId) => {
      setBookingPTLoading(true);
      setBookingPTError("");
      setBookingPTSuccess("");
      try {
        // Cari data session yang dibooking
        const bookedSession = availablePTSessions.find(s => s.id === sessionId);
        let bookingTime = null;
        if (bookedSession && bookedSession.start_date) {
          // start_date format: "2025-11-28T09:45:00.000Z"
          bookingTime = bookedSession.start_date;
        } else {
          bookingTime = new Date().toISOString();
        }
        const res = await fetch(`http://localhost:3002/api/ptsessionbookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            user_member_id: user.id,
            personal_trainer_session_id: sessionId,
            booking_time: bookingTime,
            status: "booked"
          })
        });
        if (res.ok) {
          setBookingPTSuccess("Berhasil booking PT session!");
          fetchAvailablePTSessions(ptPage, ptLimit);
        } else {
          const data = await res.json();
          setBookingPTError(data.message || "Gagal booking PT session");
        }
      } catch (err) {
        setBookingPTError("Gagal booking PT session");
      }
      setBookingPTLoading(false);
    };
  const [showClassModal, setShowClassModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classTotalRows, setClassTotalRows] = useState(0);
  const [classPage, setClassPage] = useState(1);
  const [classLimit, setClassLimit] = useState(10);
  const [bookingClassLoading, setBookingClassLoading] = useState(false);
  const [bookingClassError, setBookingClassError] = useState("");
  const [bookingClassSuccess, setBookingClassSuccess] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const classSearchDebounceRef = useRef(null);
  // Handler for Booking Class button
  const fetchAvailableClasses = async (page = 1, limit = 10, search = "") => {
    setBookingClassLoading(true);
    setBookingClassError("");
    setBookingClassSuccess("");
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);
      const res = await fetch(`${API_URL}/api/classes?today=true&${params.toString()}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data?.classes)) {
        setAvailableClasses(data.data.classes);
        setClassTotalRows(data.data.total || 0);
        setClassPage(data.data.page || 1);
        setClassLimit(data.data.limit || 10);
      } else {
        setAvailableClasses([]);
        setClassTotalRows(0);
        setBookingClassError(data.message || "Tidak ada kelas tersedia");
      }
    } catch (err) {
      setAvailableClasses([]);
      setClassTotalRows(0);
      setBookingClassError("Gagal mengambil data kelas");
    }
    setBookingClassLoading(false);
  };

  const handleBookingClass = () => {
    if (!user?.id) return;
    setShowClassModal(true);
    fetchAvailableClasses(1, classLimit, classSearch);
  };

  const handleClassTablePageChange = (page) => {
    fetchAvailableClasses(page, classLimit, classSearch);
  };
  const handleClassTableRowsPerPageChange = (newLimit, page) => {
    setClassLimit(newLimit);
    fetchAvailableClasses(page, newLimit, classSearch);
  };

  // Search input change handler with debounce
  const handleClassSearchChange = (e) => {
    const value = e.target.value;
    setClassSearch(value);
    if (classSearchDebounceRef.current) clearTimeout(classSearchDebounceRef.current);
    classSearchDebounceRef.current = setTimeout(() => {
      fetchAvailableClasses(1, classLimit, value);
    }, 400);
  };

  // Handler for booking a class (Gold membership only)
  const handleBookClass = async (classId) => {
    setBookingClassLoading(true);
    setBookingClassError("");
    setBookingClassSuccess("");
    try {
      // Cari data kelas yang dibooking
      const bookedClass = availableClasses.find(cls => cls.id === classId);
      let checkedInAt = null;
      if (bookedClass && bookedClass.start_time) {
        const now = new Date();
        let startTime = bookedClass.start_time;
        let hour = "00", minute = "00", second = "00";
        if (startTime.length >= 8) {
          const timeMatch = startTime.match(/(\d{2}):(\d{2}):(\d{2})/);
          if (timeMatch) {
            hour = parseInt(timeMatch[1], 10) + 7; // sesuaikan timezone (+7)
            minute = timeMatch[2];
            second = timeMatch[3];
          }
        }
        // Gabungkan tanggal hari ini dengan jam kelas
        const checkedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second);
        checkedInAt = checkedDate.toISOString();
      } else {
        checkedInAt = new Date().toISOString();
      }
      const res = await fetch(`${API_URL}/api/classattendances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          class_id: classId,
          member_id: user.id,
          status: "Checked-in",
          checked_in_at: checkedInAt
        })
      });
      if (res.ok) {
        setBookingClassSuccess("Berhasil booking kelas!");
        fetchAvailableClasses(classPage, classLimit);
      } else {
        const data = await res.json();
        setBookingClassError(data.message || "Gagal booking kelas");
      }
    } catch (err) {
      setBookingClassError("Gagal booking kelas");
    }
    setBookingClassLoading(false);
  };

  // Handler for buying a class (Silver/other memberships)
  const handleBuyClass = (classId) => {
    // Redirect ke halaman class purchase insert dengan user_id dan class_id
    router.push(`/admin/class/classpurchase/insert?user_id=${user.id}&class_id=${classId}`);
  };

  // Handle response dari backend (dipakai oleh scan dan manual input)
  const handleQrResponse = async (qr_code) => {
    setLoading(true);
    setMessage('');
    setMessageType('success');
    const { latitude, longitude } = getUserLocation();
    try {
      const res = await fetch(`${API_URL}/api/checkinptsession/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code, latitude, longitude }),
      });
      const apiResult = await res.json();
      setResult(apiResult);
      if (res.status === 201 && apiResult.data) {
        setUser(apiResult.data.user);
        setMessage(apiResult.message || 'Check-in berhasil');
        setMessageType('success');
      } else {
        setUser(null);
        if (qr_code.startsWith("member")) {
          setMessage(apiResult.message || 'Member not found');
        } else if (qr_code.startsWith("pt")) {
          setMessage(apiResult.message || 'PT Session not found');
        } else {
          setMessage(apiResult.message || 'Membership not found');
        }
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

  // State untuk PT session plans
  const [plans, setPlans] = useState([]);

  // Fetch PT session plans saat modal PT dibuka
  useEffect(() => {
    if (!showPTModal) return;
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ptsessionplans`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.data?.plans)) {
          setPlans(data.data.plans);
        } else {
          setPlans([]);
        }
      } catch {
        setPlans([]);
      }
    };
    fetchPlans();
  }, [showPTModal]);

  // Fetch latest checkin saat user berubah
  useEffect(() => {
    if (!user?.id) {
      setLatestCheckin(null);
      return;
    }
    const fetchLatestCheckin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/checkinptsession/latest-time/${user.id}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (data.status === 'success' && data.data?.checkin_time) {
          // Format datetime menggunakan date-fns
          // const formattedDate = `${data.data.checkin_time} || ${format(parseISO(data.data.checkin_time), "dd MMM yyyy, HH:mm", { locale: enUS })}`;
          const formattedDate = formatInTimeZone( data.data.checkin_time, 'UTC', "dd MMM yyyy, HH:mm", { locale: enUS } );
          setLatestCheckin(formattedDate);
        } else {
          setLatestCheckin(null);
        }
      } catch (err) {
        console.error('Error fetching latest checkin:', err);
        setLatestCheckin(null);
      }
    };
    fetchLatestCheckin();
  }, [user]);

  // Keep manual QR input always focused, kecuali modal booking class/PT session sedang terbuka
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Jangan paksa fokus jika modal booking class atau PT session terbuka
      if (showClassModal || showPTModal) return;
      if (manualQrInputRef.current && document.activeElement !== manualQrInputRef.current) {
        manualQrInputRef.current.focus();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showClassModal, showPTModal]);

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
    ? format(parseISO(user.membership.start_date), "dd MMM yyyy", { locale: enUS })
    : "–";

  const endDate = user?.membership?.end_date
    ? format(parseISO(user.membership.end_date), "dd MMM yyyy", { locale: enUS })
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
                let qr_code = decodedText;
                try {
                  const res = await fetch(`${API_URL}/api/checkinptsession/checkin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ qr_code, latitude, longitude }),
                  });
                  const result = await res.json();
                  if (res.status === 201 && result.data) {
                    setUser(result.data.user);
                    setMessage(result.message || 'Check-in successful');
                    setMessageType('success');
                  } else {
                    setUser(null);  
                    if (qr_code.startsWith("member")) {
                      setMessage(result.message || 'Member not found');
                    } else if (qr_code.startsWith("pt")) {
                      setMessage(result.message || 'PT Session not found');
                    } else {
                      setMessage(result.message || 'Membership not found');
                    }
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
        // const result = await res.json();
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.replace('/login');
        }
      } catch (err) {
        setBackendError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleBufferedInput = (value) => {
    setBuffer(value); // Directly set the full input value
  };

useEffect(() => {
  if (buffer.length >= 6) { // Adjust minimum length for a valid QR code
    const timer = setTimeout(() => {
      handleManualInput(buffer); // Process the full input
      setBuffer(""); // Clear the buffer
    }, 300); // Debounce threshold

    return () => clearTimeout(timer); // Cleanup timeout on buffer change
  }
}, [buffer]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  // Helper untuk render info PT Session
  const renderPTSessionInfo = (result) => {
    // console.log("result di renderPTSessionInfo:", result);
    // if (!result?.data?.type?.toLowerCase().includes('pt')) return null;
    const ptsession = Array.isArray(result.data?.ptsessions) ? result.data.ptsessions[0] : null;
    if (!ptsession) return null;
    const ptplan = ptsession.ptplan;
    const trainer = ptsession.trainer;
    // PT session period calculation
    let ptPeriod = "";
    let ptRemainingText = null;
    let ptRemainingDays = null;
    let ptDiffMs = null;
        if (ptsession && ptplan) {
          const joinDate = ptsession.join_date ? format(parseISO(ptsession.join_date), "dd MMM yyyy", { locale: enUS }) : "–";
          const endDate = ptsession.join_date ? format(parseISO(ptsession.join_date), "dd MMM yyyy", { locale: enUS }) : "–";
          let endDateCalc = null;
          if (ptsession.join_date && ptplan.duration_value) {
            const joinDateObj = parseISO(ptsession.join_date);
            endDateCalc = format(new Date(joinDateObj.getTime() + ptplan.duration_value * 24 * 60 * 60 * 1000), "dd MMM yyyy", { locale: enUS });
          }
          // ptPeriod = `${joinDate}${endDateCalc ? ` - ${endDateCalc}` : ""}`;
          ptPeriod = `${endDateCalc ? `${endDateCalc}` : ""}`;
      // Hitung sisa waktu
      const now = new Date();
      ptDiffMs = endDate - now;
      ptRemainingDays = Math.floor(ptDiffMs / (1000 * 60 * 60 * 24));
      if (ptDiffMs > 0 && ptRemainingDays <= 7) {
        const totalSeconds = Math.floor(ptDiffMs / 1000);
        const d = Math.floor(totalSeconds / (3600 * 24));
        const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (d > 0) {
          ptRemainingText = `${d} days ${h} hours left`;
        } else if (h > 0) {
          ptRemainingText = `${h} hours ${m} minutes left`;
        } else {
          ptRemainingText = `${m} minutes ${s} seconds left`;
        }
      } else if (ptDiffMs <= 0) {
        ptRemainingText = 'PT session period has expired.';
      }
    }
    return (
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow">
        <div className="font-semibold text-gray-800 dark:text-amber-400 mb-2">PT Session Info</div>
        {/* <div className="mb-1 text-gray-700 dark:text-gray-200"><span className="font-semibold">Session:</span> {ptsession.ptplan.name ? ptsession.ptplan.name : ""} - {ptsession.trainer.name ? ptsession.trainer.name : ""}</div> */}
        <div className="mb-1 text-gray-700 dark:text-gray-200"><span className="font-semibold">Expired Period:</span> {ptPeriod}</div>
        <div className="mb-1 text-gray-700 dark:text-gray-200"><span className="font-semibold">Trainer:</span> {trainer?.name}</div>
        {/* <div className="mb-1 text-gray-700 dark:text-gray-200"><span className="font-semibold">Plan Duration:</span> {ptplan?.duration} days</div> */}
        <div className="mb-1 text-gray-700 dark:text-gray-200"><span className="font-semibold">Max Session:</span> {ptplan?.max_session}</div>
        <div className="mb-1 text-gray-700 dark:text-gray-200">
          <span className="font-semibold">Session Status:</span> {' '}
          {ptsession.status === 'active' && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Active</span>
          )}
          {ptsession.status === 'pending' && (
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full font-bold">Finished</span>
          )}
          {ptsession.status === 'expired' && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Cancelled</span>
          )}
          {ptsession.status !== 'active' && ptsession.status !== 'selesai' && ptsession.status !== 'batal' && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">{ptsession.status}</span>
          )}
        </div>
        {ptRemainingText && (
          <div className={`mt-3 font-bold text-lg ${ptDiffMs > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-500'}`}>
            <span className="font-semibold">PT Session deadline:</span> {ptRemainingText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-2 py-8">
      {/* 🔴 Tombol Logout pojok kanan atas */}
      <div className="absolute top-4 right-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200"
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

      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 dark:text-amber-400 drop-shadow-lg tracking-tight text-center">
        <span className="inline-block align-middle mr-2">
          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-camera"><rect x="3" y="7" width="34" height="26" rx="4" ry="4"/><circle cx="20" cy="22" r="7"/><path d="M8 7V5a4 4 0 0 1 4-4h4"/></svg>
        </span>
        Scan QRCode Member
      </h1>

      {/* ===== TAMPILAN AWAL: belum ada hasil check-in (atau user belum scan) ===== */}
      {!message && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          {!scanMode && (
            <>
              <button
                className="bg-gray-800 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-gray-900 px-8 py-4 rounded-lg font-bold mb-8 shadow-lg transition-all duration-200 text-xl flex items-center gap-2"
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
                  className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 shadow"
                  value={buffer} // Show buffered input
                  onChange={(e) => handleBufferedInput(e.target.value)} // Pass the full input value
                  autoFocus
                  ref={manualQrInputRef}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                  borderRadius: '0.75rem',
                  border: '4px solid #fbbf24',
                  boxShadow: '0 0 24px rgba(251, 191, 36, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#374151',
                }}
                className="animate-pulse"
              />
              <div className="flex gap-4 justify-center mt-6">
                <button
                  className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg font-semibold shadow transition"
                  onClick={handleCancelScan}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-gray-900 px-6 py-2 rounded-lg font-semibold shadow transition"
                  onClick={handleRetryScan}
                  disabled={loading}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-6 font-bold text-lg ${messageType === 'error' ? 'text-red-400' : 'text-green-400'} drop-shadow`}>
              {message}
            </div>
          )}
        </div>
      )}

      {/* ===== Layout hasil scan (full width card, grid 3 kolom responsif) ===== */}
      {message && (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl min-h-[75vh] w-full max-w-[1500px] border ${messageType === 'success' ? 'border-green-500' : 'border-red-500'} p-16 grid grid-cols-1 md:grid-cols-3 gap-20 justify-center items-center`}
          style={{ minHeight: '75vh', minWidth: '340px' }}
        >
          {/* kolom kiri: foto (tampil hanya jika success) */}
          {messageType === 'success' ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-96 h-96 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium overflow-hidden border-4 border-gray-600 dark:border-amber-400 shadow-2xl p-2">
                {user?.photo ? (
                  <Image src={user.photo.startsWith('http') ? user.photo : `${API_URL?.replace(/\/$/, '')}${user.photo}`} alt="Foto Member" width={300} height={300} className="w-full h-full object-cover scale-105 rounded-xl" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-lg">No photo available</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-72 h-72 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-2xl border-4 border-red-500 shadow-xl">
                <svg width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-alert-triangle text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="48" y1="36" x2="48" y2="52"/><line x1="48" y1="68" x2="48.01" y2="68"/></svg>
              </div>
            </div>
          )}

          {/* kolom tengah: detail member (hanya jika success) */}
          <div className="text-left text-lg text-gray-700 dark:text-gray-200 flex flex-col justify-center">
            {messageType === 'success' ? (
              <>
                <p className="font-bold text-3xl text-gray-800 dark:text-amber-400 mb-4 leading-tight">{user?.name || '-'}</p>
                <p className="mb-2 text-lg"><span className="font-semibold">Email:</span> {user?.email || '-'}</p>
                <p className="mb-2 text-lg">
                  {/* <span className="font-semibold whitespace-nowrap">Membership period:</span>
                  <span className="whitespace-nowrap"> {startDate}{endDate ? ` - ${endDate}` : ""}</span> */}
                  <span className="font-semibold whitespace-nowrap">Membership expired period:</span>
                  <span className="whitespace-nowrap"> {endDate ? endDate : ""}</span>
                </p>
                <p className="mb-2 text-lg">
                  <span className="font-semibold">Membership type: </span>

                  <span
                    className={`
                      px-3 py-1 rounded-full font-semibold border
                      ${
                        user?.membership_plan?.name?.toLowerCase() === "platinum"
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                        : user?.membership_plan?.name?.toLowerCase() === "gold"
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                        : user?.membership_plan?.name?.toLowerCase() === "silver"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                        : user?.membership_plan?.name?.toLowerCase() === "trial"
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-gray-100 text-gray-500 border-gray-300"
                      }
                    `}
                  >
                    {user?.membership_plan?.name || "-"}
                  </span>
                </p>
                {/* <p className="mb-2 text-lg"><span className="font-semibold">Membership status:</span> {user?.membership?.status === 'active' ? (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Active</span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Inactive</span>
                )}</p> */}
                <p className="mb-2 text-lg">
                  <span className="font-semibold">Latest Checkin:</span> 
                  {latestCheckin ? (
                    <span className="text-green-600 dark:text-green-400 font-bold ml-1">{latestCheckin}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">-</span>
                  )}
                </p>
                {diffMs > 0 && remainingDays <= 7 && (
                  <>
                    <p className="text-red-500 dark:text-red-400 font-bold text-lg mt-4">
                       Membership deadline: {remainingText}
                    </p>
                    <p className="mt-2 text-amber-600 dark:text-amber-400 text-base">
                      Please renew your membership soon by contacting admin 08123123123
                    </p>
                  </>
                )}
                {renderPTSessionInfo(result)}
              </>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-center">
                <p className="mt-2 text-base text-red-500 dark:text-red-400 font-semibold">{message}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">Please try to check-in again</p>
              </div>
            )}
          </div>

          {/* kolom kanan: tombol check-in / input manual / message */}
          <div className="flex flex-col text-lg items-center justify-center gap-4">
            <button
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-bold shadow-lg transition-all duration-200 text-lg w-full"
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
              placeholder="Enter QR code manually"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-gray-400 mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 shadow"
              value={buffer}
              onChange={(e) => handleBufferedInput(e.target.value)}
              autoFocus
              ref={manualQrInputRef}
            />

            {/* Tambahan tombol booking class dan PT session */}
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition w-full"
              onClick={handleBookingClass}
              disabled={loading || !user}
            >
              Booking Class
            </button>
                  {/* Modal Booking Class */}
            <Modal
                isOpen={showClassModal}
                onRequestClose={() => setShowClassModal(false)}
                contentLabel="Booking Class"
                ariaHideApp={false}
                className=" bg-white dark:bg-gray-800 rounded-xl max-w-[1200px] min-w-[750px] w-full mx-auto p-8 shadow-2xl outline-none max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700 " overlayClassName="fixed inset-0 bg-black/70 flex items-center  justify-center z-[1000]" portalClassName="z-[1000]"
            >
              {/* HEADER MODAL */}
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                  <div>
                    <h2 className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">🗓️ Booking Class</h2>
                    {user?.membership_plan?.name ? 
                      user?.membership_plan?.name?.toLowerCase() === "silver" ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">⚠ {user?.membership_plan?.name || 'silver / trial'} Member - Purchase Required</p>) : (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">✓ {user?.membership_plan?.name || ''} Member - Free Booking Available</p>) : 
                      ""
                    }
                  </div>
                  {/* Tombol close di sudut kanan atas */}
                  <button
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition duration-150"
                      onClick={() => setShowClassModal(false)}
                  >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                  </button>
              </div>

              {/* FEEDBACK AREA */}
              <div className="mb-4">
                  {bookingClassLoading && <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-500 rounded-md font-medium">Memuat data...</div>}
                  {bookingClassError && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border-l-4 border-red-500 rounded-md font-medium">Error: {bookingClassError}</div>}
                  {bookingClassSuccess && <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-l-4 border-green-500 rounded-md font-medium">Berhasil: {bookingClassSuccess}</div>}
              </div>
              
              {/* SEARCH INPUT & DATA TABLE */}
              <div className="mb-4 flex items-center gap-4">
                <input
                  type="text"
                  className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-base w-96 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 shadow"
                  placeholder="Search class, instructor, date (28/11/2025)"
                  value={classSearch}
                  onChange={handleClassSearchChange}
                  autoFocus
                />
                <span className="text-gray-500 dark:text-gray-400 text-sm">Press Enter or wait for 0.4 seconds</span>
              </div>
              <div className="shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <BookingDataTable
                  columns={[
                    { name: 'Nama Kelas', selector: row => row.name, sortable: true, grow: 2 },
                    { name: 'Tanggal', selector: row => row.class_date?.slice(0, 10), sortable: true },
                    { name: 'Mulai', selector: row => row.start_time?.slice(11, 16), sortable: true },
                    { name: 'Selesai', selector: row => row.end_time?.slice(11, 16), sortable: true },
                    { name: 'Instruktur', selector: row => row.instructor?.name || '-', sortable: true, grow: 1.5 },
                    { 
                      name: 'Aksi', 
                      cell: row => {
                        // Cek apakah user memiliki Gold membership (id=2)
                        // const isGoldMember = user?.membership_plan?.id === 2;
                        const planName = user?.membership_plan?.name?.toLowerCase();
                        const isGoldMember = planName === "gold" || planName === "platinum";

                        
                        if (isGoldMember) {
                          // Gold member: tampilkan tombol Book
                          return (
                            <button
                              className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                                bookingClassLoading 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                              }`}
                              onClick={() => handleBookClass(row.id)}
                              disabled={bookingClassLoading}
                            >
                              {bookingClassLoading ? 'Processing...' : 'Book'}
                            </button>
                          );
                        } else {
                          // Non-Gold member: tampilkan tombol Buy
                          return (
                            <button
                              className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                                bookingClassLoading 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
                              }`}
                              onClick={() => handleBuyClass(row.id)}
                              disabled={bookingClassLoading}
                            >
                              {bookingClassLoading ? 'Processing...' : 'Buy Class'}
                            </button>
                          );
                        }
                      }, 
                      ignoreRowClick: true 
                    },
                  ]}
                  data={availableClasses}
                  pagination={true}
                  paginationServer={true}
                  paginationTotalRows={classTotalRows}
                  paginationPerPage={classLimit}
                  currentPage={classPage}
                  onChangePage={handleClassTablePageChange}
                  onChangeRowsPerPage={handleClassTableRowsPerPageChange}
                  paginationRowsPerPageOptions={[10, 25, 50]}
                  customStyles={{
                    header: { style: { backgroundColor: '#374151' } },
                    rows: { 
                      style: { backgroundColor: '#1f2937', color: '#e5e7eb' },
                      highlightOnHoverStyle: { backgroundColor: '#374151' } 
                    },
                  }}
                />
              </div>

              {/* FOOTER MODAL / BUTTON CLOSE */}
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-5 py-2 rounded-lg font-bold transition duration-200 shadow-md"
                    onClick={() => setShowClassModal(false)}
                >
                    Tutup
                </button>
              </div>
            </Modal>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition w-full"
              onClick={handleBookingPTSession}
              disabled={loading || !user}
            >
              Booking PT Session
            </button>
            {/* Modal Booking PT Session */}
            <Modal
              isOpen={showPTModal}
              onRequestClose={() => setShowPTModal(false)}
              contentLabel="Booking PT Session"
              ariaHideApp={false}
              className=" bg-white dark:bg-gray-800 rounded-xl max-w-[1200px] min-w-[750px] w-full mx-auto p-8 shadow-2xl outline-none max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700 " overlayClassName="fixed inset-0 bg-black/70 flex items-center  justify-center z-[1000]" portalClassName="z-[1000]"
            >
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <h2 className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">💪 Booking PT Session</h2>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition duration-150"
                  onClick={() => setShowPTModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                {bookingPTLoading && <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-500 rounded-md font-medium">Memuat data...</div>}
                {bookingPTError && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border-l-4 border-red-500 rounded-md font-medium">Error: {bookingPTError}</div>}
                {bookingPTSuccess && <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-l-4 border-green-500 rounded-md font-medium">Berhasil: {bookingPTSuccess}</div>}
              </div>
              <div className="mb-4 flex items-center gap-4">
                <input
                  type="text"
                  className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-base w-96 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 shadow"
                  placeholder="Search PT session, trainer, date (28/11/2025)"
                  value={ptSearch}
                  onChange={handlePTSearchChange}
                  autoFocus
                />
                <span className="text-gray-500 dark:text-gray-400 text-sm">Press Enter or wait for 0.4 seconds</span>
              </div>
              <div className="shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <BookingDataTable
                  columns={[
                    // { name: 'Nama Session', selector: row => row.name, sortable: true },
                    { name: 'Name', selector: row => {
                      const plan = plans.find(p => p.id === row.pt_session_plan_id);
                      return plan ? plan.name : '-';
                    }, sortable: true },
                    { name: 'Start', selector: row => row.start_date ? row.start_date.slice(0, 16).replace('T', ' ') : '-', sortable: true },
                    { name: 'End', selector: row => row.end_date ? row.end_date.slice(0, 16).replace('T', ' ') : '-', sortable: true },
                    // { name: 'Status', selector: row => row.status, sortable: true },
                    { name: 'Trainer', selector: row => row.name?.split(' - ')[1]?.split(' (')[0] || '-', sortable: true },
                    { name: 'Remaining Session', selector: row => {
                      const plan = plans.find(p => p.id === row.pt_session_plan_id);
                      const max = plan ? plan.max_session : '...';
                      const sisa = typeof row.remaining_session === 'number' ? row.remaining_session : '...';
                      return `${sisa} of ${max} sessions remaining`;
                    }, sortable: true },
                    {
                      name: 'Aksi',
                      cell: row => (
                        <button
                          className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                            bookingPTLoading
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                          }`}
                          onClick={() => handleBookPTSession(row.id)}
                          disabled={bookingPTLoading}
                        >
                          {bookingPTLoading ? 'Processing...' : 'Book'}
                        </button>
                      ),
                      ignoreRowClick: true
                    },
                  ]}
                  data={availablePTSessions}
                  pagination={true}
                  paginationServer={true}
                  paginationTotalRows={ptTotalRows}
                  paginationPerPage={ptLimit}
                  currentPage={ptPage}
                  onChangePage={handlePTTablePageChange}
                  onChangeRowsPerPage={handlePTTableRowsPerPageChange}
                  paginationRowsPerPageOptions={[10, 25, 50]}
                  customStyles={{
                    header: { style: { backgroundColor: '#374151' } },
                    rows: { 
                      style: { backgroundColor: '#1f2937', color: '#e5e7eb' },
                      highlightOnHoverStyle: { backgroundColor: '#374151' } 
                    },
                  }}
                />
              </div>
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-5 py-2 rounded-lg font-bold transition duration-200 shadow-md"
                  onClick={() => setShowPTModal(false)}
                >
                  Tutup
                </button>
              </div>
            </Modal>
          </div>
        </div>
      )}
    </div>
  );
}