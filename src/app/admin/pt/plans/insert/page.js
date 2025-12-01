"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Add PT Session Plan</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Duration (days)</label>
            <input type="number" name="duration_value" value={form.duration_value} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Max Session</label>
            <input type="number" name="max_session" value={form.max_session} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Price (Rp)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Minutes/Session</label>
            <input type="number" name="minutes_per_session" value={form.minutes_per_session} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div className="flex gap-3 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded font-bold hover:bg-gray-500" onClick={() => router.push('/admin/pt/plans')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
