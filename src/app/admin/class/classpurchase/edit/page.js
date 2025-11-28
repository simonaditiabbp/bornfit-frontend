import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPurchaseEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [userId, setUserId] = useState('');
  const [classId, setClassId] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchPurchase = async () => {
      setLoading(true);
      setError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/classpurchases/${id}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setUserId(data.data.user_id);
          setClassId(data.data.class_id);
          setPrice(data.data.price);
          setPurchaseDate(data.data.purchase_date ? data.data.purchase_date.slice(0, 16) : '');
        } else {
          setError(data.message || 'Gagal mengambil data');
        }
      } catch (err) {
        setError('Gagal mengambil data');
      }
      setLoading(false);
    };
    fetchPurchase();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/classpurchases/${id}`, {
        method: 'PUT',
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
        setError(data.message || 'Gagal mengedit purchase');
      }
    } catch (err) {
      setError('Gagal mengedit purchase');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Edit Class Purchase</h1>
      {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">User ID</label>
          <input type="number" className="w-full border rounded-lg p-3 focus:outline-blue-400" value={userId} onChange={e => setUserId(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Class ID</label>
          <input type="number" className="w-full border rounded-lg p-3 focus:outline-blue-400" value={classId} onChange={e => setClassId(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Price</label>
          <input type="number" className="w-full border rounded-lg p-3 focus:outline-blue-400" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div className="mb-8">
          <label className="block mb-2 font-semibold text-gray-700">Purchase Date <span className="text-gray-400">(optional)</span></label>
          <input type="datetime-local" className="w-full border rounded-lg p-3 focus:outline-blue-400" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </div>
        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg" disabled={loading}>{loading ? 'Saving...' : 'Simpan'}</button>
      </form>
    </div>
  );
}
