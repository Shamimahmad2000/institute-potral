import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
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
  Building2,
  Check,
  Copy,
  Database,
  ExternalLink,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  supabase,
  callRpc,
  SUPER_ADMIN_EMAILS,
  SUPER_ADMIN_PASSWORD,
  SUPABASE_PROJECT_URL,
} from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  EmptyState,
  ErrorBanner,
  LanguageThemeControls,
  SkeletonRows,
  SuccessBanner,
} from '../../components/ui';

// 1. SUPER ADMIN LOGIN (/admin/login)
export const SuperAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, refreshUserContext } = useAuth();
  const [email, setEmail] = useState('hafizshamimahmad5@gmaul.com');
  const [password, setPassword] = useState('Fariza@2000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const performLogin = async (targetEmail: string, targetPassword: string) => {
    setError(null);
    setLoading(true);

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: targetEmail.trim(),
      password: targetPassword,
    });

    if (signInErr) {
      setLoading(false);
      setError(signInErr.message);
      return;
    }

    await refreshUserContext();
    setLoading(false);
    navigate('/admin');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 p-6">
      <header className="flex items-center justify-between max-w-7xl w-full mx-auto py-2">
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-white">
          EDUWORK
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/login" className="text-slate-400 hover:text-white">
            Institution Login
          </Link>
          <Link to="/" className="text-slate-400 hover:text-white">
            Public Website
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-xl border border-slate-800 bg-slate-900 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs font-mono text-blue-400">
              PROJECT: biznhrnxukiktvtbumnc · SUPER ADMIN
            </p>
            <h1 className="font-display text-2xl font-bold text-white">Super Admin Sign In</h1>
            <p className="text-xs text-slate-400">
              Sign in with your Super Admin credentials (`hafizshamimahmad5@gmaul.com`).
            </p>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Super Admin Email / ID
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hafizshamimahmad5@gmaul.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In to Super Admin Console'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => performLogin('hafizshamimahmad5@gmaul.com', SUPER_ADMIN_PASSWORD)}
              disabled={loading}
              className="w-full py-2 px-3 text-xs font-mono text-blue-300 bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/70 rounded-lg transition-colors"
            >
              Quick Sign In: hafizshamimahmad5@gmaul.com
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-2 font-mono">
        Connected to {SUPABASE_PROJECT_URL}
      </footer>
    </div>
  );
};

// 2. SUPER ADMIN PANEL (/admin)
export const SuperAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'institutions' | 'settings' | 'audit_logs' | 'users' | 'sql_schema'
  >('dashboard');

  const { data: superAdminRow, isLoading: checkingAdmin } = useQuery({
    queryKey: ['verify_super_admin', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return null;
      const res1 = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!res1.error && res1.data) return res1.data;

      const res2 = await supabase
        .from('super_admins')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (!res2.error && res2.data) return res2.data;
      return null;
    },
  });

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 font-mono text-xs">
        Verifying super_admins authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const emailLower = String(user.email || '').toLowerCase();
  const authorized =
    isSuperAdmin || Boolean(superAdminRow) || SUPER_ADMIN_EMAILS.includes(emailLower);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="w-full max-w-lg p-8 rounded-xl border border-red-900 bg-slate-900 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Access denied</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your authenticated user ID (<code className="font-mono text-xs">{user.id}</code>) does
            not exist in the <code className="font-mono text-xs">super_admins</code> table.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/app"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Go to Institution Portal
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate('/admin/login');
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Platform Stats',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'institutions',
      label: 'Institutions',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'users',
      label: 'Users (Profiles)',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'sql_schema',
      label: 'Supabase SQL Schema',
      icon: <Database className="w-4 h-4" />,
    },
  ] as const;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Super Admin Sidebar */}
      <aside className="w-64 shrink-0 border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between">
        <div className="space-y-5">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Link
              to="/admin"
              className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white block"
            >
              EDUWORK
            </Link>
            <span className="text-[11px] font-mono text-blue-700 dark:text-blue-400">
              SUPER ADMIN CONSOLE
            </span>
          </div>

          {/* Direct Link to Institution Portal (/app) with Full Access */}
          <Link
            to="/app"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 dark:bg-blue-950/80 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <span>Open Institution Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="px-3 text-[11px] font-mono text-slate-500 truncate">{user.email}</div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500">
            Super Admin (`biznhrnxukiktvtbumnc`) /{' '}
            <strong className="text-slate-900 dark:text-white capitalize">
              {activeSection.replace('_', ' ')}
            </strong>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Switch to Institution Portal (/app)
            </Link>
            <LanguageThemeControls compact />
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && <PlatformStatsView />}
          {activeSection === 'institutions' && <SuperAdminInstitutionsView />}
          {activeSection === 'settings' && <SuperAdminSettingsView />}
          {activeSection === 'audit_logs' && <SuperAdminAuditLogsView />}
          {activeSection === 'users' && <SuperAdminUsersView />}
          {activeSection === 'sql_schema' && <SuperAdminSqlSchemaView />}
        </main>
      </div>
    </div>
  );
};

