"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
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
  const [qrInput, setQrInput] = useState("");
  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const router = useRouter();
  const [continueToMembership, setContinueToMembership] = useState(false);

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

  const handleSubmit = async (e, redirectMembership = false) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Validasi sesuai role
      if ((form.role === "admin" || form.role === "opscan") && !form.password) {
        setError("Password is required for admin & opscan role");
        setLoading(false);
        return;
      }
      // Format date_of_birth ke ISO-8601
      let dobIso = form.date_of_birth;
      if (dobIso && dobIso.length === 10) {
        dobIso = dobIso + "T00:00:00.000Z";
      }
      const token = localStorage.getItem("token");
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (["email", "date_of_birth", "nik_passport"].includes(key)) {
          if (!value || value.trim() === "") {
            // JANGAN append → backend terima sebagai NULL
            return;
          }
        }
        if (key === 'date_of_birth') {
          formData.append('date_of_birth', dobIso);
        } else if (key === 'latitude' || key === 'longitude') {
          // Jangan kirim field latitude/longitude jika kosong
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(parseFloat(value)));
          }
          // Jika kosong, skip field
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
      const dataUser = await res.json();
      const data = dataUser.data;
      if (!res.ok) {
        if (res.status === 409 && data.code === "EMAIL_EXISTS") {
          setError("Email is already registered");
          setLoading(false);
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
      if (redirectMembership && data && data.id) {
        // Redirect to membership session insert, pass member id
        router.push(`/admin/membership/session/insert?member_id=${data.id}`);
      } else {
        setTimeout(() => router.push("/admin/users"), 1200);
      }
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

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Create New User</h1>
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* USER FIELDS */}
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Name <span className="text-red-600">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Phone <span className="text-red-600">*</span></label>
          <input type="text" name="phone" value={form.phone ?? ''} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block font-medium text-gray-900 dark:text-white mb-1">
              NIK/Passport
            </label>
            <input
              type="text"
              name="nik_passport"
              value={form.nik_passport ?? ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium text-gray-900 dark:text-white mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth ?? ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>          
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block font-medium text-gray-900 dark:text-white mb-1">
              Emergency Contact Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="emergency_contact_name"
              value={form.emergency_contact_name ?? ''}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium text-gray-900 dark:text-white mb-1">
              Emergency Contact Phone <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="emergency_contact_phone"
              value={form.emergency_contact_phone ?? ''}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
        </div>

        {/* <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Latitude</label>
          <input type="text" name="latitude" value={form.latitude} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Longitude</label>
          <input type="text" name="longitude" value={form.longitude} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
        </div> */}
        {/* <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">QR Code {form.role === "member" && <span className="text-red-600">*</span>}</label>
          <input type="text" name="qr_code" value={qrInput} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required={form.role === "member"} />
        </div> */}
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Role <span className="text-red-600">*</span></label>
          <select name="role" value={form.role} onChange={handleRoleChange} className="w-full border border-gray-300 p-2 rounded" required>
            <option value="member">Member</option>
            <option value="opscan">Opscan</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>
        {(form.role === "admin" || form.role === "opscan") && (
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-1">Password <span className="text-red-600">*</span></label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded" />
          </div>
        )}
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-1">Photo</label>
          
          {/* Input File */}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full border border-gray-300 p-2 rounded"
          />

          {/* Button buka kamera */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="mt-2 px-3 py-2 bg-blue-600 text-white rounded"
          >
            Open Camera
          </button>

          {/* Webcam Modal */}
          {isCameraOpen && (
            <div className="mt-3 p-3 border rounded bg-black/10">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="rounded"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={capture}
                  className="mt-2 px-3 py-2 bg-green-600 text-white rounded"
                >
                  Capture Photo
                </button>
                <button
                  onClick={() => setIsCameraOpen(false)}
                  className="mt-2 px-3 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {photo && (
            <div className="mt-2 flex flex-col items-center">
              <span className="text-xs text-gray-500 mt-1">Preview</span>
              <Image
                src={URL.createObjectURL(photo)}
                alt="Preview Photo"
                width={180}
                height={180}
                className="w-45 h-45 object-cover rounded-lg border border-gray-300 shadow"
              />
            </div>
          )}
          {/* Remove Photo */}
          {photo && (
            <div className="flex flex-col items-center mt-2 ">
              <button
                onClick={() => {
                  setPhoto(null);
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove photo
              </button>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        {success && <div className="text-green-600 font-semibold">{success}</div>}
        <div className="flex gap-3 mt-6">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" disabled={loading}>
            {loading ? "Saving..." : "Create User"}
          </button>
          <button
            type="button"
            className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700"
            disabled={loading}
            onClick={(e) => handleSubmit(e, true)}
          >
            {loading ? "Saving..." : "Create User & Continue to Membership"}
          </button>
        </div>
      </form>
    </div>
  );
}
