'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BackendErrorFallback from '../../../components/BackendErrorFallback';
import { FaSnowflake } from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/utils/fetchClient';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMember: 0,
    activeMembership: 0,
    freezeMembership: 0,
    inactiveMembership: 0,
    totalPTSessions: 0,
    totalClasses: 0,
    conductPTToday: 0,
    activePTClient: 0,
    inactivePTClient: 0,
  });
  const [actionableLists, setActionableLists] = useState({
    expiringSoon: [],
    recentlyExpired: [],
    inactiveMembers: [],
    newMembers: [],
    memberBirthdays: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    categories: [],
    data: [],
  });
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Use FetchClient with automatic token injection & 401 redirect
        // Fetch ALL data for dashboard (limit set to 9999)
        const [usersRes, membershipsRes, checkinsRes, ptsessionsRes, classesRes, ptBookingsRes, birthdaysRes] = await Promise.all([
          api.get('/api/users?limit=9999'),
          api.get('/api/memberships?limit=9999'),
          api.get('/api/checkins?limit=9999'),
          api.get('/api/personaltrainersessions?limit=9999'),
          api.get('/api/classes/paginated?page=1&limit=9999'),
          api.get('/api/ptsessionbookings?limit=9999'),
          api.get('/api/users/birthday/this-month?limit=10000'),
        ]);
        // Extract data arrays from responses
        const users = usersRes.data?.users || [];
        const memberships = membershipsRes.data?.memberships || [];
        const checkins = checkinsRes || [];
        const ptSessions = ptsessionsRes.data?.sessions || [];
        const ptBookings = ptBookingsRes.data?.bookings || [];
        const birthdays = birthdaysRes.data?.users || [];

        const totalUsers = usersRes.data?.total || users.length;
        // Total member = user yang punya membership (user_id unik di memberships)
        const memberUserIds = new Set(memberships.map(m => m.user_id));
        const totalMember = memberUserIds.size;
        const activeMembership = memberships.filter(m => m.is_active && m.status.toLowerCase() == "active").length;
        const freezeMembership = memberships.filter(m => m.is_active && m.status.toLowerCase() == "frozen").length;
        const inactiveMembership = memberships.filter(m => !m.is_active).length;
        const totalPTSessions = ptSessions.length;
        const totalClasses = classesRes.data?.total || 0;
        // PT Metrics
        const todayStr = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const conductPTToday = ptBookings.filter(b => {
          if (!b.booking_time || b.status === 'cancelled') return false;
          const bookingDate = dayjs(b.booking_time).utc().format('YYYY-MM-DD');
          // console.log("bookingDate: ", bookingDate, " | todayStr:", todayStr)
          return bookingDate === todayStr;
        }).length;

        // Active PT Client: user_member_id unik yang punya booking status != cancelled
        const activePTClientIds = new Set(
          ptSessions
            .filter(b => b.status !== 'cancelled' && b.user_member?.id)
            .map(b => b.user_member?.id)
        );
        const activePTClient = activePTClientIds.size;

        // Inactive PT Client: user yang punya PT session tapi tidak punya booking aktif
        const allPTClientIds = new Set(
          ptSessions
            .filter(s => s.user_member_id)
            .map(s => s.user_member_id)
        );
        const inactivePTClient = allPTClientIds.size - activePTClient;

        // Grafik checkin 7 hari terakhir (WIB)
        const today = dayjs().tz('Asia/Jakarta');
        const categories = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
          const d = today.subtract(i, 'day');
          const label = d.format('ddd, DD/MM');
          const dateStr = d.format('YYYY-MM-DD');
          categories.push(label);
          // Hitung jumlah user unik yang checkin di tanggal ini
          const count = new Set(
            checkins.filter(c => {
              if (!c.checkin_time) return false;
              // const checkinWIB = dayjs.utc(c.checkin_time).tz('Asia/Jakarta').format('YYYY-MM-DD');
              // return checkinWIB === dateStr;
              const checkinDate = dayjs(c.checkin_time).utc().format('YYYY-MM-DD');
              return checkinDate === dateStr;
            }).map(c => c.user_id)
          ).size;
          data.push(count);
        }
        // Actionable Lists for Sales
        const now = dayjs().tz('Asia/Jakarta');
        
        // 1. Expiring Soon (7-14 days)
        const expiringSoon = memberships
          .filter(m => {
            if (!m.is_active || m.status.toLowerCase() !== 'active' || !m.end_date) return false;
            const daysUntilExpiry = dayjs(m.end_date).diff(now, 'day');
            return daysUntilExpiry >= 7 && daysUntilExpiry <= 14;
          })
          .map(m => ({
            userId: m.user_id,
            userName: m.user?.name || 'N/A',
            userPhone: m.user?.phone || 'N/A',
            endDate: m.end_date,
            daysLeft: dayjs(m.end_date).diff(now, 'day'),
            planName: m.membershipPlan?.name || 'N/A'
          }))
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 10);

        // 2. Recently Expired (1-7 days ago)
        const recentlyExpired = memberships
          .filter(m => {
            if (!m.end_date) return false;
            const daysUntilExpiry = dayjs(m.end_date).diff(now, 'day');
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
          })
          .map(m => ({
            userId: m.user_id,
            userName: m.user?.name || 'N/A',
            userPhone: m.user?.phone || 'N/A',
            endDate: m.end_date,
            daysAgo: now.diff(dayjs(m.end_date), 'day'),
            planName: m.membershipPlan?.name || 'N/A'
          }))
          .sort((a, b) => a.daysAgo - b.daysAgo)
          .slice(0, 10);

        // 3. Inactive Members (tidak checkin 30 hari, membership aktif)
        const thirtyDaysAgo = now.subtract(30, 'day');
        const recentCheckins = new Set(
          checkins
            .filter(c => dayjs(c.checkin_time).isAfter(thirtyDaysAgo))
            .map(c => c.user_id)
        );
        const inactiveMembers = memberships
          .filter(m => {
            return m.is_active && 
                   m.status.toLowerCase() === 'active' && 
                   !recentCheckins.has(m.user_id);
          })
          .map(m => ({
            userId: m.user_id,
            userName: m.user?.name || 'N/A',
            userPhone: m.user?.phone || 'N/A',
            planName: m.membershipPlan?.name || 'N/A',
            startDate: m.start_date
          }))
          .slice(0, 10);

        // 4. New Members This Month
        const startOfMonth = now.startOf('month');
        const newMembers = memberships
          .filter(m => {
            return m.start_date && dayjs(m.start_date).isAfter(startOfMonth);
          })
          .map(m => ({
            userId: m.user_id,
            userName: m.user?.name || 'N/A',
            userPhone: m.user?.phone || 'N/A',
            planName: m.membershipPlan?.name || 'N/A',
            startDate: m.start_date
          }))
          .sort((a, b) => dayjs(b.startDate).diff(dayjs(a.startDate)))
          .slice(0, 10);

        const memberBirthdays = birthdays.map(user => ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          birthday: user.date_of_birth,
          email: user.email,
        }));

        setStats({ totalUsers, totalMember, activeMembership, freezeMembership, inactiveMembership, totalPTSessions, totalClasses, conductPTToday, activePTClient, inactivePTClient });
        setActionableLists({ expiringSoon, recentlyExpired, inactiveMembers, newMembers, memberBirthdays });
        setChartData({ categories, data });
      } catch (err) {
        setStats({ totalUsers: 0, totalMember: 0, activeMembership: 0, freezeMembership: 0, inactiveMembership: 0, totalPTSessions: 0, totalClasses: 0, conductPTToday: 0, activePTClient: 0, inactivePTClient: 0 });
        setChartData({ categories: [], data: [] });
        setBackendError(true);
        // console.log("error: ", err)
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div className="p-5 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-6 mb-8">
        <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-300">Dashboard</h1>
      </div> */}

      {/* Weekly check-in chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 mb-5">
        <div className="mb-4 flex items-center justify-between">
          <div className={`text-lg font-bold ${theme === 'dark' ? 'text-amber-700' : 'text-gray-800'} dark:text-amber-200`}>Member Check-ins per Day (Last 7 Days)</div>
        </div>
        <div className="w-full">
            <ApexChart
              type="bar"
              height={320}
              options={{
                chart: { 
                  id: 'checkin-bar', 
                  toolbar: { show: false },
                  background: 'transparent'
                },
                theme: {
                  mode: theme === 'dark' ? 'dark' : 'light'
                },
                xaxis: { 
                  categories: chartData.categories, 
                  labels: { 
                    style: { 
                      fontSize: '14px', 
                      colors: theme === 'dark' ? '#fef3c7' : 'bg-gray-800'
                    } 
                  }
                },
                yaxis: { 
                  title: { 
                    text: 'Member Checkin',
                    style: {
                      color: theme === 'dark' ? '#fef3c7' : 'bg-gray-800'
                    }
                  }, 
                  labels: { 
                    style: { 
                      fontSize: '14px', 
                      colors: theme === 'dark' ? '#fef3c7' : 'bg-gray-800'
                    } 
                  }
                },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '40%' } },
                dataLabels: { 
                  enabled: true,
                  style: {
                    colors: [theme === 'dark' ? '#1f2937' : '#ffffff']
                  }
                },
                colors: [theme === 'dark' ? '#fbbf24' : 'bg-gray-800'],
                grid: { 
                  strokeDashArray: 4,
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                },
              }}
              series={[{ name: 'Member Checkin', data: chartData.data }]}
            />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 mt-5">
        {/* ================= LEFT SIDE (6 SMALL CARDS) ================= */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mt-7">
          {/* Active Membership */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-yellow-100 dark:bg-gray-300 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                className="w-10 h-10 text-yellow-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Active Memberships
              </div>
              <div className="text-3xl font-extrabold text-yellow-600">
                {loading ? "-" : stats.activeMembership}
              </div>
            </div>
          </div>

          {/* Freeze Membership */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-gray-300 rounded-full p-3">
              <FaSnowflake size={40} className="text-blue-500" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Freeze Memberships
              </div>
              <div className="text-3xl font-extrabold text-blue-500">
                {loading ? "-" : stats.freezeMembership}
              </div>
            </div>
          </div>

          {/* Expired Membership */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-red-100 dark:bg-gray-300 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                stroke="currentColor" className="w-10 h-10 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M10 9v6m4-6v6M12 3a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Expired / Inactive Memberships
              </div>
              <div className="text-3xl font-extrabold text-red-600">
                {loading ? "-" : stats.inactiveMembership}
              </div>
            </div>
          </div>

          {/* Conduct PT Today */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-green-100 dark:bg-gray-300 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                stroke="currentColor" className="w-10 h-10 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Conduct PT Today
              </div>
              <div className="text-3xl font-extrabold text-green-600">
                {loading ? "-" : stats.conductPTToday}
              </div>
            </div>
          </div>

          {/* Active PT Client */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-amber-100 dark:bg-gray-300 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                className="w-10 h-10 text-amber-600">
                <rect x="5" y="11" width="14" height="2" rx="0.5" />
                <circle cx="4" cy="12" r="3" />
                <circle cx="20" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Active PT Client
              </div>
              <div className="text-3xl font-extrabold text-amber-600">
                {loading ? "-" : stats.activePTClient}
              </div>
            </div>
          </div>

          {/* Inactive PT Client */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-300 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                stroke="currentColor" className="w-10 h-10 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Inactive PT Client
              </div>
              <div className="text-3xl font-extrabold text-gray-600">
                {loading ? "-" : stats.inactivePTClient}
              </div>
            </div>
          </div>

        </div>
        {/* ================= RIGHT SIDE (BIG CARD) ================= */}
        <div className="lg:col-span-1 lg:row-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              🎉 Member birthday this month
            </h3>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
              {loading ? "-" : actionableLists.memberBirthdays.length}
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Loading...
              </p>
            ) : actionableLists.memberBirthdays.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No members with birthdays this month
              </p>
            ) : (
              actionableLists.memberBirthdays.map((member, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {dayjs(member.birthday).format("DD MMM YYYY")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.email ? `${member.email}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Actionable Lists for Sales Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
        {/* Expiring Soon */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">⚠️ Expiring Soon (7-14 days)</h3>
            <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-semibold">
              {actionableLists.expiringSoon.length}
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading...</p>
            ) : actionableLists.expiringSoon.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No memberships expiring soon</p>
            ) : (
              actionableLists.expiringSoon.map((member, idx) => (
                <div key={idx} className="bg-orange-50 dark:bg-gray-700 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{member.userName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.userPhone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{member.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{member.daysLeft} days</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dayjs(member.endDate).format('DD MMM YYYY')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Expired */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">🚨 Recently Expired (1-7 days)</h3>
            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-semibold">
              {actionableLists.recentlyExpired.length}
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading...</p>
            ) : actionableLists.recentlyExpired.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recently expired memberships</p>
            ) : (
              actionableLists.recentlyExpired.map((member, idx) => (
                <div key={idx} className="bg-red-50 dark:bg-gray-700 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{member.userName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.userPhone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{member.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{member.daysAgo * -1} days</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dayjs(member.endDate).format('DD MMM YYYY')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inactive Members */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">😴 Inactive Members (30+ days)</h3>
            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
              {actionableLists.inactiveMembers.length}
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading...</p>
            ) : actionableLists.inactiveMembers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">All members are active!</p>
            ) : (
              actionableLists.inactiveMembers.map((member, idx) => (
                <div key={idx} className="bg-yellow-50 dark:bg-gray-700 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{member.userName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.userPhone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{member.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">No check-in</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">30+ days</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Members */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400">🎉 New Members This Month</h3>
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
              {actionableLists.newMembers.length}
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading...</p>
            ) : actionableLists.newMembers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No new members this month</p>
            ) : (
              actionableLists.newMembers.map((member, idx) => (
                <div key={idx} className="bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{member.userName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.userPhone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{member.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">{dayjs(member.startDate).format('DD MMM YYYY')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>      
    </div>
  );
}