// SUB-VIEW 1: PLATFORM STATS DASHBOARD (rpc platform_stats)
const PlatformStatsView: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['platform_stats'],
    queryFn: async () => {
      const res = await callRpc('platform_stats');
      if (res.error) throw new Error(res.error.message);
      return Array.isArray(res.data) ? res.data[0] : res.data;
    },
  });

  if (isLoading) return <SkeletonRows rows={6} cols={4} />;

  const totalInst = Number(data?.total_institutions ?? data?.institutions_total ?? 0);
  const activeInst = Number(data?.active_institutions ?? data?.active ?? 0);
  const pendingInst = Number(data?.pending_institutions ?? data?.pending ?? 0);
  const suspendedInst = Number(data?.suspended_institutions ?? data?.suspended ?? 0);
  const newThisMonth = Number(
    data?.new_this_month ?? data?.new_institutions_this_month ?? 0
  );
  const totalStudents = Number(data?.total_students ?? data?.students_total ?? 0);
  const totalEmployees = Number(
    data?.total_employees ?? data?.employees_total ?? data?.total_staff ?? 0
  );

  const statusChart = [
    { name: 'Active', value: activeInst },
    { name: 'Pending', value: pendingInst },
    { name: 'Suspended', value: suspendedInst },
  ];

  const scaleChart = [
    { name: 'Total Institutions', count: totalInst },
    { name: 'New This Month', count: newThisMonth },
    { name: 'Total Students', count: totalStudents },
    { name: 'Total Employees', count: totalEmployees },
  ];

  const COLORS = ['#16a34a', '#d97706', '#dc2626'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Platform Telemetry & Statistics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live metrics aggregated across all tenant institutions via platform_stats RPC.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Institutions', value: totalInst },
          { label: 'Active', value: activeInst },
          { label: 'Pending', value: pendingInst },
          { label: 'Suspended', value: suspendedInst },
          { label: 'New This Month', value: newThisMonth },
          { label: 'Total Students', value: totalStudents },
          { label: 'Total Employees', value: totalEmployees },
        ].map((m, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
          >
            <p className="text-[11px] font-medium text-slate-500">{m.label}</p>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Platform Scale Overview
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scaleChart}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Institution Status Breakdown
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusChart.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// SUB-VIEW 2: INSTITUTIONS TABLE + DIRECT CREATE INSTITUTION
const SuperAdminInstitutionsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>(
    'all'
  );
  const [selectedInst, setSelectedInst] = useState<any | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstCity, setNewInstCity] = useState('');
  const [newInstPlan, setNewInstPlan] = useState('enterprise');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: institutions, isLoading, error } = useQuery({
    queryKey: ['super_admin_institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const handleCreateInstitutionDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);
    const res = await callRpc('create_institution', {
      name: newInstName.trim(),
      city: newInstCity.trim(),
    });
    if (res.error) {
      setErrMsg(res.error.message);
      return;
    }
    const createdCode = (res.data as any)?.code || 'EDU-NEW';
    setNewInstName('');
    setNewInstCity('');
    setShowCreateForm(false);
    setOkMsg(`Institution created with code ${createdCode}.`);
    queryClient.invalidateQueries({ queryKey: ['super_admin_institutions'] });
    queryClient.invalidateQueries({ queryKey: ['platform_stats'] });
  };

  const setStatusMutation = useMutation({
    mutationFn: async ({
      instId,
      status,
      plan,
    }: {
      instId: string;
      status: string;
      plan?: string;
    }) => {
      const res = await callRpc(
        'set_institution_status',
        {
          institution_id: instId,
          status,
          plan: plan || null,
        },
        [
          {
            p_institution_id: instId,
            p_status: status,
            p_plan: plan || null,
          },
          {
            id: instId,
            status,
            plan: plan || null,
          },
        ]
      );
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      setErrMsg(null);
      setOkMsg('Institution status/plan updated via set_institution_status RPC.');
      queryClient.invalidateQueries({ queryKey: ['super_admin_institutions'] });
      queryClient.invalidateQueries({ queryKey: ['platform_stats'] });
    },
    onError: (err: Error) => {
      setOkMsg(null);
      setErrMsg(err.message);
    },
  });

  const filtered = (institutions || []).filter((inst: any) => {
    const st = (inst.status || 'active').toLowerCase();
    const matchesStatus = statusFilter === 'all' || st === statusFilter;
    const text = `${inst.name || ''} ${inst.code || inst.institution_code || ''} ${
      inst.city || ''
    } ${inst.email || ''}`.toLowerCase();
    return matchesStatus && text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Institutions Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, approve, activate, suspend, reactivate, and manage subscription plans via RPC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Institution</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or EDU-XXXXX..."
              className="ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['all', 'active', 'pending', 'suspended'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ErrorBanner
        message={errMsg || (error ? (error as Error).message : null)}
        onDismiss={() => setErrMsg(null)}
      />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      {showCreateForm && (
        <form
          onSubmit={handleCreateInstitutionDirect}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Provision New Institution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Institution Name *</label>
              <input
                type="text"
                required
                value={newInstName}
                onChange={(e) => setNewInstName(e.target.value)}
                placeholder="Al-Huda International Academy"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">City</label>
              <input
                type="text"
                value={newInstCity}
                onChange={(e) => setNewInstCity(e.target.value)}
                placeholder="New Delhi"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Initial Plan</label>
              <select
                value={newInstPlan}
                onChange={(e) => setNewInstPlan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Create & Generate EDU-XXXXX Code
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <SkeletonRows rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching institutions"
          description="Registered institutions matching your filter will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Institution</th>
                <th className="py-3 px-4 text-start font-semibold">Code</th>
                <th className="py-3 px-4 text-start font-semibold">Status</th>
                <th className="py-3 px-4 text-start font-semibold">Plan</th>
                <th className="py-3 px-4 text-end font-semibold">Actions (set_institution_status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((inst: any) => (
                <InstitutionAdminRow
                  key={inst.id}
                  inst={inst}
                  onViewDetails={() => setSelectedInst(inst)}
                  onMutate={(status, plan) =>
                    setStatusMutation.mutate({ instId: inst.id, status, plan })
                  }
                  isPending={setStatusMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Institution Details — {selectedInst.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedInst(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {Object.entries(selectedInst).map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800/60"
                >
                  <span className="text-slate-500">{k}:</span>
                  <span className="text-slate-900 dark:text-white break-all text-end">
                    {v === null || v === undefined ? '—' : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InstitutionAdminRow: React.FC<{
  inst: any;
  onViewDetails: () => void;
  onMutate: (status: string, plan: string) => void;
  isPending: boolean;
}> = ({ inst, onViewDetails, onMutate, isPending }) => {
  const [plan, setPlan] = useState<string>((inst.plan || 'free').toLowerCase());
  const status = (inst.status || 'active').toLowerCase();

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-900 dark:text-white">{inst.name}</div>
        <div className="text-xs text-slate-500">
          {[inst.city, inst.state, inst.email].filter(Boolean).join(' · ') || inst.id}
        </div>
      </td>
      <td className="py-3 px-4 font-mono text-xs font-bold text-blue-700 dark:text-blue-400 tabular-nums">
        {inst.code || inst.institution_code || '—'}
      </td>
      <td className="py-3 px-4 font-mono text-xs font-bold uppercase">{status}</td>
      <td className="py-3 px-4">
        <select
          value={plan}
          onChange={(e) => {
            const nextPlan = e.target.value;
            setPlan(nextPlan);
            onMutate(status, nextPlan);
          }}
          disabled={isPending}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
        >
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </td>
      <td className="py-3 px-4 text-end">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={onViewDetails}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="View institution details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {status === 'pending' && (
            <button
              type="button"
              onClick={() => onMutate('active', plan)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Approve / Activate
            </button>
          )}
          {status === 'active' && (
            <button
              type="button"
              onClick={() => onMutate('suspended', plan)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Suspend
            </button>
          )}
          {status === 'suspended' && (
            <button
              type="button"
              onClick={() => onMutate('active', plan)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Reactivate
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// SUB-VIEW 3: PLATFORM SETTINGS (toggle platform_settings.require_approval)
const SuperAdminSettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { data: settingsRow, isLoading, error } = useQuery({
    queryKey: ['platform_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const toggleRequireApproval = async () => {
    setErrMsg(null);
    setOkMsg(null);
    const currentVal = Boolean(settingsRow?.require_approval);
    const nextVal = !currentVal;

    if (settingsRow?.id !== undefined) {
      const { error } = await supabase
        .from('platform_settings')
        .update({ require_approval: nextVal })
        .eq('id', settingsRow.id);
      if (error) {
        setErrMsg(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('platform_settings')
        .update({ require_approval: nextVal })
        .neq('require_approval', nextVal);
      if (error) {
        setErrMsg(error.message);
        return;
      }
    }

    setOkMsg(`platform_settings.require_approval set to ${nextVal}.`);
    queryClient.invalidateQueries({ queryKey: ['platform_settings'] });
  };

  if (isLoading) return <SkeletonRows rows={2} cols={2} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure global onboarding and security controls in `platform_settings`.
        </p>
      </div>

      <ErrorBanner
        message={errMsg || (error ? (error as Error).message : null)}
        onDismiss={() => setErrMsg(null)}
      />
      <SuccessBanner message={okMsg} onDismiss={() => setOkMsg(null)} />

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Require Super Admin Approval for New Institutions (`require_approval`)
          </h2>
          <p className="text-xs text-slate-500">
            When enabled, newly created institutions enter a `pending` state until approved by a
            Super Administrator.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleRequireApproval}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            settingsRow?.require_approval
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {settingsRow?.require_approval ? 'Enabled (Click to Disable)' : 'Disabled (Click to Enable)'}
        </button>
      </div>
    </div>
  );
};

// SUB-VIEW 4: AUDIT LOG VIEWER (table audit_logs)
const SuperAdminAuditLogsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['super_admin_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(250);
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
            Platform Audit Log Viewer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspect system-wide events recorded in `audit_logs`.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading ? (
        <SkeletonRows rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          description="Events recorded in audit_logs will be displayed here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Timestamp</th>
                <th className="py-3 px-4 text-start font-semibold">Action</th>
                <th className="py-3 px-4 text-start font-semibold">User / Actor</th>
                <th className="py-3 px-4 text-start font-semibold">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs tabular-nums">
              {filtered.map((l: any, idx: number) => (
                <tr key={l.id || idx}>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {l.action || l.event || 'ACTION'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {l.actor_id || l.user_id || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-md truncate">
                    {typeof l.details === 'object'
                      ? JSON.stringify(l.details)
                      : String(l.details || '—')}
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

// SUB-VIEW 5: USERS LIST (profiles with search)
const SuperAdminUsersView: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ['super_admin_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(250);
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const filtered = (profiles || []).filter((p: any) =>
    JSON.stringify(p).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Platform Users Directory (`profiles`)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search and inspect registered user profiles across EDUWORK.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading ? (
        <SkeletonRows rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No user profiles found"
          description="Registered users in the profiles table will be listed here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4 text-start font-semibold">Full Name</th>
                <th className="py-3 px-4 text-start font-semibold">Email</th>
                <th className="py-3 px-4 text-start font-semibold">Mobile</th>
                <th className="py-3 px-4 text-start font-semibold">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((p: any, idx: number) => (
                <tr key={p.id || idx}>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {p.full_name || p.name || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {p.email || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                    {p.mobile || p.phone || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">
                    {p.id || p.user_id}
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

// SUB-VIEW 6: SUPABASE SQL SCHEMA HELPER FOR biznhrnxukiktvtbumnc
const SuperAdminSqlSchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- EDUWORK Complete Schema & Super Admin Provisioning for Project biznhrnxukiktvtbumnc
create table if not exists public.profiles (
  id uuid primary key,
  user_id uuid,
  full_name text,
  name text,
  email text,
  mobile text,
  created_at timestamptz default now()
);

create table if not exists public.super_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  created_at timestamptz default now()
);

insert into public.super_admins (user_id, email)
values ('ff8a2a41-5033-4c47-a423-861c63b64d56', 'hafizshamimahmad5@gmaul.com')
on conflict do nothing;

create table if not exists public.platform_settings (
  id int primary key default 1,
  require_approval boolean default false,
  updated_at timestamptz default now()
);
insert into public.platform_settings (id, require_approval) values (1, false) on conflict do nothing;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  institution_code text,
  type text default 'school',
  board text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text,
  status text default 'active',
  plan text default 'free',
  logo_url text,
  theme_color text default '#1d4ed8',
  created_at timestamptz default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  institution_id uuid references public.institutions(id) on delete cascade,
  role text not null,
  status text default 'active',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  institution_id uuid references public.institutions(id) on delete cascade,
  code text,
  role text not null,
  details jsonb default '{}'::jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  institution_id uuid,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.section_teachers (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references public.sections(id) on delete cascade,
  teacher_id uuid,
  user_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid,
  name text not null,
  admission_no text,
  roll_no text,
  class_id uuid,
  section_id uuid,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid,
  name text not null,
  employee_code text,
  designation text,
  department text,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  section_id uuid,
  class_id uuid,
  date date default current_date,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  employee_name text,
  date date default current_date,
  check_in timestamptz default now(),
  check_out timestamptz,
  status text default 'present',
  created_at timestamptz default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid,
  title text not null,
  content text,
  audience text default 'all',
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid,
  user_id uuid,
  student_id uuid references public.students(id) on delete cascade,
  student_name text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text,
  message text,
  read boolean default false,
  is_read boolean default false,
  created_at timestamptz default now()
);`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Supabase Project Connection & SQL Schema (`biznhrnxukiktvtbumnc`)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connected to `https://biznhrnxukiktvtbumnc.supabase.co`. Copy this SQL script to
            initialize tables in your Supabase SQL Editor if not yet installed.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(sqlScript);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied SQL Script' : 'Copy Full SQL Schema'}</span>
        </button>
      </div>

      <pre className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
        {sqlScript}
      </pre>
    </div>
  );
};
