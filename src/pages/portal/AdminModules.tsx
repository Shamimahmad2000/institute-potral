import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Check,
  Copy,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserX,
} from 'lucide-react';
import { supabase, callRpc } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../lib/i18n';
import { EmptyState, ErrorBanner, SkeletonRows, SuccessBanner } from '../../components/ui';

// 1. INSTITUTION DASHBOARD (rpc institution_dashboard + charts)
export const InstitutionDashboardView: React.FC = () => {
  const { institution } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['institution_dashboard'],
    queryFn: async () => {
      const res = await callRpc('institution_dashboard');
      if (res.error) throw new Error(res.error.message);
      return Array.isArray(res.data) ? res.data[0] : res.data;
    },
  });

  const instCode =
    data?.code ||
    data?.institution_code ||
    institution?.code ||
    institution?.institution_code ||
    null;

  const copyCode = async () => {
    if (!instCode) return;
    await navigator.clipboard.writeText(instCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <SkeletonRows rows={6} cols={4} />;

  const totalStudents = Number(data?.total_students ?? data?.students_count ?? 0);
  const totalEmployees = Number(data?.total_employees ?? data?.employees_count ?? data?.staff_count ?? 0);
  const totalClasses = Number(data?.total_classes ?? data?.classes_count ?? 0);
  const pendingRequests = Number(data?.pending_requests ?? data?.pending_join_requests ?? 0);
  const presentToday = Number(data?.present_today ?? data?.students_present_today ?? 0);
  const absentToday = Number(data?.absent_today ?? data?.students_absent_today ?? 0);
  const staffPresentToday = Number(data?.staff_present_today ?? 0);

  const barData = [
    { name: 'Students', count: totalStudents },
    { name: 'Employees', count: totalEmployees },
    { name: 'Classes', count: totalClasses },
    { name: 'Pending Joins', count: pendingRequests },
  ];

  const attendancePie = [
    { name: 'Students Present', value: presentToday },
    { name: 'Students Absent', value: absentToday },
    { name: 'Staff Present', value: staffPresentToday },
  ].filter((d) => d.value > 0);

  const COLORS = ['#1d4ed8', '#dc2626', '#16a34a', '#d97706'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {institution?.name || data?.institution_name || 'Institution Overview'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Status: {(institution?.status || data?.status || 'active').toUpperCase()}</span>
            <span aria-hidden="true">·</span>
            <span>Plan: {(institution?.plan || data?.plan || 'free').toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {instCode && (
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-xs font-mono font-semibold text-blue-700 dark:text-blue-300"
            >
              <span>{instCode}</span>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Students', value: totalStudents },
          { label: 'Faculty & Staff', value: totalEmployees },
          { label: 'Active Classes', value: totalClasses },
          { label: 'Pending Join Requests', value: pendingRequests },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Campus Composition Metrics
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Today's Attendance Distribution
          </h2>
          {attendancePie.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No attendance logs recorded for today yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {attendancePie.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Raw RPC summary properties if additional keys returned */}
      {data && typeof data === 'object' && Object.keys(data).length > 0 && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500">
            Live Telemetry Snapshot (institution_dashboard)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            {Object.entries(data)
              .filter(([_, v]) => typeof v === 'number' || typeof v === 'string')
              .map(([k, v]) => (
                <div
                  key={k}
                  className="p-2.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950"
                >
                  <span className="text-slate-500 block truncate">{k}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{String(v)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 2. APPROVALS (join_requests: approve_join_request / reject_join_request)
export const ApprovalsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['join_requests', statusFilter],
    queryFn: async () => {
      let q = supabase.from('join_requests').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') {
        q = q.eq('status', statusFilter);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (reqId: string) => {
      const res = await callRpc(
        'approve_join_request',
        { request_id: reqId },
        [{ p_request_id: reqId }, { id: reqId }, { p_id: reqId }, { join_request_id: reqId }]
      );
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      setActionError(null);
      setActionSuccess('Join request approved via RPC.');
      queryClient.invalidateQueries({ queryKey: ['join_requests'] });
      queryClient.invalidateQueries({ queryKey: ['institution_dashboard'] });
    },
    onError: (err: Error) => {
      setActionSuccess(null);
      setActionError(err.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reqId: string) => {
      const res = await callRpc(
        'reject_join_request',
        { request_id: reqId },
        [{ p_request_id: reqId }, { id: reqId }, { p_id: reqId }, { join_request_id: reqId }]
      );
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      setActionError(null);
      setActionSuccess('Join request rejected.');
      queryClient.invalidateQueries({ queryKey: ['join_requests'] });
      queryClient.invalidateQueries({ queryKey: ['institution_dashboard'] });
    },
    onError: (err: Error) => {
      setActionSuccess(null);
      setActionError(err.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Join Requests & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review teachers, staff, students, and parents requesting access via your institution code.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <ErrorBanner message={actionError || (error ? (error as Error).message : null)} onDismiss={() => setActionError(null)} />
      <SuccessBanner message={actionSuccess} onDismiss={() => setActionSuccess(null)} />

      {isLoading ? (
        <SkeletonRows rows={4} cols={5} />
      ) : !requests || requests.length === 0 ? (
        <EmptyState
          title="No join requests found"
          description={`There are currently no ${statusFilter === 'all' ? '' : statusFilter} join requests for your institution.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Applicant / Details</th>
                <th className="py-3 px-4 text-start font-semibold">Requested Role</th>
                <th className="py-3 px-4 text-start font-semibold">Status</th>
                <th className="py-3 px-4 text-start font-semibold">Submitted At</th>
                <th className="py-3 px-4 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {requests.map((req: any) => {
                const details = req.details && typeof req.details === 'object' ? req.details : {};
                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {details.name || req.name || req.email || req.user_id || 'Applicant'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {Object.entries(details)
                          .filter(([k, v]) => k !== 'name' && v)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ') || req.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs uppercase text-slate-700 dark:text-slate-300">
                      {req.role}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold capitalize">
                      {req.status || 'pending'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-end">
                      {(req.status || 'pending') === 'pending' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectMutation.mutate(req.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Processed</span>
                      )}
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

// 3. MEMBERS (memberships + rpc update_member)
export const MembersView: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['memberships_list'],
    queryFn: async () => {
      const withProfiles = await supabase
        .from('memberships')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });
      if (!withProfiles.error && withProfiles.data) {
        return withProfiles.data;
      }
      const plain = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });
      if (plain.error) throw new Error(plain.error.message);
      return plain.data || [];
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
      status,
    }: {
      memberId: string;
      role: string;
      status: string;
    }) => {
      const res = await callRpc(
        'update_member',
        { member_id: memberId, role, status },
        [
          { p_member_id: memberId, p_role: role, p_status: status },
          { id: memberId, role, status },
          { p_id: memberId, p_role: role, p_status: status },
          { membership_id: memberId, role, status },
        ]
      );
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      setActionError(null);
      setActionSuccess('Member updated via update_member RPC.');
      queryClient.invalidateQueries({ queryKey: ['memberships_list'] });
    },
    onError: (err: Error) => {
      setActionSuccess(null);
      setActionError(err.message);
    },
  });

  const filtered = (members || []).filter((m: any) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const target = `${prof?.name || ''} ${prof?.full_name || ''} ${prof?.email || ''} ${
      m.role || ''
    } ${m.user_id || ''}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Institution Members
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage roles and active access status for all campus members via update_member RPC.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      <ErrorBanner message={actionError || (error ? (error as Error).message : null)} onDismiss={() => setActionError(null)} />
      <SuccessBanner message={actionSuccess} onDismiss={() => setActionSuccess(null)} />

      {isLoading ? (
        <SkeletonRows rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No members match your filter"
          description="Approved institution members will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Member</th>
                <th className="py-3 px-4 text-start font-semibold">Role</th>
                <th className="py-3 px-4 text-start font-semibold">Status</th>
                <th className="py-3 px-4 text-end font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((m: any) => {
                const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                const currentStatus =
                  m.status || (m.is_active === false ? 'disabled' : 'active');
                return (
                  <MemberRow
                    key={m.id}
                    member={m}
                    profile={prof}
                    currentStatus={currentStatus}
                    onSave={(role, status) =>
                      updateMemberMutation.mutate({ memberId: m.id, role, status })
                    }
                    isSaving={updateMemberMutation.isPending}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const MemberRow: React.FC<{
  member: any;
  profile: any;
  currentStatus: string;
  onSave: (role: string, status: string) => void;
  isSaving: boolean;
}> = ({ member, profile, currentStatus, onSave, isSaving }) => {
  const [role, setRole] = useState<string>(member.role || 'teacher');
  const [status, setStatus] = useState<string>(currentStatus);

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-900 dark:text-white">
          {profile?.full_name || profile?.name || member.name || 'Member'}
        </div>
        <div className="text-xs font-mono text-slate-500">
          {profile?.email || member.user_id}
        </div>
      </td>
      <td className="py-3 px-4">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
        >
          <option value="institution_admin">institution_admin</option>
          <option value="principal">principal</option>
          <option value="hr_staff">hr_staff</option>
          <option value="accountant">accountant</option>
          <option value="teacher">teacher</option>
          <option value="student">student</option>
          <option value="parent">parent</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
        >
          <option value="active">active</option>
          <option value="disabled">disabled</option>
        </select>
      </td>
      <td className="py-3 px-4 text-end">
        <button
          type="button"
          onClick={() => onSave(role, status)}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
        >
          Save Changes
        </button>
      </td>
    </tr>
  );
};

// 4. CLASSES AND SECTIONS (assign teachers via section_teachers)
export const ClassesSectionsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: sectionTeachers } = useQuery({
    queryKey: ['section_teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('section_teachers').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers_list'],
    queryFn: async () => {
      // Load employees or memberships with role=teacher
      const empRes = await supabase.from('employees').select('*');
      if (!empRes.error && empRes.data && empRes.data.length > 0) {
        return empRes.data;
      }
      const memRes = await supabase
        .from('memberships')
        .select('*, profiles(*)')
        .eq('role', 'teacher');
      return memRes.data || [];
    },
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    if (!className.trim()) return;
    const { error } = await supabase.from('classes').insert([{ name: className.trim() }]);
    if (error) {
      setErrMsg(error.message);
    } else {
      setClassName('');
      setOkMsg('Class created.');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    if (!selectedClassId || !sectionName.trim()) return;
    const { error } = await supabase
      .from('sections')
      .insert([{ class_id: selectedClassId, name: sectionName.trim() }]);
    if (error) {
      setErrMsg(error.message);
    } else {
      setSectionName('');
      setOkMsg('Section created.');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    if (!assignSectionId || !assignTeacherId) return;
    const { error } = await supabase.from('section_teachers').insert([
      {
        section_id: assignSectionId,
        teacher_id: assignTeacherId,
      },
    ]);
    if (error) {
      // Try user_id or employee_id column name if teacher_id is named differently
      const retry = await supabase.from('section_teachers').insert([
        {
          section_id: assignSectionId,
          user_id: assignTeacherId,
        },
      ]);
      if (retry.error) {
        setErrMsg(error.message);
        return;
      }
    }
    setOkMsg('Teacher assigned to section.');
    queryClient.invalidateQueries({ queryKey: ['section_teachers'] });
  };

  const handleRemoveAssignment = async (id: string) => {
    setErrMsg(null);
    const { error } = await supabase.from('section_teachers').delete().eq('id', id);
    if (error) setErrMsg(error.message);
    else queryClient.invalidateQueries({ queryKey: ['section_teachers'] });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Classes, Sections & Teacher Assignments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure academic classes, divide into sections, and assign faculty via section_teachers.
        </p>
      </div>

      <ErrorBanner message={errMsg} onDismiss={() => setErrMsg(null)} />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Class */}
        <form
          onSubmit={handleCreateClass}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">1. Add New Class</h2>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Grade 10"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Class</span>
          </button>
        </form>

        {/* Create Section */}
        <form
          onSubmit={handleCreateSection}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            2. Add Section to Class
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Class *
            </label>
            <select
              required
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Section Name *
            </label>
            <input
              type="text"
              required
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g., Section A"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Section</span>
          </button>
        </form>

        {/* Assign Teacher to Section */}
        <form
          onSubmit={handleAssignTeacher}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            3. Assign Teacher (section_teachers)
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Section *
            </label>
            <select
              required
              value={assignSectionId}
              onChange={(e) => setAssignSectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              <option value="">Choose section...</option>
              {(sections || []).map((s: any) => {
                const cls = (classes || []).find((c: any) => c.id === s.class_id);
                return (
                  <option key={s.id} value={s.id}>
                    {cls ? `${cls.name} — ` : ''}
                    {s.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Teacher *
            </label>
            <select
              required
              value={assignTeacherId}
              onChange={(e) => setAssignTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              <option value="">Choose teacher...</option>
              {(teachers || []).map((t: any) => {
                const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                const tid = t.user_id || t.id;
                const tlabel =
                  t.name || t.full_name || prof?.full_name || prof?.name || prof?.email || tid;
                return (
                  <option key={tid} value={tid}>
                    {tlabel}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Teacher</span>
          </button>
        </form>
      </div>

      {/* Classes & Sections Directory */}
      {loadingClasses || loadingSections ? (
        <SkeletonRows rows={4} cols={3} />
      ) : !classes || classes.length === 0 ? (
        <EmptyState
          title="No classes configured yet"
          description="Create your first academic class above to organize sections and assign teachers."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Class</th>
                <th className="py-3 px-4 text-start font-semibold">Sections</th>
                <th className="py-3 px-4 text-start font-semibold">Assigned Teachers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {classes.map((cls: any) => {
                const clsSections = (sections || []).filter((s: any) => s.class_id === cls.id);
                return (
                  <tr key={cls.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {cls.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {clsSections.length === 0
                        ? 'No sections'
                        : clsSections.map((s: any) => s.name).join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="flex flex-wrap gap-2">
                        {clsSections.map((sec: any) => {
                          const assignments = (sectionTeachers || []).filter(
                            (st: any) => st.section_id === sec.id
                          );
                          return assignments.map((asgn: any) => {
                            const tid = asgn.teacher_id || asgn.user_id || asgn.employee_id;
                            const foundT = (teachers || []).find(
                              (t: any) => t.id === tid || t.user_id === tid
                            );
                            const tName =
                              foundT?.name ||
                              foundT?.full_name ||
                              foundT?.profiles?.name ||
                              tid;
                            return (
                              <span
                                key={asgn.id || `${sec.id}-${tid}`}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                              >
                                <span>
                                  {sec.name}: <strong>{tName}</strong>
                                </span>
                                {asgn.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(asgn.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove assignment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            );
                          });
                        })}
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

// 5. BRANDING SETTINGS (logo upload to bucket `logos`, theme color)
export const BrandingSettingsView: React.FC = () => {
  const { institution, refreshUserContext } = useAuth();
  const { brandColor, setBrandColor } = useI18n();
  const [color, setColor] = useState(institution?.theme_color || brandColor || '#1d4ed8');
  const [instName, setInstName] = useState(institution?.name || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrMsg(null);
    setOkMsg(null);
    setUploading(true);

    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${institution?.id || 'campus'}/logo_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setErrMsg(uploadError.message);
      return;
    }

    const { data: pubUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
    const logoUrl = pubUrlData.publicUrl;

    if (institution?.id) {
      const { error: updateErr } = await supabase
        .from('institutions')
        .update({ logo_url: logoUrl })
        .eq('id', institution.id);
      if (updateErr) {
        setUploading(false);
        setErrMsg(updateErr.message);
        return;
      }
    }

    setUploading(false);
    setOkMsg('Logo uploaded to bucket `logos` and saved to institution profile.');
    await refreshUserContext();
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    setSaving(true);
    setBrandColor(color);

    if (institution?.id) {
      const { error } = await supabase
        .from('institutions')
        .update({
          name: instName.trim() || institution.name,
          theme_color: color,
        })
        .eq('id', institution.id);
      setSaving(false);
      if (error) {
        setErrMsg(error.message);
        return;
      }
      setOkMsg('Institution branding and theme color saved.');
      await refreshUserContext();
    } else {
      setSaving(false);
      setOkMsg('Theme accent applied.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Institution Branding Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload your official crest to the Supabase `logos` storage bucket and customize your campus
          theme color.
        </p>
      </div>

      <ErrorBanner message={errMsg} onDismiss={() => setErrMsg(null)} />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-center gap-5">
          {institution?.logo_url ? (
            <img
              src={institution.logo_url}
              alt="Institution Logo"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-contain border border-slate-200 dark:border-slate-800 p-1 bg-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
              No Logo
            </div>
          )}

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading to `logos`...' : 'Upload Logo to `logos` Bucket'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500">PNG, SVG, or JPG recommended (square 1:1).</p>
          </div>
        </div>

        <form onSubmit={handleSaveBranding} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Institution Display Name
            </label>
            <input
              type="text"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Portal Theme Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-36 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <div className="flex items-center gap-1.5">
                {['#1d4ed8', '#0f766e', '#15803d', '#b45309', '#be123c', '#334155'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className="w-6 h-6 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: preset }}
                    title={preset}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: color }}
          >
            <Palette className="w-4 h-4" />
            <span>{saving ? 'Saving Branding...' : 'Save Branding Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// 6. AUDIT LOGS VIEW
export const AuditLogsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['institution_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const filtered = (logs || []).filter((l: any) =>
    JSON.stringify(l).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Institutional Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable record of administrative actions and security events within your campus.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter audit logs..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading ? (
        <SkeletonRows rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No audit log entries found"
          description="Administrative actions recorded in audit_logs will appear here automatically."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Timestamp</th>
                <th className="py-3 px-4 text-start font-semibold">Action</th>
                <th className="py-3 px-4 text-start font-semibold">Actor / Entity</th>
                <th className="py-3 px-4 text-start font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((log: any, idx: number) => (
                <tr key={log.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {log.action || log.event || log.type || 'EVENT'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {log.actor_id || log.user_id || log.entity_type || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 max-w-md truncate">
                    {typeof log.details === 'object'
                      ? JSON.stringify(log.details)
                      : String(log.details || log.metadata ? JSON.stringify(log.metadata) : '—')}
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
