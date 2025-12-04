'use client';
import { useState, useEffect } from 'react';
import { FaCalendar, FaPlus, FaTrash, FaChevronLeft, FaChevronRight, FaFilter } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StaffScheduleCalendarPage() {
  const [schedules, setSchedules] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
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
  }, [currentDate, selectedStaff]);

  const fetchStaffMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/staff-schedules/staff-members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStaffMembers(data.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { startDate, endDate } = getWeekRange();
      
      let url = `${API_URL}/api/staff-schedules/combined?start_date=${startDate}&end_date=${endDate}`;
      if (selectedStaff.length > 0) {
        url += `&staff_ids=${selectedStaff.join(',')}`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
    setLoading(false);
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
      // Parse schedule_date without timezone conversion
      const scheduleDate = schedule.schedule_date.split('T')[0];
      // Use UTC hours to prevent timezone shift
      const startHour = new Date(schedule.start_time).getUTCHours();
      const endHour = new Date(schedule.end_time).getUTCHours();
      
      return scheduleDate === dayStr && startHour <= parseInt(hour) && endHour > parseInt(hour);
    });
  };

  const formatTime = (datetime) => {
    // Parse datetime string directly without timezone conversion
    const date = new Date(datetime);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        staff_id: Number(formData.staff_id),
      };

      const res = await fetch(`${API_URL}/api/staff-schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert('Schedule created!');
        setShowForm(false);
        resetForm();
        fetchSchedules();
      } else {
        alert(data.message || 'Error saving schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule');
    }
  };

  const handleDelete = async (sourceId) => {
    if (!confirm('Delete this manual schedule?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/staff-schedules/${sourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Schedule deleted!');
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
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

  const weekDays = getWeekDays();
  const timeSlots = getTimeSlots();
  const { start, end } = getWeekRange();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 p-5 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <FaCalendar className="text-amber-400 text-2xl" />
            <h1 className="text-2xl font-bold">Staff Schedule Calendar</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
            >
              <FaFilter /> Filters
            </button>
            <button
              onClick={() => { setShowForm(true); resetForm(); }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
            >
              <FaPlus /> Add Manual
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goToPrevWeek} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded">
              <FaChevronLeft />
            </button>
            <button onClick={goToToday} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold">
              Today
            </button>
            <button onClick={goToNextWeek} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded">
              <FaChevronRight />
            </button>
          </div>
          <div className="text-gray-300 font-semibold">
            {start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <div className="text-sm font-semibold text-gray-300 mb-2">Filter by Staff:</div>
            <div className="flex flex-wrap gap-2">
              {staffMembers.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => toggleStaffFilter(staff.id)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    selectedStaff.includes(staff.id)
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
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
          <div className="text-center text-amber-300 py-20">Loading...</div>
        ) : (
          <div className="min-w-[1200px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="bg-gray-800 p-2 rounded font-semibold text-center border border-gray-600">Time</div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`bg-gray-800 p-2 rounded font-semibold text-center border ${
                    day.toDateString() === new Date().toDateString()
                      ? 'border-amber-500 bg-amber-900/20'
                      : 'border-gray-600'
                  }`}
                >
                  <div className="text-xs text-gray-400">
                    {day.toLocaleDateString('id-ID', { weekday: 'short' })}
                  </div>
                  <div className="text-lg">{day.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-8 gap-2 mb-2">
                <div className="bg-gray-800 p-2 rounded text-center font-semibold border border-gray-600 flex items-center justify-center">
                  {timeSlot}
                </div>

                {weekDays.map((day) => {
                  const daySchedules = getSchedulesForDayAndTime(day, timeSlot);
                  
                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      className="bg-gray-800 p-1 rounded border border-gray-700 min-h-[80px]"
                    >
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="mb-1 p-2 rounded text-xs cursor-pointer hover:opacity-80 transition relative group"
                          style={{ backgroundColor: schedule.color }}
                          title={`${schedule.staff_name}\n${schedule.title}\n${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}\n${schedule.description || ''}`}
                        >
                          <div className="font-bold text-white truncate">{schedule.staff_name}</div>
                          <div className="text-white/90 truncate">{schedule.title}</div>
                          <div className="text-white/70 text-xs">{formatTime(schedule.start_time)}</div>
                          
                          {schedule.source === 'manual' && (
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
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="fixed bottom-5 right-5 bg-gray-800 rounded-lg p-4 border border-gray-600 shadow-lg">
        <div className="text-sm font-semibold text-gray-300 mb-2">Schedule Types</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-gray-400">Class</span>
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
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-amber-400">Add Manual Schedule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-2 font-semibold">Staff *</label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Staff</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-200 mb-2 font-semibold">Date *</label>
                  <input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-200 mb-2 font-semibold">Type *</label>
                  <select
                    value={formData.schedule_type}
                    onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
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
                  <label className="block text-gray-200 mb-2 font-semibold">Start *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-200 mb-2 font-semibold">End *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-200 mb-2 font-semibold">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
                  placeholder="e.g., Lunch Break, Day Off"
                />
              </div>

              <div>
                <label className="block text-gray-200 mb-2 font-semibold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold"
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
