'use client';
import Link from 'next/link';
import { FaTachometerAlt, FaUsers, FaDumbbell, FaClipboardList, FaCalendarCheck, FaBarcode, FaCheckCircle, FaSignOutAlt, FaCalendar, FaUserCheck, FaChalkboardTeacher } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const [userEmail, setUserEmail] = useState("");
  const [membershipDropdownOpen, setMembershipDropdownOpen] = useState(false);
  const [ptDropdownOpen, setPtDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const router = useRouter();

  const pathname = usePathname();

  // useEffect(() => {
  //   const validateToken = async () => {
  //     const currentPath = window.location.pathname;
  //     console.log('Current path:', currentPath);
  //     if (currentPath.startsWith('/barcode')) {
  //       // Skip token validation for any path starting with /barcode
  //       return;
  //     }

  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       router.replace('/login');
  //       return;
  //     }

  //     try {
//       const response = await fetch('/api/users', {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },

  //       if (response.status === 401) {
  //         localStorage.removeItem('token');
  //         router.replace('/login');
  //       }
  //     } catch (error) {
  //       console.error('Token validation failed:', error);
  //       router.replace('/login');
  //     }
  //   };

  //   validateToken();
  // }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('location_alerted');
    router.replace('/login');
  };
  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Ambil email user dari localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUserEmail(userObj.email || "");
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 767);
    checkWidth(); // cek saat pertama kali
    window.addEventListener("resize", checkWidth);

    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
  <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside
        className={`h-screen w-72 bg-white border-r border-gray-200 shadow-md z-30 transition-transform duration-300
          ${sidebarOpen ? 'block' : 'hidden'} relative flex flex-col py-6 px-6`}
      >
        {/* Tombol hide sidebar di semua layar */}
        <button
          className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded shadow hover:bg-gray-100 transition"
          onClick={() => setSidebarOpen(false)}
          aria-label="Hide sidebar"
        >
          ✕
        </button>
  <div className={`${isMobile ? 'pt-12' : 'pt-9'} mb-2 text-2xl font-extrabold tracking-wide text-center text-gray-800`}>BornFit Admin</div>
  {userEmail && (
    <div className="mb-8 text-center text-sm text-gray-500 font-medium">{userEmail}</div>
  )}
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/dashboard"
                className={`block py-2 px-4 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/dashboard") ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}
              ><FaTachometerAlt className="inline-block" /> Dashboard</Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className={`block py-2 px-4 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/users") ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}
              ><FaUsers className="inline-block" /> User Data</Link>
            </li>
            {/* Membership Dropdown */}
            <li className="relative">
              <button
                className={`w-full text-left py-2 px-4 rounded font-bold flex items-center justify-between ${membershipDropdownOpen ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
                type="button"
                aria-expanded={membershipDropdownOpen}
                aria-controls="membership-dropdown"
                onClick={() => setMembershipDropdownOpen((open) => !open)}
                data-collapse-toggle="membership-dropdown"
              >
                <span className="flex items-center gap-2"><FaUserCheck className="inline-block" /> Membership</span>
                <span className="ml-2">{membershipDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {membershipDropdownOpen && (
                <ul id="pt-session-dropdown" className="pl-6 border-l-2 border-blue-100 mt-1">
                  <li>
                    <Link
                      href="/admin/membership/session"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/membership/session") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaCalendarCheck className="inline-block" /> Details</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/membership/plans"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/membership/plans") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaClipboardList className="inline-block" /> Plans</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/membership/schedules"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/membership/schedules") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaCalendar className="inline-block" /> Schedule</Link>
                  </li>
                </ul>
              )}
            </li>
            {/* PT Session Dropdown */}
            <li className="relative">
              <button
                className={`w-full text-left py-2 px-4 rounded font-bold flex items-center justify-between ${ptDropdownOpen ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
                type="button"
                aria-expanded={ptDropdownOpen}
                aria-controls="pt-session-dropdown"
                onClick={() => setPtDropdownOpen((open) => !open)}
                data-collapse-toggle="pt-session-dropdown"
              >
                <span className="flex items-center gap-2"><FaDumbbell className="inline-block" /> PT Session</span>
                <span className="ml-2">{ptDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {ptDropdownOpen && (
                <ul id="pt-session-dropdown" className="pl-6 border-l-2 border-blue-100 mt-1">
                  <li>
                    <Link
                      href="/admin/pt/session"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/pt/session") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaCalendarCheck className="inline-block" /> Details</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/pt/plans"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/pt/plans") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaClipboardList className="inline-block" /> Plans</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/pt/booking"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/pt/booking") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaCheckCircle className="inline-block" /> Booking</Link>
                  </li>
                </ul>
              )}
            </li>
            {/* Class Session Dropdown */}
            <li className="relative">
              <button
                className={`w-full text-left py-2 px-4 rounded font-bold flex items-center justify-between ${classDropdownOpen ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
                type="button"
                aria-expanded={classDropdownOpen}
                aria-controls="class-session-dropdown"
                onClick={() => setClassDropdownOpen((open) => !open)}
                data-collapse-toggle="class-session-dropdown"
              >
                <span className="flex items-center gap-2"><FaChalkboardTeacher className="inline-block" /> Class Session</span>
                <span className="ml-2">{classDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {classDropdownOpen && (
                <ul id="class-session-dropdown" className="pl-6 border-l-2 border-blue-100 mt-1">
                  <li>
                    <Link
                      href="/admin/class/session"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/class/session") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaCalendarCheck className="inline-block" /> Details</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class/plans"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/class/plans") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaClipboardList className="inline-block" /> Plans</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class/attendance"
                      className={`block py-2 px-2 rounded font-semibold flex items-center gap-2 ${pathname.startsWith("/admin/class/attendance") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    ><FaCheckCircle className="inline-block" /> Attendance</Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link href="/barcode" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700 font-semibold flex items-center gap-2"><FaBarcode className="inline-block" /> Scan Barcode</Link>
            </li>
            <li>
              <Link href="/checkin" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700 font-semibold flex items-center gap-2"><FaBarcode className="inline-block" /> Checkin</Link>
            </li>
          </ul>
        </nav>
        <button
          className="mt-8 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-bold shadow flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="flex-shrink-0" />
          Logout
        </button>

      </aside>
      {/* Tombol show sidebar di semua layar saat sidebar tertutup */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-40 bg-white text-gray-900 p-2 rounded shadow hover:bg-gray-100 transition"
          onClick={() => setSidebarOpen(true)}
          aria-label="Show sidebar"
        >
          ☰
        </button>

      )}
      {/* Main content */}
  <main className="flex-1 p-6 md:p-8 ml-8 bg-white">{children}</main>
    </div>
  );
}
