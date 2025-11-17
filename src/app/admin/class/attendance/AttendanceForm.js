import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceForm({ mode, id }) {
  const router = useRouter();
  const [form, setForm] = useState({
    class_id: "",
    member_id: "",
    checked_in_at: "",
    status: "Booked",
    created_by: "",
    updated_by: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && id) {
      setLoading(true);
      fetch(`/api/classattendances/${id}`)
        .then(res => res.json())
        .then(data => {
          setForm({
            class_id: data.class_id || "",
            member_id: data.member_id || "",
            checked_in_at: data.checked_in_at ? data.checked_in_at.slice(0, 16) : "",
            status: data.status || "Booked",
            created_by: data.created_by || "",
            updated_by: data.updated_by || ""
          });
        })
        .finally(() => setLoading(false));
    }
  }, [mode, id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const method = mode === "edit" ? "PUT" : "POST";
    const url = mode === "edit" ? `/api/classattendances/${id}` : "/api/classattendances";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setLoading(false);
    router.push("/admin/class/attendance");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">{mode === "edit" ? "Edit" : "Add"} Attendance</h2>
      <div className="mb-2">
        <label className="block mb-1">Class</label>
        <input name="class_id" type="number" value={form.class_id} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Member</label>
        <input name="member_id" type="number" value={form.member_id} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Checked In At</label>
        <input name="checked_in_at" type="datetime-local" value={form.checked_in_at} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className="w-full border px-2 py-1 rounded">
          <option value="Booked">Booked</option>
          <option value="Checked-in">Checked-in</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Created By</label>
        <input name="created_by" value={form.created_by} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Updated By</label>
        <input name="updated_by" value={form.updated_by} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
      </button>
    </form>
  );
}
