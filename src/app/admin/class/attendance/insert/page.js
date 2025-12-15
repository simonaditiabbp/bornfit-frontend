"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaDumbbell, FaSearch, FaTimes } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';

export default function InsertAttendancePage() {
  const now = new Date();
  const nowPlus7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('class_id');

  const initialFormState = {
    class_id: "",
    member_id: "",
    checked_in_at: nowPlus7.toISOString().slice(0,16),
    status: "Booked",
    created_by: "",
    updated_by: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [classSearch, setClassSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const classDropdownRef = useRef(null);
  const memberDropdownRef = useRef(null);
  const theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';

  const handleReset = () => {
    const nowPlus7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    setForm({
      ...initialFormState,
      checked_in_at: nowPlus7.toISOString().slice(0,16)
    });
    setClassSearch("");
    setMemberSearch("");
    setError("");
  };

  // Fetch all classes with pagination
  useEffect(() => {
    const fetchAllClasses = async () => {
      try {
        let allClasses = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await api.get(`/api/classes/paginated?page=${currentPage}&limit=1000&scheduleType=all`);
          
          if (data.data?.classes) {
            allClasses = [...allClasses, ...data.data.classes];
            // Check if there are more pages
            hasMore = data.data.classes.length === 1000;
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        
        // Filter only non-recurring patterns and future/today classes
        const today = new Date();
        today.setHours(7, 0, 0, 0); // fix bug -> Set to 7 AM WIB
        const filteredClasses = allClasses.filter(cls => {
          if (cls.is_recurring && !cls.parent_class_id) return false; // Skip recurring patterns
          if (cls.class_date) {
            const classDate = new Date(cls.class_date);
            return classDate >= today;
          }
          return true;
        });
        
        setClasses(filteredClasses);
      } catch (err) {
        // Silently fail - dropdown will be empty but form still usable
      }
    };
    fetchAllClasses();
  }, []);

  // Fetch all members with pagination
  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        let allMembers = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await api.get(`/api/users?page=${currentPage}&limit=1000&role=member`);
          
          if (data.data?.users) {
            allMembers = [...allMembers, ...data.data.users];
            hasMore = data.data.users.length === 100;
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        
        // Fetch memberships to filter out Silver plan members
        const membershipData = await api.get('/api/memberships?limit=1000');
        const memberships = membershipData.data?.memberships || [];
        
        // Fetch membership plans to get plan names
        const plansData = await api.get('/api/membership-plans?limit=1000');
        const plans = plansData.data?.membershipPlans || [];

        // Filter members - exclude those with Silver plan
        const filteredMembers = allMembers.filter(member => {
          const membership = memberships.find(m => m.user_id === member.id && m.is_active);
          if (!membership) return false; // No active membership
          
          const plan = plans.find(p => p.id === membership.membership_plan_id);
          if (!plan) return false;
          
          // Exclude Silver plan (case insensitive)
          return plan.name.toLowerCase() !== 'silver';
        });
        
        setMembers(filteredMembers);
      } catch (err) {
        // Silently fail - dropdown will be empty but form still usable
      }
    };
    fetchAllMembers();
  }, []);

  // Helper function to format class display
  const formatClassDisplay = useCallback((cls) => {
    let display = cls.name || `Class #${cls.id}`;
    if (cls.class_date) {
      // Parse date without timezone conversion
      const dateStr = cls.class_date.split('T')[0];
      const [year, month, day] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      display += ` - ${day} ${monthNames[parseInt(month) - 1]} ${year}`;
    }
    if (cls.start_time) {
      // Use UTC to prevent timezone shift
      const time = new Date(cls.start_time);
      const hours = time.getUTCHours().toString().padStart(2, '0');
      const minutes = time.getUTCMinutes().toString().padStart(2, '0');
      display += ` ${hours}:${minutes}`;
    }
    if (cls.end_time) {
      // Use UTC to prevent timezone shift
      const time = new Date(cls.end_time);
      const hours = time.getUTCHours().toString().padStart(2, '0');
      const minutes = time.getUTCMinutes().toString().padStart(2, '0');
      display += `-${hours}:${minutes}`;
    }
    return display;
  }, []);

  // Handler to select class
  const handleSelectClass = useCallback((cls) => {
    setForm(prev => ({ ...prev, class_id: cls.id }));
    setClassSearch(formatClassDisplay(cls));
    setShowClassDropdown(false);

    // Auto-set checked_in_at based on class date and time
    if (cls.class_date && cls.start_time) {
      // Parse class_date (YYYY-MM-DD)
      const dateStr = cls.class_date.split('T')[0];
      
      // Parse start_time using UTC to prevent timezone shift
      const startTime = new Date(cls.start_time);
      const hours = startTime.getUTCHours().toString().padStart(2, '0');
      const minutes = startTime.getUTCMinutes().toString().padStart(2, '0');
      
      // Combine date and time
      const checkedInAt = `${dateStr}T${hours}:${minutes}`;
      setForm(prev => ({ ...prev, checked_in_at: checkedInAt }));
    }
  }, [formatClassDisplay]);

  // Auto-select class if preselected from query parameter
  useEffect(() => {
    if (preselectedClassId && classes.length > 0 && !form.class_id) {
      const selectedClass = classes.find(cls => cls.id === parseInt(preselectedClassId));
      if (selectedClass) {
        handleSelectClass(selectedClass);
      }
    }
  }, [preselectedClassId, classes, form.class_id, handleSelectClass]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target)) {
        setShowClassDropdown(false);
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSelectMember(member) {
    setForm(prev => ({ ...prev, member_id: member.id }));
    setMemberSearch(member.name || member.email || `Member #${member.id}`);
    setShowMemberDropdown(false);
  }

  const filteredClasses = classes.filter(cls => {
    const display = formatClassDisplay(cls).toLowerCase();
    return display.includes(classSearch.toLowerCase());
  });

  const filteredMembers = members.filter(m => {
    const name = (m.name || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    const search = memberSearch.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Check class capacity before submitting
      const selectedClass = classes.find(c => c.id == form.class_id);
      if (selectedClass) {
        // Fetch class attendance count for the specific class
        const attendanceData = await api.get('/api/classattendances?limit=1000');
        // Filter attendance untuk class yang dipilih saja dan exclude yang Cancelled
        const currentAttendance = attendanceData.data?.attendances?.filter(
          a => a.class_id === form.class_id && a.status !== 'Cancelled'
        ).length || 0;
        
        // Fetch event plan to get max_visitor
        const planData = await api.get(`/api/eventplans/${selectedClass.event_plan_id}`);
        const maxVisitor = planData.data?.max_visitor || 0;

        if (maxVisitor > 0 && currentAttendance >= maxVisitor) {
          setError(`Class sudah penuh! Kapasitas maksimal: ${maxVisitor} orang, Saat ini: ${currentAttendance} orang`);
          setLoading(false);
          alert(`Class sudah penuh!\n\nKapasitas maksimal: ${maxVisitor} orang\nJumlah peserta saat ini: ${currentAttendance} orang\n\nSilakan pilih class lain atau hubungi admin untuk menambah kapasitas.`);
          return;
        }
      }
      
      // Format checked_in_at to ISO-8601 (add seconds and Z)
      let checkedInAtIso = form.checked_in_at;
      if (checkedInAtIso && checkedInAtIso.length === 16) {
        checkedInAtIso = checkedInAtIso + ':00.000Z';
      }
      
      await api.post('/api/classattendances', {
        class_id: Number(form.class_id),
        member_id: Number(form.member_id),
        checked_in_at: checkedInAtIso,
        status: form.status,
      });
      
      router.push("/admin/class/attendance");
    } catch (err) {
      console.log("Error submitting attendance:", err);
      setError(err.message || "Gagal menyimpan attendance");
    }
    setLoading(false);
  }

  return (
    <div>
      <PageBreadcrumb
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Attendance', href: '/admin/class/attendance' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create Class Attendance</h1>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          {/* Searchable Class Dropdown */}
          <div className="mb-4 relative" ref={classDropdownRef}>
            <label className="block mb-2 text-gray-800 dark:text-gray-200 font-semibold">Class *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search class..."
                className="w-full border border-gray-300 dark:border-gray-600 p-3 pr-10 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-amber-400"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                onFocus={() => setShowClassDropdown(true)}
              />
              {classSearch && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  onClick={() => {
                    setClassSearch("");
                    setForm(prev => ({ ...prev, class_id: "" }));
                  }}
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {showClassDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map(cls => (
                    <div
                      key={cls.id}
                      className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      onClick={() => handleSelectClass(cls)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className={`${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} font-medium`}>{cls.name || `Class #${cls.id}`}</div>
                          <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-sm mt-1`}>
                            {cls.instructor?.name && (
                              <span>👤 {cls.instructor.name}</span>
                            )}
                          </div>
                          <div className={`${theme === 'light' ? 'text-gray-800' : 'text-gray-400'} text-sm mt-1`}>
                            {cls.class_date && (() => {
                              const dateStr = cls.class_date.split('T')[0];
                              const [year, month, day] = dateStr.split('-');
                              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                              const date = new Date(year, parseInt(month) - 1, parseInt(day));
                              const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                              return `📅 ${dayNames[date.getDay()]}, ${day} ${monthNames[parseInt(month) - 1]} ${year}`;
                            })()}
                            {cls.start_time && (() => {
                              const time = new Date(cls.start_time);
                              const hours = time.getUTCHours().toString().padStart(2, '0');
                              const minutes = time.getUTCMinutes().toString().padStart(2, '0');
                              return ` • ⏰ ${hours}:${minutes}`;
                            })()}
                            {cls.end_time && (() => {
                              const time = new Date(cls.end_time);
                              const hours = time.getUTCHours().toString().padStart(2, '0');
                              const minutes = time.getUTCMinutes().toString().padStart(2, '0');
                              return `-${hours}:${minutes}`;
                            })()}
                          </div>
                        </div>
                        {cls.class_type && (
                          <div className={`${theme === 'light' ? 'text-gray-500 bg-gray-200' : 'text-gray-400 bg-gray-700'} text-xs px-2 py-1 rounded`}>
                            {cls.class_type}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} p-3 text-center`}>No classes found</div>
                )}
              </div>
            )}
          </div>

          {/* Searchable Member Dropdown */}
          <div className="mb-4 relative" ref={memberDropdownRef}>
            <label className="block mb-2 text-gray-800 dark:text-gray-200 font-semibold">Member *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search member..."
                className="w-full border border-gray-300 dark:border-gray-600 p-3 pr-10 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-amber-400"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onFocus={() => setShowMemberDropdown(true)}
              />
              {memberSearch && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  onClick={() => {
                    setMemberSearch("");
                    setForm(prev => ({ ...prev, member_id: "" }));
                  }}
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {showMemberDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map(m => (
                    <div
                      key={m.id}
                      className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      onClick={() => handleSelectMember(m)}
                    >
                      <div className={`${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} font-medium`}>{m.name || `Member #${m.id}`}</div>
                      {m.email && <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-sm`}>{m.email}</div>}
                    </div>
                  ))
                ) : (
                  <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} p-3 text-center`}>No members found</div>
                )}
              </div>
            )}
          </div>
          <FormInput
            label="Checked In At"
            name="checked_in_at"
            type="datetime-local"
            value={form.checked_in_at}
            onChange={handleChange}
          />
          <FormInput
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={handleChange}
            options={[
              { value: 'booked', label: 'Booked' },
              { value: 'checked_in', label: 'Checked-in' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
          <FormActions
            onSubmit={handleSubmit}
            onReset={handleReset}
            cancelHref="/admin/class/attendance"
            loading={loading}
            disabled={!form.class_id || !form.member_id}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
