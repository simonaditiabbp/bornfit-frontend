"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaDumbbell, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassSessionInsertPage() {
  const now = new Date();
  const format = (date) => date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const start = format(now);
  
  const initialFormState = {
    event_plan_id: "",
    instructor_id: "",
    class_date: now.toISOString().slice(0,10),
    start_time: start,
    class_type: "membership_only",
    total_manual_checkin: 0,
    notes: "",
    is_recurring: false,
    recurrence_days: [],
    recurrence_start_time: "",
    recurrence_end_time: "",
    valid_from: "",
    valid_until: "",
  };
  
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/eventplans?is_active=true`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        if (res.ok) setPlans(data.data.plans);
      } catch {}
    };
    fetchPlans();
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users/?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructor = await fetch(`${API_URL}/api/users/?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataMember = await resMember.json();
        const dataInstructor = await resInstructor.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resInstructor.ok) setInstructors(dataInstructor.data.users);
      } catch {}
    };
    fetchUsers();
  }, []);

  const [form, setForm] = useState(initialFormState);

  // Helper: Calculate end time from start time + minutes
  const calculateEndTime = (startTime, minutes) => {
    if (!startTime || !minutes) return '';
    const [hours, mins] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  // Auto-calculate end times when event plan or start time changes
  useEffect(() => {
    if (form.event_plan_id) {
      const selectedPlan = plans.find(p => p.id === Number(form.event_plan_id));
      if (selectedPlan && selectedPlan.minutes_per_session) {
        // Auto-calculate recurrence_end_time for recurring class
        if (form.is_recurring && form.recurrence_start_time) {
          const endTime = calculateEndTime(form.recurrence_start_time, selectedPlan.minutes_per_session);
          setForm(f => ({ ...f, recurrence_end_time: endTime }));
        }
      }
    }
  }, [form.event_plan_id, form.recurrence_start_time, form.is_recurring, plans]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleReset = () => {
    setForm(initialFormState);
    setSuccess("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      
      let payload = {};
      
      if (form.is_recurring) {
        // Recurring class
        payload = {
          event_plan_id: Number(form.event_plan_id),
          instructor_id: Number(form.instructor_id),
          class_type: form.class_type,
          notes: form.notes,
          is_recurring: true,
          recurrence_days: JSON.stringify(form.recurrence_days),
          recurrence_start_time: form.recurrence_start_time,
          recurrence_end_time: form.recurrence_end_time,
          valid_from: `${form.valid_from}T00:00:00.000Z`,
          valid_until: `${form.valid_until}T23:59:59.999Z`,
        };
      } else {
        // Single class - combine date and time properly
        const start_datetime = new Date(`${form.class_date}T${form.start_time}:00`);
        const start_time_iso = start_datetime.toISOString();
        
        payload = {
          event_plan_id: Number(form.event_plan_id),
          instructor_id: Number(form.instructor_id),
          class_date: start_time_iso, // Use start_time as class_date
          start_time: start_time_iso,
          class_type: form.class_type,
          total_manual_checkin: Number(form.total_manual_checkin),
          notes: form.notes,
          is_recurring: false,
        };
      }
      
      const res = await fetch(`${API_URL}/api/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal simpan");
      setSuccess("Berhasil simpan");
      router.push("/admin/class/session");
    } catch (err) {
      setError("Gagal simpan");
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaDumbbell className="text-amber-300" />
        <Link href="/admin/class/session" className="text-gray-400 hover:text-amber-300 transition-colors">
          Class Session
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Create</span>
      </div>

      <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-8 text-amber-300 text-center">Create Detail Class</h1>
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block mb-1 text-gray-200">Event Plan</label>
            <select name="event_plan_id" value={form.event_plan_id} onChange={e => setForm({ ...form, event_plan_id: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200">
              <option value="">Pilih Event Plan</option>
              {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Instructor</label>
            <select name="instructor_id" value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200">
              <option value="">Pilih Instructor</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Class Type</label>
            <select name="class_type" value={form.class_type} onChange={e => setForm({ ...form, class_type: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200">
              <option value="membership_only">Membership Only</option>
              <option value="free">Free</option>
              <option value="both">Both</option>
            </select>
          </div>
          
          {/* Recurring Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <input
              type="checkbox"
              id="is_recurring"
              checked={form.is_recurring}
              onChange={e => setForm({ ...form, is_recurring: e.target.checked })}
              className="w-5 h-5 accent-amber-400"
            />
            <label htmlFor="is_recurring" className="text-gray-200 font-semibold">
              Recurring Schedule (Repeat Weekly)
            </label>
          </div>

          {/* Single Class Fields */}
          {!form.is_recurring && (
            <>
              <div>
                <label className="block mb-1 text-gray-200">Class Date</label>
                <input name="class_date" type="date" value={form.class_date} onChange={e => setForm({ ...form, class_date: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" required />
              </div>
              <div>
                <label className="block mb-1 text-gray-200">Start Time</label>
                <input name="start_time" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" required />
              </div>
            </>
          )}

          {/* Recurring Class Fields */}
          {form.is_recurring && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-200">Valid From *</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={e => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-200">Valid Until *</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-200">Repeat On (Days) *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = form.recurrence_days.includes(day)
                          ? form.recurrence_days.filter(d => d !== day)
                          : [...form.recurrence_days, day];
                        setForm({ ...form, recurrence_days: newDays });
                      }}
                      className={`px-3 py-2 rounded font-semibold transition ${
                        form.recurrence_days.includes(day)
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-200">Time Start *</label>
                  <input
                    type="time"
                    value={form.recurrence_start_time}
                    onChange={e => setForm({ ...form, recurrence_start_time: e.target.value })}
                    className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-200">Time End * (Auto-calculated)</label>
                  <input
                    type="time"
                    value={form.recurrence_end_time}
                    onChange={e => setForm({ ...form, recurrence_end_time: e.target.value })}
                    className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Based on Event Plan duration</p>
                </div>
              </div>

              <div className="bg-amber-900/30 border border-amber-700 rounded p-3 text-sm text-amber-200">
                <strong>Preview:</strong> Class akan dibuat otomatis setiap{' '}
                {form.recurrence_days.length > 0 ? form.recurrence_days.join(', ') : '(pilih hari)'}{' '}
                pada jam {form.recurrence_start_time || '(pilih waktu)'} - {form.recurrence_end_time || '(pilih waktu)'}{' '}
                dari {form.valid_from || '(tanggal mulai)'} sampai {form.valid_until || '(tanggal selesai)'}
              </div>
            </>
          )}
          
          {/* <div>
            <label className="block mb-1 text-gray-200">Total Manual Checkin</label>
            <input name="total_manual_checkin" type="number" value={form.total_manual_checkin} onChange={e => setForm({ ...form, total_manual_checkin: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" />
          </div> */}
          <div>
            <label className="block mb-1 text-gray-200">Notes</label>
            <textarea name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-600 p-2 rounded bg-gray-700 text-gray-200" />
          </div>
          <div className="flex gap-3 mt-8 justify-start">
            <button type="submit" className="bg-amber-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500 transition" disabled={loading}>
              {loading ? "Saving..." : "Submit"}
            </button>
            <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition" onClick={() => router.push('/admin/class/session')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
