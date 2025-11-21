'use client';
import Link from 'next/link';
import { FaTachometerAlt, FaUsers, FaDumbbell, FaClipboardList, FaCalendarCheck, FaBarcode, FaCheckCircle, FaSignOutAlt, FaBars, FaAngleRight, FaAngleDoubleLeft, FaMoon, FaAngleDoubleRight, FaUps, FaAngleUp, FaAngleDown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Sidebar Dropdown
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Ambil email user dari localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (error) {
          console.error("Gagal parsing data user:", error);
        }
      }
    }
  }, []);

  const navTextClass = isCollapsed ? "hidden" : "block";
  const dropdownArrowClass = isCollapsed ? "hidden" : "block";

  return (

  <div className="bg-gray-800">
    <div>
      <nav className="fixed top-0 z-50 w-full bg-gray-800 border-b border-gray-600 dark:bg-gray-800 dark:border-gray-100">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              <button 
                type="button" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700">
                  <span className="sr-only">Open sidebar</span>
                  <FaBars className="inline-block" />
              </button>
                    
              <div className="hidden sm:flex">
                <a href="" className="flex ms-2 md:me-24">
                  <Image
                    src={"../logo.svg"}
                    alt="BornFit Logo"
                    width={128}
                    height={128}
                    className="w-8 h-8 me-3"
                  />
                </a>                
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center ms-3 gap-2.5">
              {/* Theme Setting */}
                <button id="theme-toggle" type="button" className="text-amber-300 dark:text-white hover:bg-gray-700 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 rounded-lg text-sm p-2.5">
                  <FaMoon />
                </button>

              {/* Dropdown User */}
              <div className="relative">
                <button type="button" className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-700 dark:focus:ring-gray-600" 
                  aria-expanded={userDropdownOpen}
                  aria-controls="user-dropdown"
                  onClick={() => setUserDropdownOpen((open) => !open)}
                  data-collapse-toggle="user-dropdown"
                >
                  <span className="sr-only">Open user menu</span>
                  <Image
                    src={"../logo.svg"}
                    alt="User Profile"
                    width={128}
                    height={128}
                    className="w-8 h-8 rounded-full"
                  />
                </button>
              </div>
              {userDropdownOpen && (
                <div id="user-dropdown" className="absolute right-0 top-full z-50 mt-2 w-48 text-base list-none bg-gray-800 divide-y divide-gray-600 rounded-md shadow-lg dark:bg-gray-400 dark:divide-gray-100">
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-amber-300" role="none">
                      {user?.name}
                    </p>
                    <p className="text-sm font-medium text-amber-300 truncate" role="none">
                      {user?.email}
                    </p>
                  </div>
                  <ul className="py-1" role="none">
                    <li>
                      <a href="" className="block px-4 py-2 text-sm text-amber-300 hover:bg-gray-700" role="menuitem">Settings</a>
                    </li>
                    <li className="block px-4 py-2 text-sm text-amber-300 hover:bg-gray-700">
                      <button onClick={handleLogout}>Logout</button>
                    </li>
                  </ul>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <div className="flex pt-16">
      <aside 
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 h-screen pt-20 transition-all duration-300 bg-gray-800 border-r border-gray-600 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
        }`}
        aria-label="Sidebar"
      >
        <div className="justify-between h-full px-3 pb-4 overflow-y-auto bg-gray-800 flex flex-col">
          <ul className="space-y-1 font-medium flex-grow">

            <li className="sm:hidden mb-4 border-b-2 p-4">
              <a href="" className="flex ms-2">
                <Image
                  src={"../logo.svg"}
                  alt="BornFit Logo"
                  width={128}
                  height={128}
                  className="h-6 me-3"
                />
              </a>
            </li>

            <li>
              <Link
                href="/admin/dashboard"
                className={`flex items-center py-2 px-4 gap-2 rounded-lg font-semibold ${pathname.startsWith("/admin/dashboard") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}>
                <FaTachometerAlt class="inline-block transition duration-75"/> 
                <span className={navTextClass}>Dashboard</span>
              </Link>
            </li>

            <li>
              <Link
                href="/admin/users"
                className={`flex items-center py-2 px-4 gap-2 rounded-lg font-semibold ${pathname.startsWith("/admin/users") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}>
                <FaUsers className="inline-block transition duration-75" /> 
                <span className={navTextClass}>User Data</span>
              </Link>
            </li>

            {/* PT Session Dropdown */}
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-2 px-4 text-base transition duration-75 rounded-lg font-bold ${ptDropdownOpen ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}
                aria-expanded={ptDropdownOpen}
                aria-controls="pt-session-dropdown"
                onClick={() => setPtDropdownOpen((open) => !open)}
                data-collapse-toggle="pt-session-dropdown"
              >
                <FaDumbbell className="inline-block transition duration-75" />
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>PT Session</span>
                <span className={`${dropdownArrowClass} w-3 h-3 transition-transform duration-300`}>
                  {ptDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {ptDropdownOpen && (
                <ul id="pt-session-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-gray-600'}`}>
                  <li>
                    <Link 
                      href="/admin/pt/session" 
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/pt/session") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"} ${isCollapsed ? 'justify-center' : ''}`}>
                      <FaCalendarCheck className="inline-block transition duration-75 mr-2" />
                      <span className={navTextClass}>Session</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/pt/plans" 
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/pt/plans") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"} ${isCollapsed ? 'justify-center' : ''}`}>
                      <FaClipboardList className="inline-block transition duration-75 mr-2" />
                      <span className={navTextClass}>Plans</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/pt/booking" 
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/pt/booking") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"} ${isCollapsed ? 'justify-center' : ''}`}>
                      <FaCheckCircle className="inline-block transition duration-75 mr-2" />
                      <span className={navTextClass}>Booking</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Class Session Dropdown */}
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-2 px-4 text-base transition duration-75 rounded-lg font-bold ${classDropdownOpen ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}
                aria-expanded={classDropdownOpen}
                aria-controls="class-session-dropdown"
                onClick={() => setClassDropdownOpen((open) => !open)}
                data-collapse-toggle="class-session-dropdown"
              >
                <FaDumbbell className="inline-block transition duration-75" />
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>Class Session</span>
                <span className={`${dropdownArrowClass} w-3 h-3 transition-transform duration-300`}>
                  {classDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {classDropdownOpen && (
                <ul id="class-session-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-gray-600'}`}>
                  <li>
                    <Link
                      href="/admin/class/session"
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/class/session") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}
                    >
                    <FaCalendarCheck className="inline-block transition duration-75 mr-2" /> 
                    <span className={navTextClass}>Session</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class/plans"
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/class/plans") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}
                    >
                      <FaClipboardList className="inline-block transition duration-75 mr-2" /> 
                      <span className={navTextClass}>Plans</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class/attendance"
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/class/attendance") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}
                    >
                      <FaCheckCircle className="inline-block transition duration-75 mr-2" /> 
                      <span className={navTextClass}>Attendance</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li>
              <Link 
                href="/barcode" 
                className="flex items-center py-2 px-4 gap-2 rounded-lg font-semibold hover:bg-gray-700 text-amber-300"
              >
                <FaBarcode className="inline-block transition duration-75" /> 
                <span className={navTextClass}>Scan Barcode</span>
              </Link>
            </li>

            <li>
              <Link 
                href="/checkin" 
                className="flex items-center py-2 px-4 gap-2 rounded-lg font-semibold hover:bg-gray-700 text-amber-300"
              >
                <FaBarcode className="inline-block transition duration-75" /> 
                <span className={navTextClass}>Checkin</span>
              </Link>
            </li>

          </ul>

          <div className="mt-auto hidden sm:block">
            <button 
                id="sidebar-toggle" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center p-4 text-amber-300 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-700 group"
              >
                {isCollapsed ? (
                    <FaAngleDoubleRight className="w-6 h-6 transition-transform duration-300" />
                ) : (
                    <FaAngleDoubleLeft className="w-6 h-6 transition-transform duration-300" />
                )}
              </button>
          </div>
        </div>
      </aside>        
        
      <main className={`flex-1 overflow-x-hidden bg-gray-900 transition-all duration-300 ease-in-out ${isCollapsed ? 'sm:ml-20' : 'sm:ml-64'}`}>{children}</main>
    </div>
  </div>
  );
}
