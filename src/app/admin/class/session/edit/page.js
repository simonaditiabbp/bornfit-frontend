"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import { FaDumbbell } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, ActionButton, FormInput } from '@/components/admin';
import LoadingSpin from "@/components/admin/LoadingSpin";
import api from '@/utils/fetchClient';

export default function ClassSessionEditPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const formatDateToISO = (val) => val ? (val.length === 16 ? val + ":00.000Z" : val) : "";
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

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
    if (form && form.event_plan_id && edit) {
      const selectedPlan = plans.find(p => p.id === Number(form.event_plan_id));
      if (selectedPlan && selectedPlan.minutes_per_session) {
        // Auto-calculate recurrence_end_time for recurring class
        if (form.is_recurring && form.recurrence_start_time) {
          const endTime = calculateEndTime(form.recurrence_start_time, selectedPlan.minutes_per_session);
          setForm(f => ({ ...f, recurrence_end_time: endTime }));
        }
        // Auto-calculate end_time for single class
        if (!form.is_recurring && form.start_time) {
          const endTime = calculateEndTime(form.start_time, selectedPlan.minutes_per_session);
          setForm(f => ({ ...f, end_time: endTime }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.event_plan_id, form?.recurrence_start_time, form?.start_time, form?.is_recurring, edit, plans]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [dataPlans, dataMember, dataInstructor] = await Promise.all([
          api.get('/api/eventplans?limit=10000'),
          api.get('/api/users?role=member&membership=active&limit=10000'),
          api.get('/api/users?role=instructor&limit=10000')
        ]);
        setPlans(dataPlans.data.plans || []);
        setMembers(dataMember.data.users || []);
        setInstructors(dataInstructor.data.users || []);
      } catch {}
    };
    fetchDropdownData();
    const fetchSession = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const dataClass = await api.get(`/api/classes/${id}`);
        const data = dataClass.data;
        setSession(data);
        setIsRecurring(data.is_recurring || false);
        
        // Prepare form based on recurring or single class
        if (data.is_recurring) {
          // Parse recurrence_days
          let recurrenceDays = [];
          try {
            recurrenceDays = data.recurrence_days ? JSON.parse(data.recurrence_days) : [];
          } catch (e) {
            recurrenceDays = [];
          }
          
          setForm({
            event_plan_id: data.event_plan_id || "",
            instructor_id: data.instructor_id || "",
            class_type: data.class_type || "membership_only",
            notes: data.notes || "",
            is_recurring: true,
            recurrence_days: recurrenceDays,
            recurrence_start_time: data.recurrence_start_time || "",
            recurrence_end_time: data.recurrence_end_time || "",
            valid_from: data.valid_from ? data.valid_from.slice(0, 10) : "",
            valid_until: data.valid_until ? data.valid_until.slice(0, 10) : "",
          });
        } else {
          setForm({
            event_plan_id: data.event_plan_id || "",
            instructor_id: data.instructor_id || "",
            class_date: data.class_date ? data.class_date.slice(0, 10) : "",
            start_time: data.start_time ? data.start_time.slice(11, 16) : "",
            end_time: data.end_time ? data.end_time.slice(11, 16) : "",
            class_type: data.class_type || "membership_only",
            total_manual_checkin: data.total_manual_checkin || 0,
            notes: data.notes || "",
            is_recurring: false,
          });
        }
      } catch (err) {
        if (err.isNetworkError) setBackendError(true);
      }
      setLoading(false);
    };
    if (id) fetchSession();
  }, [id]);

  const handleEdit = () => {
    setEdit(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEdit(false);
    setSuccess("");
    setError("");
    
    // Reset form based on recurring or single
    if (session.is_recurring) {
      let recurrenceDays = [];
      try {
        recurrenceDays = session.recurrence_days ? JSON.parse(session.recurrence_days) : [];
      } catch (e) {
        recurrenceDays = [];
      }
      
      setForm({
        event_plan_id: session.event_plan_id || "",
        instructor_id: session.instructor_id || "",
        class_type: session.class_type || "membership_only",
        notes: session.notes || "",
        is_recurring: true,
        recurrence_days: recurrenceDays,
        recurrence_start_time: session.recurrence_start_time || "",
        recurrence_end_time: session.recurrence_end_time || "",
        valid_from: session.valid_from ? session.valid_from.slice(0, 10) : "",
        valid_until: session.valid_until ? session.valid_until.slice(0, 10) : "",
      });
    } else {
      setForm({
        event_plan_id: session.event_plan_id || "",
        instructor_id: session.instructor_id || "",
        class_date: session.class_date ? session.class_date.slice(0, 10) : "",
        start_time: session.start_time ? session.start_time.slice(11, 16) : "",
        end_time: session.end_time ? session.end_time.slice(11, 16) : "",
        class_type: session.class_type || "membership_only",
        total_manual_checkin: session.total_manual_checkin || 0,
        notes: session.notes || "",
        is_recurring: false,
      });
    }
  };

  const handleSave = async () => {
    // Validasi untuk recurring class
    if (form.is_recurring) {
      if (!form.valid_from) {
        setError("Valid From date is required for recurring classes");
        return;
      }
      if (!form.valid_until) {
        setError("Valid Until date is required for recurring classes");
        return;
      }
      if (form.recurrence_days.length === 0) {
        setError("Please select at least one day for recurring classes");
        return;
      }
      if (!form.recurrence_start_time) {
        setError("Start time is required for recurring classes");
        return;
      }
      if (!form.recurrence_end_time) {
        setError("End time is required for recurring classes");
        return;
      }
      if (new Date(form.valid_from) > new Date(form.valid_until)) {
        setError("Valid From date cannot be later than Valid Until date");
        return;
      }
      if (new Date(form.valid_until) < new Date()) {
        setError("Valid Until date cannot be in the past");
        return;
      }
    }
    
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      let payload = {};
      
      if (form.is_recurring) {
        // Recurring class update - will regenerate all children
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
          id: Number(id),
        };
      } else {
        // Single class update
        const class_date_iso = form.class_date ? `${form.class_date}T${form.start_time}:00.000Z` : "";
        const start_time_iso = form.class_date && form.start_time ? `${form.class_date}T${form.start_time}:00.000Z` : "";
        const end_time_iso = form.class_date && form.end_time ? `${form.class_date}T${form.end_time}:00.000Z` : "";
        
        payload = {
          event_plan_id: Number(form.event_plan_id),
          instructor_id: Number(form.instructor_id),
          class_date: class_date_iso,
          start_time: start_time_iso,
          end_time: end_time_iso,
          class_type: form.class_type,
          total_manual_checkin: Number(form.total_manual_checkin),
          notes: form.notes,
          is_recurring: false,
          id: Number(id),
        };
      }
      
      await api.put(`/api/classes/${id}`, payload);
      
      if (form.is_recurring) {
        setSuccess("Recurring class pattern berhasil diupdate! Semua class instances telah di-regenerate.");
      } else {
        setSuccess("Class berhasil diupdate!");
      }
      setEdit(false);
      
      // Reload session data to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.data?.message || 'Failed to update class');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    let confirmMessage = 'Yakin ingin menghapus class ini?';
    
    if (isRecurring && session?.generated_instances) {
      confirmMessage = `⚠️ PERHATIAN!\n\nIni adalah recurring class pattern dengan ${session.generated_instances} class instances yang sudah ter-generate.\n\nMenghapus recurring pattern ini akan menghapus SEMUA ${session.generated_instances} class instances sekaligus!\n\nYakin ingin melanjutkan?`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    setFormLoading(true);
    try {
      await api.delete(`/api/classes/${id}`);
      router.push('/admin/class/session');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete class');
      console.log("error: ", err);
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  if (loading || !form) return <LoadingSpin />;

  const selectedPlan = plans.length > 0 && form.event_plan_id ? plans.find(p => p.id === form.event_plan_id) ?? null : null;
  const selectedInstructor = instructors.length > 0 && form.instructor_id ? instructors.find(u => u.id === form.instructor_id) ?? null : null;

  return (
    <div>
      <PageBreadcrumb
        items={[
          { icon: <FaDumbbell className="w-3 h-3" />, label: 'Class Session', href: '/admin/class/session' },
          { label: 'Detail / Edit' }
        ]}
      />

      <PageContainerInsert>
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-amber-300">Class Session Details</h1>
          <ActionButton
            variant="gray"
            href="/admin/class/session"
          >
            Back
          </ActionButton>
        </div>     
        {/* Recurring Warning */}
        {isRecurring && (
          <div className="text-white bg-gray-900/70 border-gray-700 dark:text-amber-200 dark:bg-amber-900/30 dark:border-amber-700 border rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-amber-400 text-xl">⚠️</div>
              <div className="text-sm">
                <strong className="block mb-1">Recurring Class Pattern</strong>
                <p className="mb-2">Editing this recurring pattern will <strong>delete all existing class instances</strong> and regenerate them with the new pattern. All attendance data will be preserved for classes that have already occurred.</p>
                {session?.generated_instances !== undefined && (
                  <p className="bg-gray-900/50 dark:bg-amber-800/40 px-3 py-2 rounded mt-2">
                    📊 <strong>Currently generated:</strong> {session.generated_instances} class instances
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-4">
          <FormInput
            label="Plan"
            name="event_plan_id"
            type="searchable-select"
            placeholder='Search Plan'
            disabled={!edit}
            value={ selectedPlan ? { value: selectedPlan.id, label: selectedPlan.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, event_plan_id: opt?.value || '' }))
            }
            options={plans.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
          />
          <FormInput
            label="Instructor"
            name="instructor_id"
            type="searchable-select"
            placeholder='Search Instructor'
            disabled={!edit}
            value={ selectedInstructor ? { value: selectedInstructor.id, label: selectedInstructor.name }
                  : null }
            onChange={(opt) =>
              setForm(prev => ({ ...prev, instructor_id: opt?.value || '' }))
            }
            options={instructors.map(u => ({
              value: u.id,
              label: u.name
            }))}
            required
          />
          {/* Single Class Fields */}
          {!isRecurring && (
            <>
              <FormInput
                label="Class Date"
                name="class_date"
                type="date"
                value={form.class_date}
                onChange={e => setForm(f => ({ ...f, class_date: e.target.value }))}
                disabled={!edit}
                required
              />
              <FormInput
                label="Start Time"
                name="start_time"
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                disabled={!edit}
                required
              />
              <div>
                <FormInput
                  label="End Time (Auto-calculated)"
                  name="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  disabled={!edit}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Based on Event Plan duration</p>
              </div>
            </>
          )}

          {/* Recurring Class Fields */}
          {isRecurring && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Valid From"
                  type="date"
                  value={form.valid_from}
                  onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                  disabled={!edit}
                  required
                />
                <FormInput
                  label="Valid Until"
                  type="date"
                  value={form.valid_until}
                  onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                  disabled={!edit}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-600 dark:text-gray-200 font-medium text-sm">Repeat On (Days) *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (!edit) return;
                        const newDays = form.recurrence_days.includes(day)
                          ? form.recurrence_days.filter(d => d !== day)
                          : [...form.recurrence_days, day];
                        setForm(f => ({ ...f, recurrence_days: newDays }));
                      }}
                      className={`px-3 py-2 rounded font-semibold transition ${
                        form.recurrence_days.includes(day)
                          ? 'bg-gray-600 text-white dark:bg-amber-600 dark:text-white'
                          : edit 
                            ? 'bg-gray-300 text-white hover:bg-gray-500 dark:bg-gray-600 dark:text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-400 hover:text-white dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!edit}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Time Start"
                  type="time"
                  value={form.recurrence_start_time}
                  onChange={e => setForm(f => ({ ...f, recurrence_start_time: e.target.value }))}
                  disabled={!edit}
                  required
                />
                <div>
                  <FormInput
                    label="Time End (Auto-calculated)"
                    type="time"
                    value={form.recurrence_end_time}
                    onChange={e => setForm(f => ({ ...f, recurrence_end_time: e.target.value }))}
                    disabled={!edit}
                    required
                  />
                  <p className="text-gray-800 dark:text-gray-400 text-xs mt-1">Based on Event Plan duration</p>
                </div>
              </div>

              {edit && (
                <div className="bg-gray-600/70 border-gray-700 text-white dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200 border rounded p-3 text-sm">
                  <strong>Preview:</strong> Class akan dibuat otomatis setiap{' '}
                  {form.recurrence_days.length > 0 ? form.recurrence_days.join(', ') : '(pilih hari)'}{' '}
                  pada jam {form.recurrence_start_time || '(pilih waktu)'} - {form.recurrence_end_time || '(pilih waktu)'}{' '}
                  dari {form.valid_from || '(tanggal mulai)'} sampai {form.valid_until || '(tanggal selesai)'}
                </div>
              )}
            </>
          )}
          
          <FormInput
            label="Class Type"
            name="class_type"
            type="select"
            value={form.class_type}
            onChange={e => setForm(f => ({ ...f, class_type: e.target.value }))}
            disabled={!edit}
            required
            options={[
              { value: 'membership_only', label: 'Membership Only' },
              { value: 'free', label: 'Free' },
              { value: 'both', label: 'Both' }
            ]}
          />
          <FormInput
            label="Total Manual Checkin"
            name="total_manual_checkin"
            type="number"
            value={form.total_manual_checkin}
            onChange={e => setForm(f => ({ ...f, total_manual_checkin: e.target.value }))}
            disabled={!edit}
            required
          />
          <FormInput
            label="Notes"
            name="notes"
            type="textarea"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            disabled={!edit}
          />
        </div>
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
        <div className="flex gap-3 mt-8 justify-start">
          {!edit ? (
            <>
              <ActionButton variant="primary" onClick={handleEdit}>Edit</ActionButton>
              <ActionButton variant="danger" onClick={handleDelete}>Delete</ActionButton>
            </>
          ) : (
            <>
              <ActionButton variant="primary" onClick={handleSave} disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</ActionButton>
              <ActionButton variant="gray" onClick={handleCancel}>Cancel</ActionButton>
            </>
          )}
        </div>
      </PageContainerInsert>
    </div>
  );
}
