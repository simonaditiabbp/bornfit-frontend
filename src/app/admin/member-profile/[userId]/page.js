'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/fetchClient';
import BackendErrorFallback from '@/components/BackendErrorFallback';
import { FaUser, FaPlus, FaEdit, FaTrash, FaIdCard, FaDumbbell, FaCalendarCheck, FaHistory, FaClipboardList } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText, StyledDataTable } from '@/components/admin';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log('API_URL:', API_URL);

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;
  
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [ptSessions, setPtSessions] = useState([]);
  const [ptBookings, setPtBookings] = useState([]);
  const [classAttendances, setClassAttendances] = useState([]);
  const [classPurchases, setClassPurchases] = useState([]);
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  // Fetch all user data
  useEffect(() => {
    if (!userId) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      setBackendError(false);
      
      try {
        // Fetch user details
        const userData = await api.get(`/api/users/${userId}`);
        setUser(userData.data || null);
        
        // Fetch memberships for this user using /member/ route with allStatus parameter to show all memberships (including expired)
        const membershipData = await api.get(`/api/memberships/member/${userId}?allStatus=true`);
        setMemberships(membershipData.data || []);
        
        // Fetch PT sessions for this user
        const ptSessionData = await api.get(`/api/personaltrainersessions/paginated?userId=${userId}&limit=100`);
        setPtSessions(ptSessionData.data?.sessions || []);
        
        // Fetch PT bookings for this user
        const ptBookingData = await api.get(`/api/ptsessionbookings/paginated?userId=${userId}&limit=100`);
        setPtBookings(ptBookingData.data?.bookings || []);
        
        // Fetch class attendances for this user
        const classAttendanceData = await api.get(`/api/classattendances/paginated?userId=${userId}&limit=100`);
        setClassAttendances(classAttendanceData.data?.attendances || []);
        
        // Fetch class purchases for this user
        const classPurchaseData = await api.get(`/api/classpurchases?user_id=${userId}&limit=100`);
        setClassPurchases(classPurchaseData.data?.purchases || []);
        
        // Fetch checkin logs for this user
        const checkinData = await api.get(`/api/checkins/user/${userId}?limit=100`);
        setCheckinLogs(checkinData || []);
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.isNetworkError) {
          setBackendError(true);
        }
      }
      
      setLoading(false);
    };
    
    fetchUserData();
  }, [userId]);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return dayjs(date).subtract(7, 'hour').format('DD/MM/YYYY HH:mm');
  };

  const hasActiveMembership = () => {
    return memberships.some(membership => membership.status === 'active');
  };

  const hasActivePTSession = () => {
    return ptSessions.some(session => session.status === 'active');
  };

  // Check if active membership allows class access
  const canAccessClass = () => {
    const activeMembership = memberships.find(membership => membership.status === 'active');
    if (!activeMembership) return false;
    
    const plan = activeMembership.membershipPlan;
    if (!plan) return false;
    
    // Check if level is 5 or plan name contains "silver" (case insensitive)
    const isSilverOrLevel5 = plan.level === 5 || plan.name?.toLowerCase().includes('silver');
    
    return !isSilverOrLevel5; // Return false if it's silver or level 5
  };

  const handleAddPTSession = () => {
    if (!hasActiveMembership()) {
      Swal.fire({
        title: 'No Active Membership',
        text: 'Members must have an active membership before they can create a PT session.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    router.push(`/admin/pt/session/insert?member_id=${userId}`);
  };

  // Handle PT Booking button click
  const handleAddPTBooking = () => {
    if (!hasActiveMembership()) {
      Swal.fire({
        title: 'No Active Membership',
        text: 'Members must have an active membership before they can create a PT booking.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!hasActivePTSession()) {
      Swal.fire({
        title: 'No Active PT Session',
        text: 'Members must have an active PT session before they can create a PT booking.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    router.push(`/admin/pt/booking/create?member_id=${userId}`);
  };

  const handleAddClassAttendance = () => {
    if (!hasActiveMembership()) {
      Swal.fire({
        title: 'No Active Membership',
        text: 'Members must have an active membership before they can join a class.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    
    if (!canAccessClass()) {
      Swal.fire({
        title: 'Membership Not Eligible',
        html: 'The member’s current membership plan does not allow them to join classes.<br><br>Members must purchase <strong>Class Purchase</strong> first in order to join a class.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    
    router.push(`/admin/class/attendance/insert?member_id=${userId}`);
  };

  // Membership columns
  const membershipColumns = [
    {
      name: 'Plan',
      selector: row => row.membershipPlan?.name || '-',
      sortable: true,
    },
    {
      name: 'Start Date',
      selector: row => formatDate(row.start_date),
      sortable: true,
    },
    {
      name: 'End Date',
      selector: row => formatDate(row.end_date),
      sortable: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'frozen' ? 'bg-blue-100 text-blue-800' :
          row.status === 'expired' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/membership/session/edit/${row.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm text-xs font-medium"
            title="Edit Membership"
          >
            <FaEdit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => handleDeleteMembership(row.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm text-xs font-medium"
            title="Delete Membership"
          >
            <FaTrash className="w-3 h-3" />
            Delete
          </button>
        </div>
      ),
      width: '180px',
    },
  ];

  // PT Session columns
  const ptSessionColumns = [
    {
      name: 'Plan',
      cell: row => row.pt_session_plan?.name || '-',
      sortable: true,
    },
    {
      name: 'Trainer',
      cell: row => row.user_pt?.name || '-',
      sortable: true,
    },
    {
      name: 'Start Date',
      cell: row => formatDate(row.start_date),
      sortable: true,
    },
    {
      name: 'End Date',
      cell: row => formatDate(row.end_date),
      sortable: true,
    },
    {
      name: 'Sessions',
      cell: row => {
        const max = row.pt_session_plan ? row.pt_session_plan.max_session : '...';
        const sisa = typeof row.remaining_session === 'number' ? row.remaining_session : '...';
        return `${sisa} of ${max} sessions remaining`;
      },
      sortable: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'expired' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/pt/session/edit?id=${row.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm text-xs font-medium"
            title="Edit PT Session"
          >
            <FaEdit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => handleDeletePTSession(row.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm text-xs font-medium"
            title="Delete PT Session"
          >
            <FaTrash className="w-3 h-3" />
            Delete
          </button>
        </div>
      ),
      width: '180px',
    },
  ];

  // PT Booking columns
  const ptBookingColumns = [
    {
       name: 'PT Session Plan',
       cell: row => row.personal_trainer_session?.pt_session_plan?.name || '-',
       sortable: true,
    },    
    {
      name: 'Trainer',
      cell: row => row.personal_trainer_session?.user_pt?.name || '-',
      sortable: true,
    },
    {
      name: 'Date',
      cell: row => formatDateTime(row.booking_time),
      sortable: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'booked' ? 'bg-blue-100 text-blue-800' :
          row.status === 'completed' ? 'bg-green-100 text-green-800' :
          row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    // {
    //   name: 'Check-in',
    //   selector: row => row.checkin_time ? formatDateTime(row.checkin_time) : '-',
    //   sortable: true,
    // },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/pt/booking/edit?id=${row.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm text-xs font-medium"
            title="Edit PT Booking"
          >
            <FaEdit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => handleDeletePTBooking(row.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm text-xs font-medium"
            title="Delete PT Booking"
          >
            <FaTrash className="w-3 h-3" />
            Delete
          </button>
        </div>
      ),
      width: '180px',
    },
  ];

  // Class Purchase columns
  const classPurchaseColumns = [
    {
      name: 'Class Plan',
      cell: row => row.class?.event_plan?.name || '-',
      sortable: true,
    },
    {
      name: 'Purchase Date',
      cell: row => formatDate(row.purchase_date),
      sortable: true,
    },
    {
      name: 'Instructor/Trainer',
      cell: row => row.class?.instructor?.name || row.class?.trainer?.name || '-',
      sortable: true,
    },
    {
      name: 'Price',
      cell: row => row.price ? `${row.price}` : '-',
      sortable: true,
    },
    {
      name: 'Max Capacity',
      cell: row => row.class?.event_plan?.max_visitor ? `${row.class.event_plan.max_visitor} people` : '-',
      sortable: true,
    },
    // {
    //   name: 'Status',
    //   selector: row => row.status,
    //   sortable: true,
    //   cell: row => (
    //     <span className={`px-2 py-1 rounded text-xs font-semibold ${
    //       row.status === 'active' ? 'bg-green-100 text-green-800' :
    //       row.status === 'expired' ? 'bg-red-100 text-red-800' :
    //       'bg-gray-100 text-gray-800'
    //     }`}>
    //       {row.status}
    //     </span>
    //   ),
    // },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/class/classpurchase/edit?id=${row.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm text-xs font-medium"
            title="Edit Class Purchase"
          >
            <FaEdit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => handleDeleteClassPurchase(row.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm text-xs font-medium"
            title="Delete Class Purchase"
          >
            <FaTrash className="w-3 h-3" />
            Delete
          </button>
        </div>
      ),
      width: '180px',
    },
  ];

  // Class Attendance columns
  const classAttendanceColumns = [
    {
      name: 'Class Plan',
      cell: row => row.class?.event_plan?.name || '-',
      sortable: true,
    },
    {
      name: 'Class Date',
      cell: row => formatDateTime(row.class?.start_time),
      sortable: true,
    },
    {
      name: 'Instructor/Trainer',
      cell: row => row.class?.instructor?.name || row.class?.trainer?.name || '-',
      sortable: true,
    },
    {
      name: 'Check-in',
      cell: row => row.checked_in_at ? formatDateTime(row.checked_in_at) : '-',
      sortable: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'attended' ? 'bg-green-100 text-green-800' :
          row.status === 'booked' ? 'bg-blue-100 text-blue-800' :
          row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => handleDeleteClassAttendance(row.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm text-xs font-medium"
            title="Delete Class Attendance"
          >
            <FaTrash className="w-3 h-3" />
            Delete
          </button>
        </div>
      ),
      width: '150px',
    },
  ];

  // Checkin Log columns
  const checkinLogColumns = [
    {
      name: 'Date & Time',
      cell: row => formatDateTime(row.checkin_time),
      sortable: true,
    //   width: '180px',
    },
    {
      name: 'Member',
      cell: row => row.user?.name || '-',
      sortable: true,
    //   width: '150px',
    },
    {
      name: 'Active Membership',
      cell: row => {
        // Cari membership yang active
        const activeMembership = row.user?.memberships?.find(m => m.status === 'active');
        return activeMembership?.membershipPlan?.name || '-';
      },
      sortable: true,
      cell: row => {
        const activeMembership = row.user?.memberships?.find(m => m.status === 'active');
        const membershipName = activeMembership?.membershipPlan?.name || '-';
        return (
          <span className={activeMembership ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500'}>
            {membershipName}
          </span>
        );
      },
    },
    {
      name: 'Location',
      selector: row => row.latitude && row.longitude ? `${row.latitude.toFixed(6)}, ${row.longitude.toFixed(6)}` : '-',
      sortable: true,
      width: '150px',
      cell: row => {
        if (row.latitude && row.longitude) {
          return (
            <a 
              href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors shadow-sm text-xs font-medium"
              title="View location on Google Maps"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              View Map
            </a>
          );
        }
        return <span className="text-gray-400 text-xs">No location</span>;
      },
    },
    {
      name: 'Status',
      cell: row => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          Checked In
        </span>
      ),
      width: '120px',
    },
  ];

  // Delete handlers
  const handleDeleteMembership = async (id) => {
    if (!confirm('Are you sure you want to delete this membership?')) return;
    
    try {
      await api.delete(`/api/memberships/${id}`);
      setMemberships(prev => prev.filter(m => m.id !== id));
      alert('Membership deleted successfully');
    } catch (err) {
      alert('Failed to delete membership: ' + (err.data?.message || err.message));
    }
  };

  const handleDeletePTSession = async (id) => {
    if (!confirm('Are you sure you want to delete this PT session?')) return;
    
    try {
      await api.delete(`/api/personaltrainersessions/${id}`);
      setPtSessions(prev => prev.filter(s => s.id !== id));
      alert('PT Session deleted successfully');
    } catch (err) {
      alert('Failed to delete PT session: ' + (err.data?.message || err.message));
    }
  };

  const handleDeletePTBooking = async (id) => {
    if (!confirm('Are you sure you want to delete this PT booking?')) return;
    
    try {
      await api.delete(`/api/ptsessionbookings/${id}`);
      setPtBookings(prev => prev.filter(b => b.id !== id));
      alert('PT Booking deleted successfully');
    } catch (err) {
      alert('Failed to delete PT booking: ' + (err.data?.message || err.message));
    }
  };

  const handleDeleteClassAttendance = async (id) => {
    if (!confirm('Are you sure you want to delete this class attendance?')) return;
    
    try {
      await api.delete(`/api/classattendances/${id}`);
      setClassAttendances(prev => prev.filter(a => a.id !== id));
      alert('Class attendance deleted successfully');
    } catch (err) {
      alert('Failed to delete class attendance: ' + (err.data?.message || err.message));
    }
  };

  const handleDeleteClassPurchase = async (id) => {
    if (!confirm('Are you sure you want to delete this class purchase?')) return;
    
    try {
      await api.delete(`/api/classpurchases/${id}`);
      setClassPurchases(prev => prev.filter(p => p.id !== id));
      alert('Class purchase deleted successfully');
    } catch (err) {
      alert('Failed to delete class purchase: ' + (err.data?.message || err.message));
    }
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div>
        <PageBreadcrumb 
          items={[
            { icon: <FaUser className="w-3 h-3" />, label: 'Member Profile' }
          ]}
        />
        <PageContainer>
          <LoadingText />
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageBreadcrumb 
          items={[
            { icon: <FaUser className="w-3 h-3" />, label: 'Member Profile' }
          ]}
        />
        <PageContainer>
          <div className="text-center text-gray-600 dark:text-gray-400">
            User not found
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaUser className="w-3 h-3" />, label: 'Member Profile', href: '/admin/users' },
          { label: user.name }
        ]}
      />
      
      <PageContainer>
        {/* User Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {console.log('User photo:', user.photo)}
              {console.log('Constructed photo URL:', user.photo ? (user.photo.startsWith("http") ? user.photo : `${API_URL?.replace(/\/$/, "")}${user.photo}`) : 'No photo')}
              {user.photo ? (
                <img 
                  src={user.photo.startsWith("http")
                        ? user.photo
                        : `${API_URL?.replace(/\/$/, "")}${user.photo}`} 
                  alt={user.name} 
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <FaUser className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium">{user.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Role:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium capitalize">{user.role}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date of Birth:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium">{formatDate(user.date_of_birth)}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Gender:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium capitalize">{user.gender || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Address:</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium">{user.address || '-'}</span>
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={() => router.push(`/admin/users/${userId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <FaEdit />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Membership History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaIdCard className="text-blue-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Membership History ({memberships.length})
              </h3>
            </div>
            <button
              onClick={() => router.push(`/admin/membership/session/insert?member_id=${userId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              <FaPlus />
              Add Membership
            </button>
          </div>
          {memberships.length > 0 ? (
            <StyledDataTable
              columns={membershipColumns}
              data={memberships}
              pagination
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
            />
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 py-4">
              No membership history found
            </div>
          )}
        </div>

        {/* PT Session History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaDumbbell className="text-purple-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                PT Session History ({ptSessions.length})
              </h3>
            </div>
            <button
              onClick={handleAddPTSession}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              <FaPlus />
              Add PT Session
            </button>
          </div>
          {ptSessions.length > 0 ? (
            <StyledDataTable
              columns={ptSessionColumns}
              data={ptSessions}
              pagination
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
            />
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 py-4">
              No PT session history found
            </div>
          )}
        </div>

        {/* PT Booking History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaCalendarCheck className="text-orange-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                PT Booking History ({ptBookings.length})
              </h3>
            </div>
            <button
              onClick={handleAddPTBooking}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              <FaPlus />
              Add PT Booking
            </button>
          </div>
          {ptBookings.length > 0 ? (
            <StyledDataTable
              columns={ptBookingColumns}
              data={ptBookings}
              pagination
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
            />
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 py-4">
              No PT booking history found
            </div>
          )}
        </div>        

        {/* Class Attendance History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaHistory className="text-teal-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Class Attendance History ({classAttendances.length})
              </h3>
            </div>
            <button
              onClick={handleAddClassAttendance}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              <FaPlus />
              Add Class Attendance
            </button>
          </div>
          {classAttendances.length > 0 ? (
            <StyledDataTable
              columns={classAttendanceColumns}
              data={classAttendances}
              pagination
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
            />
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 py-4">
              No class attendance history found
            </div>
          )}
        </div>

        {/* Class Purchase History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaDumbbell className="text-purple-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Class Purchase History ({classPurchases.length})
              </h3>
            </div>
            <button
              onClick={() => router.push(`/admin/class/classpurchase/insert?member_id=${userId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              <FaPlus />
              Add Class Purchase
            </button>
          </div>
          {classPurchases.length > 0 ? (
            <StyledDataTable
              columns={classPurchaseColumns}
              data={classPurchases}
              pagination
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
            />
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 py-4">
              No class purchase history found
            </div>
          )}
        </div>

        {/* Membership Check-in History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaClipboardList className="text-indigo-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Membership Check-in History ({checkinLogs.length})
              </h3>
            </div>
          </div>
          {console.log('Check-in Logs:', checkinLogs)}
          {checkinLogs.length > 0 ? (
            <StyledDataTable
              columns={checkinLogColumns}
              data={checkinLogs}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 30, 50]}
            />
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400 py-4">
              No check-in history found
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
