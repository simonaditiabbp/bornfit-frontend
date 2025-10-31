"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BackendErrorFallback from '../../../../components/BackendErrorFallback';

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
  const [qrInput, setQrInput] = useState("");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const router = useRouter();

  const getJwtExp = () => {
    const tokenCheck = localStorage.getItem('token');
    if (!tokenCheck) return null;
    try {
      const payload = tokenCheck.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    // Only admin can access
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    if (!userData || !tokenData) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'admin') {
      router.replace('/barcode');
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000); // waktu sekarang dalam detik
    const exp = getJwtExp(tokenData);
    if (exp && currentTime >= exp) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.replace('/login');
      return;
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setForm((f) => ({
        ...f,
        membership: { ...f.membership, [name]: value },
      }));
    } else if (name === "qr_code") {
      setQrInput(value);
      const now = new Date().toISOString();
      setForm((f) => ({
        ...f,
        qr_code: value ? `${value}_${now}` : "",
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm((f) => ({ ...f, role, password: role === "member" ? "" : f.password }));
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Validasi sesuai role
      if ((form.role === "admin" || form.role === "opscan") && !form.password) {
        setError("Password is required for admin & opscan role");
        return;
      }
      if (form.role === "member" && !form.qr_code) {
        setError("QR Code is required for member role");
        return;
      }
      const token = localStorage.getItem("token");
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'membership') {
          if (value.start_date) formData.append('membership[start_date]', value.start_date);
          if (value.end_date) formData.append('membership[end_date]', value.end_date);
        } else {
          formData.append(key, value);
        }
      });
      if (photo) {
        formData.append('photo', photo);
      }
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.code === "EMAIL_EXISTS") {
          setError("Email is already registered");
          return;
        }
        throw new Error(data.message || "Failed to create user");
      }
      setSuccess("User created successfully!");
      setForm({
        name: "",
        email: "",
        qr_code: "",
        password: "",
        role: "member",
        membership: { start_date: "", end_date: "" },
      });
      setPhoto(null);
      setTimeout(() => router.push("/admin/users"), 1200);
    } catch (err) {
      if (err.message === "Email is already registered") {
        setError(err.message);
      } else {
        setBackendError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Create New User</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Name <span className="text-red-600">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Email <span className="text-red-600">*</span></label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">QR Code {form.role === "member" && <span className="text-red-600">*</span>}</label>
          <input
            type="text"
            name="qr_code"
            value={qrInput}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required={form.role === "member"}
          />
          {/* {form.qr_code && ( */}
            {/* <div className="text-xs text-gray-500 mt-1">akan dikirim: {form.qr_code}</div> */}
          {/* )} */}
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Role</label>
          <select name="role" value={form.role} onChange={handleRoleChange} className="w-full border border-gray-300 p-2 rounded">
            <option value="member">Member</option>
            <option value="opscan">Opscan</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {(form.role === "admin" || form.role === "opscan") && (
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-1">Password <span className="text-red-600">*</span></label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-1">Membership Start</label>
            <input
              type="date"
              name="start_date"
              value={form.membership.start_date}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required={form.role === "member"}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-1">Membership End</label>
            <input
              type="date"
              name="end_date"
              value={form.membership.end_date}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required={form.role === "member"}
            />
          </div>
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full border border-gray-300 p-2 rounded" />
          {photo && (
            <div className="mt-2 flex flex-col items-center">
              <Image
                src={URL.createObjectURL(photo)}
                alt="Preview Photo"
                width={180}
                height={180}
                className="w-45 h-45 object-cover rounded-lg border border-gray-300 shadow"
              />
              <span className="text-xs text-gray-500 mt-1">Preview</span>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        {success && <div className="text-green-600 font-semibold">{success}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
          {loading ? "Saving..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
