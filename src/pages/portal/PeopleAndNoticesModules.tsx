import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, FileSpreadsheet, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState, ErrorBanner, SkeletonRows, SuccessBanner } from '../../components/ui';

// 1. STUDENTS MODULE (CRUD, search, CSV import)
export const StudentsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Student form fields
  const [name, setName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // CSV Import state
  const [csvPreview, setCsvPreview] = useState<Record<string, any>[]>([]);
  const [importingCsv, setImportingCsv] = useState(false);

  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('*').order('name');
      return data || [];
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await supabase.from('sections').select('*').order('name');
      return data || [];
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAdmissionNo('');
    setRollNo('');
    setClassId('');
    setSectionId('');
    setGuardianPhone('');
    setShowForm(false);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    const payload: Record<string, any> = {
      name: name.trim(),
      admission_no: admissionNo.trim() || null,
      roll_no: rollNo.trim() || null,
      class_id: classId || null,
      section_id: sectionId || null,
      phone: guardianPhone.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from('students').update(payload).eq('id', editingId);
      if (error) {
        setErrMsg(error.message);
        return;
      }
      setOkMsg('Student record updated.');
    } else {
      const { error } = await supabase.from('students').insert([payload]);
      if (error) {
        setErrMsg(error.message);
        return;
      }
      setOkMsg('Student added to roster.');
    }

    resetForm();
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  const handleDeleteStudent = async (id: string) => {
    setErrMsg(null);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) setErrMsg(error.message);
    else {
      setOkMsg('Student deleted.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  };

  // CSV File Parser (Client-side, supports name, admission_no, roll_no, class_id, section_id, phone)
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrMsg(null);
    setOkMsg(null);

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setErrMsg('CSV file must include a header row and at least one student row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        if (values[idx] !== undefined && values[idx] !== '') {
          rowObj[h] = values[idx];
        }
      });
      if (Object.keys(rowObj).length > 0) {
        rows.push(rowObj);
      }
    }

    setCsvPreview(rows);
  };

  const handleConfirmCsvImport = async () => {
    if (csvPreview.length === 0) return;
    setErrMsg(null);
    setOkMsg(null);
    setImportingCsv(true);

    const { error } = await supabase.from('students').insert(csvPreview);
    setImportingCsv(false);

    if (error) {
      setErrMsg(error.message);
      return;
    }

    setOkMsg(`Imported ${csvPreview.length} student records from CSV.`);
    setCsvPreview([]);
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  const filteredStudents = (students || []).filter((s: any) => {
    const matchesClass = !classFilter || s.class_id === classFilter;
    const text = `${s.name || s.full_name || ''} ${s.admission_no || ''} ${
      s.roll_no || ''
    }`.toLowerCase();
    return matchesClass && text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Student Directory & Enrollment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add, edit, search, or bulk-import students via CSV (`name,admission_no,roll_no,class_id,section_id`).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvFileChange} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <ErrorBanner
        message={errMsg || (error ? (error as Error).message : null)}
        onDismiss={() => setErrMsg(null)}
      />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {/* CSV Preview Panel */}
      {csvPreview.length > 0 && (
        <div className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                CSV Import Preview ({csvPreview.length} rows ready)
              </h3>
              <p className="text-xs text-slate-500">
                Columns detected: {Object.keys(csvPreview[0] || {}).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmCsvImport}
                disabled={importingCsv}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {importingCsv ? 'Inserting Rows...' : `Confirm Import (${csvPreview.length})`}
              </button>
              <button
                type="button"
                onClick={() => setCsvPreview([])}
                className="p-2 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSaveStudent}
          className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Student Record' : 'New Student Enrollment'}
            </h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Number
              </label>
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                placeholder="ADM-2026-101"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="01"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class
              </label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">Select class...</option>
                {(classes || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">Select section...</option>
                {(sections || [])
                  .filter((s: any) => !classId || s.class_id === classId)
                  .map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian Phone
              </label>
              <input
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              {editingId ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, admission no, or roll no..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="">All Classes</option>
          {(classes || []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <SkeletonRows rows={6} cols={5} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Add a student manually or import your student roster via CSV."
          actionLabel="Add First Student"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Student Name</th>
                <th className="py-3 px-4 text-start font-semibold">Admission / Roll</th>
                <th className="py-3 px-4 text-start font-semibold">Class & Section</th>
                <th className="py-3 px-4 text-start font-semibold">Contact</th>
                <th className="py-3 px-4 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredStudents.map((st: any) => {
                const cls = (classes || []).find((c: any) => c.id === st.class_id);
                const sec = (sections || []).find((s: any) => s.id === st.section_id);
                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {st.name || st.full_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      {st.admission_no || '—'} · Roll: {st.roll_no || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {cls?.name || st.class_name || '—'}{' '}
                      {sec?.name ? `(${sec.name})` : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                      {st.phone || st.guardian_phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(st.id);
                            setName(st.name || st.full_name || '');
                            setAdmissionNo(st.admission_no || '');
                            setRollNo(st.roll_no || '');
                            setClassId(st.class_id || '');
                            setSectionId(st.section_id || '');
                            setGuardianPhone(st.phone || '');
                            setShowForm(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-700"
                          title="Edit student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(st.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

// 2. EMPLOYEES MODULE (for institution_admin, principal, hr_staff)
export const EmployeesView: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    const { error } = await supabase.from('employees').insert([
      {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        designation: designation.trim() || null,
        department: department.trim() || null,
        employee_code: employeeCode.trim() || null,
      },
    ]);

    if (error) {
      setErrMsg(error.message);
      return;
    }

    setOkMsg('Employee added.');
    setName('');
    setEmail('');
    setPhone('');
    setDesignation('');
    setDepartment('');
    setEmployeeCode('');
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const handleDeleteEmployee = async (id: string) => {
    setErrMsg(null);
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) setErrMsg(error.message);
    else queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const filtered = (employees || []).filter((emp: any) =>
    `${emp.name || emp.full_name || ''} ${emp.designation || ''} ${emp.department || ''} ${
      emp.employee_code || ''
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Employees & Faculty Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage teaching faculty, administrative officers, and HR personnel records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <ErrorBanner
        message={errMsg || (error ? (error as Error).message : null)}
        onDismiss={() => setErrMsg(null)}
      />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {showForm && (
        <form
          onSubmit={handleSaveEmployee}
          className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add Employee Record</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prof. Neha Gupta"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee Code
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="EMP-104"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Senior Mathematics Teacher"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Science & Mathematics"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neha@school.edu"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
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
              Save Employee
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
      </div>

      {isLoading ? (
        <SkeletonRows rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Add faculty and staff records to populate the institutional employee directory."
          actionLabel="Add First Employee"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Employee</th>
                <th className="py-3 px-4 text-start font-semibold">Code</th>
                <th className="py-3 px-4 text-start font-semibold">Designation & Dept</th>
                <th className="py-3 px-4 text-start font-semibold">Contact</th>
                <th className="py-3 px-4 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {emp.name || emp.full_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                    {emp.employee_code || '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                    {[emp.designation, emp.department].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                    {[emp.email, emp.phone].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Delete employee"
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

// 3. NOTICES MODULE (accessible to all roles; Admin/Principal/Teacher can post notices)
export const NoticesView: React.FC = () => {
  const { membership } = useAuth();
  const queryClient = useQueryClient();
  const canManage =
    membership?.role === 'institution_admin' ||
    membership?.role === 'principal' ||
    membership?.role === 'teacher';

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: notices, isLoading, error } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    const { error } = await supabase.from('notices').insert([
      {
        title: title.trim(),
        content: content.trim(),
        audience,
      },
    ]);

    if (error) {
      // Fallback if table uses body/description instead of content or doesn't have audience
      const retry = await supabase.from('notices').insert([
        {
          title: title.trim(),
          body: content.trim(),
        },
      ]);
      if (retry.error) {
        setErrMsg(error.message);
        return;
      }
    }

    setTitle('');
    setContent('');
    setShowForm(false);
    setOkMsg('Notice published.');
    queryClient.invalidateQueries({ queryKey: ['notices'] });
  };

  const handleDeleteNotice = async (id: string) => {
    setErrMsg(null);
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) setErrMsg(error.message);
    else queryClient.invalidateQueries({ queryKey: ['notices'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Campus Notices & Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional circulars and announcements for faculty, students, and parents.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      <ErrorBanner
        message={errMsg || (error ? (error as Error).message : null)}
        onDismiss={() => setErrMsg(null)}
      />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {showForm && canManage && (
        <form
          onSubmit={handleCreateNotice}
          className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Publish New Notice</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notice Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mid-Term Examination Schedule Released"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="all">All Campus Roles</option>
                <option value="teachers">Teachers & Staff</option>
                <option value="students">Students</option>
                <option value="parents">Parents</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Content *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the complete official notice details..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
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
              Publish Notice
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <SkeletonRows rows={4} cols={2} />
      ) : !notices || notices.length === 0 ? (
        <EmptyState
          title="No notices published yet"
          description="Campus announcements and circulars will appear here once published."
        />
      ) : (
        <div className="space-y-4">
          {notices.map((n: any) => (
            <article
              key={n.id}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{n.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                    <span>
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Published'}
                    </span>
                    {n.audience && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase">Audience: {n.audience}</span>
                      </>
                    )}
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pt-2">
                {n.content || n.body || n.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
