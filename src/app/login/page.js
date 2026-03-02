'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import BackendErrorFallback from '../../components/BackendErrorFallback';
import { useTheme } from '@/contexts/ThemeContext';
import logoDark from '@/assets/logodark.png';
import bgLogin from '@/assets/bg-login.jpg';
import { Dumbbell, Mail, Lock, Loader2, ArrowRight, LogIn, ChevronRight, Eye, EyeOff } from 'lucide-react';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [backendError, setBackendError] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (user.role === 'finance') {
          router.replace('/admin/report/revenue');
        } else if (user.role === 'trainer') {
          router.replace('/trainer/dashboard');
        } else if (user.role === 'instructor') {
          router.replace('/instructor/dashboard');
        } else if (user.role === 'member') {
          router.replace('/member/dashboard');
        } else if (user.role === 'opscan') {
          router.replace('/checkin');
        }
      } catch (err) {
        // Invalid user data, stay on login
      }
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
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, latitude, longitude }),
      });
      const dataRes = await res.json();
      
      // Handle error responses dengan message spesifik
      if (!res.ok) {
        // Handle rate limiting (429 Too Many Requests)
        if (res.status === 429) {
          const remainingTime = dataRes.data?.remainingTime;
          if (remainingTime) {
            toast.error(`Account/IP locked due to too many failed attempts. Please try again in ${remainingTime} minutes.`, { duration: 5000 });
          } else {
            toast.error(dataRes.message || 'Too many requests. Please try again later.', { duration: 4000 });
          }
        }
        // Error dari backend (404, 401, 403, dll)
        else if (res.status === 404) {
          const remaining = dataRes.data?.remainingAttempts;
          if (remaining !== undefined && remaining > 0) {
            toast.error(`User not found. Please re-check your input email. ${remaining} attempts remaining.`, { duration: 4000 });
          } else if (remaining === 0) {
            toast.error('User not found. Your account has been locked due to too many failed attempts.', { duration: 5000 });
          } else {
            toast.error('User not found. Please re-check your input email.', { duration: 4000 });
          }
        } else if (res.status === 401) {
          const remaining = dataRes.data?.remainingAttempts;
          if (remaining !== undefined && remaining > 0) {
            toast.error(`Incorrect password. Please try again. ${remaining} attempts remaining.`, { duration: 4000 });
          } else if (remaining === 0) {
            toast.error('Incorrect password. Your account has been locked due to too many failed attempts.', { duration: 5000 });
          } else {
            toast.error('Incorrect password. Please try again.', { duration: 4000 });
          }
        } else if (res.status === 403) {
          toast.error('Access denied. Only admin, opscan, trainer, instructor, member & finance can login.', { duration: 4000 });
        } else {
          toast.error(dataRes.message || 'Login failed. Please try again.', { duration: 4000 });
        }
        setLoading(false);
        return;
      }
      
      const data = dataRes.data;
      
      // Simpan token dan user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Clear session flags on successful login
      sessionStorage.removeItem('session_expired_toast');
      sessionStorage.removeItem('auth_error_toast');
      
      toast.success('Login successful! Redirecting...');
      
      setTimeout(() => {
        if (data.user.role === "admin") {
          router.push('/admin/dashboard');
        } else if (data.user.role === "finance") {
          router.push('/admin/report/revenue');
        } else if (data.user.role === "trainer") {
          router.push('/trainer/dashboard');
        } else if (data.user.role === "instructor") {
          router.push('/instructor/dashboard');
        } else if (data.user.role === "member") {
          router.push('/member/dashboard');
        } else if (data.user.role === "opscan") {
          router.push('/checkin');
        }
      }, 1000);
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
    // min-h-screen memastikan container setidaknya setinggi layar
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-950 font-sans">
      
      {/* --- SISI KIRI: FULL IMAGE --- */}
      {/* Kita hapus h-screen dan gunakan w-1/2 yang otomatis stretch mengikuti flex parent */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src={bgLogin}
          alt="Gym Interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradien agar transisi ke hitam di sisi kanan terlihat halus (seamless) */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 dark:to-gray-950" />
      </div>

      {/* --- SISI KANAN: FORM LOGIN --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 md:px-20 py-12 relative bg-gray-50 dark:bg-gray-950">
        
        {/* Dekorasi Glow Halus */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 dark:bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md space-y-12 z-10">
          
          {/* LOGO & JUDUL */}
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative w-48 h-36">
              <Image
                src={theme === 'dark' ? "/logo.svg" : logoDark}
                alt="BornFit Logo"
                fill
                className={`object-contain ${theme === 'light' ? 'scale-130' : ''}`}
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome Back</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Enter your credentials to access your dashboard.</p>
            </div>
          </div>

          {/* FORMULIR */}
          <form onSubmit={handleSubmit} className="space-y-8">
            

            <div className="space-y-6">
              
              {/* Input Email */}
              <div className="group space-y-2">
                <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 dark:text-gray-500 group-focus-within:text-amber-500 dark:group-focus-within:text-amber-400 transition-colors duration-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-2xl pl-14 pr-6 py-5 outline-none focus:border-amber-500 transition-all duration-300 text-lg"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="group space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs text-gray-600 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 dark:text-gray-500 group-focus-within:text-amber-500 dark:group-focus-within:text-amber-400 transition-colors duration-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-2xl pl-14 pr-14 py-5 outline-none focus:border-amber-500 transition-all duration-300 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white dark:text-gray-950 font-extrabold text-lg py-5 rounded-2xl transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-gray-800 dark:text-white" />
                    <span className="text-gray-800 dark:text-white">Loading</span>
                  </>
                ) : (
                  <>
                    <span className='text-gray-800 dark:text-white'>LOG IN TO ACCOUNT</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform text-gray-800 dark:text-white" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Footer */}
          <div className="pt-4 text-center">
             <p className="text-gray-600 dark:text-gray-400">
                Don&apos;t have an account? <a href="#" className="text-gray-900 dark:text-white font-bold hover:text-amber-500 dark:hover:text-amber-400 transition-all">Sign up</a>
             </p>
          </div>
        </div>

        {/* Watermark Bornfit */}
        <div className="absolute bottom-6 text-gray-200 dark:text-gray-900 font-black text-7xl select-none opacity-20 tracking-tighter pointer-events-none uppercase">
          Bornfit
        </div>
      </div>

    </div>
  );
}
