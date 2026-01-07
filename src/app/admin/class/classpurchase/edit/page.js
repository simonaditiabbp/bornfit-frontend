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
      const data = await api.get('/api/classes/exclude-recurring-parent?limit=10000');
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

  const handleEdit = (e) => {
    e.preventDefault();
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

  const handleSave = async (e) => {
    e.preventDefault();
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

  const selectedUser = users.length > 0 && form.user_id ? users.find(u => u.id === Number(form.user_id)) ?? null : null;
  const selectedClass = classes.length > 0 && form.class_id ? classes.find(u => u.id === Number(form.class_id)) ?? null : null;

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
        
        <form onSubmit={handleSave} className="space-y-4 mb-4">
          <FormInput
            label="Member Name"
            name="user_id"
            type="searchable-select"
            placeholder='Search Member'
            disabled={!edit}
            value={ selectedUser ? { value: selectedUser.id, label: `${selectedUser.name} ${selectedUser.email ? `(${selectedUser.email})` : ''}` }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, user_id: opt?.value || '' }))
            }
            options={users.map(u => ({
              value: u.id,
              label: `${u.name} ${u.email ? `(${u.email})` : ''}`
            }))}
            required
          />

          <FormInput
            label="Class Name"
            name="class_id"
            type="searchable-select"
            placeholder='Search Member'
            disabled={!edit}
            value={ selectedClass ? { 
              value: selectedClass.id, 
              label: `${selectedClass.event_plan?.name || selectedClass.name} - 
                      ${selectedClass.instructor?.name || ''} 
                      (${new Date(selectedClass.start_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
                      ${selectedClass.start_time?.replace('T', ' ').replace('.000Z', '')} - 
                      ${new Date(selectedClass.end_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
                      ${selectedClass.end_time?.replace('T', ' ').replace('.000Z', '')})`
            }
            : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, class_id: opt?.value || '' }))
            }
            options={classes.map(cls => ({
              value: cls.id,
              label: `${cls.event_plan?.name || cls.name} - 
                      ${cls.instructor?.name || ''} 
                      (${new Date(cls.start_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
                      ${cls.start_time?.replace('T', ' ').replace('.000Z', '')} - 
                      ${new Date(cls.end_time)?.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' })}, 
                      ${cls.end_time?.replace('T', ' ').replace('.000Z', '')})`
            }))}
            required
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

          {success && <div className="text-green-400 mb-2">{success}</div>}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          
          <div className="flex gap-3 mt-6 justify-start">
            {!edit ? (
              <>
                <ActionButton variant="primary" onClick={handleEdit}>Edit</ActionButton>
                <ActionButton variant="danger" onClick={handleDelete} disabled={formLoading}>Delete</ActionButton>
              </>
            ) : (
              <>
                <ActionButton type="submit" variant="primary" disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</ActionButton>
                <ActionButton variant="gray" onClick={handleCancel}>Cancel</ActionButton>
              </>
            )}
          </div>
        </form>
      </PageContainerInsert>
    </div>
  );
}
