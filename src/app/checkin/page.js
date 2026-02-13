'use client';
import { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import BookingDataTable from './BookingDataTable';
import Image from 'next/image';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { format, differenceInDays, parseISO } from "date-fns";
import { id, enUS } from "date-fns/locale";
import { useRouter } from 'next/navigation';
import BackendErrorFallback from '../../components/BackendErrorFallback';
import { formatInTimeZone } from "date-fns-tz";
import { useBirthdayEffect } from '@/hooks/useBirthdayEffect';
import api from '@/utils/fetchClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BarcodePage() {
    const [result, setResult] = useState(null);
  const manualQrInputRef = useRef(null);
  const [user, setUser] = useState(null); // data member jika ditemukan
  const [ptSession, setPtSession] = useState(null); // PT session data
  const [ptSessionStatus, setPtSessionStatus] = useState(null); // 'active' | 'expired' | 'never'
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
  const [plans, setPlans] = useState([]);
  const { showBirthday } = useBirthdayEffect({result, user, messageType});

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
    const [bookingTimes, setBookingTimes] = useState({}); // Store booking time for each session
    
    // Modal state for viewing PT session bookings
    const [showPTBookingsModal, setShowPTBookingsModal] = useState(false);
    const [ptBookings, setPTBookings] = useState([]);
    const [ptBookingsLoading, setPTBookingsLoading] = useState(false);
    const [ptBookingsError, setPTBookingsError] = useState("");
    
    // Handler for Booking PT Session button
    const fetchAvailablePTSessions = async (page = 1, limit = 10, search = "") => {
      setBookingPTLoading(true);
      setBookingPTError("");
      // Don't clear success message to keep it visible after refresh
      try {
        // API sudah sesuai: /api/personaltrainersessions/member/:id
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        const data = await api.get(`/api/personaltrainersessions/member/${user.id}?${params.toString()}`);
        if (Array.isArray(data.data?.sessions)) {
          setAvailablePTSessions(data.data.sessions);
          setPTTotalRows(data.data.total); // total = jumlah data
          setPTPage(page);
          setPTLimit(limit);
          
          // Initialize booking times with current time for all sessions
          const initialTimes = {};
          data.data.sessions.forEach(session => {
            const now = new Date();
            initialTimes[session.id] = new Date(now.getTime()).toISOString();
          });
          setBookingTimes(prev => ({...prev, ...initialTimes}));
        } else {
          setAvailablePTSessions([]);
          setPTTotalRows(0);
          setBookingPTError(data.message || "No PT sessions available");
        }
      } catch (err) {
        setAvailablePTSessions([]);
        setPTTotalRows(0);
        setBookingPTError("Failed to fetch PT session data");
      }
      setBookingPTLoading(false);
    };

    const handleBookingPTSession = () => {
      if (!user?.id) return;
      setBookingPTError("");
      setBookingPTSuccess("");
      setBookingTimes({}); // Reset booking times
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
        // Get booking time from input or use current time
        const bookingTime = bookingTimes[sessionId] || new Date().toISOString();
        const bookingTimeAdjusted = new Date(new Date(bookingTime).getTime() + 7 * 60 * 60 * 1000).toISOString();
        
        await api.post(`/api/ptsessionbookings`, {
          user_member_id: user.id,
          personal_trainer_session_id: sessionId,
          booking_time: bookingTimeAdjusted,
          status: "booked"
        });
        setBookingPTSuccess("PT session booked successfully!");
        // Refresh data PT sessions untuk update remaining session
        fetchAvailablePTSessions(ptPage, ptLimit, ptSearch);
      } catch (err) {
        console.log("error: ", err);
        setBookingPTError(err.data.message || "Failed to book PT session");
      }
      setBookingPTLoading(false);
    };
    
  // Handler for viewing PT session bookings
  const handleViewPTBookings = async () => {
    if (!user?.id) return;
    setShowPTBookingsModal(true);
    setPTBookingsLoading(true);
    setPTBookingsError("");
    try {
      const data = await api.get(`/api/ptsessionbookings/member/${user.id}`);
      if (Array.isArray(data.data?.bookings)) {
        setPTBookings(data.data.bookings);
      } else {
        setPTBookings([]);
        setPTBookingsError("No PT session bookings found");
      }
    } catch (err) {
      console.error("Error fetching PT bookings:", err);
      setPTBookings([]);
      setPTBookingsError(err.message || "Failed to fetch PT session bookings");
    }
    setPTBookingsLoading(false);
  };
  
  // Handler for navigating to admin PT booking page with member name
  const handleGoToAdminPTBooking = () => {
    if (!user?.name) return;
    const memberName = encodeURIComponent(user.name);
    router.push(`/admin/pt/booking?search=${memberName}`);
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
  
  // Manual Checkin Modal State
  const [showManualCheckinModal, setShowManualCheckinModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchedMembers, setSearchedMembers] = useState([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState("");
  const memberSearchDebounceRef = useRef(null);
  
  // Handler for Booking Class button
  const fetchAvailableClasses = async (page = 1, limit = 10, search = "") => {
    setBookingClassLoading(true);
    setBookingClassError("");
    setBookingClassSuccess("");
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);
      const data = await api.get(`/api/classes?today=true&${params.toString()}`);
      if (Array.isArray(data.data?.classes)) {
        setAvailableClasses(data.data.classes);
        setClassTotalRows(data.data.total || 0);
        setClassPage(data.data.page || 1);
        setClassLimit(data.data.limit || 10);
      } else {
        setAvailableClasses([]);
        setClassTotalRows(0);
        setBookingClassError(data.message || "No Classes available");
      }
    } catch (err) {
      setAvailableClasses([]);
      setClassTotalRows(0);
      setBookingClassError("Failed to fetch Class data");
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
      await api.post(`/api/classattendances`, {
        class_id: classId,
        member_id: user.id,
        status: "Checked-in",
        checked_in_at: checkedInAt
      });
      setBookingClassSuccess("Class booked successfully!");
      // Refresh data classes untuk update slot
      fetchAvailableClasses(classPage, classLimit, classSearch);
    } catch (err) {
      setBookingClassError(err.message || "Failed to book class");
    }
    setBookingClassLoading(false);
  };

  // Handler for buying a class (Silver/other memberships)
  const handleBuyClass = (classId) => {
    // Redirect ke halaman class purchase insert dengan user_id dan class_id
    router.push(`/admin/class/classpurchase/insert?user_id=${user.id}&class_id=${classId}`);
  };

  const formatPendingMessage = (message) => {
  if (!message) return 'Membership not found';

  return message
    .split(/("pending"|not active)/gi)
    .map((part, index) => {
      const lower = part.toLowerCase();

      if (lower.includes('pending')) {
        return (
          <span
            key={index}
            className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold"
          >
            {part}
          </span>
        );
      }

      if (lower.includes('not active')) {
        return (
          <span
            key={index}
            className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold"
          >
            {part}
          </span>
        );
      }

      return part;
    });
  };


  // Handle response dari backend (dipakai oleh scan dan manual input)
  const handleQrResponse = async (qr_code) => {
    setLoading(true);
    setMessage('');
    setMessageType('success');
    setPtSession(null); // Reset PT session setiap check-in baru
    setPtSessionStatus(null); // Reset PT session status
    const { latitude, longitude } = getUserLocation();
    try {
      const apiResult = await api.post(`/api/checkins/checkin`, { qr_code, latitude, longitude });
      setResult(apiResult);
      if (apiResult.data) {
        setUser(apiResult.data.user);
        setMessage(apiResult.message || 'Check-in successfully');
        setMessageType('success');
        
        // Fetch latest PT session (active or expired)
        if (apiResult.data.user?.id) {
          try {
            const ptData = await api.get(`/api/personaltrainersessions/member/${apiResult.data.user.id}/latest`);
            if (ptData.data) {
              setPtSession(ptData.data);
              // Check if PT session is active or not
              if (ptData.data.status === 'active') {
                setPtSessionStatus('active');
              } else {
                setPtSessionStatus('expired');
              }
            } else {
              setPtSession(null);
              setPtSessionStatus('never');
            }
          } catch (e) {
            console.log('Error fetching PT session:', e);
            // If error (404 or other), assume never registered
            setPtSession(null);
            setPtSessionStatus('never');
          }
        }
      } else {
        setUser(null);
        setPtSession(null);
        setPtSessionStatus(null);
        if (qr_code.startsWith("member")) {
          setMessage(apiResult.message || 'Member not found');
        } else if (qr_code.startsWith("pt")) {
          setMessage(apiResult.message || 'PT Session not found');
        } else {
          setMessage(formatPendingMessage(apiResult.message) || 'Membership not found');
        }
        setMessageType('error');
      }
    } catch (err) {
      console.log("error: ", err);
      setPtSession(null);
      setPtSessionStatus(null);
      setUser(null);
      setMessage(err.data.message || 'An error occurred during check-in');
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

  const handleLogout = async () => {
    const confirmLogout = await Swal.fire({
      title: '⚠️ Logout Confirmation',
      html: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Logout!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });
    if (confirmLogout.isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out successfully', { duration: 1500 });
      router.push('/login');
    }
  };  

  // Handler untuk membuka modal manual checkin
  const handleOpenManualCheckin = () => {
    setShowManualCheckinModal(true);
    setMemberSearch("");
    setSearchedMembers([]);
    setMemberSearchError("");
  };

  // Handler untuk search member
  const searchMembers = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchedMembers([]);
      return;
    }
    
    setMemberSearchLoading(true);
    setMemberSearchError("");
    try {
      const data = await api.get(`/api/users?search=${encodeURIComponent(searchQuery)}&role=member&limit=20`);
      if (Array.isArray(data.data?.users)) {
        setSearchedMembers(data.data.users);
      } else {
        setSearchedMembers([]);
        setMemberSearchError(data.message || "Member not found");
      }
    } catch (err) {
      setSearchedMembers([]);
      setMemberSearchError("Failed to search for member");
    }
    setMemberSearchLoading(false);
  };

  // Handler untuk input search dengan debounce
  const handleMemberSearchChange = (e) => {
    const value = e.target.value;
    setMemberSearch(value);
    if (memberSearchDebounceRef.current) clearTimeout(memberSearchDebounceRef.current);
    memberSearchDebounceRef.current = setTimeout(() => {
      searchMembers(value);
    }, 400);
  };

  // Handler untuk melakukan manual checkin berdasarkan member yang dipilih
  const handleManualCheckinMember = async (selectedMember) => {
    if (!selectedMember?.qr_code) {
      setMemberSearchError("Member not have QR code");
      return;
    }
    
    // Close modal
    setShowManualCheckinModal(false);
    
    // Reset state
    setMemberSearch("");
    setSearchedMembers([]);
    
    // Lakukan checkin menggunakan barcode member
    await handleQrResponse(selectedMember.qr_code);
  };

  // Fetch PT session plans saat modal PT dibuka
  useEffect(() => {
    if (!showPTModal) return;
    const fetchPlans = async () => {
      try {
        const data = await api.get(`/api/ptsessionplans?limit=10000`);
        if (Array.isArray(data.data?.plans)) {
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
        const data = await api.get(`/api/checkins/latest-time/${user.id}`);
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

  // Keep manual QR input always focused, kecuali modal booking class/PT session/manual checkin sedang terbuka
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Jangan paksa fokus jika modal booking class, PT session, atau manual checkin terbuka
      if (showClassModal || showPTModal || showManualCheckinModal) return;
      if (manualQrInputRef.current && document.activeElement !== manualQrInputRef.current) {
        manualQrInputRef.current.focus();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showClassModal, showPTModal, showManualCheckinModal]);

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
                  const result = await api.post(`/api/checkins/checkin`, { qr_code, latitude, longitude });
                  setResult(result);
                  if (result.data) {
                    setUser(result.data.user);
                    setMessage(result.message || 'Check-in successful');
                    setMessageType('success');
                    
                    // Fetch latest PT session (active or expired)
                    if (result.data.user?.id) {
                      try {
                        const ptData = await api.get(`/api/personaltrainersessions/member/${result.data.user.id}/latest`);
                        if (ptData.data) {
                          setPtSession(ptData.data);
                          // Check if PT session is active or not
                          if (ptData.data.status === 'active') {
                            setPtSessionStatus('active');
                          } else {
                            setPtSessionStatus('expired');
                          }
                        } else {
                          setPtSession(null);
                          setPtSessionStatus('never');
                        }
                      } catch (e) {
                        console.log('Error fetching PT session:', e);
                        // If error (404 or other), assume never registered
                        setPtSession(null);
                        setPtSessionStatus('never');
                      }
                    }
                  } else {
                    setUser(null);
                    setPtSession(null);
                    setPtSessionStatus(null);
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
                  setPtSession(null);
                  setPtSessionStatus(null);
                  setMessage(err.message || 'An error occurred during check-in');
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
            setMessage('Unable to access the camera: ' + (err?.message || err));
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
        try {
          await api.get(`/api/users`);
        } catch (err) {
          if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.replace('/login');
          } else {
            throw err;
          }
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
  const renderPTSessionInfo = () => {
    // If never registered for PT session
    if (ptSessionStatus === 'never') {
      return (
        <div className="w-full mb-4 p-4 rounded-xl bg-gradient-to-br from-gray-50/80 to-blue-50/80 dark:from-gray-900/20 dark:to-blue-900/20 border border-gray-200/70 dark:border-gray-700/50 shadow-[0_8px_20px_rgba(147,51,234,0.15)]">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wide">PT Session Info</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium">Belum pernah registrasi PT session.</p>
          </div>
        </div>
      );
    }

    // If has PT session but expired
    if (ptSessionStatus === 'expired' && ptSession) {
      const lastActiveDate = ptSession.start_date 
        ? format(parseISO(ptSession.start_date), "dd MMM yyyy", { locale: enUS })
        : "–";
      return (
        <div className="w-full mb-4 p-4 rounded-xl bg-gradient-to-br from-orange-50/80 to-red-50/80 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/70 dark:border-orange-700/50 shadow-[0_8px_20px_rgba(147,51,234,0.15)]">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-extrabold text-orange-700 dark:text-orange-300 uppercase tracking-wide">PT Session Info</div>
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            <p className="font-medium">PT session terakhir aktif pada tanggal <span className="font-bold">{lastActiveDate}</span>.</p>
            <p className="mt-2 text-xs">Status: <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">{ptSession.status || 'expired'}</span></p>
          </div>
        </div>
      );
    }

    // If active PT session exists
    if (!ptSession) return null;
    const ptsession = ptSession;
    const ptplan = ptsession.pt_session_plan;
    const trainer = ptsession.user_pt;
    // PT session period calculation
    let ptPeriod = "";
    let ptRemainingText = null;
    let ptRemainingDays = null;
    let ptDiffMs = null;
        if (ptsession && ptplan) {
          const joinDate = ptsession.join_date ? format(parseISO(ptsession.join_date), "dd MMM yyyy", { locale: enUS }) : "–";
          const endDate = ptsession.join_date ? format(parseISO(ptsession.join_date), "dd MMM yyyy", { locale: enUS }) : "–";
          let endDateCalc = null;
          if (ptsession.start_date && ptplan.duration_value) {
            const startDateObj = parseISO(ptsession.start_date);
            endDateCalc = format(new Date(startDateObj.getTime() + ptplan.duration_value * 24 * 60 * 60 * 1000), "dd MMM yyyy", { locale: enUS });
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
      <div className="w-full mb-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-red-50/80 dark:from-amber-900/20 dark:to-red-900/20 border border-amber-200/70 dark:border-amber-700/50 shadow-[0_8px_20px_rgba(147,51,234,0.15)]">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wide">PT Session Active</div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-amber-600/80 dark:text-amber-400/80 font-medium">Expired Period:</span>
            <span className="font-bold text-amber-800 dark:text-amber-200">{ptPeriod || "–"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-600/80 dark:text-amber-400/80 font-medium">Trainer:</span>
            <span className="font-bold text-amber-800 dark:text-amber-200">{trainer?.name || "–"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-600/80 dark:text-amber-400/80 font-medium">Max Session:</span>
            <span className="font-bold text-amber-800 dark:text-amber-200">{ptplan?.max_session || "–"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-600/80 dark:text-amber-400/80 font-medium">Remaining:</span>
            <span className="font-bold text-amber-800 dark:text-amber-200">{ptsession?.remaining_session ?? "–"}</span>
          </div>
          <div className="pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
            {ptsession.status === 'active' && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">Active</span>
            )}
            {ptsession.status === 'pending' && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600">Finished</span>
            )}
            {ptsession.status !== 'active' && ptsession.status !== 'pending' && ptsession.status !== 'selesai' && ptsession.status !== 'batal' && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">{ptsession.status}</span>
            )}
          </div>
        </div>
        {ptRemainingText && (
          <div className={`mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/50 text-xs font-bold ${ptDiffMs > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'}`}>
            ⏰ Deadline: {ptRemainingText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-2 py-8">
      <div className="w-full flex flex-wrap justify-center gap-3 px-2 lg:w-auto lg:flex-nowrap lg:justify-end lg:absolute lg:top-4 lg:right-6">
        <button
          onClick={handleOpenManualCheckin}
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200"
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
            className="feather feather-user-check"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
          Manual Checkin
        </button>
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

      <h1 className="text-4xl font-extrabold mb-8 mt-6 lg:mt-0 text-gray-800 dark:text-amber-400 drop-shadow-lg tracking-tight text-center">
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
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl min-h-[75vh] w-full max-w-[1500px] border ${messageType === 'success' ? 'border-green-500' : 'border-red-500'} p-12 grid grid-cols-1 md:grid-cols-3 gap-20 justify-center items-center`}
          style={{ minHeight: '75vh', minWidth: '340px' }}
        >
          {/* kolom kiri: foto (tampil hanya jika success) */}
          {messageType === 'success' ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-96 h-96 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium overflow-hidden border-1 border-amber-400 dark:border-amber-400 shadow-2xl p-2">
                {user?.photo ? (
                  <img src={user.photo.startsWith('http') ? user.photo : `${API_URL?.replace(/\/$/, '')}${user.photo}`} alt="Foto Member" width={300} height={300} className="w-full h-full object-cover scale-105 rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-gray-500 dark:text-gray-400">
                    <svg
                      viewBox="0 0 24 24"
                      width="120"
                      height="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" /> {/* Head */}
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" /> {/* Body */}
                    </svg>

                    <span className="text-lg font-medium">
                      No photo available
                    </span>

                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-96 h-96 flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-700 rounded-2xl border-4 border-red-500 shadow-xl">
                
                <svg
                  viewBox="0 0 24 24"
                  width="120"
                  height="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>

                <span className="text-gray-500 dark:text-gray-400 text-lg text-center">
                  No photo available
                </span>

              </div>
            </div>
          )}

          {/* kolom tengah: detail member (hanya jika success) */}
          <div className="text-left text-lg text-gray-700 dark:text-gray-200 flex flex-col justify-center">
            {messageType === 'success' ? (
              <>
                {/* <button className='flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200' onClick={playBirthday} style={{ display: 'none' }}> Play Birthday </button> */}
                {showBirthday && (
                  <div className="mb-4 flex items-center gap-2">
                    <span role="img" aria-label="birthday" className="text-3xl">🎉</span>
                    <span className="text-2xl font-bold text-pink-500 dark:text-pink-300 animate-bounce">Happy Birthday! 🎂</span>
                  </div>
                )}
                <p className="font-bold text-3xl text-gray-800 dark:text-amber-400 mb-2 leading-tight">{user?.name || '-'}</p>
                
                {/* Email */}
                <div className="mb-1 p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</p>
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-200 break-all">{user?.email || '-'}</p>
                </div>

                {/* Membership Expired Period */}
                <div className="mb-1 p-3 rounded-lg bg-rose-50/70 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-700/50">
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">Membership Expired Period</p>
                  <p className="text-base font-bold text-rose-700 dark:text-rose-300">{endDate ? endDate : "-"}</p>
                </div>

                {/* Membership Type */}
                <div className="mb-1 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/50">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Membership Type</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold border break-words ${
                        user?.membership_plan?.name?.toLowerCase() === "platinum"
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                        : user?.membership_plan?.name?.toLowerCase() === "gold"
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                        : user?.membership_plan?.name?.toLowerCase() === "silver"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                        : user?.membership_plan?.name?.toLowerCase() === "trial"
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-amber-100 text-amber-500 border-amber-300"
                      }`}
                      style={{ maxWidth: '100%', wordBreak: 'break-word' }}
                    >
                      {user?.membership_plan?.name || "-"}
                    </span>
                  </div>
                </div>

                {/* Latest Checkin */}
                <div className="mb-1 p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/50">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Latest Check-in</p>
                  {latestCheckin ? (
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{latestCheckin}</p>
                  ) : (
                    <p className="text-base font-semibold text-slate-400 dark:text-slate-500">No recent check-in</p>
                  )}
                </div>
                {diffMs > 0 && remainingDays <= 7 && (
                  <>
                    <p className="text-red-500 dark:text-red-400 font-bold text-lg mt-1">
                       Membership deadline: {remainingText}
                    </p>
                    <p className="mt-1 text-amber-600 dark:text-amber-400 text-base">
                      Please renew your membership soon by contacting admin +62 857-8213-5542
                    </p>
                  </>
                )}
              </>
            ) : (
              <div className="whitespace-pre-line text-gray-500 dark:text-gray-400 text-center">
                <p className="mt-2 text-base text-red-500 dark:text-red-400 font-semibold">{message}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">Please try to check-in again</p>
              </div>
            )}
          </div>

          {/* kolom kanan: tombol check-in / input manual / message */}
          <div className="flex flex-col text-lg items-center justify-center gap-4">
            {/* PT Session Info */}
            {renderPTSessionInfo()}
            
            <button
              className="group relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-lg font-extrabold uppercase tracking-wider text-white shadow-[0_1px_12px_rgba(245,158,11,0.35)] transition-all duration-200 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 hover:-translate-y-0.5"
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
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/30" />
            </button>
            <input
              type="text"
              placeholder="Enter QR code manually"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 shadow"
              value={buffer}
              onChange={(e) => handleBufferedInput(e.target.value)}
              autoFocus
              ref={manualQrInputRef}
            />

            {/* Tambahan tombol booking class dan PT session */}
            <button
              className="group relative w-full rounded-xl border border-emerald-300/70 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 text-lg font-extrabold uppercase tracking-wider text-white shadow-[0_12px_28px_rgba(16,185,129,0.35)] transition-all duration-200 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-300/70 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              onClick={handleBookingClass}
              disabled={loading || !user}
            >
              Booking Class
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
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
                  {bookingClassLoading && <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-500 rounded-md font-medium">Loading data...</div>}
                  {bookingClassError && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border-l-4 border-red-500 rounded-md font-medium">Error: {bookingClassError}</div>}
                  {bookingClassSuccess && <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-l-4 border-green-500 rounded-md font-medium">Successfully: {bookingClassSuccess}</div>}
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
                    { name: 'Class Name', selector: row => row.name, sortable: true, grow: 2 },
                    { name: 'Date', selector: row => row.class_date?.slice(0, 10), sortable: true },
                    { name: 'Start', selector: row => row.start_time?.slice(11, 16), sortable: true },
                    { name: 'End', selector: row => row.end_time?.slice(11, 16), sortable: true },
                    { name: 'Instructor', selector: row => row.instructor?.name || '-', sortable: true, grow: 1.5 },
                    { 
                      name: 'Action', 
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
                    Close
                </button>
              </div>
            </Modal>
            <button
              className="group relative w-full rounded-xl border border-blue-300/70 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-6 py-3 text-lg font-extrabold uppercase tracking-wider text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)] transition-all duration-200 hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              onClick={handleBookingPTSession}
              disabled={loading || !user}
            >
              Booking PT Session
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
            </button>
            
            {/* Modal Booking PT Session */}
            <Modal
              isOpen={showPTModal}
              onRequestClose={() => setShowPTModal(false)}
              contentLabel="Booking PT Session"
              ariaHideApp={false}
              className=" bg-white dark:bg-gray-800 rounded-xl max-w-[1400px] min-w-[900px] w-full mx-auto p-8 shadow-2xl outline-none max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700 " overlayClassName="fixed inset-0 bg-black/70 flex items-center  justify-center z-[1000]" portalClassName="z-[1000]"
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
                {bookingPTLoading && <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-500 rounded-md font-medium">Loading data...</div>}
                {bookingPTError && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border-l-4 border-red-500 rounded-md font-medium">Error: {bookingPTError}</div>}
                {bookingPTSuccess && <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-l-4 border-green-500 rounded-md font-medium">Success: {bookingPTSuccess}</div>}
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
                <button
                  className="ml-auto px-4 py-2 rounded-lg border border-violet-300/70 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-semibold shadow-md transition-all duration-200 hover:from-violet-400 hover:via-purple-400 hover:to-fuchsia-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-300/70"
                  onClick={handleViewPTBookings}
                >
                  📋 View PT Bookings
                </button>
              </div>
              <div className="shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <BookingDataTable
                  columns={[
                    // { name: 'Nama Session', selector: row => row.name, sortable: true },
                    { name: 'Name', cell: row => {
                      const plan = plans.find(p => p.id === row.pt_session_plan_id);
                      return plan ? plan.name : '-';
                    }, sortable: true },
                    { name: 'Start', cell: row => row.start_date ? row.start_date.slice(0, 16).replace('T', ' ') : '-', sortable: true },
                    { name: 'End', cell: row => row.end_date ? row.end_date.slice(0, 16).replace('T', ' ') : '-', sortable: true },
                    // { name: 'Status', cell: row => row.status, sortable: true },
                    { name: 'Trainer', cell: row => row.name?.split(' - ')[1]?.split(' (')[0] || '-', sortable: true },
                    {
                      name: 'Remaining Session',
                      cell: row => {
                        const plan = plans.find(p => p.id === row.pt_session_plan_id);
                        const max = plan ? plan.max_session : '...';
                        const sisa = typeof row.remaining_session === 'number'
                          ? row.remaining_session
                          : '...';

                        return `${sisa} of ${max} sessions remaining`;
                      },
                      sortable: true,
                    },
                    {
                      name: 'Booking Time',
                      cell: row => {
                        // Get the booking time for this row
                        const storedTime = bookingTimes[row.id];
                        let displayValue = '';
                        
                        if (storedTime) {
                          // Convert UTC ISO string to local datetime-local format
                          const date = new Date(storedTime);
                          displayValue = new Date(date.getTime() - date.getTimezoneOffset() * 60000 ).toISOString().slice(0, 16);
                        }
                        
                        return (
                          <input
                            type="datetime-local"
                            className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-w-[180px]"
                            value={displayValue}
                            onChange={(e) => {
                              const localDateTime = e.target.value;
                              if (localDateTime) {
                                // Convert local datetime-local to UTC ISO string
                                const isoString = new Date(localDateTime).toISOString();
                                setBookingTimes(prev => ({...prev, [row.id]: isoString}));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        );
                      },
                      sortable: false,
                      width: '200px',
                    },
                    {
                      name: 'Action',
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
                  Close
                </button>
              </div>
            </Modal>
            
            {/* Modal View PT Session Bookings */}
            <Modal
              isOpen={showPTBookingsModal}
              onRequestClose={() => setShowPTBookingsModal(false)}
              contentLabel="PT Session Bookings"
              ariaHideApp={false}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-[900px] w-full mx-auto p-6 shadow-2xl outline-none max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
              overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000]"
              portalClassName="z-[2000]"
            >
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                    📋 PT Session Bookings History
                  </h2>
                  <button
                    onClick={() => setShowPTBookingsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 shadow-md flex items-center gap-2 text-sm"
                  onClick={handleGoToAdminPTBooking}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Go to Admin PT Booking
                </button>
              </div>
              
              {ptBookingsLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading PT session bookings...</p>
                </div>
              )}
              
              {ptBookingsError && !ptBookingsLoading && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 border-l-4 border-yellow-500 rounded-md mb-4">
                  {ptBookingsError}
                </div>
              )}
              
              {!ptBookingsLoading && !ptBookingsError && ptBookings.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No PT session bookings found for this member.
                </div>
              )}
              
              {!ptBookingsLoading && ptBookings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Booking Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          PT Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Session Plan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created At
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ptBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {booking.booking_time ? new Date(new Date(booking.booking_time).getTime() - 7 * 60 * 60 * 1000).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {booking.personal_trainer_session?.user_pt?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {booking.personal_trainer_session?.pt_session_plan?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {booking.created_at ? new Date(new Date(booking.created_at).getTime() - 7 * 60 * 60 * 1000).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }) : '-'}
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-5 py-2 rounded-lg font-bold transition duration-200 shadow-md"
                  onClick={() => setShowPTBookingsModal(false)}
                >
                  Close
                </button>
              </div>
            </Modal>
          </div>
        </div>
      )}

      {/* Modal Manual Checkin */}
      <Modal
        isOpen={showManualCheckinModal}
        onRequestClose={() => setShowManualCheckinModal(false)}
        contentLabel="Manual Checkin"
        ariaHideApp={false}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-[800px] w-full mx-auto p-8 shadow-2xl outline-none max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]"
        portalClassName="z-[1000]"
      >
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <div>
            <h2 className="flex items-center gap-3 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z
                    M7 6h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2z
                    M9 11h6
                    M9 15h6
                    M9 19h4"
                />
              </svg>
              Manual Check-in
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Search for a member by name or email</p>
          </div>
          {/* Tombol close di sudut kanan atas */}
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition duration-150"
            onClick={() => setShowManualCheckinModal(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* FEEDBACK AREA */}
        <div className="mb-4">
          {memberSearchLoading && <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-500 rounded-md font-medium">Searching for member...</div>}
          {memberSearchError && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border-l-4 border-red-500 rounded-md font-medium">Error: {memberSearchError}</div>}
        </div>

        {/* SEARCH INPUT */}
        <div className="mb-6">
          <input
            type="text"
            className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 shadow"
            placeholder="Type the member’s name or email (minimum 2 characters)..."
            value={memberSearch}
            onChange={handleMemberSearchChange}
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Search will start automatically after 0.4 seconds</p>
        </div>

        {/* MEMBER LIST */}
        {searchedMembers.length > 0 && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3">Search Results ({searchedMembers.length} member{searchedMembers.length !== 1 ? 's' : ''}):</h3>
            {searchedMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer flex justify-between items-center shadow-sm"
                onClick={() => handleManualCheckinMember(member)}
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-lg">{member.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                  {member.membership_plan?.name && (
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      member.membership_plan.name.toLowerCase() === "platinum"
                        ? "bg-gray-100 text-gray-800"
                        : member.membership_plan.name.toLowerCase() === "gold"
                        ? "bg-amber-100 text-amber-700"
                        : member.membership_plan.name.toLowerCase() === "silver"
                        ? "bg-slate-100 text-slate-700"
                        : member.membership_plan.name.toLowerCase() === "trial"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {member.membership_plan.name}
                    </span>
                  )}
                </div>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualCheckinMember(member);
                  }}
                >
                  Check In
                </button>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!memberSearchLoading && memberSearch.length >= 2 && searchedMembers.length === 0 && !memberSearchError && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <p className="text-lg font-medium">No members found</p>
            <p className="text-sm mt-1">Try using a different keyword</p>
          </div>
        )}

        {/* INITIAL STATE */}
        {memberSearch.length < 2 && searchedMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p className="text-lg font-medium">Start searching for member</p>
            <p className="text-sm mt-1">Type at least 2 characters to start searching</p>
          </div>
        )}

        {/* FOOTER MODAL */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-5 py-2 rounded-lg font-bold transition duration-200 shadow-md"
            onClick={() => setShowManualCheckinModal(false)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}