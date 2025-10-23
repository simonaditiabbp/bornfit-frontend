'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserDetailPage() {
  const params = useParams();
  const { id } = params;
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '' });
  const [membershipForm, setMembershipForm] = useState({ start_date: '', end_date: '' });
  const [token, setToken] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const tokenData = localStorage.getItem('token');
    setToken(tokenData);
    if (!tokenData) {
      router.replace('/login');
      return;
    }

    const fetchWith401 = async (url) => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tokenData}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
        throw new Error('Unauthorized');
      }
      return res.json();
    };

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const userRes = await fetchWith401(`${API_URL}/api/users/${id}`);
        const membershipRes = await fetchWith401(`${API_URL}/api/memberships`);
        const checkinsRes = await fetchWith401(`${API_URL}/api/checkins/user/${id}`);

        setUser(userRes);
        setMembership(membershipRes.find((m) => m.user_id == id));
        setCheckins(checkinsRes);

        setForm({ name: userRes.name, email: userRes.email, role: userRes.role });
        setMembershipForm({
          start_date: membershipRes.find((m) => m.user_id == id)?.start_date?.slice(0, 10) || '',
          end_date: membershipRes.find((m) => m.user_id == id)?.end_date?.slice(0, 10) || '',
        });
      } catch (err) {
        console.error(err);
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
    let userUpdateSuccess = false;
    if (photo) {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('role', form.role);
      formData.append('photo', photo);
      await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      userUpdateSuccess = true;
    } else {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      userUpdateSuccess = true;
    }
    if (membership) {
      await fetch(`${API_URL}/api/memberships/${membership.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(membershipForm),
      });
    }
    setEdit(false);
    setPhoto(null);
    setPhotoPreview(null);
    if (userUpdateSuccess) {
      // Ambil ulang data user terbaru agar preview langsung update
      const tokenData = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/${id}`, { headers: { Authorization: `Bearer ${tokenData}` } });
      const userRes = await res.json();
      setUser(userRes);
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

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
        {loading ? (
          <div className="text-blue-600 text-center font-medium">Memuat data...</div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-8 text-blue-700 border-b pb-3">
              Detail Member
            </h2>

            {/* PHOTO USER */}
            <div className="flex flex-col items-center mb-8">
  {(photoPreview || user?.photo) ? (
    <img
      src={
        photoPreview ||
        (user.photo.startsWith('http')
          ? user.photo
          : `${API_URL?.replace(/\/$/, '')}${user.photo}`)
      }
      alt="Foto User"
      className="w-32 h-32 object-cover rounded-full border border-gray-300 shadow mb-3"
    />
  ) : (
    <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-full text-gray-400 mb-3">
      Tidak ada foto
    </div>
  )}

  <span className="text-sm text-gray-600 font-medium">Foto</span>

  {edit && (
    <label className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition">
      Pilih Foto
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          setPhoto(e.target.files[0]);
          setPhotoPreview(
            e.target.files[0]
              ? URL.createObjectURL(e.target.files[0])
              : null
          );
        }}
      />
    </label>
  )}

  {photoPreview && (
    <button
      onClick={() => {
        setPhoto(null);
        setPhotoPreview(null);
      }}
      className="mt-2 text-xs text-red-500 hover:underline"
    >
      Hapus foto
    </button>
  )}
</div>

            {/* INFO SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  Nama
                </label>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-lg ${
                    edit ? 'bg-white' : 'bg-gray-100'
                  }`}
                  value={form.name}
                  disabled={!edit}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full p-3 border rounded-lg ${
                    edit ? 'bg-white' : 'bg-gray-100'
                  }`}
                  value={form.email}
                  disabled={!edit}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  Membership Start
                </label>
                <input
                  type="date"
                  className={`w-full p-3 border rounded-lg ${
                    edit ? 'bg-white' : 'bg-gray-100'
                  }`}
                  value={membershipForm.start_date}
                  disabled={!edit}
                  onChange={(e) =>
                    setMembershipForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  Membership End
                </label>
                <input
                  type="date"
                  className={`w-full p-3 border rounded-lg ${
                    edit ? 'bg-white' : 'bg-gray-100'
                  }`}
                  value={membershipForm.end_date}
                  disabled={!edit}
                  onChange={(e) =>
                    setMembershipForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  Role
                </label>
                <select
                  className={`w-full p-3 border rounded-lg ${
                    edit ? 'bg-white' : 'bg-gray-100'
                  }`}
                  value={form.role}
                  disabled={!edit}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="opscan">Opscan</option>
                </select>
              </div>
            </div>

            {/* CHECKIN HISTORY */}
            <div className="mt-8">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Riwayat Checkin
              </label>
              <div className="max-h-56 overflow-y-auto border rounded-lg bg-gray-50 p-4">
                {checkins.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Belum ada data checkin.</p>
                ) : (
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {checkins.map((c) => (
                      <li key={c.id}>
                        {new Date(c.checkin_time).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                        })}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

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
                    Hapus
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={handleSave}
                  >
                    Simpan
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={handleCancel}
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}