"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaDumbbell } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';

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
      const data = await api.get('/api/users?role=member&limit=10000');
      setUsers(data.data?.users || []);
    } catch (err) {
      // Silently fail - dropdown will be empty
    }
    setFetchingData(false);
  };

  // Fetch all classes
  const fetchClasses = async () => {
    setFetchingData(true);
    try {
      const data = await api.get('/api/classes?limit=10000');
      setClasses(data.data?.classes || []);
    } catch (err) {
      // Silently fail - dropdown will be empty
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
      await api.post('/api/classpurchases', {
        user_id: parseInt(userId, 10),
        class_id: parseInt(classId, 10),
        price: parseInt(price, 10),
      });
      router.push('/admin/class/classpurchase');
    } catch (err) {
      setError(err.data?.message || 'Failed to add class purchase');
      console.log("error: ", err);
    }
    setLoading(false);
  };

  const selectedUser = users.length > 0 && userId ? users.find(u => u.id === Number(userId)) ?? null : null;
  const selectedClass = classes.length > 0 && classId ? classes.find(u => u.id === Number(classId)) ?? null : null;

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
            name="user_id"
            type="searchable-select"
            placeholder="Search Member"
            value={
              selectedUser
                ? {
                    value: selectedUser.id,
                    label: `${selectedUser.name} (${selectedUser.email})`
                  }
                : null
            }
            onChange={(opt) => {
              setUserId(opt?.value ?? '');
            }}
            options={users.map(user => ({
              value: user.id,
              label: `${user.name} (${user.email})`
            }))}
            required
          />
          <FormInput
            label="Class Name"
            name="class_id"
            type="searchable-select"
            placeholder="Search Class"
            value={
              selectedClass
                ? {
                    value: selectedClass.id,
                    label: `${selectedClass.name} - ${selectedClass.class_date?.slice(0, 10)} ${selectedClass.start_time?.slice(0, 5)}`
                  }
                : null
            }
            onChange={(opt) => {
              setClassId(opt?.value ?? '');
            }}
            options={classes.map(cls => ({
              value: cls.id,
              label: `${cls.name} - ${cls.class_date?.slice(0, 10)} ${cls.start_time?.slice(0, 5)}`
            }))}
            required
          />
          <FormInput
            label="Price"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
          <FormActions
            onReset={handleReset}
            cancelHref="/admin/class/classpurchase"
            isSubmitting={loading}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
