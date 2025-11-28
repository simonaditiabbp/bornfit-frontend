// Edit Membership Plan
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditMembershipPlanPage() {
  const [form, setForm] = useState({
    name: '',
    duration_value: '',
    duration_unit: 'day',
    price: '',
    // Hide and set default values for these fields
    category: 'REGULAR',
    loyalty_point: 0,
    access_type: 'ALL',
    class_access_type: 'ALL',
    description: '',
    max_session: '',
    allow_unlimited_session: false,
    available_from: '',
    available_until: '',
    quota_max_sold: '',
    always_available: false,
    level: 1
  });
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const formatDateForInput = s => s ? new Date(new Date(s).getTime() - new Date().getTimezoneOffset()*60000) .toISOString().slice(0,16) : "";
  const formatDateOnlyForInput = s => s 
    ? new Date(new Date(s).getTime())
        .toISOString().slice(0, 10) // <-- Hanya mengambil YYYY-MM-DD
    : "";

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const fetchData = async () => {
      setLoading(true);
      try {
        const resPlan = await fetch(`${API_URL}/api/membership-plans/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const planData = await resPlan.json();
        setForm(planData.data || null);
      } catch (err) {
        setError('Gagal fetch data');
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Helper for dynamic field visibility
  const showMaxSession = !form.allow_unlimited_session;
  const showQuotaMaxSold = !form.always_available;

  // Update allow_unlimited_session and always_available to also set default values
  const handleSelectChange = e => {
    const { name, value } = e.target;
    if (name === 'allow_unlimited_session') {
      setForm(f => ({
        ...f,
        allow_unlimited_session: value === 'true',
        max_session: value === 'true' ? 99999 : f.max_session
      }));
    } else if (name === 'always_available') {
      setForm(f => ({
        ...f,
        always_available: value === 'true',
        quota_max_sold: value === 'true' ? 99999 : f.quota_max_sold
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let availableFromIso = form.available_from;
      if (availableFromIso && availableFromIso.length === 10) {
          availableFromIso = availableFromIso + 'T00:00:00.000Z';
      }
      else if (availableFromIso && availableFromIso.length === 16) {
          availableFromIso = availableFromIso + ':00.000Z';
      }

      let availableUntilIso = form.available_until;
      if (availableUntilIso && availableUntilIso.length === 10) {
          availableUntilIso = availableUntilIso + 'T00:00:00.000Z';
      }
      else if (availableUntilIso && availableUntilIso.length === 16) {
          availableUntilIso = availableUntilIso + ':00.000Z';
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: form.name,
          duration_value: Number(form.duration_value),
          duration_unit: form.duration_unit,
          price: Number(form.price),
          category: form.category,
          loyalty_point: Number(form.loyalty_point),
          description: form.description,
          access_type: form.access_type,
          class_access_type: form.class_access_type,
          max_session: form.max_session ? Number(form.max_session) : null,
          allow_unlimited_session: Boolean(form.allow_unlimited_session),
          available_from: availableFromIso || null,
          available_until: availableUntilIso || null,
          quota_max_sold: form.quota_max_sold ? Number(form.quota_max_sold) : null,
          always_available: Boolean(form.always_available),
          level: Number(form.level)
        })
      });
      router.push('/admin/membership/plans');
    } catch (err) {
      setError('Gagal menyimpan plan');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus plan ini?')) return;
    setFormLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/membership-plans/${id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      router.push('/admin/membership/plans');
    } catch (err) {
      setError('Gagal menghapus plan');
    }
    setFormLoading(false);
  };

  if (loading || !form) return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-blue-700 border-b pb-3">Edit Membership Plan</h2>
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="space-y-4 mb-4">
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Nama Plan <span className="text-red-600">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
       <div className="flex gap-2 items-center">
            <div className="flex-1">
                <label className="block mb-1">Duration Value</label>
                <input
                type="number"
                name="duration_value"
                value={form.duration_value}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`}
                required
                disabled={!edit}
                />
            </div>
            <div className="w-32">
                <label className="block mb-1">Duration Unit</label>
                <select
                name="duration_unit"
                value={form.duration_unit}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`}
                disabled={!edit}
                >
                <option value="day">Day</option>
                <option value="month">Month</option>
                </select>
            </div>
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Harga <span className="text-red-600">*</span></label>
          <input type="number" name="price" value={form.price} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
        {/* Hidden fields with default values */}
        <input type="hidden" name="category" value={form.category} onChange={handleChange} />
        <input type="hidden" name="loyalty_point" value={form.loyalty_point} onChange={handleChange} />
        <input type="hidden" name="access_type" value={form.access_type} onChange={handleChange} />
        <input type="hidden" name="class_access_type" value={form.class_access_type} onChange={handleChange} />
        <div>
          <label className="block mb-1">Keterangan</label>
          <input type="text" name="description" value={form.description} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
        </div>
        <div>
          <label className="block mb-1">Allow Unlimited Session</label>
          <select name="allow_unlimited_session" value={form.allow_unlimited_session ? 'true' : 'false'} onChange={handleSelectChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit}>
            <option value="false">Tidak</option>
            <option value="true">Ya</option>
          </select>
        </div>
        {showMaxSession && (
          <div>
            <label className="block mb-1">Max Session</label>
            <input type="number" name="max_session" value={form.max_session || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
          </div>
        )}
       <div className="flex gap-2">
          <div className="flex-1">
              <label className="block mb-1">Available From</label>
              <input
              type="date"
              name="available_from"
              value={formatDateOnlyForInput(form.available_from) || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`}
              disabled={!edit}
              />
          </div>
            {/* <div className="flex-1">
                <label className="block mb-1">Available From</label>
                <input
                type="datetime-local"
                name="available_from"
                value={formatDateForInput(form.available_from) || ''}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`}
                disabled={!edit}
                />
            </div> */}
          <div className="flex-1">
              <label className="block mb-1">Available Until</label>
              <input
              type="date"
              name="available_until"
              value={formatDateOnlyForInput(form.available_until) || ''}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`}
              disabled={!edit}
              />
          </div>
            {/* <div className="flex-1">
                <label className="block mb-1">Available Until</label>
                <input
                type="datetime-local"
                name="available_until"
                value={formatDateForInput(form.available_until) || ''}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`}
                disabled={!edit}
                />
            </div> */}
        </div>
        <div>
          <label className="block mb-1">Always Available</label>
          <select name="always_available" value={form.always_available ? 'true' : 'false'} onChange={handleSelectChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit}>
            <option value="false">Tidak</option>
            <option value="true">Ya</option>
          </select>
        </div>
        {showQuotaMaxSold && (
          <div>
            <label className="block mb-1">Quota Max Sold</label>
            <input type="number" name="quota_max_sold" value={form.quota_max_sold || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} disabled={!edit} />
          </div>
        )}
        <div>
          <label className="block mb-1">Level</label>
          <input type="number" name="level" value={form.level || ''} onChange={handleChange} className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} required disabled={!edit} />
        </div>
        <div className="flex gap-2 mt-4">
          {!edit ? (
            <>
              <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setEdit(true)}>Edit</button>
              <button type="button" className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDelete} disabled={formLoading}>Delete</button>
            </>
          ) : (
            <>
              <button type="button" className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSubmit} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setEdit(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
