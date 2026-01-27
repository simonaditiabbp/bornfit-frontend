"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import api from '@/utils/fetchClient';
import { FormInput, FormInputGroup } from '@/components/admin';

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

      if ((form.role === "admin" || form.role === "opscan" || form.role === "finance") && !form.password) {
        setError("Password is required for admin, opscan & finance role");
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

      const data = await api.post('/api/users', formData);

      // Check if user has email for QR code notification
      const hasValidEmail = form.email && form.email.trim() !== '';
      const successMessage = hasValidEmail 
        ? "User created successfully! QR code has been sent to email." 
        : "User created successfully! No email provided, QR code not sent.";
      
      setSuccess(successMessage);
      if (onRefresh) onRefresh(); // Refresh data di parent
      
      // Redirect based on role
      if (form.role === "member" && data.data.id) {
        // Member: redirect to membership insert
        setTimeout(() => {
          handleCloseInternal();
          router.push(`/admin/membership/session/insert?member_id=${data.data.id}`);
        }, 1200);
      } else {
        // Non-member: redirect to users list
        setTimeout(() => {
          handleCloseInternal();
          router.push("/admin/users");
          window.location.reload();
        }, 1200);
      }

    } catch (err) {
      setError(err.data?.message || 'Failed to create user');
      console.log("error: ", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create New User</h1>
            <button 
                onClick={handleCloseInternal}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <FormInput
              label="Name"
              placeholder="Enter name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
            
            <FormInputGroup className="grid grid-cols-2 gap-4">
              <FormInput
                label="Email"
                placeholder="Enter email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
              <FormInput
                label="Phone"
                placeholder="Enter phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </FormInputGroup>

            <FormInputGroup className="grid grid-cols-2 gap-4">
              <FormInput
                label="NIK/Passport"
                placeholder="Enter NIK/Passport"
                name="nik_passport"
                value={form.nik_passport}
                onChange={handleChange}
              />
              <FormInput
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </FormInputGroup>

            <FormInputGroup className="grid grid-cols-2 gap-4">
              <FormInput
                label="Emergency Contact Name"
                placeholder="Enter contact Name"
                name="emergency_contact_name"
                value={form.emergency_contact_name}
                onChange={handleChange}
                required
              />
              <FormInput
                label="Emergency Contact Phone"
                placeholder="Enter contact phone"
                name="emergency_contact_phone"
                value={form.emergency_contact_phone}
                onChange={handleChange}
                required
              />
            </FormInputGroup>

            <FormInput
              label="Role"
              name="role"
              type="select"
              value={form.role}
              onChange={handleRoleChange}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'opscan', label: 'Opscan' },
                { value: 'admin', label: 'Admin' },
                { value: 'trainer', label: 'Trainer' },
                { value: 'instructor', label: 'Instructor' },
                { value: 'finance', label: 'Finance' }
              ]}
              required
            />

            {(form.role === "admin" || form.role === "opscan" || form.role === "finance") && (
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            )}

            <div>
              <label className="block font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">Photo</label>
              
              {/* Input File */}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-400 p-2 rounded font-medium text-sm"
              />

              {/* Button buka kamera */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(!isCameraOpen)}
                className="mt-2 px-4 py-2 bg-gray-600 dark:bg-gray-600 border border-gray-400 dark:border-gray-500 text-white dark:text-gray-300 rounded hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors font-medium text-sm"
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
                <div className="mt-4 flex flex-col items-center p-4 border border-dashed border-gray-300 dark:border-gray-400 rounded-lg">
                  <Image
                    src={URL.createObjectURL(photo)}
                    alt="Preview Photo"
                    width={180}
                    height={180}
                    className="w-40 h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-400 shadow-sm"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 mt-2">New Photo Selected</span>
                  <button type="button" onClick={() => setPhoto(null)} className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200 text-sm font-semibold">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded border border-green-200 text-sm font-semibold">{success}</div>}
            
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
                <button 
                    type="button" 
                    onClick={handleCloseInternal}
                    className="flex-1 bg-gray-200 dark:bg-gray-100 text-gray-800 dark:text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="flex-1 bg-gray-600 dark:bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
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