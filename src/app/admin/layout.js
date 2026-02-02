'use client';
import Link from 'next/link';
import { FaTachometerAlt, FaUsers, FaDumbbell, FaClipboardList, FaCalendarCheck, FaBarcode, FaCheckCircle, FaSignOutAlt, FaBars, FaAngleRight, FaAngleDoubleLeft, FaMoon, FaAngleDoubleRight, FaUps, FaAngleUp, FaAngleDown, FaCalendar, FaUserCheck, FaChalkboardTeacher, FaShoppingBag, FaExchangeAlt, FaSnowflake, FaIdCard, FaChartLine, FaFileAlt, FaCalendarAlt, FaCog, FaUserTie, FaUserTag, FaHistory } from 'react-icons/fa';
import { BreadcrumbProvider, useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingSpin from '@/components/admin/LoadingSpin';
import logoDark from '@/assets/logodark.png';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { theme } = useTheme();

  // Sidebar Dropdown
  const [membershipDropdownOpen, setMembershipDropdownOpen] = useState(false);
  const [ptDropdownOpen, setPtDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [scheduleDropdownOpen, setScheduleDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

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
    // Role-based access control for admin layout
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.replace('/login');
        return;
      }
      
      try {
        const userData = JSON.parse(userStr);
        
        // Only admin and finance role can access admin pages
        if (userData.role !== 'admin' && userData.role !== 'finance') {
          if (userData.role === 'opscan') {
            router.replace('/checkin');
          } else {
            router.replace('/login');
          }
          return;
        }
        
        setUser(userData);
        setIsAuthorized(true);
        
        // Auto-open report dropdown for finance role
        if (userData.role === 'finance') {
          setReportDropdownOpen(true);
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.replace('/login');
      }
    }
  }, [router]);

  const navTextClass = isCollapsed ? "hidden" : "block";
  const dropdownArrowClass = isCollapsed ? "hidden" : "block";

  // Show loading state while checking authorization
  if (!isAuthorized) {
    return <LoadingSpin />
  }

  return (
  <BreadcrumbProvider>
  <div className="bg-gray-100 dark:bg-gray-800">
    <div>
      <nav className={`fixed top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 transition-all duration-300 ${isCollapsed ? 'sm:ml-20 sm:w-[calc(100%-5rem)]' : 'sm:ml-64 sm:w-[calc(100%-16rem)]'}`}>
        <div className="px-3 py-1 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              <button 
                type="button" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-700 dark:text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700">
                  <span className="sr-only">Open sidebar</span>
                  <FaBars className="inline-block" />
              </button>
              
              {/* Breadcrumb di Navbar */}
              <BreadcrumbDisplay />
            </div>

            <div className="flex items-center">
              <div className="flex items-center ms-3 gap-2.5">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Dropdown User */}
              <div className="relative">
                <button type="button" className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white bg-gradient-to-br from-amber-400 to-amber-600 dark:from-yellow-400 dark:to-amber-500 rounded-full focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600" 
                  aria-expanded={userDropdownOpen}
                  aria-controls="user-dropdown"
                  onClick={() => setUserDropdownOpen((open) => !open)}
                  data-collapse-toggle="user-dropdown"
                >
                  <span className="sr-only">Open user menu</span>
                  <span className="text-base font-bold text-gray-800 dark:text-gray-800">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                  </span>
                </button>
              </div>
              {userDropdownOpen && (
                <div id="user-dropdown" className="absolute right-0 top-full z-50 mt-2 w-48 text-base list-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600 rounded-md shadow-lg">
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-gray-800 dark:text-amber-300" role="none">
                      {user?.name}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-amber-300 truncate" role="none">
                      {user?.email}
                    </p>
                  </div>
                  <ul className="py-1" role="none">
                    <li>
                      <a href="" className="block px-4 py-2 text-sm text-gray-700 dark:text-amber-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Settings</a>
                    </li>
                    <li>
                      <a onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700 dark:text-amber-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Logout</a>
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

    <div className="flex">
      {/* Backdrop overlay untuk mobile - klik untuk tutup sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <aside 
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 h-screen pt-12 sm:pt-0 transition-all duration-300 bg-slate-50 dark:bg-gray-900 border-r border-slate-300 dark:border-gray-700 sm:translate-x-0 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
        aria-label="Sidebar"
      >
        <div className="justify-between h-full px-3 pb-4 overflow-y-auto bg-slate-50 dark:bg-gray-900 flex flex-col">
          <ul className="space-y-1 font-medium flex-grow">

            <li className="mb-4 border-b-2 border-slate-300 dark:border-gray-600 pb-3 pt-2 justify-center flex">
              <a href="" className={`flex items-center justify-center ${isCollapsed ? 'w-12 h-12' : 'w-32 h-24'}`}>
                <Image
                  src={theme === 'dark' ? "/logo.svg" : logoDark}
                  alt="BornFit Logo"
                  width={128}
                  height={96}
                  className={`object-contain ${theme === 'light' ? 'scale-125' : ''}`}
                />
              </a>
            </li>

            {user?.role === 'admin' && (
            <li>
              <Link
                href="/admin/dashboard"
                className={`flex items-center py-3 px-3 gap-3 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/dashboard") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/dashboard") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaTachometerAlt className="text-base transition duration-200"/> 
                </div>
                <span className={navTextClass}>Dashboard</span>
              </Link>
            </li>
            )}

            {user?.role === 'admin' && (
            <li>
              <Link
                href="/admin/users"
                className={`flex items-center py-3 px-3 gap-3 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/users") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/users") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaUsers className="text-base transition duration-200" /> 
                </div>
                <span className={navTextClass}>User Data</span>
              </Link>
            </li>
            )}
            {/* Membership Dropdown */}
            {user?.role === 'admin' && (
            <li>
              <button
                className={`flex items-center w-full py-3 px-3 gap-3 text-base transition-all duration-200 rounded-xl font-semibold group ${membershipDropdownOpen ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
                type="button"
                aria-expanded={membershipDropdownOpen}
                aria-controls="membership-dropdown"
                onClick={() => setMembershipDropdownOpen((open) => !open)}
                data-collapse-toggle="membership-dropdown"
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${membershipDropdownOpen ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaIdCard className="text-base transition duration-200" /> 
                </div>
                <span className={`${navTextClass} flex-1 text-left rtl:text-right whitespace-nowrap`}>Membership</span>
                <span className={`w-3 h-3 transition-transform duration-300`}>
                  {membershipDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {membershipDropdownOpen && (
                <ul id="pt-session-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-amber-500/40 dark:border-amber-500/40'}`}>
                  <li>
                    <Link
                      href="/admin/membership/session"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/membership/session") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/membership/session") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaCalendarCheck className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Details</span>
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      href="/admin/membership/plans"
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/membership/plans") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <FaClipboardList className="inline-block transition duration-75 mr-2" /> 
                      <span className={navTextClass}>Plans</span>
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      href="/admin/membership/schedules"
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/membership/schedules") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <FaCalendar className="inline-block transition duration-75 mr-2" /> 
                      <span className={navTextClass}>Schedule</span>
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      href="/admin/membership/transfer"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/membership/transfer") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/membership/transfer") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaExchangeAlt className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Transfer</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/membership/freeze"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/membership/freeze") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/membership/freeze") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaSnowflake className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Freeze</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            )}
            {/* PT Session Dropdown */}
            {user?.role === 'admin' && (
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-3 px-3 gap-3 text-base transition-all duration-200 rounded-xl font-semibold group ${ptDropdownOpen ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
                aria-expanded={ptDropdownOpen}
                aria-controls="pt-session-dropdown"
                onClick={() => setPtDropdownOpen((open) => !open)}
                data-collapse-toggle="pt-session-dropdown"
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${ptDropdownOpen ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaChalkboardTeacher className="text-base transition duration-200" />
                </div>
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>PT Session</span>
                <span className={`${ptDropdownOpen} w-3 h-3 transition-transform duration-300`}>
                  {ptDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {ptDropdownOpen && (
                <ul id="pt-session-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-amber-500/40 dark:border-amber-500/40'}`}>
                  <li>
                    <Link 
                      href="/admin/pt/session" 
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/pt/session") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}>
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/pt/session") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaCalendarCheck className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Details</span>
                    </Link>
                  </li>
                  {/* <li>
                    <Link 
                      href="/admin/pt/plans" 
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/pt/plans") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"} ${isCollapsed ? 'justify-center' : ''}`}>
                      <FaClipboardList className="inline-block transition duration-75 mr-2" />
                      <span className={navTextClass}>Plans</span>
                    </Link>
                  </li> */}
                  <li>
                    <Link 
                      href="/admin/pt/booking" 
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/pt/booking") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}>
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/pt/booking") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaCheckCircle className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Booking</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            )}

            {/* Class Session Dropdown */}
            {user?.role === 'admin' && (
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-3 px-3 gap-3 text-base transition-all duration-200 rounded-xl font-semibold group ${classDropdownOpen ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
                aria-expanded={classDropdownOpen}
                aria-controls="class-session-dropdown"
                onClick={() => setClassDropdownOpen((open) => !open)}
                data-collapse-toggle="class-session-dropdown"
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${classDropdownOpen ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaDumbbell className="text-base transition duration-200" />
                </div>
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>Class Session</span>
                <span className={`${classDropdownOpen} w-3 h-3 transition-transform duration-300`}>
                  {classDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {classDropdownOpen && (
                <ul id="class-session-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-amber-500/40 dark:border-amber-500/40'}`}>
                  <li>
                    <Link
                      href="/admin/class/session"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/class/session") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/class/session") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaCalendarCheck className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Details</span>
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      href="/admin/class/plans"
                      className={`flex items-center w-full p-2 rounded-lg font-semibold transition duration-75 ${pathname.startsWith("/admin/class/plans") ? "bg-amber-300 text-gray-600" : "hover:bg-gray-700 text-amber-300"}`}
                    >
                      <FaClipboardList className="inline-block transition duration-75 mr-2" /> 
                      <span className={navTextClass}>Plans</span>
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      href="/admin/class/attendance"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/class/attendance") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/class/attendance") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaCheckCircle className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Attendance</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class/classpurchase"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/class/classpurchase") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/class/classpurchase") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaShoppingBag className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Class Purchase</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            )}

            {/* Report Dropdown */}
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-3 px-3 gap-3 text-base transition-all duration-200 rounded-xl font-semibold group ${reportDropdownOpen ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
                aria-expanded={reportDropdownOpen}
                aria-controls="report-dropdown"
                onClick={() => setReportDropdownOpen((open) => !open)}
                data-collapse-toggle="report-dropdown"
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${reportDropdownOpen ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaChartLine className="text-base transition duration-200" />
                </div>
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>Reports</span>
                <span className={`${reportDropdownOpen} w-3 h-3 transition-transform duration-300`}>
                  {reportDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {reportDropdownOpen && (
                <ul id="report-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-amber-500/40 dark:border-amber-500/40'}`}>
                  <li>
                    <Link
                      href="/admin/report/revenue"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/report/revenue") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/report/revenue") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaChartLine className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Revenue</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/report/checkin"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/report/checkin") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/report/checkin") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaUserCheck className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Check-in</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/report/membership"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/report/membership") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/report/membership") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaIdCard className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Membership</span>
                    </Link>
                  </li>                                   
                  <li>
                    <Link
                      href="/admin/report/pt-session"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/report/pt-session") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/report/pt-session") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaChalkboardTeacher className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>PT Session</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/report/class"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/report/class") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/report/class") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaDumbbell className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Class</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Schedule Dropdown */}
            {user?.role === 'admin' && (
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-3 px-3 gap-3 text-base transition-all duration-200 rounded-xl font-semibold group ${scheduleDropdownOpen ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
                aria-expanded={scheduleDropdownOpen}
                aria-controls="schedule-dropdown"
                onClick={() => setScheduleDropdownOpen((open) => !open)}
                data-collapse-toggle="schedule-dropdown"
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${scheduleDropdownOpen ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaCalendarAlt className="text-base transition duration-200" />
                </div>
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>Schedule</span>
                <span className={`${scheduleDropdownOpen} w-3 h-3 transition-transform duration-300`}>
                  {scheduleDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {scheduleDropdownOpen && (
                <ul id="schedule-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-amber-500/40 dark:border-amber-500/40'}`}>
                  <li>
                    <Link
                      href="/admin/staff-schedule"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/staff-schedule") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/staff-schedule") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaUserCheck className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Staff Schedule</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class-schedule"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/class-schedule") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/class-schedule") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaDumbbell className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Class Schedule</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            )}

            {/* Settings Dropdown */}
            {user?.role === 'admin' && (
            <li>
              <button
                type="button"
                className={`flex items-center w-full py-3 px-3 gap-3 text-base transition-all duration-200 rounded-xl font-semibold group ${settingsDropdownOpen ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
                aria-expanded={settingsDropdownOpen}
                aria-controls="settings-dropdown"
                onClick={() => setSettingsDropdownOpen((open) => !open)}
                data-collapse-toggle="settings-dropdown"
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${settingsDropdownOpen ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaCog className="text-base transition duration-200" />
                </div>
                <span className={`${navTextClass} flex-1 ms-3 text-left rtl:text-right whitespace-nowrap`}>Settings</span>
                <span className={`${settingsDropdownOpen} w-3 h-3 transition-transform duration-300`}>
                  {settingsDropdownOpen ? (
                    <FaAngleUp />
                  ) : (
                    <FaAngleDown />
                  )}
                </span>
              </button>
              {settingsDropdownOpen && (
                <ul id="settings-dropdown" className={`py-2 space-y-2 ${isCollapsed ? 'pl-0 text-center' : 'pl-6 border-l-2 border-amber-500/40 dark:border-amber-500/40'}`}>
                  <li>
                    <Link
                      href="/admin/membership/plans"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/membership/plans") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/membership/plans") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaIdCard className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Membership Plans</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/pt/plans"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/pt/plans") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/pt/plans") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaChalkboardTeacher className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>PT Plans</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/class/plans"
                      className={`flex items-center w-full py-2.5 px-3 gap-2.5 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/class/plans") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"} ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/class/plans") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                        <FaDumbbell className="text-sm transition duration-200" />
                      </div>
                      <span className={navTextClass}>Class Plans</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            )}

            {/* <li>
              <Link 
                href="/barcode" 
                className="flex items-center py-2 px-4 gap-2 rounded-lg font-semibold hover:bg-gray-700 text-amber-300"
              >
                <FaBarcode className="inline-block transition duration-75" /> 
                <span className={navTextClass}>Scan Barcode</span>
              </Link>
            </li> */}

            {user?.role === 'admin' && (
            <li>
              <Link 
                href="/checkin" 
                className="flex items-center py-3 px-3 gap-3 rounded-xl font-semibold transition-all duration-200 group hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20">
                  <FaBarcode className="text-base transition duration-200" /> 
                </div>
                <span className={navTextClass}>Checkin</span>
              </Link>
            </li>
            )}

            {user?.role === 'admin' && (
            <li>
              <Link 
                href="/admin/history" 
                className={`flex items-center py-3 px-3 gap-3 rounded-xl font-semibold transition-all duration-200 group ${pathname.startsWith("/admin/history") ? "bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400" : "hover:bg-slate-200 dark:hover:bg-gray-700/50 text-slate-700 dark:text-gray-300"}`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${pathname.startsWith("/admin/history") ? "bg-amber-500/20" : "bg-slate-200 dark:bg-gray-700 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/20"}`}>
                  <FaHistory className="text-base transition duration-200" /> 
                </div>
                <span className={navTextClass}>History</span>
              </Link>
            </li>
            )}

          </ul>

          <div className="mt-auto hidden sm:block">
            <button 
                id="sidebar-toggle" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center p-4 text-slate-700 dark:text-amber-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 group"
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
        
      <main className={`flex-1 overflow-x-hidden bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 ease-in-out pt-12 ${isCollapsed ? 'sm:ml-20' : 'sm:ml-64'}`}>{children}</main>
    </div>
  </div>
  </BreadcrumbProvider>
  );
}

// Komponen untuk menampilkan breadcrumb di navbar
function BreadcrumbDisplay() {
  const { breadcrumbItems } = useBreadcrumb();
  
  if (!breadcrumbItems || breadcrumbItems.length === 0) return null;

  return (
    <nav className="hidden sm:flex items-center ml-4" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <div key={index} className="inline-flex items-center">
            {index > 0 && (
              <FaAngleRight className="mx-2 text-gray-400 dark:text-gray-500 text-xs" />
            )}
            
            {item.icon && (
              <span className={isLast ? "text-gray-700 dark:text-amber-400 mr-1.5" : "text-gray-500 dark:text-gray-400 mr-1.5"}>
                {item.icon}
              </span>
            )}
            
            {item.href ? (
              <Link 
                href={item.href} 
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-amber-300 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-800 dark:text-amber-400">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
