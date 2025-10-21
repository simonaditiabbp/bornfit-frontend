"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CreateUserPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    qr_code: "",
    password: "",
    role: "member",
    membership: {
      start_date: "",
      end_date: "",
    },
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Only admin can access
  // (optional: add token check/redirect here if needed)

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setForm((f) => ({
        ...f,
        membership: { ...f.membership, [name]: value },
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm((f) => ({ ...f, role, password: role === "member" ? "" : f.password }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi sesuai role
    if ((form.role === "admin" || form.role === "opscan") && !form.password) {
      setError("Password wajib diisi untuk role admin & opscan");
      return;
    }
    if (form.role === "member" && !form.qr_code) {
      setError("QR Code wajib diisi untuk role member");
      return;
    }
    // Membership start/end opsional untuk admin/opscan
    // QR code opsional untuk admin/opscan
    // Password opsional untuk member

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat user");
      setSuccess("User berhasil dibuat!");
      setForm({
        name: "",
        email: "",
        qr_code: "",
        password: "",
        role: "member",
        membership: { start_date: "", end_date: "" },
      });
      setTimeout(() => router.push("/admin/users"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Buat User Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Nama <span className="text-red-600">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email <span className="text-red-600">*</span></label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">QR Code {form.role === "member" && <span className="text-red-600">*</span>}</label>
          <input
            type="text"
            name="qr_code"
            value={form.qr_code}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required={form.role === "member"}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Role</label>
          <select name="role" value={form.role} onChange={handleRoleChange} className="w-full border p-2 rounded">
            <option value="member">Member</option>
            <option value="opscan">Opscan</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {(form.role === "admin" || form.role === "opscan") && (
          <div>
            <label className="block font-semibold mb-1">Password <span className="text-red-600">*</span></label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Membership Start</label>
            <input
              type="date"
              name="start_date"
              value={form.membership.start_date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required={form.role === "member"}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Membership End</label>
            <input
              type="date"
              name="end_date"
              value={form.membership.end_date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required={form.role === "member"}
            />
          </div>
        </div>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        {success && <div className="text-green-600 font-semibold">{success}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
          {loading ? "Menyimpan..." : "Buat User"}
        </button>
      </form>
    </div>
  );
}
