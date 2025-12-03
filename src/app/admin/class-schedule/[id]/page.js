'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaUser, FaClock, FaCalendar, FaUsers, FaCheckCircle, FaClock as FaPending, FaBan } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchClassDetail();
    }
  }, [params.id]);

  const fetchClassDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classes/${params.id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClassData(data.data);
      } else {
        alert('Class not found');
        router.push('/admin/class-schedule');
      }
    } catch (error) {
      console.error('Error fetching class detail:', error);
      alert('Error loading class detail');
    }
    setLoading(false);
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString('id-ID', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('id-ID', { 
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Booked': { color: 'bg-yellow-600', icon: FaPending, text: 'Booked' },
      'Checked-in': { color: 'bg-green-600', icon: FaCheckCircle, text: 'Checked In' },
      'Cancelled': { color: 'bg-red-600', icon: FaBan, text: 'Cancelled' },
    };
    const badge = badges[status] || badges['Booked'];
    const Icon = badge.icon;
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${badge.color} text-white`}>
        <Icon className="text-xs" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
        <div className="text-amber-300 text-xl">Loading...</div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
        <div className="text-red-400 text-xl">Class not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 p-5">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/class-schedule"
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
          >
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{classData.name || classData.event_plan.name}</h1>
            <p className="text-gray-400 text-sm">Class Details & Attendance</p>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Class Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Class Info Card */}
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-600">
              <h2 className="text-lg font-bold text-amber-400 mb-4">Class Information</h2>
              
              <div className="space-y-3">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Event Plan</div>
                  <div className="text-gray-200 font-semibold">{classData.event_plan.name}</div>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <FaCalendar className="text-amber-400" />
                  <span>{formatDate(classData.class_date)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <FaClock className="text-amber-400" />
                  <span>{formatTime(classData.start_time)} - {formatTime(classData.end_time)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <FaUser className="text-amber-400" />
                  <div>
                    <div className="text-sm text-gray-400">Instructor</div>
                    <div className="font-semibold">{classData.instructor.name}</div>
                    <div className="text-xs text-gray-500">{classData.instructor.email}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-600">
                  <div className="text-gray-400 text-sm mb-1">Class Type</div>
                  <div className="text-gray-200">{classData.class_type}</div>
                </div>

                {classData.notes && (
                  <div className="pt-3 border-t border-gray-600">
                    <div className="text-gray-400 text-sm mb-1">Notes</div>
                    <div className="text-gray-300 text-sm">{classData.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-600">
              <h2 className="text-lg font-bold text-amber-400 mb-4">Attendance Statistics</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Total Capacity</span>
                  <span className="font-bold text-gray-200">{classData.event_plan.max_visitor}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Total Attendances</span>
                  <span className="font-bold text-green-400">{classData.total_attendances}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Available Slots</span>
                  <span className={`font-bold ${classData.is_full ? 'text-red-400' : 'text-amber-400'}`}>
                    {classData.available_slots}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-600">
                  <div className="text-sm text-gray-400 mb-2">By Status</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaPending className="text-yellow-500" />
                        <span className="text-gray-300 text-sm">Booked</span>
                      </div>
                      <span className="text-gray-200 font-semibold">{classData.attendances_by_status.booked}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-gray-300 text-sm">Checked In</span>
                      </div>
                      <span className="text-gray-200 font-semibold">{classData.attendances_by_status.checked_in}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaBan className="text-red-500" />
                        <span className="text-gray-300 text-sm">Cancelled</span>
                      </div>
                      <span className="text-gray-200 font-semibold">{classData.attendances_by_status.cancelled}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Attendance List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <FaUsers />
                  Member Attendances ({classData.attendances.length})
                </h2>
              </div>

              {classData.attendances.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  No attendances yet
                </div>
              ) : (
                <div className="space-y-3">
                  {classData.attendances.map((attendance, index) => (
                    <div
                      key={attendance.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-200 mb-1">
                              {attendance.member.name}
                            </div>
                            <div className="text-sm text-gray-400 mb-2">
                              {attendance.member.email}
                            </div>
                            {attendance.member.phone && (
                              <div className="text-sm text-gray-400">
                                📱 {attendance.member.phone}
                              </div>
                            )}
                            {attendance.checked_in_at && (
                              <div className="text-xs text-gray-500 mt-2">
                                Checked in: {formatDateTime(attendance.checked_in_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(attendance.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Check-in Info */}
        {classData.total_manual_checkin > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-5 border border-gray-600">
            <div className="flex items-center gap-2 text-gray-300">
              <FaUsers className="text-amber-400" />
              <span className="font-semibold">Manual Check-ins: {classData.total_manual_checkin}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
