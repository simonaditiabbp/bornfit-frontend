'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BackendErrorFallback from '../../components/BackendErrorFallback';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/admin/dashboard');
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        (err) => {
          setLatitude(null);
          setLongitude(null);
        }
      );
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, latitude, longitude }),
      });
      const dataRes = await res.json();
      
      // Handle error responses dengan message spesifik
      if (!res.ok) {
        // Error dari backend (404, 401, 403, dll)
        if (res.status === 404) {
          setError(`User not found. \n Please re-check your input email.`);
        } else if (res.status === 401) {
          setError('Incorrect password. Please try again.');
        } else if (res.status === 403) {
          setError('Access denied. Only admin & opscan can login.');
        } else {
          setError(dataRes.message || 'Login failed. Please try again.');
        }
        setLoading(false);
        return;
      }
      
      const data = dataRes.data;
      
      // Simpan token dan user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === "admin") {
        router.push('/admin/dashboard');
      } else if (data.user.role === "opscan") {
        router.push('/checkin');
      }
    } catch (err) {
      // Network error atau backend tidak bisa diakses
      console.error('Login error:', err);
      setBackendError(true);
    }
    setLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
  <div className="bg-gray-50 dark:bg-gray-900 relative items-center justify-center min-h-screen w-full overflow-hidden">
    
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-100">
      <Image
          src={"./oooscillate.svg"}
          alt="Graphic"
          width={128}
          height={128}
          className="w-full h-full object-cover"
        />
    </div>

    <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 gap-8">
      <div className="animate-fade-in-down">
        <Image
          src={"./logo.svg"}
          alt="BornFit Logo"
          width={128}
          height={128}
          className="w-34 h-34"
        />
      </div>

      <div className="bg-white/30 dark:bg-white/15 backdrop-blur-lg border border-gray-200 dark:border-white/30 p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-amber-600 dark:text-amber-300 mb-6">
          Sign in
        </h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-2 mb-4 rounded text-center border border-red-200 dark:border-red-700" style={{whiteSpace: "pre-line"}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-800 dark:text-amber-300 font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border border-gray-300 dark:border-amber-100 bg-white dark:bg-transparent text-gray-800 dark:text-amber-300 placeholder:text-gray-400 dark:placeholder:text-amber-300/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-800 dark:text-amber-300 font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-amber-100 bg-white dark:bg-transparent text-gray-800 dark:text-amber-300 placeholder:text-gray-400 dark:placeholder:text-amber-300/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-300 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-yellow-300 dark:to-amber-100 border border-transparent hover:border-amber-600 dark:hover:border-amber-500 text-white dark:text-gray-800 font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  </div>
);

}
