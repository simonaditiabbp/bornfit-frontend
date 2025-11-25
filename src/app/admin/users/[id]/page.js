'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import { FaAngleLeft, FaAngleRight, FaUser } from 'react-icons/fa';
import Link from 'next/link';
import Webcam from 'react-webcam';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserDetailPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const params = useParams();
  const { id } = params;
  const [user, setUser] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    date_of_birth: '',
    nik_passport: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    latitude: null,
    longitude: null,
  });
  const [token, setToken] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const [backendError, setBackendError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    setToken(tokenData);
    if (!userData || !tokenData) {
      router.replace('/login');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'admin') {
      router.replace('/barcode');
      return;
    }

    const fetchWith401 = async (url) => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tokenData}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
        // throw new Error('Unauthorized');
      }
      return res.json();
    };

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const userRes = await fetchWith401(`${API_URL}/api/users/${id}`);
        const checkinsRes = await fetchWith401(`${API_URL}/api/checkins/user/${id}`);
        const userData = userRes.data;
        setUser(userData);
        setCheckins(checkinsRes);

        setForm({
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || '',
          phone: userData.phone || '',
          date_of_birth: userData.date_of_birth ? userData.date_of_birth.slice(0, 10) : '',
          nik_passport: userData.nik_passport || '',
          emergency_contact_name: userData.emergency_contact_name || '',
          emergency_contact_phone: userData.emergency_contact_phone || '',
          latitude: userData.latitude && !isNaN(Number(userData.latitude)) ? Number(userData.latitude) : null,
          longitude: userData.longitude && !isNaN(Number(userData.longitude)) ? Number(userData.longitude) : null,
        });
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };

    fetchDetail();
  }, [id, router]);

  const handleEdit = () => setEdit(true);
  const handleCancel = () => {
    setEdit(false);
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    let userUpdateSuccess = false;
    try {
      let res, data;
      // Format date_of_birth ke ISO-8601
      let dobIso = form.date_of_birth;
      if (dobIso && dobIso.length === 10) {
        dobIso = dobIso + "T00:00:00.000Z";
      }
      if (photo) {
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('role', form.role);
        formData.append('date_of_birth', dobIso);
        formData.append('latitude', form.latitude && !isNaN(Number(form.latitude)) ? Number(form.latitude) : null);
        formData.append('longitude', form.longitude && !isNaN(Number(form.longitude)) ? Number(form.longitude) : null);
        formData.append('photo', photo);
        res = await fetch(`${API_URL}/api/users/${id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        data = await res.json();
      } else {
        res = await fetch(`${API_URL}/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...form,
            date_of_birth: dobIso,
            latitude: form.latitude && !isNaN(Number(form.latitude)) ? Number(form.latitude) : null,
            longitude: form.longitude && !isNaN(Number(form.longitude)) ? Number(form.longitude) : null
          }),
        });
        const userData = await res.json();
        data = userData;
      }
      if (!res.ok) {
        if (res.status === 409 && data.code === "EMAIL_EXISTS") {
          setError("Email is already registered!");
          return;
        }
        throw new Error(data.message || "Failed to update user");
      }
      userUpdateSuccess = true;

      setEdit(false);
      setPhoto(null);
      setPhotoPreview(null);
      if (userUpdateSuccess) {
        // Ambil ulang data user terbaru agar preview langsung update
        const tokenData = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/users/${id}`, { headers: { Authorization: `Bearer ${tokenData}` } });
        const userRes = await res.json();
        setUser(userRes.data);
        setSuccess("User updated successfully!");
      }
    } catch (err) {
      if (err.message === "Email is already registered!") {
        setError(err.message);
      } else {
        setBackendError(true);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('Yakin ingin menghapus member ini?')) {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace('/admin/users');
    }
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div>
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li>
              <div className="inline-flex items-center">
                <FaUser className="w-3 h-3 me-2.5 text-amber-300" /> 
                <Link href="/admin/users" className="ms-1 text-sm font-medium text-gray-400 hover:text-gray-200 md:ms-2 dark:text-gray-400">User Data</Link>
              </div>
            </li>
            <li aria-current="page">
              <div class="flex items-center">
                <FaAngleRight className="w-3 h-3 text-gray-400 mx-1" />
                <span class="ms-1 text-sm font-medium text-gray-400 md:ms-2 dark:text-gray-400">Detail</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-5">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-600">
          {loading ? (
            <div className="text-blue-600 text-center font-medium">Loading...</div>
          ) : (
          <>            
            <h2 className="text-3xl font-bold mb-8 text-gray-200 border-b pb-3">
              User Details
            </h2>

            {/* PHOTO USER */}
            <div className="flex flex-col items-center mb-8">
              {(photoPreview || user?.photo) ? (
                <Image
                  src={
                    photoPreview ||
                    (user.photo.startsWith('http')
                      ? user.photo
                      : `${API_URL?.replace(/\/$/, '')}${user.photo}`)
                  }
              alt="User Photo"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-full border border-gray-300 shadow mb-3"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-full text-gray-400 mb-3">
                  No photo available
                </div>
              )}

              <span className="text-sm text-gray-200 font-medium">Photo</span>

                {edit && (
                  <div className="flex gap-3 mt-3">

                    {/* Upload File */}
                    <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          setPhoto(e.target.files[0]);
                          setPhotoPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null);
                        }}
                      />
                    </label>

                    {/* Open Camera */}
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Open Camera
                    </button>
                  </div>
                )}

                {/* Remove Photo */}
                {photoPreview && (
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove photo
                  </button>
                )}

                {/* CAMERA MODAL */}
                {isCameraOpen && (
                  <div className="mt-3 p-4 border rounded-lg bg-black/10 flex flex-col items-center">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="rounded-lg mb-3"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const imageSrc = webcamRef.current.getScreenshot();

                          fetch(imageSrc)
                            .then(res => res.blob())
                            .then(blob => {
                              const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
                              setPhoto(file);
                              setPhotoPreview(URL.createObjectURL(file));
                              setIsCameraOpen(false);
                            });
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded"
                      >
                        Capture
                      </button>

                      <button
                        onClick={() => setIsCameraOpen(false)}
                        className="px-4 py-2 bg-gray-400 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

            {/* INFO SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* USER FIELDS */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Name</label>
                <input type="text" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.name} disabled={!edit} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
                <input type="email" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.email} disabled={!edit} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Phone</label>
                <input type="text" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.phone} disabled={!edit} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Date of Birth</label>
                <input type="date" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.date_of_birth} disabled={!edit} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">NIK/Passport</label>
                <input type="text" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.nik_passport} disabled={!edit} onChange={e => setForm(f => ({ ...f, nik_passport: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Role</label>
                <select className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.role} disabled={!edit} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="opscan">Opscan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Emergency Contact Name</label>
                <input type="text" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.emergency_contact_name} disabled={!edit} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Emergency Contact Phone</label>
                <input type="text" className={`w-full p-3 border rounded-lg ${edit ? 'bg-white' : 'bg-gray-100'}`} value={form.emergency_contact_phone} disabled={!edit} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} />
              </div>
            </div>

            {/* CHECKIN HISTORY */}
            <div className="mt-8">
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Check-in History
              </label>
              <div className="max-h-56 overflow-y-auto border rounded-lg bg-gray-700 border-gray-600 p-4">
                {checkins.length === 0 ? (
                  <p className="text-gray-200 text-sm italic">No check-in data yet.</p>
                ) : (
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {checkins.map((c) => (
                      <li key={c.id}>
                        {(() => {
                          const date = new Date(c.checkin_time);
                          const day = String(date.getUTCDate()).padStart(2, '0');
                          const monthNames = [
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ];
                          const month = monthNames[date.getUTCMonth()];
                          const year = date.getUTCFullYear();
                          const hours = String(date.getUTCHours()).padStart(2, '0');
                          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                          return `${day} ${month} ${year} ${hours}:${minutes}`;
                        })()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
            {success && <div className="text-green-600 font-semibold mt-2">{success}</div>}
            {/* ACTION BUTTONS */}
            <div className="flex gap-3 mt-8">
              {!edit ? (
                <>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}