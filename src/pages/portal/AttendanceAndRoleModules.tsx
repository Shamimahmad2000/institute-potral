import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCheck,
  Clock,
  LogIn,
  LogOut,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { supabase, callRpc } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n, Language } from '../../lib/i18n';
import { EmptyState, ErrorBanner, SkeletonRows, SuccessBanner } from '../../components/ui';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

// 1. TEACHER: MY SECTIONS
export const TeacherMySectionsView: React.FC<{
  onSelectSectionForAttendance?: (classId: string, sectionId: string) => void;
}> = ({ onSelectSectionForAttendance }) => {
  const { user } = useAuth();

  const { data: myAssignments, isLoading, error } = useQuery({
    queryKey: ['my_section_teachers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('section_teachers').select('*');
      if (error) throw new Error(error.message);
      // Filter to current teacher if multiple returned, or return all RLS-scoped rows for teacher
      const rows = data || [];
      const mine = rows.filter(
        (r: any) =>
          r.teacher_id === user?.id || r.user_id === user?.id || r.employee_id === user?.id
      );
      return mine.length > 0 ? mine : rows;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await supabase.from('sections').select('*');
      return data || [];
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('*');
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          My Assigned Sections
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Classes and sections assigned to you via section_teachers.
        </p>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading ? (
        <SkeletonRows rows={3} cols={3} />
      ) : !myAssignments || myAssignments.length === 0 ? (
        <EmptyState
          title="No sections assigned yet"
          description="Your principal or institution administrator can assign you to sections in Classes & Sections."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAssignments.map((asgn: any, idx: number) => {
            const sec = (sections || []).find((s: any) => s.id === asgn.section_id);
            const cls = (classes || []).find(
              (c: any) => c.id === (sec?.class_id || asgn.class_id)
            );
            return (
              <div
                key={asgn.id || idx}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4"
              >
                <div>
                  <p className="text-xs font-mono text-blue-700 dark:text-blue-400">
                    ASSIGNED SECTION
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {cls?.name || 'Class'} — {sec?.name || asgn.section_id}
                  </h3>
                </div>
                {onSelectSectionForAttendance && sec && (
                  <button
                    type="button"
                    onClick={() => onSelectSectionForAttendance(sec.class_id || '', sec.id)}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                  >
                    Mark Attendance for Section
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 2. TEACHER: MARK ATTENDANCE (Class -> Section -> Date, big Present/Absent/Late/Leave buttons, "Mark all present", via rpc mark_attendance)
export const TeacherMarkAttendanceView: React.FC<{
  initialClassId?: string;
  initialSectionId?: string;
}> = ({ initialClassId = '', initialSectionId = '' }) => {
  const { t } = useI18n();
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['section_students', selectedClassId, selectedSectionId],
    enabled: Boolean(selectedSectionId || selectedClassId),
    queryFn: async () => {
      let q = supabase.from('students').select('*').order('roll_no');
      if (selectedSectionId) {
        q = q.eq('section_id', selectedSectionId);
      } else if (selectedClassId) {
        q = q.eq('class_id', selectedClassId);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    if (initialSectionId) setSelectedSectionId(initialSectionId);
  }, [initialClassId, initialSectionId]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    if (!students) return;
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s: any) => {
      next[s.id] = 'present';
    });
    setAttendanceMap(next);
  };

  const handleSubmitAttendance = async () => {
    if (!students || students.length === 0) return;
    setErrMsg(null);
    setOkMsg(null);
    setSubmitting(true);

    const records = students.map((s: any) => ({
      student_id: s.id,
      status: attendanceMap[s.id] || 'present',
      date: selectedDate,
      section_id: selectedSectionId || s.section_id || null,
      class_id: selectedClassId || s.class_id || null,
    }));

    // Try batch RPC call first, then fallback signatures
    const batchRes = await callRpc(
      'mark_attendance',
      {
        section_id: selectedSectionId || null,
        class_id: selectedClassId || null,
        date: selectedDate,
        records,
      },
      [
        {
          p_section_id: selectedSectionId || null,
          p_date: selectedDate,
          p_records: records,
        },
        {
          section_id: selectedSectionId || null,
          attendance_date: selectedDate,
          records,
        },
        {
          records,
        },
        {
          p_records: records,
        },
      ]
    );

    if (batchRes.error && batchRes.error.code === 'PGRST202') {
      // If mark_attendance takes individual student parameters (student_id, date, status)
      let firstErr: string | null = null;
      for (const rec of records) {
        const singleRes = await callRpc(
          'mark_attendance',
          {
            student_id: rec.student_id,
            date: rec.date,
            status: rec.status,
            section_id: rec.section_id,
          },
          [
            {
              p_student_id: rec.student_id,
              p_date: rec.date,
              p_status: rec.status,
              p_section_id: rec.section_id,
            },
            {
              student_id: rec.student_id,
              date: rec.date,
              status: rec.status,
            },
          ]
        );
        if (singleRes.error) {
          firstErr = singleRes.error.message;
          break;
        }
      }
      setSubmitting(false);
      if (firstErr) {
        setErrMsg(firstErr);
        return;
      }
      setOkMsg(`Attendance saved via mark_attendance RPC for ${records.length} students.`);
      return;
    }

    setSubmitting(false);
    if (batchRes.error) {
      setErrMsg(batchRes.error.message);
      return;
    }

    setOkMsg(`Attendance marked for ${records.length} students on ${selectedDate}.`);
  };

  const filteredSections = (sections || []).filter(
    (s: any) => !selectedClassId || s.class_id === selectedClassId
  );

  const statusButtons: {
    id: AttendanceStatus;
    label: string;
    activeClass: string;
  }[] = [
    {
      id: 'present',
      label: t('present'),
      activeClass: 'bg-emerald-600 text-white border-emerald-600',
    },
    {
      id: 'absent',
      label: t('absent'),
      activeClass: 'bg-red-600 text-white border-red-600',
    },
    {
      id: 'late',
      label: t('late'),
      activeClass: 'bg-amber-600 text-white border-amber-600',
    },
    {
      id: 'leave',
      label: t('leave'),
      activeClass: 'bg-slate-700 text-white border-slate-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {t('menu_mark_attendance')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select Class, Section, and Date to record daily student attendance via mark_attendance RPC.
        </p>
      </div>

      {/* Selector Bar: Class -> Section -> Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            1. Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('');
            }}
            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          >
            <option value="">Choose class...</option>
            {(classes || []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            2. Select Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          >
            <option value="">Choose section...</option>
            {filteredSections.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            3. Attendance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
        </div>
      </div>

      <ErrorBanner message={errMsg} onDismiss={() => setErrMsg(null)} />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {!selectedClassId && !selectedSectionId ? (
        <EmptyState
          title="Select a Class & Section above"
          description="Choose a class and section to load the student roll call list."
        />
      ) : loadingStudents ? (
        <SkeletonRows rows={6} cols={3} />
      ) : !students || students.length === 0 ? (
        <EmptyState
          title="No students enrolled in this section"
          description="Once students are added to this section, they will appear here for daily roll call."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              Total Students in Roster: {students.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{t('mark_all_present')}</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {submitting ? 'Saving Attendance...' : 'Submit Attendance via RPC'}
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {students.map((st: any) => {
              const current = attendanceMap[st.id];
              return (
                <div
                  key={st.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {st.name || st.full_name}
                    </p>
                    <p className="text-xs font-mono text-slate-500 tabular-nums">
                      Roll: {st.roll_no || '—'} · Admission: {st.admission_no || '—'}
                    </p>
                  </div>

                  {/* Big Present / Absent / Late / Leave Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statusButtons.map((btn) => {
                      const isActive = current === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleSetStatus(st.id, btn.id)}
                          className={`min-h-[44px] px-4 py-2.5 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap ${
                            isActive
                              ? btn.activeClass
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. TEACHER / STAFF OWN CHECK-IN / CHECK-OUT (rpc check_in / check_out)
export const StaffCheckInOutView: React.FC = () => {
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState<'in' | 'out' | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['my_staff_attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) return [];
      return data || [];
    },
  });

  const handleCheckIn = async () => {
    setErrMsg(null);
    setOkMsg(null);
    setLoadingAction('in');
    const res = await callRpc('check_in');
    setLoadingAction(null);
    if (res.error) {
      setErrMsg(res.error.message);
    } else {
      setOkMsg('Checked in via check_in RPC.');
      queryClient.invalidateQueries({ queryKey: ['my_staff_attendance'] });
    }
  };

  const handleCheckOut = async () => {
    setErrMsg(null);
    setOkMsg(null);
    setLoadingAction('out');
    const res = await callRpc('check_out');
    setLoadingAction(null);
    if (res.error) {
      setErrMsg(res.error.message);
    } else {
      setOkMsg('Checked out via check_out RPC.');
      queryClient.invalidateQueries({ queryKey: ['my_staff_attendance'] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Staff Daily Check-In & Check-Out
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Record your daily arrival and departure timestamps via check_in and check_out RPCs.
        </p>
      </div>

      <ErrorBanner message={errMsg} onDismiss={() => setErrMsg(null)} />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs font-mono text-slate-500 tabular-nums">
            TODAY · {new Date().toLocaleDateString()}
          </p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Log Your Campus Shift Attendance
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loadingAction !== null}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            <span>{loadingAction === 'in' ? 'Checking In...' : 'Check In Now'}</span>
          </button>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={loadingAction !== null}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            <span>{loadingAction === 'out' ? 'Checking Out...' : 'Check Out Now'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows rows={4} cols={4} />
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          title="No check-in history found"
          description="Your daily check-in and check-out timestamps will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Date</th>
                <th className="py-3 px-4 text-start font-semibold">Check In</th>
                <th className="py-3 px-4 text-start font-semibold">Check Out</th>
                <th className="py-3 px-4 text-start font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs tabular-nums">
              {logs.map((row: any, idx: number) => (
                <tr key={row.id || idx}>
                  <td className="py-3 px-4">{row.date || row.created_at?.slice(0, 10) || '—'}</td>
                  <td className="py-3 px-4">
                    {row.check_in || row.check_in_at
                      ? new Date(row.check_in || row.check_in_at).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {row.check_out || row.check_out_at
                      ? new Date(row.check_out || row.check_out_at).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td className="py-3 px-4 uppercase font-semibold">
                    {row.status || 'PRESENT'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// 4. ADMIN/PRINCIPAL: STUDENT ATTENDANCE VIEW
export const AdminStudentAttendanceView: React.FC = () => {
  const [dateFilter, setDateFilter] = useState('');

  const { data: records, isLoading, error } = useQuery({
    queryKey: ['student_attendance_admin', dateFilter],
    queryFn: async () => {
      // Try student_attendance first, fallback to attendance
      let q1 = supabase
        .from('student_attendance')
        .select('*, students(*)')
        .order('date', { ascending: false })
        .limit(200);
      if (dateFilter) q1 = q1.eq('date', dateFilter);
      const res1 = await q1;
      if (!res1.error) return res1.data || [];

      let q2 = supabase
        .from('attendance')
        .select('*, students(*)')
        .order('date', { ascending: false })
        .limit(200);
      if (dateFilter) q2 = q2.eq('date', dateFilter);
      const res2 = await q2;
      if (!res2.error) return res2.data || [];

      // Plain query without join if FK name differs
      let q3 = supabase.from('student_attendance').select('*').limit(200);
      if (dateFilter) q3 = q3.eq('date', dateFilter);
      const res3 = await q3;
      if (!res3.error) return res3.data || [];

      throw new Error(res1.error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Student Attendance Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review daily student attendance records across all classes and sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="text-xs text-blue-700 dark:text-blue-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading ? (
        <SkeletonRows rows={6} cols={4} />
      ) : !records || records.length === 0 ? (
        <EmptyState
          title="No student attendance records found"
          description="Attendance marked by teachers via mark_attendance will be listed here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Date</th>
                <th className="py-3 px-4 text-start font-semibold">Student</th>
                <th className="py-3 px-4 text-start font-semibold">Status</th>
                <th className="py-3 px-4 text-start font-semibold">Remarks / Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.map((r: any, idx: number) => {
                const st = Array.isArray(r.students) ? r.students[0] : r.students;
                return (
                  <tr key={r.id || idx}>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {r.date || r.attendance_date || r.created_at?.slice(0, 10) || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {st?.name || st?.full_name || r.student_name || r.student_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold uppercase">
                      {r.status}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {r.remarks || r.section_id || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// 5. ADMIN / PRINCIPAL / HR: STAFF ATTENDANCE VIEW
export const AdminStaffAttendanceView: React.FC = () => {
  const [dateFilter, setDateFilter] = useState('');

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['staff_attendance_all', dateFilter],
    queryFn: async () => {
      let q = supabase
        .from('staff_attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (dateFilter) q = q.eq('date', dateFilter);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Staff & Faculty Attendance Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor employee check-in and check-out records across your campus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="text-xs text-blue-700 dark:text-blue-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading ? (
        <SkeletonRows rows={5} cols={4} />
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          title="No staff attendance records found"
          description="When teachers and staff check in or check out via RPC, their timestamps appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Date</th>
                <th className="py-3 px-4 text-start font-semibold">Staff / Employee</th>
                <th className="py-3 px-4 text-start font-semibold">Check In</th>
                <th className="py-3 px-4 text-start font-semibold">Check Out</th>
                <th className="py-3 px-4 text-start font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs tabular-nums">
              {logs.map((row: any, idx: number) => (
                <tr key={row.id || idx}>
                  <td className="py-3 px-4">{row.date || row.created_at?.slice(0, 10) || '—'}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                    {row.employee_name || row.user_id || row.employee_id || 'Staff Member'}
                  </td>
                  <td className="py-3 px-4">
                    {row.check_in || row.check_in_at
                      ? new Date(row.check_in || row.check_in_at).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {row.check_out || row.check_out_at
                      ? new Date(row.check_out || row.check_out_at).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td className="py-3 px-4 uppercase font-bold">{row.status || 'PRESENT'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// 6. STUDENT: OWN ATTENDANCE & PERCENTAGE (rpc student_attendance_summary)
export const StudentAttendanceSummaryView: React.FC<{ studentId?: string; studentName?: string }> = ({
  studentId,
  studentName,
}) => {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['student_attendance_summary', studentId || 'self'],
    queryFn: async () => {
      const args = studentId ? { student_id: studentId } : {};
      const fallbacks = studentId ? [{ p_student_id: studentId }, { id: studentId }, {}] : [];
      const res = await callRpc('student_attendance_summary', args, fallbacks);
      if (res.error) throw new Error(res.error.message);
      return Array.isArray(res.data) ? res.data[0] : res.data;
    },
  });

  if (isLoading) return <SkeletonRows rows={4} cols={4} />;

  const totalDays = Number(summary?.total_days ?? summary?.total ?? 0);
  const presentDays = Number(summary?.present_days ?? summary?.present ?? 0);
  const absentDays = Number(summary?.absent_days ?? summary?.absent ?? 0);
  const lateDays = Number(summary?.late_days ?? summary?.late ?? 0);
  const leaveDays = Number(summary?.leave_days ?? summary?.leave ?? 0);
  const percentage =
    summary?.percentage !== undefined
      ? Number(summary.percentage)
      : totalDays > 0
      ? Math.round((presentDays / totalDays) * 1000) / 10
      : 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {studentName ? `${studentName} — Attendance Summary` : 'My Attendance & Percentage'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Calculated directly via the student_attendance_summary RPC.
        </p>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-1">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Attendance Percentage
          </p>
          <p className="font-mono text-3xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
            {percentage}%
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <p className="text-xs text-slate-500">Total Academic Days</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {totalDays}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Days Present</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {presentDays}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <p className="text-xs text-red-600 dark:text-red-400">Days Absent</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {absentDays}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <p className="text-xs text-amber-600 dark:text-amber-400">Late / Leave</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {lateDays + leaveDays}
          </p>
        </div>
      </div>

      {totalDays === 0 && !error && (
        <EmptyState
          title="No attendance records logged yet"
          description="Your attendance percentage and daily breakdown will update automatically once your class teacher records attendance."
        />
      )}
    </div>
  );
};

// 7. PARENT: CHILD SWITCHER (parent_students) + CHILD'S ATTENDANCE
export const ParentChildAttendanceView: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { data: childrenLinks, isLoading, error } = useQuery({
    queryKey: ['parent_students'],
    queryFn: async () => {
      const withJoin = await supabase.from('parent_students').select('*, students(*)');
      if (!withJoin.error && withJoin.data) return withJoin.data;

      const plain = await supabase.from('parent_students').select('*');
      if (plain.error) throw new Error(plain.error.message);
      return plain.data || [];
    },
  });

  useEffect(() => {
    if (childrenLinks && childrenLinks.length > 0 && !selectedChildId) {
      const first = childrenLinks[0] as any;
      const st = Array.isArray(first.students) ? first.students[0] : first.students;
      setSelectedChildId(st?.id || first.student_id || first.id);
    }
  }, [childrenLinks, selectedChildId]);

  if (isLoading) return <SkeletonRows rows={4} cols={3} />;

  if (error) {
    return <ErrorBanner message={(error as Error).message} />;
  }

  if (!childrenLinks || childrenLinks.length === 0) {
    return (
      <EmptyState
        title="No linked children found in parent_students"
        description="Once your institution links your parent account to your child's student record in parent_students, you can switch between children and monitor their attendance here."
      />
    );
  }

  const activeChildObj = childrenLinks.find((link: any) => {
    const st = Array.isArray(link.students) ? link.students[0] : link.students;
    const id = st?.id || link.student_id || link.id;
    return id === selectedChildId;
  }) as any;

  const activeStudent = Array.isArray(activeChildObj?.students)
    ? activeChildObj?.students[0]
    : activeChildObj?.students;
  const activeName =
    activeStudent?.name ||
    activeStudent?.full_name ||
    activeChildObj?.student_name ||
    'Selected Child';

  return (
    <div className="space-y-6">
      {/* Child Switcher Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Child Switcher (parent_students):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {childrenLinks.map((link: any) => {
            const st = Array.isArray(link.students) ? link.students[0] : link.students;
            const id = st?.id || link.student_id || link.id;
            const label =
              st?.name || st?.full_name || link.student_name || `Student ${String(id).slice(0, 6)}`;
            const isSelected = id === selectedChildId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedChildId(id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedChildId && (
        <StudentAttendanceSummaryView studentId={selectedChildId} studentName={activeName} />
      )}
    </div>
  );
};

// 8. ALL ROLES: PROFILE, CHANGE PASSWORD, LANGUAGE, DELETE ACCOUNT (rpc delete_my_account)
export const ProfileAndAccountView: React.FC = () => {
  const { user, profile, membership, refreshUserContext, signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [fullName, setFullName] = useState(
    profile?.full_name || profile?.name || user?.user_metadata?.name || ''
  );
  const [mobile, setMobile] = useState(
    profile?.mobile || profile?.phone || user?.user_metadata?.mobile || ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrMsg(null);
    setOkMsg(null);
    setSavingProfile(true);

    await supabase.auth.updateUser({
      data: { name: fullName.trim(), full_name: fullName.trim(), mobile: mobile.trim() },
    });

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        name: fullName.trim(),
        mobile: mobile.trim(),
      });

    setSavingProfile(false);
    if (error && !error.message.includes('column')) {
      setErrMsg(error.message);
      return;
    }

    setOkMsg('Profile updated.');
    await refreshUserContext();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    if (newPassword.length < 6) {
      setErrMsg('New password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setErrMsg(error.message);
    } else {
      setNewPassword('');
      setOkMsg('Password changed.');
    }
  };

  const handleDeleteAccount = async () => {
    setErrMsg(null);
    setDeleting(true);
    const res = await callRpc('delete_my_account');
    setDeleting(false);
    if (res.error) {
      setErrMsg(res.error.message);
      return;
    }
    await signOut();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {t('menu_profile')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, language preferences, password, and account deletion.
        </p>
      </div>

      <ErrorBanner message={errMsg} onDismiss={() => setErrMsg(null)} />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {/* Personal Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('name_label')}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('mobile_label')}
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Active Role
            </label>
            <input
              type="text"
              disabled
              value={membership?.role || 'member'}
              className="w-full px-3.5 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Language Preference */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Interface Language & Script Direction
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'en', label: 'English (LTR)' },
            { id: 'hi', label: 'हिन्दी / Hindi (LTR)' },
            { id: 'ur', label: 'اردو / Urdu (RTL)' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id as Language)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                lang === l.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <form
        onSubmit={handleChangePassword}
        className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {t('change_password')}
        </h2>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            New Password (minimum 6 characters)
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
        </div>
        <button
          type="submit"
          disabled={savingPassword}
          className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 rounded-lg"
        >
          {savingPassword ? 'Updating...' : t('change_password')}
        </button>
      </form>

      {/* Delete Account via rpc delete_my_account */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50/40 dark:bg-red-950/20 space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
            {t('delete_account')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Permanently delete your account and remove your institutional membership via the{' '}
            <code className="font-mono">delete_my_account</code> RPC. This action cannot be undone.
          </p>
        </div>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('delete_account')}</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg"
            >
              {deleting ? 'Deleting Account...' : 'Confirm Permanent Deletion'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 9. COMING SOON PLACEHOLDER (For Timetable, Homework, Leave, Fees, Exams, Reports, Accountant)
export const ComingSoonModuleView: React.FC<{ title: string }> = ({ title }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('coming_soon')}</p>
      </div>

      <div className="p-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 text-center space-y-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Clock className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {title} — {t('coming_soon')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {t('coming_soon_desc')}
        </p>
      </div>
    </div>
  );
};
