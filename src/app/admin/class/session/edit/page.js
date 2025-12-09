"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackendErrorFallback from "../../../../../components/BackendErrorFallback";
import Link from "next/link";
import { FaIdCard, FaAngleRight } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    const fetchPlans = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/eventplans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataPlans = await res.json();
        if (res.ok) setPlans(dataPlans.data.plans);
      } catch {}
    };
    fetchPlans();
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resMember = await fetch(`${API_URL}/api/users?role=member&membership=active`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resInstructor = await fetch(`${API_URL}/api/users?role=instructor`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const dataMember = await resMember.json();
        const dataInstructor = await resInstructor.json();
        if (resMember.ok) setMembers(dataMember.data.users);
        if (resInstructor.ok) setInstructors(dataInstructor.data.users);
      } catch {}
    };
    fetchUsers();
    const fetchSession = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await fetch(`${API_URL}/api/classes/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error("Gagal fetch class");
        const dataClass = await res.json();
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
        setBackendError(true);
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
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      
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
        const class_date_iso = form.class_date ? `${form.class_date}T00:00:00.000Z` : "";
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
      
      const res = await fetch(`${API_URL}/api/classes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Gagal update class");
      
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
      setError("Gagal update class");
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        await fetch(`${API_URL}/api/classes/${id}`, {
        method: 'DELETE',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
        });
        router.push('/admin/class/session');
    } catch (err) {
      setError("Gagal menghapus class");
    }
    setFormLoading(false);
  };

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }
  if (loading || !form) {
    return <div className="text-amber-300 text-center font-medium mt-20">Loading...</div>;
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm mb-6 bg-gray-800 px-4 py-3 rounded-lg">
        <FaIdCard className="text-amber-300" />
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-amber-300 transition-colors">
          Dashboard
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <Link href="/admin/class/session" className="text-gray-400 hover:text-amber-300 transition-colors">
          Class Session
        </Link>
        <FaAngleRight className="text-gray-500 text-xs" />
        <span className="text-gray-200 font-medium">Edit</span>
      </div>

      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-700">
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-amber-300">
            {isRecurring ? 'Edit Recurring Class Pattern' : 'Edit Class'}
          </h1>
          <Link href="/admin/class/session" className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors">
            Back
          </Link>
        </div>
        
        {/* Recurring Warning */}
        {isRecurring && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-amber-400 text-xl">⚠️</div>
              <div className="text-amber-200 text-sm">
                <strong className="block mb-1">Recurring Class Pattern</strong>
                <p className="mb-2">Editing this recurring pattern will <strong>delete all existing class instances</strong> and regenerate them with the new pattern. All attendance data will be preserved for classes that have already occurred.</p>
                {session?.generated_instances !== undefined && (
                  <p className="bg-amber-800/40 px-3 py-2 rounded mt-2">
                    📊 <strong>Currently generated:</strong> {session.generated_instances} class instances
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-4">
          <div>
            <label className="block mb-1 text-gray-200">Event Plan</label>
            <select name="event_plan_id" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.event_plan_id} onChange={e => setForm(f => ({ ...f, event_plan_id: e.target.value }))} required disabled={!edit}>
              <option value="">Pilih Event Plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-200">Instructor</label>
            <select name="instructor_id" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))} required disabled={!edit}>
              <option value="">Pilih Instructor</option>
              {instructors.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          {/* Single Class Fields */}
          {!isRecurring && (
            <>
              <div>
                <label className="block mb-1 text-gray-200">Class Date</label>
                <input name="class_date" type="date" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.class_date} onChange={e => setForm(f => ({ ...f, class_date: e.target.value }))} required disabled={!edit} />
              </div>
              <div>
                <label className="block mb-1 text-gray-200">Start Time</label>
                <input name="start_time" type="time" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required disabled={!edit} />
              </div>
              <div>
                <label className="block mb-1 text-gray-200">End Time (Auto-calculated)</label>
                <input name="end_time" type="time" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required disabled={!edit} />
                <p className="text-xs text-gray-400 mt-1">Based on Event Plan duration</p>
              </div>
            </>
          )}

          {/* Recurring Class Fields */}
          {isRecurring && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-200">Valid From *</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                    className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                    required
                    disabled={!edit}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-200">Valid Until *</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                    required
                    disabled={!edit}
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
                        if (!edit) return;
                        const newDays = form.recurrence_days.includes(day)
                          ? form.recurrence_days.filter(d => d !== day)
                          : [...form.recurrence_days, day];
                        setForm(f => ({ ...f, recurrence_days: newDays }));
                      }}
                      className={`px-3 py-2 rounded font-semibold transition ${
                        form.recurrence_days.includes(day)
                          ? 'bg-amber-600 text-white'
                          : edit 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            : 'bg-gray-900 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!edit}
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
                    onChange={e => setForm(f => ({ ...f, recurrence_start_time: e.target.value }))}
                    className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                    required
                    disabled={!edit}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-200">Time End * (Auto-calculated)</label>
                  <input
                    type="time"
                    value={form.recurrence_end_time}
                    onChange={e => setForm(f => ({ ...f, recurrence_end_time: e.target.value }))}
                    className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                    required
                    disabled={!edit}
                  />
                  <p className="text-xs text-gray-400 mt-1">Based on Event Plan duration</p>
                </div>
              </div>

              {edit && (
                <div className="bg-amber-900/30 border border-amber-700 rounded p-3 text-sm text-amber-200">
                  <strong>Preview:</strong> Class akan dibuat otomatis setiap{' '}
                  {form.recurrence_days.length > 0 ? form.recurrence_days.join(', ') : '(pilih hari)'}{' '}
                  pada jam {form.recurrence_start_time || '(pilih waktu)'} - {form.recurrence_end_time || '(pilih waktu)'}{' '}
                  dari {form.valid_from || '(tanggal mulai)'} sampai {form.valid_until || '(tanggal selesai)'}
                </div>
              )}
            </>
          )}
          
          <div>
            <label className="block mb-1 text-gray-200">Class Type</label>
            <select name="class_type" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.class_type} onChange={e => setForm(f => ({ ...f, class_type: e.target.value }))} required disabled={!edit}>
              <option value="membership_only">Membership Only</option>
              <option value="free">Free</option>
              <option value="both">Both</option>
            </select>
          </div>
          {/* <div>
            <label className="block mb-1 text-gray-200">Total Manual Checkin</label>
            <input name="total_manual_checkin" type="number" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.total_manual_checkin} onChange={e => setForm(f => ({ ...f, total_manual_checkin: e.target.value }))} required disabled={!edit} />
          </div> */}
          <div>
            <label className="block mb-1 text-gray-200">Notes</label>
            <textarea name="notes" className={`w-full p-3 border rounded-lg ${edit ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={!edit} />
          </div>
        </div>
        {success && <div className="text-green-400 font-semibold mb-2">{success}</div>}
        {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
        <div className="flex gap-3 mt-8 justify-start">
          {!edit ? (
            <>
              <button type="button" className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-6 py-2 rounded-lg font-semibold transition" onClick={handleEdit}>Edit</button>
              <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleDelete}>Delete</button>
            </>
          ) : (
            <>
              <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition" disabled={formLoading} onClick={handleSave}>{formLoading ? "Saving..." : "Save"}</button>
              <button type="button" className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
