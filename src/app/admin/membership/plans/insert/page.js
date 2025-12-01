// Insert Membership Plan
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaAngleRight, FaFileInvoice } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InsertMembershipPlanPage() {
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
    allow_unlimited_session: true,
    available_from: '',
    available_until: '',
    quota_max_sold: '',
    always_available: true,
    level: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      await fetch(`${API_URL}/api/membership-plans`, {
        method: 'POST',
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

  return (
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaFileInvoice className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/membership/plans" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2 dark:text-gray-400">Membership Plans</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FaAngleRight className="w-3 h-3 text-gray-400 mx-1" />
                <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2 dark:text-gray-400">Create</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-600">
          <h2 className="text-3xl font-bold mb-8 text-gray-200 text-center border-b border-gray-600 pb-3">Tambah Membership Plan</h2>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-200 mb-1">Nama Plan <span className="text-red-400">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required />
            </div>
           <div className="flex gap-2 items-center">
            <div className="flex-1">
                <label className="block mb-1 text-gray-200">Duration Value</label>
                <input
                type="number"
                name="duration_value"
                value={form.duration_value}
                onChange={handleChange}
                className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded"
                required
                />
            </div>
            <div className="w-32">
                <label className="block mb-1 text-gray-200">Duration Unit</label>
                <select
                name="duration_unit"
                value={form.duration_unit}
                onChange={handleChange}
                className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded"
                >
                <option value="day">Day</option>
                <option value="month">Month</option>
                </select>
            </div>
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Harga <span className="text-red-400">*</span></label>
              <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required />
            </div>
            <div>
              <label className="block font-medium text-gray-200 mb-1">Keterangan</label>
              <input type="text" name="description" value={form.description} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
            </div>
            <div>
              <label className="block mb-1 text-gray-200">Allow Unlimited Session</label>
              <select name="allow_unlimited_session" value={form.allow_unlimited_session ? 'true' : 'false'} onChange={handleSelectChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required>
                <option value="false">Tidak</option>
                <option value="true">Ya</option>
              </select>
            </div>
            {showMaxSession && (
              <div>
                <label className="block mb-1 text-gray-200">Max Session</label>
                <input type="number" name="max_session" value={form.max_session || ''} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
              </div>
            )}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block mb-1 text-gray-200">Available From</label>
                    <input
                    type="date"
                    name="available_from"
                    value={form.available_from}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded"
                    />
                </div>
                <div className="flex-1">
                    <label className="block mb-1 text-gray-200">Available Until</label>
                    <input
                    type="date"
                    name="available_until"
                    value={form.available_until}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded"
                    />
                </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-200">Always Available</label>
              <select name="always_available" value={form.always_available ? 'true' : 'false'} onChange={handleSelectChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required>
                <option value="false">Tidak</option>
                <option value="true">Ya</option>
              </select>
            </div>
            {showQuotaMaxSold && (
              <div>
                <label className="block mb-1 text-gray-200">Quota Max Sold</label>
                <input type="number" name="quota_max_sold" value={form.quota_max_sold || ''} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" />
              </div>
            )}
            <div>
              <label className="block mb-1 text-gray-200">Level</label>
              <input type="number" name="level" value={form.level} onChange={handleChange} className="w-full bg-gray-700 text-gray-100 border border-gray-600 p-2 rounded" required />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
              <button type="button" className="flex-1 bg-gray-600 text-white py-2 rounded font-bold hover:bg-gray-700" onClick={() => router.push('/admin/membership/plans')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}