'use client';
import { useState, useEffect } from 'react';
import { FaCalendar, FaPlus, FaTrash, FaChevronLeft, FaChevronRight, FaFilter } from 'react-icons/fa';
import api from '@/utils/fetchClient';
import LoadingSpin from '@/components/admin/LoadingSpin';
import { FormInput } from '@/components/admin';

export default function StaffScheduleCalendarPage() {
  const [schedules, setSchedules] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    schedule_date: '',
    start_time: '',
    end_time: '',
    schedule_type: 'available',
    title: '',
    notes: '',
  });

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, selectedStaff, viewMode]);

  const fetchStaffMembers = async () => {
    try {
      const data = await api.get('/api/staff-schedules/staff-members?limit=10000');
      if (data.status) {
        setStaffMembers(data.data);
      }
    } catch (error) {
      // Silently fail - staff filter will be empty
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      let url = `/api/staff-schedules/combined?start_date=${startDate}&end_date=${endDate}&limit=10000`;
      if (selectedStaff.length > 0) {
        url += `&staff_ids=${selectedStaff.join(',')}`;
      }
      
      const data = await api.get(url);
      if (data.status) {
        setSchedules(data.data);
      }
    } catch (error) {
      // Error handled by fetchClient
    }
    setLoading(false);
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    let end = new Date(currentDate);
    
    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    
    // Format dates manually to avoid timezone conversion
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      start,
      end,
    };
  };

  const getDisplayDays = () => {
    const { start, end } = getDateRange();
    const days = [];
    const current = new Date(start);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getWeekRange = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      start,
      end,
    };
  };

  const getWeekDays = () => {
    const { start } = getWeekRange();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getSchedulesForDayAndTime = (day, timeSlot) => {
    // Format day as YYYY-MM-DD without timezone conversion
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(day.getDate()).padStart(2, '0');
    const dayStr = `${year}-${month}-${dayOfMonth}`;
    
    const [hour] = timeSlot.split(':');
    
    return schedules.filter(schedule => {
      // Parse start_time date without timezone conversion
      const scheduleDate = schedule.start_time.split('T')[0];
      // Use UTC hours since backend already adds +7 hours offset
      const startHour = new Date(schedule.start_time).getUTCHours();
      const endHour = new Date(schedule.end_time).getUTCHours();
      
      return scheduleDate === dayStr && startHour <= parseInt(hour) && endHour >= parseInt(hour);
    });
  };

  const formatTime = (datetime) => {
    // Parse datetime string directly without timezone conversion
    const date = new Date(datetime);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const goToPrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleStaffFilter = (staffId) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        staff_id: Number(formData.staff_id),
      };

      const data = await api.post('/api/staff-schedules', payload);
      if (data.success) {
        alert('Schedule created!');
        setShowForm(false);
        resetForm();
        fetchSchedules();
      } else {
        alert(data.message || 'Error saving schedule');
      }
    } catch (error) {
      alert('Error saving schedule');
    }
  };

  const handleDelete = async (sourceId) => {
    if (!confirm('Delete this manual schedule?')) return;
    
    try {
      const data = await api.delete(`/api/staff-schedules/${sourceId}`);
      if (data.success) {
        alert('Schedule deleted!');
        fetchSchedules();
      }
    } catch (error) {
      alert('Error deleting schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      schedule_date: '',
      start_time: '',
      end_time: '',
      schedule_type: 'available',
      title: '',
      notes: '',
    });
  };

  const displayDays = getDisplayDays();
  const weekDays = getWeekDays();
  // Compute only the time slots (hours) that have at least one schedule for any displayed day
  const getActiveTimeSlots = () => {
    const slotsSet = new Set();
    displayDays.forEach((day) => {
      // Format day as YYYY-MM-DD
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(day.getDate()).padStart(2, '0');
      const dayStr = `${year}-${month}-${dayOfMonth}`;
      schedules.forEach((schedule) => {
        // Only consider schedules for this day
        const scheduleDate = schedule.start_time.split('T')[0];
        if (scheduleDate !== dayStr) return;
        // Get start and end hour (UTC, as in getSchedulesForDayAndTime)
        const startHour = new Date(schedule.start_time).getUTCHours();
        const endHour = new Date(schedule.end_time).getUTCHours();
        for (let hour = startHour; hour <= endHour; hour++) {
          slotsSet.add(hour);
        }
      });
    });
    // Sort and format as HH:00
    return Array.from(slotsSet)
      .sort((a, b) => a - b)
      .map((hour) => `${hour.toString().padStart(2, '0')}:00`);
  };

  const timeSlots = getActiveTimeSlots();
  const { start, end } = getDateRange();

  const selectedStaffOption = staffMembers.length > 0 && formData.staff_id ? staffMembers.find(u => u.id === formData.staff_id) ?? null : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 p-5 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <FaCalendar className="text-amber-400 text-2xl" />
            <h1 className="text-2xl font-bold">Staff Schedule Calendar</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
            >
              <FaFilter /> Filters
            </button>
            <button
              onClick={() => { setShowForm(true); resetForm(); }}
              className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 dark:from-amber-400 dark:to-amber-500 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
            >
              <FaPlus /> Add Manual
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded font-semibold transition ${
                viewMode === 'day'
                  ? 'bg-gray-500 dark:bg-gray-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded font-semibold transition ${
                viewMode === 'week'
                  ? 'bg-gray-500 dark:bg-gray-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded font-semibold transition ${
                viewMode === 'month'
                  ? 'bg-gray-500 dark:bg-gray-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goToPrev} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white p-2 rounded">
              <FaChevronLeft />
            </button>
            <button onClick={goToToday} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded font-semibold">
              Today
            </button>
            <button onClick={goToNext} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white p-2 rounded">
              <FaChevronRight />
            </button>
          </div>
          <div className="text-gray-700 dark:text-gray-300 font-semibold">
            {start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filter by Staff:</div>
            <div className="flex flex-wrap gap-2">
              {staffMembers.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => toggleStaffFilter(staff.id)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    selectedStaff.includes(staff.id)
                      ? 'bg-amber-500 dark:bg-amber-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {staff.name}
                </button>
              ))}
              {selectedStaff.length > 0 && (
                <button
                  onClick={() => setSelectedStaff([])}
                  className="px-3 py-1 rounded text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-5 overflow-x-auto">
        {loading ? (
          <LoadingSpin />
        ) : (
          <div className="min-w-[1200px]">
            {/* Day Headers */}
            <div 
              className="gap-2 mb-2"
              style={{
                display: 'grid',
                gridTemplateColumns: `100px repeat(${displayDays.length}, ${viewMode === 'month' ? '60px' : '1fr'})`
              }}
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded font-semibold text-center border border-gray-300 dark:border-gray-600">Time</div>
              {displayDays.map((day, index) => (
                <div
                  key={index}
                  className={`bg-gray-100 dark:bg-gray-800 rounded font-semibold text-center border ${
                    day.toDateString() === new Date().toDateString()
                      ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${
                    viewMode === 'month' ? 'p-0.5 text-[10px]' : 'p-2'
                  }`}
                >
                  {viewMode === 'month' ? (
                    <div className="text-xs">{day.getDate()}</div>
                  ) : (
                    <>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {day.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </div>
                      <div className="text-lg">{day.getDate()}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Time Slots (only those with schedules) */}
            {timeSlots.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No schedules found for this period.</div>
            ) : (
              timeSlots.map((timeSlot) => (
                <div 
                  key={timeSlot} 
                  className="gap-2 mb-2"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `100px repeat(${displayDays.length}, ${viewMode === 'month' ? '60px' : '1fr'})`
                  }}
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center font-semibold border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    {timeSlot}
                  </div>

                  {displayDays.map((day) => {
                    const daySchedules = getSchedulesForDayAndTime(day, timeSlot);
                    
                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className={`bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden ${
                          viewMode === 'month' ? 'p-0.5 min-h-[50px]' : 'p-1 min-h-[80px]'
                        }`}
                      >
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`mb-1 rounded cursor-pointer hover:opacity-80 transition relative group ${
                              viewMode === 'month' ? 'p-1 text-[10px]' : 'p-2 text-xs'
                            }`}
                            style={{ backgroundColor: schedule.color }}
                            title={`${schedule.staff_name}\n${schedule.title}\n${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}\n${schedule.description || ''}`}
                          >
                            <div className="font-bold text-white break-words">{schedule.staff_name}</div>
                            {viewMode !== 'month' && (
                              <>
                                <div className="text-white/90 break-words line-clamp-2">{schedule.title}</div>
                                <div className="text-white/70 text-xs">{formatTime(schedule.start_time)}</div>
                              </>
                            )}
                            
                            {schedule.source === 'manual' && viewMode !== 'month' && (
                              <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(schedule.source_id);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="fixed bottom-5 right-5 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Schedule Types</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-gray-400">PT Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span className="text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-gray-400">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-gray-400">Break</span>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-amber-600 dark:text-amber-400">Add Manual Schedule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-2 font-semibold">Staff *</label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Staff</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                  ))}
                </select>                
              </div> */}

              <FormInput
                  label="Staff"
                  name="staff_id"
                  type="searchable-select"
                  placeholder='Search Staff'
                  value={ selectedStaffOption ? { value: selectedStaffOption.id, label: `${selectedStaffOption.name} - ${selectedStaffOption.role}` }
                        : null }
                  onChange={(opt) =>
                    setFormData(prev => ({ ...prev, staff_id: opt?.value || '' }))
                  }
                  options={staffMembers.map(u => ({
                    value: u.id,
                    label: `${u.name} - ${u.role}`
                  }))}
                  required
                />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium text-sm">Date *</label>
                  <input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium text-sm">Type *</label>
                  <select
                    value={formData.schedule_type}
                    onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                    required
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="break">Break</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium text-sm">Start *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium text-sm">End *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium text-sm">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                  placeholder="e.g., Lunch Break, Day Off"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium text-sm">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
