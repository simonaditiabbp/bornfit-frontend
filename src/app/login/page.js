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
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, latitude, longitude }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login gagal');
      // Simpan token dan user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.role == "admin") {
        router.push('/admin/dashboard');
      }
      if (data.user.role == "opscan") {
        router.push('/barcode');
      }
    } catch (err) {
      setBackendError(true);
    }
    setLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
  <div className="bg-gray-900 relative items-center justify-center min-h-screen w-full overflow-hidden">
    
    <div className="absolute inset-0 z-0 pointer-events-none">
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

      <div className="bg-white/15 backdrop-blur-lg border border-white/30 p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-amber-300 mb-6">
          Sign in
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-300 font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border border-amber-100 text-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-0 focus:border-amber-300"
            />
          </div>

          <div>
            <label className="block text-amber-300 font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-amber-100 text-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-0 focus:border-amber-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-yellow-300 to-amber-100 border border-transparent hover:border-amber-500 text-gray-800 font-semibold py-2 rounded-lg"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  </div>
);

}
