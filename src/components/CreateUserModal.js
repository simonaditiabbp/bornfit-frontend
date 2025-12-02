"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CreateUserModal({ isOpen, onClose, onRefresh }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    qr_code: "",
    password: "",
    role: "member",
    phone: "",
    date_of_birth: "",
    nik_passport: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    latitude: null,
    longitude: null,
    membership: {
      membership_plan_id: "",
      start_date: "",
      end_date: "",
      sales_type: "",
      additional_fee: "",
      discount_amount: "",
      discount_percent: "",
      extra_duration_days: "",
      extra_session: "",
      note: "",
      final_price: "",
      status: "",
      is_active: false,
      previous_membership_id: "",
    },
  });

  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState("");

  // Fungsi untuk mereset form dan menutup modal
  const handleCloseInternal = () => {
    setForm({
      name: "",
      email: "",
      qr_code: "",
      password: "",
      role: "member",
      phone: "",
      date_of_birth: "",
      nik_passport: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      membership: { start_date: "", end_date: "" },
    });
    setPhoto(null);
    setError("");
    setSuccess("");
    setQrInput("");
    onClose();
  };

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

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        setPhoto(file);
        setIsCameraOpen(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {

      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Sesi habis atau Anda belum login. Silakan login ulang.");
        setLoading(false);
        setTimeout(() => router.push('/login'), 2000); 
        return;
      }

      if ((form.role === "admin" || form.role === "opscan") && !form.password) {
        setError("Password is required for admin & opscan role");
        setLoading(false);
        return;
      }
      
      const formData = new FormData();
      
      Object.entries(form).forEach(([key, value]) => {
        // --- PERBAIKAN LOGIKA DATE OF BIRTH ---
        if (key === 'date_of_birth') {
          // Hanya kirim jika value TIDAK kosong
          if (value && value !== "") {
             // Jika formatnya YYYY-MM-DD (panjang 10), tambahkan jam
             if (value.length === 10) {
               formData.append('date_of_birth', value + "T00:00:00.000Z");
             } else {
               formData.append('date_of_birth', value);
             }
          }
          // Jika kosong, JANGAN append apapun agar tidak error "premature end"
        } 
        // --- LOGIKA LAINNYA ---
        else if (key === 'latitude' || key === 'longitude') {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(parseFloat(value)));
          }
        } else if (key === 'membership') {
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

      if (res.status === 401) {
         localStorage.removeItem("token");
         localStorage.removeItem("user");
         router.push('/login');
         throw new Error("Sesi tidak valid. Silakan login ulang.");
      }

      if (!res.ok) {
        if (res.status === 409 && data.code === "EMAIL_EXISTS") {
          setError("Email is already registered");
          return;
        }
        throw new Error(data.message || "Failed to create user");
      }

      // Check if user has email for QR code notification
      const hasValidEmail = form.email && form.email.trim() !== '';
      const successMessage = hasValidEmail 
        ? "User created successfully! QR code has been sent to email." 
        : "User created successfully! No email provided, QR code not sent.";
      
      setSuccess(successMessage);
      if (onRefresh) onRefresh(); // Refresh data di parent
      
      // Delay sedikit sebelum menutup modal
      setTimeout(() => {
        handleCloseInternal();
      }, 2000);

    } catch (err) {
      if (err.message === "Email is already registered") {
        setError(err.message);
      } else {
        console.log("err: ", err);
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-600 sticky top-0 bg-gray-800 z-10">
            <h1 className="text-2xl font-bold text-gray-200">Create New User</h1>
            <button 
                onClick={handleCloseInternal}
                className="text-gray-400 hover:text-gray-200 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block font-medium text-gray-200 mb-1">Name <span className="text-red-600">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none" autoFocus />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium text-gray-200 mb-1">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none" />
                </div>
                <div>
                    <label className="block font-medium text-gray-200 mb-1">Phone <span className="text-red-600">*</span></label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} required className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-medium text-gray-200 mb-1">
                  NIK/Passport
                </label>
                <input
                  type="text"
                  name="nik_passport"
                  value={form.nik_passport}
                  onChange={handleChange}
                  className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block font-medium text-gray-200 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none"
                />
              </div>          
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-medium text-gray-200 mb-1">
                  Emergency Contact Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={form.emergency_contact_name}
                  onChange={handleChange}
                  required
                  className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block font-medium text-gray-200 mb-1">
                  Emergency Contact Phone <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="emergency_contact_phone"
                  value={form.emergency_contact_phone}
                  onChange={handleChange}
                  required
                  className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-200 mb-1">Role <span className="text-red-600">*</span></label>
              <select name="role" value={form.role} onChange={handleRoleChange} className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none" required>
                <option value="member">Member</option>
                <option value="opscan">Opscan</option>
                <option value="admin">Admin</option>
                <option value="trainner">Trainner</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            {(form.role === "admin" || form.role === "opscan") && (
              <div>
                <label className="block font-medium text-gray-200 mb-1">Password <span className="text-red-600">*</span></label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full text-gray-200 bg-gray-700 focus:bg-gray-600 border border-gray-400 p-2 rounded focus:ring-0 outline-none" />
              </div>
            )}

            <div>
              <label className="block font-medium text-gray-200 mb-1">Photo</label>
              
              {/* Input File */}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-gray-200 bg-gray-700 border border-gray-400 p-2 rounded"
              />

              {/* Button buka kamera */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(!isCameraOpen)}
                className="mt-2 px-4 py-2 bg-gray-600 border border-gray-500 text-gray-300 rounded hover:bg-gray-500 transition-colors"
              >
                {isCameraOpen ? "Close Camera" : "Open Camera"}
              </button>

              {/* Webcam Modal */}
              {isCameraOpen && (
                <div className="mt-3 p-3 border rounded bg-black/5 flex flex-col items-center">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded shadow-md w-full max-w-sm"
                  />
                  <button
                    type="button"
                    onClick={capture}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                  >
                    Capture Photo
                  </button>
                </div>
              )}

              {/* Preview */}
              {photo && (
                <div className="mt-4 flex flex-col items-center p-4 border border-dashed border-gray-400 rounded-lg">
                  <Image
                    src={URL.createObjectURL(photo)}
                    alt="Preview Photo"
                    width={180}
                    height={180}
                    className="w-40 h-40 object-cover rounded-lg border border-gray-400 shadow-sm"
                  />
                  <span className="text-xs text-gray-300 mt-2">New Photo Selected</span>
                  <button type="button" onClick={() => setPhoto(null)} className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200 text-sm font-semibold">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded border border-green-200 text-sm font-semibold">{success}</div>}
            
            <div className="flex gap-3 pt-4 border-t border-gray-600 mt-4">
                <button 
                    type="button" 
                    onClick={handleCloseInternal}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                             Saving...
                        </div>
                    ) : "Create User"}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}