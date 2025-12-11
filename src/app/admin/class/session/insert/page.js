"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaDumbbell } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput } from '@/components/admin';
import api from '@/utils/fetchClient';

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
    const fetchData = async () => {
      try {
        const [dataPlans, dataMember, dataInstructor] = await Promise.all([
          api.get('/api/eventplans?is_active=true'),
          api.get('/api/users/?role=member&membership=active'),
          api.get('/api/users/?role=instructor')
        ]);
        setPlans(dataPlans.data.plans || []);
        setMembers(dataMember.data.users || []);
        setInstructors(dataInstructor.data.users || []);
      } catch {}
    };
    fetchData();
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
      
      await api.post('/api/classes', payload);
      setSuccess("Berhasil simpan");
      router.push("/admin/class/session");
    } catch (err) {
      setError("Gagal simpan");
    }
    setLoading(false);
  };

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create Detail Class</h1>
        {success && <div className="text-green-400 font-semibold mb-2 text-center">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2 text-center">{error}</div>}
        <form className="space-y-4" onSubmit={handleSave}>
          <FormInput
            label="Event Plan"
            name="event_plan_id"
            type="select"
            value={form.event_plan_id}
            onChange={e => setForm({ ...form, event_plan_id: e.target.value })}
            options={[
              { value: '', label: 'Pilih Event Plan' },
              ...plans.map(plan => ({ value: plan.id, label: plan.name }))
            ]}
          />
          
          <FormInput
            label="Instructor"
            name="instructor_id"
            type="select"
            value={form.instructor_id}
            onChange={e => setForm({ ...form, instructor_id: e.target.value })}
            options={[
              { value: '', label: 'Pilih Instructor' },
              ...instructors.map(i => ({ value: i.id, label: i.name }))
            ]}
          />
          
          <FormInput
            label="Class Type"
            name="class_type"
            type="select"
            value={form.class_type}
            onChange={e => setForm({ ...form, class_type: e.target.value })}
            options={[
              { value: 'membership_only', label: 'Membership Only' },
              { value: 'free', label: 'Free' },
              { value: 'both', label: 'Both' }
            ]}
          />
          
          {/* Recurring Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
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
              <FormInput
                label="Class Date"
                name="class_date"
                type="date"
                value={form.class_date}
                onChange={e => setForm({ ...form, class_date: e.target.value })}
                required
              />
              <FormInput
                label="Start Time"
                name="start_time"
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </>
          )}

          {/* Recurring Class Fields */}
          {form.is_recurring && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Valid From *"
                  type="date"
                  value={form.valid_from}
                  onChange={e => setForm({ ...form, valid_from: e.target.value })}
                  required
                />
                <FormInput
                  label="Valid Until *"
                  type="date"
                  value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })}
                  required
                />
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
                <FormInput
                  label="Time Start *"
                  type="time"
                  value={form.recurrence_start_time}
                  onChange={e => setForm({ ...form, recurrence_start_time: e.target.value })}
                  required
                />
                <div>
                  <FormInput
                    label="Time End * (Auto-calculated)"
                    type="time"
                    value={form.recurrence_end_time}
                    onChange={e => setForm({ ...form, recurrence_end_time: e.target.value })}
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
          
          <div>
            <label className="block mb-1 text-gray-800 dark:text-gray-200">Total Manual Checkin</label>
            <input name="total_manual_checkin" type="number" value={form.total_manual_checkin} onChange={e => setForm({ ...form, total_manual_checkin: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label className="block mb-1 text-gray-800 dark:text-gray-200">Notes</label>
            <textarea name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <FormActions
            onSubmit={handleSave}
            onReset={handleReset}
            cancelHref="/admin/class/session"
            loading={loading}
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
