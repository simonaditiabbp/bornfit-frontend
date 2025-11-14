'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {      
  const [ptDropdownOpen, setPtDropdownOpen] = useState(false);
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
  <div className={`${isMobile ? 'pt-12' : 'pt-9'} mb-8 text-2xl font-extrabold tracking-wide text-center text-gray-800`}>BornFit Admin</div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/dashboard"
                className={`block py-2 px-4 rounded font-semibold ${pathname.startsWith("/admin/dashboard") ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}
              >Dashboard</Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className={`block py-2 px-4 rounded font-semibold ${pathname.startsWith("/admin/users") ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}
              >User Data</Link>
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
                PT Session
                <span className="ml-2">{ptDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {ptDropdownOpen && (
                <ul id="pt-session-dropdown" className="pl-6 border-l-2 border-blue-100 mt-1">
                  <li>
                    <Link
                      href="/admin/pt/session"
                      className={`block py-2 px-2 rounded font-semibold ${pathname.startsWith("/admin/pt/session") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    >Session</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/pt/plans"
                      className={`block py-2 px-2 rounded font-semibold ${pathname.startsWith("/admin/pt/plans") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    >Plans</Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/pt/booking"
                      className={`block py-2 px-2 rounded font-semibold ${pathname.startsWith("/admin/pt/booking") ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}
                    >Booking</Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link href="/barcode" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700 font-semibold">Scan Barcode</Link>
            </li>
            <li>
              <Link href="/checkin" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700 font-semibold">Checkin</Link>
            </li>
          </ul>
        </nav>
        <button
          className="mt-8 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-bold shadow"
          onClick={handleLogout}
        >
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
