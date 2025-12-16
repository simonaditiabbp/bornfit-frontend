"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaDumbbell } from 'react-icons/fa';
import BackendErrorFallback from '../../../../../components/BackendErrorFallback';
import { PageBreadcrumb, PageContainerInsert, FormInput, ActionButton } from '@/components/admin';
import LoadingSpin from '@/components/admin/LoadingSpin';
import api from '@/utils/fetchClient';

export default function ClassPurchaseEditPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/users?limit=10000');
      setUsers(data.data?.users || []);
    } catch (err) {
      // Silently fail - dropdown will be empty
    }
  };

  // Fetch all classes
  const fetchClasses = async () => {
    try {
      const data = await api.get('/api/classes?limit=10000');
      setClasses(data.data?.classes || []);
    } catch (err) {
      // Silently fail - dropdown will be empty
    }
  };

  // Load purchase data, users, and classes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        // Fetch purchase data
        const purchaseData = await api.get(`/api/classpurchases/${id}`);
        const purchase = purchaseData.data;
        
        // Fetch users and classes in parallel
        await Promise.all([fetchUsers(), fetchClasses()]);
        
        // Set form data
        const purchaseForm = {
          user_id: String(purchase.user_id),
          class_id: String(purchase.class_id),
          price: String(purchase.price),
        };
        setForm(purchaseForm);
        setInitialForm(purchaseForm);
      } catch (err) {
        if (err.isNetworkError) setBackendError(true);
        else setError(err.data?.message || 'Failed to fetch data');
      }
      setLoading(false);
    };
    
    if (id) fetchData();
  }, [id]);

  const handleEdit = () => {
    setEdit(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess('');
    setError('');
    setForm(initialForm);
  };

  const handleSave = async () => {
    setFormLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/classpurchases/${id}`, {
        user_id: parseInt(form.user_id, 10),
        class_id: parseInt(form.class_id, 10),
        price: parseInt(form.price, 10),
      });
      setSuccess('Class purchase updated successfully!');
      setInitialForm(form);
      setEdit(false);
    } catch (err) {
      setError(err.data?.message || 'Failed to update class purchase');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this class purchase?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/classpurchases/${id}`);
      router.push('/admin/class/classpurchase');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete class purchase');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (backendError) return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  if (loading || !form) return <LoadingSpin />;

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
        
        {success && <div className="text-green-400 mb-2">{success}</div>}
        {error && <div className="text-red-400 mb-2">{error}</div>}
        
        <div className="space-y-4 mb-4">
          <FormInput
            label="Member Name"
            type="select"
            value={form.user_id}
            onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
            disabled={!edit}
            required
            options={[
              { value: '', label: '-- Select Member --' },
              ...users.map(user => ({ value: user.id, label: `${user.name} (${user.email || 'No email'})` }))
            ]}
          />
          
          <FormInput
            label="Class Name"
            type="select"
            value={form.class_id}
            onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}
            disabled={!edit}
            required
            options={[
              { value: '', label: '-- Select Class --' },
              ...classes.map(cls => ({ value: cls.id, label: `${cls.name} - ${cls.class_date?.slice(0, 10)} ${cls.start_time?.slice(0, 5)}` }))
            ]}
          />
          
          <FormInput
            label="Price (IDR)"
            type="number"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            disabled={!edit}
            required
            min="0"
          />
          
          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <ActionButton variant="primary" onClick={handleEdit}>Edit</ActionButton>
                <ActionButton variant="danger" onClick={handleDelete} disabled={formLoading}>Delete</ActionButton>
              </>
            ) : (
              <>
                <ActionButton variant="primary" onClick={handleSave} disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save"}
                </ActionButton>
                <ActionButton variant="gray" onClick={handleCancel}>Cancel</ActionButton>
              </>
            )}
          </div>
        </div>
      </PageContainerInsert>
    </div>
  );
}
