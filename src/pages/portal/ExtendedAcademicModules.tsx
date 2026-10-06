import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EmptyState, ErrorBanner, SkeletonRows, SuccessBanner } from '../../components/ui';

export const ExtendedAcademicModuleView: React.FC<{
  moduleId: 'timetable' | 'homework' | 'leave' | 'fees' | 'exams' | 'reports';
  title: string;
}> = ({ moduleId, title }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Generic form state
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [field3, setField3] = useState('');
  const [field4, setField4] = useState('');
  const [field5, setField5] = useState('');

  const tableMap: Record<string, string> = {
    timetable: 'timetables',
    homework: 'homework',
    leave: 'leaves',
    fees: 'fees',
    exams: 'exams',
    reports: 'exams',
  };

  const tableName = tableMap[moduleId] || 'notices';

  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['extended_module', tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    let payload: Record<string, any> = {};
    if (moduleId === 'timetable') {
      payload = {
        class_name: field1.trim(),
        day: field2.trim() || 'Monday',
        period: field3.trim() || '09:00 AM - 10:00 AM',
        subject: field4.trim(),
        teacher: field5.trim(),
      };
    } else if (moduleId === 'homework') {
      payload = {
        class_name: field1.trim(),
        subject: field2.trim(),
        title: field3.trim(),
        due_date: field4.trim() || new Date().toISOString().slice(0, 10),
        description: field5.trim(),
      };
    } else if (moduleId === 'leave') {
      payload = {
        applicant_name: field1.trim(),
        leave_type: field2.trim() || 'Casual Leave',
        from_date: field3.trim() || new Date().toISOString().slice(0, 10),
        to_date: field4.trim() || new Date().toISOString().slice(0, 10),
        reason: field5.trim(),
        status: 'approved',
      };
    } else if (moduleId === 'fees') {
      payload = {
        student_name: field1.trim(),
        admission_no: field2.trim(),
        fee_Title: field3.trim() || 'Tuition Fee',
        amount: Number(field4) || 0,
        status: field5.trim() || 'paid',
      };
    } else {
      payload = {
        exam_name: field1.trim(),
        class_name: field2.trim(),
        subject: field3.trim(),
        exam_date: field4.trim() || new Date().toISOString().slice(0, 10),
        max_marks: Number(field5) || 100,
        status: 'scheduled',
      };
    }

    const { error } = await supabase.from(tableName).insert([payload]);
    if (error) {
      setErrMsg(error.message);
      return;
    }

    setField1('');
    setField2('');
    setField3('');
    setField4('');
    setField5('');
    setShowForm(false);
    setOkMsg(`${title} record saved.`);
    queryClient.invalidateQueries({ queryKey: ['extended_module', tableName] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from(tableName).delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['extended_module', tableName] });
  };

  const getFieldLabels = () => {
    switch (moduleId) {
      case 'timetable':
        return ['Class & Section *', 'Day of Week', 'Time Slot', 'Subject *', 'Teacher Name'];
      case 'homework':
        return ['Class & Section *', 'Subject *', 'Assignment Title *', 'Due Date', 'Instructions'];
      case 'leave':
        return ['Applicant Name *', 'Leave Type', 'From Date', 'To Date', 'Reason *'];
      case 'fees':
        return ['Student Name *', 'Admission No', 'Fee Description *', 'Amount ($ / ₹)', 'Status (paid/pending)'];
      default:
        return ['Exam / Report Title *', 'Class *', 'Subject *', 'Date', 'Max Marks'];
    }
  };

  const labels = getFieldLabels();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and review institutional {title.toLowerCase()} records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add {title} Entry</span>
        </button>
      </div>

      <ErrorBanner
        message={errMsg || (error ? (error as Error).message : null)}
        onDismiss={() => setErrMsg(null)}
      />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            New {title} Record
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {labels[0]}
              </label>
              <input
                type="text"
                required
                value={field1}
                onChange={(e) => setField1(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {labels[1]}
              </label>
              <input
                type="text"
                value={field2}
                onChange={(e) => setField2(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {labels[2]}
              </label>
              <input
                type="text"
                value={field3}
                onChange={(e) => setField3(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {labels[3]}
              </label>
              <input
                type="text"
                value={field4}
                onChange={(e) => setField4(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {labels[4]}
              </label>
              <input
                type="text"
                value={field5}
                onChange={(e) => setField5(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Save Record
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <SkeletonRows rows={4} cols={4} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} records yet`}
          description={`Click "Add ${title} Entry" above to create the first record.`}
          actionLabel={`Add ${title} Entry`}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Primary Details</th>
                <th className="py-3 px-4 text-start font-semibold">Schedule / Reference</th>
                <th className="py-3 px-4 text-start font-semibold">Metadata</th>
                <th className="py-3 px-4 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((r: any, idx: number) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {r.title ||
                        r.subject ||
                        r.student_name ||
                        r.applicant_name ||
                        r.exam_name ||
                        r.class_name ||
                        'Record'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.class_name || r.leave_type || r.fee_Title || r.description || ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                    {r.day
                      ? `${r.day} · ${r.period || ''}`
                      : r.due_date || r.from_date || r.exam_date || r.created_at?.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                    {r.amount !== undefined
                      ? `Amount: ${r.amount} (${r.status || 'paid'})`
                      : r.max_marks !== undefined
                      ? `Max Marks: ${r.max_marks}`
                      : r.teacher || r.reason || r.status || 'Active'}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
