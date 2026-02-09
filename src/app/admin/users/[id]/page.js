'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import { FaAngleLeft, FaAngleRight, FaUser, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';
import Webcam from 'react-webcam';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import SendQRCodeModal from '../../../../components/SendQRCodeModal';
import api from '@/utils/fetchClient';
import { PageBreadcrumb, FormInput, FormInputGroup, PageContainer, PageHeader, LoadingText } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserDetailPage() {
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
    // latitude: null,
    // longitude: null,
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const [backendError, setBackendError] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        // Use FetchClient with automatic token injection & 401 redirect
        const userRes = await api.get(`/api/users/${id}`);
        const checkinsRes = await api.get(`/api/checkins/user/${id}`);
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
          // latitude: userData.latitude && !isNaN(Number(userData.latitude)) ? Number(userData.latitude) : null,
          // longitude: userData.longitude && !isNaN(Number(userData.longitude)) ? Number(userData.longitude) : null,
        });
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  const handleEdit = () => setEdit(true);
  const handleCancel = () => {
    setEdit(false);
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSave = async () => {
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
        formData.append('role', form.role);
        if (form.email && form.email.trim() !== "") {
          formData.append('email', form.email);
        }
        if (form.phone && form.phone.trim() !== "") {
          formData.append('phone', form.phone);
        }
        if (form.date_of_birth && form.date_of_birth.trim() !== "") {
          let dobIso = form.date_of_birth;
          if (dobIso.length === 10) dobIso += "T00:00:00.000Z";
          formData.append('date_of_birth', dobIso);
        }
        if (form.nik_passport && form.nik_passport.trim() !== "") {
          formData.append('nik_passport', form.nik_passport);
        }
        if (form.emergency_contact_name && form.emergency_contact_name.trim() !== "") {
          formData.append('emergency_contact_name', form.emergency_contact_name);
        }
        if (form.emergency_contact_phone && form.emergency_contact_phone.trim() !== "") {
          formData.append('emergency_contact_phone', form.emergency_contact_phone);
        }
        formData.append('photo', photo);
        data = await api.put(`/api/users/${id}`, formData);
        res = { ok: true };
      } else {
        // Use api client for non-FormData requests
        const cleanForm = {
          ...form,
          email: form.email?.trim() === "" ? null : form.email,
          nik_passport: form.nik_passport?.trim() === "" ? null : form.nik_passport,
          date_of_birth: form.date_of_birth?.trim() === "" ? null : dobIso,
        };

        data = await api.put(`/api/users/${id}`, cleanForm);
        res = { ok: true };
      }
      if (!res.ok) {
        if (res.status === 409 && data.code === "EMAIL_EXISTS") {
          toast.error('Email is already registered!');
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
        const userRes = await api.get(`/api/users/${id}`);
        setUser(userRes.data);
        toast.success('User updated successfully!');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update user');
      console.log("error: ", err);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '⚠️ Delete Confirmation',
      html: `Are you sure you want to delete user <strong>${user?.name || 'this user'}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted successfully!');
      router.replace('/admin/users')
    } catch (err) {
      toast.error(err.data?.message || 'Failed to delete user');
      console.log("error: ", err);
    }
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaUser className="w-3 h-3" />, label: 'User Data', href: '/admin/users' },
          { label: 'Detail / Edit' }
        ]}
      />

      <div className="p-5">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-200 dark:border-gray-600">
          {loading ? (
            <LoadingText />
          ) : (
          <>            
            <div className="flex justify-between items-center mb-8 border-b pb-3">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                User Details
              </h2>
              {!edit && user?.qr_code && (
                <button
                  onClick={() => setShowQRModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FaEnvelope className="w-4 h-4" />
                  Send QR Code
                </button>
              )}
            </div>

            {/* PHOTO USER */}
              <div className="flex flex-col items-center mb-8">

                {(photoPreview || user?.photo) ? (
                  <img
                    src={
                      photoPreview ||
                      (user.photo.startsWith("http")
                        ? user.photo
                        : `${API_URL?.replace(/\/$/, "")}${user.photo}`)
                    }
                    alt="User Photo"
                    className="w-32 h-32 object-cover rounded-full border border-gray-300 shadow mb-3"
                  />
                ) : (
                  <div className="w-32 h-32 grid place-items-center bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 mb-3 text-center">
                    No photo available
                  </div>
                )}

              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">Photo</span>

                {edit && (
                  <div className="flex gap-3 mt-3">

                    {/* Upload File */}
                    <label className="px-4 py-2 bg-gray-600 dark:bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-gray-700 dark:hover:bg-blue-600 transition">
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
                        Capture Photo
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
            <FormInputGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Name"
                placeholder="Enter name"
                value={form.name}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <FormInput
                label="Email"
                placeholder="Enter email"
                type="email"
                value={form.email}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
              <FormInput
                label="Phone"
                placeholder="Enter phone"
                value={form.phone}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              <FormInput
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
              />
              <FormInput
                label="NIK/Passport"
                placeholder="Enter NIK/Passport"
                value={form.nik_passport}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, nik_passport: e.target.value }))}
              />
              <FormInput
                label="Role"
                type="select"
                value={form.role}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'opscan', label: 'Opscan' },
                  { value: 'trainer', label: 'Trainer' },
                  { value: 'instructor', label: 'Instructor' },
                ]}
              />
              <FormInput
                label="Emergency Contact Name"
                placeholder="Enter contact name"
                value={form.emergency_contact_name}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))}
              />
              <FormInput
                label="Emergency Contact Phone"
                placeholder="Enter contact phone"
                value={form.emergency_contact_phone}
                disabled={!edit}
                onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
              />
            </FormInputGroup>

            {/* CHECKIN HISTORY */}
            <div className="mt-8">
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Check-in History
              </label>
              <div className="max-h-56 overflow-y-auto border rounded-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 p-4">
                {checkins.length === 0 ? (
                  <p className="text-gray-700 dark:text-gray-200 text-sm italic">No check-in data yet.</p>
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
            {/* ACTION BUTTONS */}
            <div className="flex justify-between mt-8 ">
              <div className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-6 py-2 rounded-lg font-semibold transition">
                <Link href="/admin/users">Back</Link>
              </div>
              <div className="flex gap-3">
                {!edit ? (
                  <>
                    <button
                      className="bg-gray-600 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
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
            </div>
          </>
          )}
        </div>
      </div>

      {/* Send QR Code Modal */}
      <SendQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        userId={id}
        userEmail={user?.email}
        userName={user?.name}
      />
    </div>
  );
}