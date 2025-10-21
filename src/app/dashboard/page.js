'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    checkinToday: 0,
    activeMembership: 0,
    inactiveMembership: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Ambil user info dari localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    // Proteksi akses: hanya admin & opscan
    if (userObj.role !== 'admin' && userObj.role !== 'opscan') {
      router.replace('/barcode');
      return;
    }

    // Fetch statistik dashboard
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, membershipsRes, checkinsRes] = await Promise.all([
          fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${API_URL}/api/memberships`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${API_URL}/api/checkins`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
        // Total user
        const totalUsers = usersRes.length;
        // Membership aktif/tidak aktif
        const activeMembership = membershipsRes.filter(m => m.is_active).length;
        const inactiveMembership = membershipsRes.filter(m => !m.is_active).length;
        // Checkin hari ini (WIB)
        const todayWIB = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const checkinToday = checkinsRes.filter(c => {
          if (!c.checkin_time) return false;
          // Pastikan waktu checkin diubah ke WIB
          const checkinWIB = dayjs.utc(c.checkin_time).tz('Asia/Jakarta').format('YYYY-MM-DD');
          return checkinWIB === todayWIB;
        }).length;
        setStats({ totalUsers, checkinToday, activeMembership, inactiveMembership });
      } catch (err) {
        setStats({ totalUsers: 0, checkinToday: 0, activeMembership: 0, inactiveMembership: 0 });
      }
      setLoading(false);
    };
    fetchStats();
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <p className="mb-2">Selamat datang, <span className="font-semibold">{user.name}</span>!</p>
        <p className="mb-2">Role: <span className="font-semibold">{user.role}</span></p>
        <p className="mb-2">Email: <span className="font-semibold">{user.email}</span></p>
        {/* Statistik dashboard */}
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-blue-700">Total User</div>
              <div className="text-2xl font-extrabold text-blue-900">{loading ? '-' : stats.totalUsers}</div>
            </div>
            <span className="text-blue-400 text-4xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368" /></svg></span>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-green-700">User Checkin Hari Ini</div>
              <div className="text-2xl font-extrabold text-green-900">{loading ? '-' : stats.checkinToday}</div>
            </div>
            <span className="text-green-400 text-4xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg></span>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-yellow-700">User Aktif Membership</div>
              <div className="text-2xl font-extrabold text-yellow-900">{loading ? '-' : stats.activeMembership}</div>
            </div>
            <span className="text-yellow-400 text-4xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg></span>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-red-700">User Tidak Aktif Membership</div>
              <div className="text-2xl font-extrabold text-red-900">{loading ? '-' : stats.inactiveMembership}</div>
            </div>
            <span className="text-red-400 text-4xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg></span>
          </div>
        </div>
      </div>
    </div>
  );
}
