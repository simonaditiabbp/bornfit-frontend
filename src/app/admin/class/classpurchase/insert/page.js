"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaFileInvoice, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPurchaseInsertPage() {
  const searchParams = useSearchParams();
  const initialFormState = {
    userId: '',
    classId: '',
    price: ''
  };
  
  const [userId, setUserId] = useState('');
  const [classId, setClassId] = useState('');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [price, setPrice] = useState('');
  // const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleReset = () => {
    setUserId('');
    setClassId('');
    setPrice('');
    setError('');
  };

  // Fetch all users
  const fetchUsers = async () => {
    setFetchingData(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data?.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setFetchingData(false);
  };

  // Fetch all classes
  const fetchClasses = async () => {
    setFetchingData(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.data?.classes || []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
    setFetchingData(false);
  };

  // Load data on mount
  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  // Auto-select dari query parameters
  useEffect(() => {
    const userIdParam = searchParams.get('user_id');
    const classIdParam = searchParams.get('class_id');
    
    if (userIdParam) setUserId(userIdParam);
    if (classIdParam) setClassId(classIdParam);
  }, [searchParams]);

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
          // ...(purchaseDate ? { purchase_date: purchaseDate } : {})
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
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaFileInvoice className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <Link href="/admin/class/classpurchase" className="text-gray-400 hover:text-amber-300 transition-colors">
          Class Purchases
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Create</span>
      </div>

      <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Tambah Class Purchase</h1>
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        {fetchingData && <div className="text-amber-400 mb-4 text-center">Loading data...</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-1 text-gray-200">Member Name</label>
            <select 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400" 
              value={userId} 
              onChange={e => setUserId(e.target.value)} 
              required
            >
              <option value="">-- Select Member --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block mb-1 text-gray-200">Class Name</label>
            <select 
              className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400" 
              value={classId} 
              onChange={e => setClassId(e.target.value)} 
              required
            >
              <option value="">-- Select Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.class_date?.slice(0, 10)} {cls.start_time?.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block mb-1 text-gray-200">Price</label>
            <input type="number" className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          {/* <div className="mb-8">
            <label className="block mb-1 text-gray-200">Purchase Date <span className="text-gray-400">(optional)</span></label>
            <input type="datetime-local" className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div> */}
          <div className="flex gap-3 mt-8 justify-start">
            <button type="submit" className="bg-amber-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500 transition" disabled={loading || fetchingData}>
              {loading ? 'Saving...' : 'Submit'}
            </button>
            <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition" onClick={() => router.push('/admin/class/classpurchase')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
