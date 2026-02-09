"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaDumbbell } from 'react-icons/fa';
import toast from 'react-hot-toast';
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
  const router = useRouter();

  const handleReset = () => {
    setUserId('');
    setClassId('');
    setPrice('');
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
      const data = await api.get('/api/classes/exclude-recurring-parent?limit=10000');
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
    try {
      await api.post('/api/classpurchases', {
        user_id: parseInt(userId, 10),
        class_id: parseInt(classId, 10),
        price: parseInt(price, 10),
      });
      toast.success('Class purchase created successfully!');
      router.push('/admin/class/classpurchase');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create class purchase');
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
                    label: `${selectedUser.name} ${selectedUser.email ? `(${selectedUser.email})` : ''}`
                  }
                : null
            }
            onChange={(opt) => {
              setUserId(opt?.value ?? '');
            }}
            options={users.map(user => ({
              value: user.id,
              label: `${user.name} ${user.email ? `(${user.email})` : ''}`
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
                    label: `${selectedClass.event_plan?.name || selectedClass.name} - 
                    ${selectedClass.instructor?.name ? `${selectedClass.instructor.name} (Instructor)` : selectedClass.trainer?.name ? `${selectedClass.trainer.name} (Trainer)` : ''} 
                    (${new Date(selectedClass.start_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
                    ${selectedClass.start_time?.replace('T', ' ').replace('.000Z', '')} - 
                    ${new Date(selectedClass.end_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
                    ${selectedClass.end_time?.replace('T', ' ').replace('.000Z', '')})`
                  }
                : null
            }
            onChange={(opt) => {
              setClassId(opt?.value ?? '');
            }}
            options={classes.map(cls => ({
              value: cls.id,
              label: `${cls.event_plan?.name || cls.name} - 
              ${cls.instructor?.name ? `${cls.instructor.name} (Instructor)` : cls.trainer?.name ? `${cls.trainer.name} (Trainer)` : ''} 
              (${new Date(cls.start_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
              ${cls.start_time?.replace('T', ' ').replace('.000Z', '')} - 
              ${new Date(cls.end_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
              ${cls.end_time?.replace('T', ' ').replace('.000Z', '')})`
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
