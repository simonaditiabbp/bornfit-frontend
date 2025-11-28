"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPurchaseInsertPage() {
  const [userId, setUserId] = useState('');
  const [classId, setClassId] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/classpurchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: parseInt(userId, 10),
          class_id: parseInt(classId, 10),
          price: parseInt(price, 10),
          ...(purchaseDate ? { purchase_date: purchaseDate } : {})
        })
      });
      if (res.ok) {
        router.push('/admin/class/classpurchase');
      } else {
        const data = await res.json();
        setError(data.message || 'Gagal menambah purchase');
      }
    } catch (err) {
      setError('Gagal menambah purchase');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Tambah Class Purchase</h1>
      {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block mb-1">User ID</label>
          <input type="number" className="w-full border border-gray-300 p-2 rounded" value={userId} onChange={e => setUserId(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Class ID</label>
          <input type="number" className="w-full border border-gray-300 p-2 rounded" value={classId} onChange={e => setClassId(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Price</label>
          <input type="number" className="w-full border border-gray-300 p-2 rounded" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div className="mb-8">
          <label className="block mb-1">Purchase Date <span className="text-gray-400">(optional)</span></label>
          <input type="datetime-local" className="w-full border border-gray-300 p-2 rounded" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </div>
        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg" disabled={loading}>{loading ? 'Saving...' : 'Simpan'}</button>
      </form>
    </div>
  );
}
