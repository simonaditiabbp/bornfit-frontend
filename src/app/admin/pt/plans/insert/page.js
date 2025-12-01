"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaAngleRight, FaFileInvoice } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTPlanInsertPage() {
  const [form, setForm] = useState({
    name: "",
    duration_value: 1,
    max_session: 1,
    price: 0,
    minutes_per_session: 60,
    description: "",
    duration_unit: "day",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "price" || name === "duration_value" || name === "max_session" || name === "minutes_per_session" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/ptsessionplans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      router.push("/admin/pt/plans");
    } catch (err) {
      alert("Gagal menyimpan plan");
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
                <Link href="/admin/pt/plans" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2">PT Plans</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FaAngleRight className="w-3 h-3 text-gray-400 mx-1" />
                <span className="ms-1 text-sm font-medium text-gray-400 md:ms-2">Add Plan</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-600">
          <h1 className="text-3xl font-bold mb-8 text-gray-200 border-b border-gray-600 pb-3">Add PT Session Plan</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-gray-200">Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1 text-gray-200">Duration (days)</label>
                <input type="number" name="duration_value" value={form.duration_value} onChange={handleChange} required className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-200">Max Session</label>
                <input type="number" name="max_session" value={form.max_session} onChange={handleChange} required className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1 text-gray-200">Price (Rp)</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} required className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-200">Minutes/Session</label>
                <input type="number" name="minutes_per_session" value={form.minutes_per_session} onChange={handleChange} required className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-200">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} required className="w-full border border-gray-600 p-3 rounded-lg bg-gray-700 text-gray-200" />
            </div>
            <div className="flex justify-between mt-8">
              <div className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                <Link href="/admin/pt/plans">Back</Link>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition" onClick={() => router.push('/admin/pt/plans')}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
