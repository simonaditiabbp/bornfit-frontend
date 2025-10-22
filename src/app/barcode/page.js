'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Html5Qrcode } from 'html5-qrcode';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BarcodePage() {
  const [user, setUser] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' | 'error'
  const [scanner, setScanner] = useState(null);
  const [manualQr, setManualQr] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    // if (!userData) {
    //   router.replace('/login');
    //   return;
    // }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    // Proteksi: hanya member bisa akses barcode
    // if (userObj.role !== 'member') {
    //   router.replace('/dashboard');
    // }
  }, [router]);

  useEffect(() => {
    if (scanMode && !scanner) {
      // Pastikan elemen sudah ada sebelum inisialisasi scanner
      setTimeout(() => {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            // console.log('QR decoded:', decodedText);
            setManualQr(decodedText); // tampilkan hasil scan ke input manual
            if (!loading) {
              setLoading(true);
              setMessage('');
              setMessageType('success');
              try {
                const res = await fetch(`${API_URL}/api/checkins`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ qr_code: decodedText }),
                });
                const result = await res.json();
                if (res.status === 201) {
                  setMessage(result.message);
                  setMessageType('success');
                } else {
                  setMessage(result.message || 'Check-in gagal');
                  setMessageType('error');
                }
              } catch (err) {
                setMessage('Terjadi kesalahan saat check-in');
                setMessageType('error');
              } finally {
                setLoading(false);
                setScanMode(false);
                html5QrCode.stop();
                setScanner(null);
              }
            }
          },
          (errorMessage) => {
            setMessage('Gagal membaca QR code. Pastikan kamera tidak digunakan aplikasi lain, atau klik Retry.');
            // Jangan tutup kamera, biarkan user retry
          }
        );
        setScanner(html5QrCode);
      }, 300); // delay agar div sudah ter-render
    }
    return () => {
      if (scanner) {
        try {
          scanner.stop();
        } catch (e) {
          // ignore error jika scanner sudah tidak aktif
        }
        setScanner(null);
      }
    };
  }, [scanMode]);

  // if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700 drop-shadow">Scan QRCode Member</h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg text-center border border-blue-200">
        {/* <p className="mb-2 text-lg">Halo, <span className="font-bold text-blue-700">{user.name}</span></p> */}
        {/* <p className="mb-6 text-base">QR Code Anda: <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{user.qr_code}</span></p> */}
        {!scanMode && (
          <>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-xl font-bold mb-6 shadow hover:scale-105 transition-transform duration-200"
              onClick={() => { setScanMode(true); setMessage(''); }}
              disabled={loading}
            >
              <span className="inline-block align-middle mr-2">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-camera"><rect x="3" y="7" width="18" height="13" rx="2" ry="2"/><circle cx="12" cy="15" r="3"/><path d="M5 7V5a2 2 0 0 1 2-2h2"/></svg>
              </span>
              Check-in
            </button>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Input QR code manual"
                className="w-full p-3 border-2 border-blue-300 rounded-xl mt-2 text-lg tracking-widest text-center focus:outline-blue-500"
                value={manualQr}
                onChange={async (e) => {
                  const value = e.target.value;
                  setManualQr(value);
                  if (value) {
                    setLoading(true);
                    setMessage('');
                    setMessageType('success');
                    try {
                      const res = await fetch(`${API_URL}/api/checkins`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ qr_code: value }),
                      });
                      const result = await res.json();
                      if (res.status === 201) {
                        setMessage(result.message);
                        setMessageType('success');
                      } else {
                        setMessage(result.message || 'Check-in gagal');
                        setMessageType('error');
                      }
                    } catch (err) {
                      setMessage('Terjadi kesalahan saat check-in');
                      setMessageType('error');
                    } finally {
                      setLoading(false);
                      setManualQr('');
                    }
                  }
                }}
                disabled={loading}
              />
              <div className="text-xs text-blue-500 mt-1">QR code bisa diinput manual jika scanner bermasalah</div>
            </div>
          </>
        )}
        {scanMode && (
          <div className="mb-6 flex flex-col items-center justify-center">
            <div
              id="qr-reader"
              style={{ width: '340px', height: '340px', margin: '0 auto', borderRadius: '1.5rem', border: '4px solid #3b82f6', boxShadow: '0 0 24px #3b82f6a0', position: 'relative', overflow: 'hidden' }}
              className="animate-pulse"
            />
            <div className="flex gap-4 justify-center mt-4">
              <button
                className="bg-gray-400 text-white px-5 py-2 rounded-xl font-semibold shadow hover:bg-gray-500"
                onClick={() => {
                  setMessage('');
                  if (scanner) {
                    try {
                      scanner.stop();
                    } catch (e) {}
                    setScanner(null);
                  }
                  setScanMode(false);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:bg-blue-700"
                onClick={() => {
                  setMessage('');
                  if (scanner) {
                    try {
                      scanner.stop();
                    } catch (e) {}
                    setScanner(null);
                  }
                  setScanMode(false);
                  setTimeout(() => setScanMode(true), 200);
                }}
                disabled={loading}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className={`mt-6 font-bold text-lg ${messageType === 'error' ? 'text-red-600' : 'text-green-600'} drop-shadow`}>{message}</div>
        )}
      </div>
    </div>
  );
}
