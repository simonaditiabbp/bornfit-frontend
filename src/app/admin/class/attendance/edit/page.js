"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaDumbbell, FaTimes } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import LoadingSpin from "@/components/admin/LoadingSpin";
import BackendErrorFallback from '@/components/BackendErrorFallback';
import api from '@/utils/fetchClient';

export default function EditAttendancePage() {
  const [form, setForm] = useState(null);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [edit, setEdit] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const classDropdownRef = useRef(null);
  const memberDropdownRef = useRef(null);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const dataClasses = await api.get(`/api/classattendances/${id}`);
        const data = dataClasses.data;
        const attForm = {
          class_id: data.class_id || "",
          member_id: data.member_id || "",
          checked_in_at: data.checked_in_at ? data.checked_in_at.slice(0, 16) : "",
          status: data.status || "Booked",
          created_by: data.created_by || "",
          updated_by: data.updated_by || ""
        };
        setForm(attForm);
        setInitialForm(attForm);
      } catch (err) {
        if (err.isNetworkError) setBackendError(true);
      }
      setLoading(false);
    };
    
    const fetchAllClasses = async () => {
      try {
        let allClasses = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await api.get(`/api/classes/paginated?page=${currentPage}&limit=100&scheduleType=all&orderBy=start_time&orderDir=asc`);
          
          if (data.data?.classes) {
            allClasses = [...allClasses, ...data.data.classes];
            hasMore = data.data.classes.length === 100;
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filteredClasses = allClasses.filter(cls => {
          if (cls.is_recurring && !cls.parent_class_id) return false;
          if (cls.class_date) {
            const classDate = new Date(cls.class_date);
            return classDate;// >= today;
          }
          return true;
        });
        
        setClasses(filteredClasses);
      } catch (err) {
        // Silently fail - dropdown will be empty but form still usable
      }
    };

    const fetchAllMembers = async () => {
      try {
        let allMembers = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const data = await api.get(`/api/users?page=${currentPage}&limit=100&role=member`);
          
          if (data.data?.users) {
            allMembers = [...allMembers, ...data.data.users];
            hasMore = data.data.users.length === 100;
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        
        // Fetch memberships to filter out Silver plan members
        const membershipData = await api.get('/api/memberships?limit=10000');
        const memberships = membershipData.data?.memberships || [];
        
        // Fetch membership plans to get plan names
        const plansData = await api.get('/api/membership-plans?limit=10000');
        const plans = plansData.data?.membershipPlans || [];
        
        const filteredMembers = allMembers.filter(member => {
          const membership = memberships.find(m => m.user_id === member.id);
          if (!membership) return false; // Tidak pernah punya membership
          
          const plan = plans.find(p => p.id === membership.membership_plan_id);
          if (!plan) return false;
          
          return plan.name.toLowerCase();
        });
        
        setMembers(filteredMembers);
      } catch (err) {
        // Silently fail - dropdown will be empty but form still usable
      }
    };

    if (id) {
      fetchAttendance();
      fetchAllClasses();
      fetchAllMembers();
    }
  }, [id]);

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

  // Update search when form data loaded and when edit mode changes
  useEffect(() => {
    if (form && classes.length > 0 && form.class_id) {
      const selectedClass = classes.find(c => c.id == form.class_id);
      if (selectedClass) {
        const displayText = formatClassDisplay(selectedClass);
        // Only update if different to avoid infinite loop
        if (classSearch !== displayText) {
          setClassSearch(displayText);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.class_id, classes]);

  useEffect(() => {
    if (form && members.length > 0 && form.member_id) {
      const selectedMember = members.find(m => m.id == form.member_id);
      if (selectedMember) {
        const displayText = selectedMember.name || selectedMember.email || `Member #${selectedMember.id}`;
        // Only update if different to avoid infinite loop
        if (memberSearch !== displayText) {
          setMemberSearch(displayText);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.member_id, members]);

  function formatClassDisplay(cls) {
    let display = cls.event_plan.name || `Class #${cls.id}`;
    if (cls.instructor && cls.instructor.name) {
      display += ` - ${cls.instructor.name}`;
    }
    /*if (cls.class_date) {
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
    }*/
    return display;
  }

  function handleSelectClass(cls) {
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


  const handleEdit = (e) => {
    e.preventDefault();
    setEdit(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
    setForm(initialForm);
    // Reset search to initial values
    if (initialForm && classes.length > 0 && members.length > 0) {
      const selectedClass = classes.find(c => c.id == initialForm.class_id);
      const selectedMember = members.find(m => m.id == initialForm.member_id);
      if (selectedClass) setClassSearch(formatClassDisplay(selectedClass));
      if (selectedMember) setMemberSearch(selectedMember.name || selectedMember.email || `Member #${selectedMember.id}`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      // Check class capacity before submitting (only if class_id changed)
      const selectedClass = classes.find(c => c.id == form.class_id);
      if (selectedClass && form.class_id !== initialForm.class_id) {
        // Fetch class attendance count for the specific class
        const attendanceData = await api.get('/api/classattendances?limit=10000');
        // Filter attendance untuk class yang dipilih saja, exclude yang Cancelled, dan exclude current attendance
        const currentAttendance = attendanceData.data?.attendances?.filter(
          a => a.class_id === form.class_id && a.status !== 'Cancelled' && a.id !== parseInt(id)
        ).length || 0;
        
        // Fetch event plan to get max_visitor
        const planData = await api.get(`/api/eventplans/${selectedClass.event_plan_id}`);
        const maxVisitor = planData.data?.max_visitor || 0;

        if (maxVisitor > 0 && currentAttendance >= maxVisitor) {
          setError(`Class is full! Maximum capacity: ${maxVisitor} people, Current: ${currentAttendance} people`);
          setFormLoading(false);
          alert(
            `Class is full!\n\n` +
            `Maximum capacity: ${maxVisitor} people\n` +
            `Current number of participants: ${currentAttendance} people\n\n` +
            `Please choose another class or contact the admin to increase the capacity.`
          );
          return;
        }
      }
      
      let checkedInAtIso = form.checked_in_at;
      if (checkedInAtIso && checkedInAtIso.length === 16) {
        checkedInAtIso = checkedInAtIso + ':00.000Z';
      }
      await api.put(`/api/classattendances/${id}`, {
        class_id: Number(form.class_id),
        member_id: Number(form.member_id),
        checked_in_at: checkedInAtIso,
        status: form.status,
        created_by: form.created_by,
        updated_by: form.updated_by
      });
      setSuccess("Attendance updated");
      setEdit(false);
      // Update initial form with new values
      setInitialForm(form);
    } catch (err) {      
      setError(err.data?.message || 'Failed to update attendance');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this attendance?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/api/classattendances/${id}`);
      router.push('/admin/class/attendance');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete attendance');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;
  }
  
  if (loading || !form) return <LoadingSpin />;

  return (
    <div>
      <PageBreadcrumb
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Class Attendance', href: '/admin/class/attendance' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Class Attendance Details</h1>
          <ActionButton
            variant="gray"
            href="/admin/class/attendance"
          >
            Back
          </ActionButton>
        </div>             
        <form onSubmit={handleSave} className="space-y-4 mb-4">
          {/* Searchable Class Dropdown */}
          <div className="mb-4 relative" ref={classDropdownRef}>
            <label className="block mb-2 text-gray-800 dark:text-gray-200 font-medium text-sm">Class <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search class..."
                className={`w-full px-3 py-2 border rounded-lg ${edit ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-amber-400' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed'}`}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                onFocus={() => edit && setShowClassDropdown(true)}
                disabled={!edit}
                required
              />
              {classSearch && edit && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => {
                    setClassSearch("");
                    setForm(prev => ({ ...prev, class_id: "" }));
                  }}
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {showClassDropdown && edit && (
              <div className="absolute z-50 w-full mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map(cls => (
                    <div
                      key={cls.id}
                      className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      onClick={() => handleSelectClass(cls)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className={`${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} font-medium`}>{cls.event_plan.name || `Class #${cls.id}`}</div>
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
            <label className="block mb-2 text-gray-800 dark:text-gray-200 font-medium text-sm">Member <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search member..."
                className={`w-full px-3 py-2 border rounded-lg ${edit ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-amber-400' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed'}`}
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onFocus={() => edit && setShowMemberDropdown(true)}
                disabled={!edit}
                required
              />
              {memberSearch && edit && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => {
                    setMemberSearch("");
                    setForm(prev => ({ ...prev, member_id: "" }));
                  }}
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {showMemberDropdown && edit && (
              <div className="absolute z-50 w-full mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map(m => (
                    <div
                      key={m.id}
                      className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
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
            onChange={e => setForm(f => ({ ...f, checked_in_at: e.target.value }))}
            disabled={!edit}
            required
          />
          <FormInput
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            disabled={!edit}
            options={[
              { value: 'booked', label: 'Booked' },
              { value: 'checked_in', label: 'Checked-in' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
          {success && <div className="text-green-400 mb-2">{success}</div>}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="flex gap-3 mt-8 justify-start">
            {!edit ? (
              <>
                <ActionButton variant="primary" onClick={handleEdit}>Edit</ActionButton>
                <ActionButton variant="danger" onClick={handleDelete} disabled={formLoading}>Delete</ActionButton>
              </>
            ) : (
              <>
                <ActionButton type="submit" disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</ActionButton>
                <ActionButton variant="gray" onClick={handleCancel}>Cancel</ActionButton>
              </>
            )}
          </div>
        </form>
      </PageContainerInsert>
    </div>
  );
}
