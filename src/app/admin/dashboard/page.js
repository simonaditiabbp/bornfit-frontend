'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BackendErrorFallback from '../../../components/BackendErrorFallback';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMember: 0,
    activeMembership: 0,
    inactiveMembership: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    categories: [],
    data: [],
  });
  const [backendError, setBackendError] = useState(false);

  const router = require('next/navigation').useRouter();
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'admin') {
      router.replace('/barcode');
      return;
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Helper fetch with 401 handling
        const fetchWith401 = async (url) => {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.replace('/login');
            // throw new Error('Unauthorized');
          }
          return res.json();
        };
        const [usersRes, membershipsRes, checkinsRes] = await Promise.all([
          fetchWith401(`${API_URL}/api/users`),
          fetchWith401(`${API_URL}/api/memberships`),
          fetchWith401(`${API_URL}/api/checkins`),
        ]);
        const totalUsers = usersRes.length;
        // Total member = user yang punya membership (user_id unik di memberships)
        const memberUserIds = new Set(membershipsRes.map(m => m.user_id));
        const totalMember = memberUserIds.size;
        const activeMembership = membershipsRes.filter(m => m.is_active).length;
        const inactiveMembership = membershipsRes.filter(m => !m.is_active).length;

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
            checkinsRes.filter(c => {
              if (!c.checkin_time) return false;
              // const checkinWIB = dayjs.utc(c.checkin_time).tz('Asia/Jakarta').format('YYYY-MM-DD');
              // return checkinWIB === dateStr;
              const checkinDate = dayjs(c.checkin_time).utc().format('YYYY-MM-DD');
              return checkinDate === dateStr;
            }).map(c => c.user_id)
          ).size;
          data.push(count);
        }
        setStats({ totalUsers, totalMember, activeMembership, inactiveMembership });
        setChartData({ categories, data });
      } catch (err) {
        setStats({ totalUsers: 0, totalMember: 0, activeMembership: 0, inactiveMembership: 0 });
        setChartData({ categories: [], data: [] });
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchStats();
  }, [router]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Dashboard Admin</h1>
      {/* Weekly check-in chart */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-bold text-blue-700">Member Check-ins per Day (Last 7 Days)</div>
        </div>
        <div className="w-full">
            <ApexChart
              type="bar"
              height={320}
              options={{
                chart: { id: 'checkin-bar', toolbar: { show: false } },
                xaxis: { categories: chartData.categories, labels: { style: { fontSize: '14px' } } },
                yaxis: { title: { text: 'Member Checkin' }, labels: { style: { fontSize: '14px' } } },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '40%' } },
                dataLabels: { enabled: true },
                colors: ['#2563eb'],
                grid: { strokeDashArray: 4 },
              }}
              series={[{ name: 'Member Checkin', data: chartData.data }]}
            />
        </div>
      </div>
      {/* 2 card: total user, total member */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368" /></svg>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">Total Users</div>
            <div className="text-3xl font-extrabold text-blue-900">{loading ? '-' : stats.totalUsers}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-3-3h-4a3 3 0 00-3 3v2h5zM9 20H4v-2a3 3 0 013-3h4a3 3 0 013 3v2H9z" /></svg>
          </div>
          <div>
            <div className="text-lg font-bold text-indigo-700">Total Members</div>
            <div className="text-3xl font-extrabold text-indigo-900">{loading ? '-' : stats.totalMember}</div>
          </div>
        </div>
      </div>
      {/* 2 card: aktif & tidak aktif membership */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-yellow-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-700">Active Memberships</div>
            <div className="text-3xl font-extrabold text-yellow-900">{loading ? '-' : stats.activeMembership}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
          </div>
          <div>
            <div className="text-lg font-bold text-red-700">Inactive Memberships</div>
            <div className="text-3xl font-extrabold text-red-900">{loading ? '-' : stats.inactiveMembership}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
