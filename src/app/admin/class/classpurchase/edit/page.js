"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaDumbbell } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput, ActionButton } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassPurchaseEditPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const [userId, setUserId] = useState('');
  const [classId, setClassId] = useState('');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [price, setPrice] = useState('');
  // const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');

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

  // Load users and classes on mount
  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  useEffect(() => {
    console.log("MASUK")
    console.log("PARAMS: ", params)
    if (!id) return;
    console.log("MASUK 2")
    const fetchPurchase = async () => {
      console.log("MASUK 3")
      setLoading(true);
      setError('');
      try {
        console.log("MASUK 4")
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/classpurchases/${id}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setUserId(data.data.user_id);
          setClassId(data.data.class_id);
          setPrice(data.data.price);
          // setPurchaseDate(data.data.purchase_date ? data.data.purchase_date.slice(0, 16) : '');
        } else {
          setError(data.message || 'Gagal mengambil data');
        }
      } catch (err) {
        setError('Gagal mengambil data');
      }
      setLoading(false);
    };
    fetchPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // ...(purchaseDate ? { purchase_date: purchaseDate } : {})
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
    <div>
      <PageBreadcrumb
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Purchase', href: '/admin/class/classpurchase' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Class Purchase Details</h1>
          <ActionButton
            variant="gray"
            href="/admin/class/classpurchase"
          >
            Back
          </ActionButton>
        </div>     
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
            onCancel={() => router.push('/admin/class/classpurchase')}
            loading={loading || fetchingData}
            showReset={false}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
