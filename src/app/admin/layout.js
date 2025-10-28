'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

export default function AdminLayout({ children }) {
  const router = useRouter();

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
  //       });

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
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-blue-700 text-white flex flex-col py-8 px-4 shadow-lg">
        <div className="mb-8 text-2xl font-extrabold tracking-wide text-center">BornFit Admin</div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link href="/admin/dashboard" className="block py-2 px-4 rounded hover:bg-blue-600 font-semibold">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-blue-600 font-semibold">Data User</Link>
            </li>
            <li>
              <Link href="/admin/users/create" className="block py-2 px-4 rounded hover:bg-blue-600 font-semibold">Buat User Baru</Link>
            </li>
            <li>
              <Link href="/barcode" className="block py-2 px-4 rounded hover:bg-blue-600 font-semibold">Scan Barcode</Link>
            </li>
            {/* Tambah menu lain di sini */}
          </ul>
        </nav>
        <button
          className="mt-8 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-bold shadow"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
