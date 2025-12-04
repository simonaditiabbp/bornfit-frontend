'use client';
import { useState, useEffect } from 'react';
import { FaCalendar, FaChevronLeft, FaChevronRight, FaUsers, FaFilter } from 'react-icons/fa';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSchedulePage() {
  const [classes, setClasses] = useState([]);
  const [eventPlans, setEventPlans] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventPlan, setSelectedEventPlan] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEventPlans();
    fetchInstructors();
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [currentDate, selectedEventPlan, selectedInstructor]);

  const fetchEventPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/eventplans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEventPlans(data.data?.plans || []);
      }
    } catch (error) {
      console.error('Error fetching event plans:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users?exclude_role=member`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInstructors(data.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { startDate, endDate } = getWeekRange();
      
      let url = `${API_URL}/api/classes/date-range?start_date=${startDate}&end_date=${endDate}`;
      if (selectedEventPlan !== 'all') {
        url += `&event_plan_id=${selectedEventPlan}`;
      }
      if (selectedInstructor !== 'all') {
        url += `&instructor_id=${selectedInstructor}`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setClasses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getClassesForDayAndTime = (day, timeSlot) => {
    // Format day as YYYY-MM-DD without timezone conversion
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(day.getDate()).padStart(2, '0');
    const dayStr = `${year}-${month}-${dayOfMonth}`;
    
    const [hour] = timeSlot.split(':');
    
    return classes.filter(cls => {
      // Parse class_date without timezone conversion
      const classDate = cls.class_date.split('T')[0];
      // Use UTC hours to prevent timezone shift
      const startHour = new Date(cls.start_time).getUTCHours();
      const endHour = new Date(cls.end_time).getUTCHours();

      return classDate === dayStr && startHour <= parseInt(hour) && endHour > parseInt(hour);
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

  const getSlotBadgeColor = (cls) => {
    const percentage = (cls.total_attendances / cls.event_plan.max_visitor) * 100;
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
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
            <h1 className="text-2xl font-bold">Class Schedule Calendar</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
            >
              <FaFilter /> Filters
            </button>
            <Link
              href="/admin/class/session/insert"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Create Class
            </Link>
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
          <div className="mt-4 p-4 bg-gray-700 rounded-lg grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Event Plan:</label>
              <select
                value={selectedEventPlan}
                onChange={(e) => setSelectedEventPlan(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 text-gray-200 rounded px-3 py-2"
              >
                <option value="all">All Event Plans</option>
                {eventPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Instructor:</label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 text-gray-200 rounded px-3 py-2"
              >
                <option value="all">All Instructors</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                ))}
              </select>
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
                  const dayClasses = getClassesForDayAndTime(day, timeSlot);
                  
                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      className="bg-gray-800 p-1 rounded border border-gray-700 min-h-[80px]"
                    >
                      {dayClasses.map((cls) => (
                        <Link
                          key={cls.id}
                          href={`/admin/class-schedule/${cls.id}`}
                          className="block mb-1 p-2 rounded text-xs cursor-pointer hover:opacity-80 transition"
                          style={{ backgroundColor: getSlotBadgeColor(cls) }}
                          title={`${cls.event_plan.name}\n${cls.instructor.name}\n${formatTime(cls.start_time)} - ${formatTime(cls.end_time)}\n${cls.total_attendances}/${cls.event_plan.max_visitor} attendees`}
                        >
                          <div className="font-bold text-white truncate">{cls.event_plan.name}</div>
                          <div className="text-white/90 text-xs truncate">{cls.instructor.name}</div>
                          <div className="text-white/70 text-xs">{formatTime(cls.start_time)}</div>
                          <div className="flex items-center gap-1 text-white/90 text-xs mt-1">
                            <FaUsers className="text-xs" />
                            <span>{cls.total_attendances}/{cls.event_plan.max_visitor}</span>
                          </div>
                        </Link>
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
        <div className="text-sm font-semibold text-gray-300 mb-2">Slot Availability</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-gray-400">&lt; 70% filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-600 rounded"></div>
            <span className="text-gray-400">70-90% filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-gray-400">&gt; 90% filled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
