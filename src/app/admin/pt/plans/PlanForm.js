import { useState } from "react";

export default function PlanForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      duration: 30,
      max_session: 1,
      price: 0,
      minutes_per_session: 60,
      description: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "price" || name === "duration" || name === "max_session" || name === "minutes_per_session" ? Number(value) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Duration (days)</label>
          <input type="number" name="duration" value={form.duration} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium mb-1">Max Session</label>
          <input type="number" name="max_session" value={form.max_session} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Price (Rp)</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium mb-1">Minutes/Session</label>
          <input type="number" name="minutes_per_session" value={form.minutes_per_session} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      </div>
      <div className="flex gap-3 mt-4">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded font-bold hover:bg-gray-500" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
