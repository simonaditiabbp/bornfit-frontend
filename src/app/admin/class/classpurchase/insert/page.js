"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaDumbbell } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';

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
      <PageBreadcrumb
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Purchase', href: '/admin/class/classpurchase' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert title="Create Class Purchase">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create Class Purchase</h1>
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        {fetchingData && <div className="text-amber-400 mb-4 text-center">Loading data...</div>}
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Member Name"
            type="select"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            required
            options={[
              { value: '', label: '-- Select Member --' },
              ...users.map(user => ({ value: user.id, label: `${user.name} (${user.email})` }))
            ]}
          />
          <FormInput
            label="Class Name"
            type="select"
            value={classId}
            onChange={e => setClassId(e.target.value)}
            required
            options={[
              { value: '', label: '-- Select Class --' },
              ...classes.map(cls => ({ value: cls.id, label: `${cls.name} - ${cls.class_date?.slice(0, 10)} ${cls.start_time?.slice(0, 5)}` }))
            ]}
          />
          <FormInput
            label="Price"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
          <FormActions
            onSubmit={handleSubmit}
            onReset={handleReset}
            cancelHref="/admin/class/classpurchase"
            loading={loading || fetchingData}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
