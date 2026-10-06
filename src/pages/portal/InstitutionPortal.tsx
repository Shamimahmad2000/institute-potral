import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  Building,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Palette,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InstitutionRole, useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../lib/i18n';
import { LanguageThemeControls } from '../../components/ui';
import { WaitingForApprovalView } from '../AuthPages';
import {
  ApprovalsView,
  AuditLogsView,
  BrandingSettingsView,
  ClassesSectionsView,
  InstitutionDashboardView,
  MembersView,
} from './AdminModules';
import { EmployeesView, NoticesView, StudentsView } from './PeopleAndNoticesModules';
import {
  AdminStaffAttendanceView,
  AdminStudentAttendanceView,
  ParentChildAttendanceView,
  ProfileAndAccountView,
  StaffCheckInOutView,
  StudentAttendanceSummaryView,
  TeacherMarkAttendanceView,
  TeacherMySectionsView,
} from './AttendanceAndRoleModules';
import { ExtendedAcademicModuleView } from './ExtendedAcademicModules';

interface MenuItem {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  icon: React.ReactNode;
  roles: InstitutionRole[];
}

export const InstitutionPortal: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user,
    profile,
    membership,
    institution,
    joinRequest,
    isSuperAdmin,
    activeRoleOverride,
    setActiveRoleOverride,
    loading,
    refreshUserContext,
    signOut,
  } = useAuth();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAllModules, setShowAllModules] = useState<boolean>(true);
  const [selectedSectionContext, setSelectedSectionContext] = useState<{
    classId: string;
    sectionId: string;
  }>({ classId: '', sectionId: '' });

  const baseRole: InstitutionRole =
    (membership?.role as InstitutionRole) || (isSuperAdmin ? 'institution_admin' : 'student');
  const effectiveRole: InstitutionRole = activeRoleOverride || baseRole;
  const canSwitchRoles =
    isSuperAdmin || baseRole === 'institution_admin' || baseRole === 'principal';

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      labelKey: 'menu_dashboard',
      fallbackLabel: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'approvals',
      labelKey: 'menu_approvals',
      fallbackLabel: 'Join Approvals',
      icon: <UserCheck className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'members',
      labelKey: 'menu_members',
      fallbackLabel: 'Members',
      icon: <Users className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'classes',
      labelKey: 'menu_classes',
      fallbackLabel: 'Classes & Sections',
      icon: <Building className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'students',
      labelKey: 'menu_students',
      fallbackLabel: 'Students',
      icon: <GraduationCap className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'employees',
      labelKey: 'menu_employees',
      fallbackLabel: 'Employees',
      icon: <Users className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'hr_staff'],
    },
    {
      id: 'student_attendance',
      labelKey: 'menu_student_attendance',
      fallbackLabel: 'Student Attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'staff_attendance',
      labelKey: 'menu_staff_attendance',
      fallbackLabel: 'Staff Attendance',
      icon: <ClipboardCheck className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'hr_staff'],
    },
    {
      id: 'my_sections',
      labelKey: 'menu_my_sections',
      fallbackLabel: 'My Sections',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['teacher', 'institution_admin', 'principal'],
    },
    {
      id: 'mark_attendance',
      labelKey: 'menu_mark_attendance',
      fallbackLabel: 'Mark Attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['teacher', 'institution_admin', 'principal'],
    },
    {
      id: 'check_in_out',
      labelKey: 'menu_check_in_out',
      fallbackLabel: 'Check-In / Out',
      icon: <Clock className="w-4 h-4" />,
      roles: ['teacher', 'hr_staff', 'accountant', 'institution_admin', 'principal'],
    },
    {
      id: 'my_attendance',
      labelKey: 'menu_my_attendance',
      fallbackLabel: 'Student Attendance Summary',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['student', 'institution_admin', 'principal'],
    },
    {
      id: 'child_attendance',
      labelKey: 'menu_child_attendance',
      fallbackLabel: 'Parent / Child Attendance',
      icon: <Users className="w-4 h-4" />,
      roles: ['parent', 'institution_admin', 'principal'],
    },
    {
      id: 'notices',
      labelKey: 'menu_notices',
      fallbackLabel: 'Notices',
      icon: <FileText className="w-4 h-4" />,
      roles: [
        'institution_admin',
        'principal',
        'hr_staff',
        'accountant',
        'teacher',
        'student',
        'parent',
      ],
    },
    {
      id: 'timetable',
      labelKey: 'menu_timetable',
      fallbackLabel: 'Timetable',
      icon: <Clock className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'teacher', 'student'],
    },
    {
      id: 'homework',
      labelKey: 'menu_homework',
      fallbackLabel: 'Homework',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'teacher', 'student', 'parent'],
    },
    {
      id: 'leave',
      labelKey: 'menu_leave',
      fallbackLabel: 'Leave Management',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'hr_staff', 'teacher', 'student', 'parent'],
    },
    {
      id: 'fees',
      labelKey: 'menu_fees',
      fallbackLabel: 'Fees & Accounts',
      icon: <FileText className="w-4 h-4" />,
      roles: ['accountant', 'institution_admin', 'principal', 'student', 'parent'],
    },
    {
      id: 'exams',
      labelKey: 'menu_exams',
      fallbackLabel: 'Exams & Grading',
      icon: <GraduationCap className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'teacher', 'student', 'parent'],
    },
    {
      id: 'reports',
      labelKey: 'menu_reports',
      fallbackLabel: 'Academic Reports',
      icon: <ClipboardCheck className="w-4 h-4" />,
      roles: ['institution_admin', 'principal', 'hr_staff', 'accountant', 'teacher'],
    },
    {
      id: 'branding',
      labelKey: 'menu_branding',
      fallbackLabel: 'Branding Settings',
      icon: <Palette className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'audit_logs',
      labelKey: 'menu_audit_logs',
      fallbackLabel: 'Audit Logs',
      icon: <ShieldCheck className="w-4 h-4" />,
      roles: ['institution_admin', 'principal'],
    },
    {
      id: 'profile',
      labelKey: 'menu_profile',
      fallbackLabel: 'Profile & Settings',
      icon: <UserCheck className="w-4 h-4" />,
      roles: [
        'institution_admin',
        'principal',
        'hr_staff',
        'accountant',
        'teacher',
        'student',
        'parent',
      ],
    },
  ];

  // Filter menu items by effectiveRole, or show all if Super Admin / Admin has "All Modules" enabled
  const allowedMenus =
    canSwitchRoles && showAllModules && !activeRoleOverride
      ? allMenuItems
      : allMenuItems.filter((item) => item.roles.includes(effectiveRole));

  const getDefaultTabForRole = (r: InstitutionRole): string => {
    switch (r) {
      case 'institution_admin':
      case 'principal':
        return 'dashboard';
      case 'hr_staff':
        return 'employees';
      case 'accountant':
        return 'fees';
      case 'teacher':
        return 'my_sections';
      case 'student':
        return 'my_attendance';
      case 'parent':
        return 'child_attendance';
      default:
        return 'dashboard';
    }
  };

  const [activeTab, setActiveTab] = useState<string>(() => getDefaultTabForRole(effectiveRole));

  useEffect(() => {
    const validIds = allowedMenus.map((m) => m.id);
    if (!validIds.includes(activeTab)) {
      setActiveTab(getDefaultTabForRole(effectiveRole));
    }
  }, [effectiveRole, showAllModules]);

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) return [];
      return data || [];
    },
  });

  const unreadCount = (notifications || []).filter(
    (n: any) => n.read === false || n.is_read === false || (!n.read && !n.is_read && !n.read_at)
  ).length;

  const handleMarkNotificationRead = async (notifId: string) => {
    const res1 = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    if (res1.error) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleMarkAllRead = async () => {
    if (!notifications || notifications.length === 0) return;
    const ids = notifications.map((n: any) => n.id);
    const res1 = await supabase.from('notifications').update({ read: true }).in('id', ids);
    if (res1.error) {
      await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-xs font-mono text-slate-500 animate-pulse">
          Loading Institutional Context...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!membership && !isSuperAdmin) {
    if (joinRequest) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <WaitingForApprovalView
            joinRequest={joinRequest}
            onRefresh={async () => {
              await refreshUserContext();
            }}
            onSignOut={async () => {
              await signOut();
              navigate('/login');
            }}
          />
        </div>
      );
    }
    return <Navigate to="/signup?step=onboarding" replace />;
  }

  const instStatus = (institution?.status || '').toLowerCase();
  if (instStatus === 'suspended' && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-lg p-8 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {t('suspended_institution_title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('suspended_institution_desc')}
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  const memStatus = (membership?.status || '').toLowerCase();
  if (
    !isSuperAdmin &&
    (memStatus === 'disabled' || memStatus === 'suspended' || membership?.is_active === false)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-lg p-8 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center mx-auto text-red-600">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {t('disabled_member_title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('disabled_member_desc')}
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InstitutionDashboardView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'members':
        return <MembersView />;
      case 'classes':
        return <ClassesSectionsView />;
      case 'students':
        return <StudentsView />;
      case 'employees':
        return <EmployeesView />;
      case 'student_attendance':
        return <AdminStudentAttendanceView />;
      case 'staff_attendance':
        return <AdminStaffAttendanceView />;
      case 'my_sections':
        return (
          <TeacherMySectionsView
            onSelectSectionForAttendance={(cId, sId) => {
              setSelectedSectionContext({ classId: cId, sectionId: sId });
              setActiveTab('mark_attendance');
            }}
          />
        );
      case 'mark_attendance':
        return (
          <TeacherMarkAttendanceView
            initialClassId={selectedSectionContext.classId}
            initialSectionId={selectedSectionContext.sectionId}
          />
        );
      case 'check_in_out':
        return <StaffCheckInOutView />;
      case 'my_attendance':
        return <StudentAttendanceSummaryView />;
      case 'child_attendance':
        return <ParentChildAttendanceView />;
      case 'notices':
        return <NoticesView />;
      case 'branding':
        return <BrandingSettingsView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'profile':
        return <ProfileAndAccountView />;
      case 'fees':
      case 'timetable':
      case 'homework':
      case 'leave':
      case 'exams':
      case 'reports': {
        const found = allowedMenus.find((m) => m.id === activeTab);
        return (
          <ExtendedAcademicModuleView
            moduleId={activeTab as any}
            title={found ? t(found.labelKey, found.fallbackLabel) : 'Academic Module'}
          />
        );
      }
      default:
        return <InstitutionDashboardView />;
    }
  };

  const SidebarNavigation = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        {/* Institution Header inside Sidebar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {institution?.logo_url ? (
            <img
              src={institution.logo_url}
              alt={institution.name || 'Logo'}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-contain border border-slate-200 dark:border-slate-800 bg-white p-0.5 shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm shrink-0"
              style={{ backgroundColor: 'var(--brand-primary, #1d4ed8)' }}
            >
              {(institution?.name || 'E').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
              {institution?.name || 'EDUWORK Campus'}
            </p>
            <p className="text-[11px] font-mono text-slate-500 uppercase truncate">
              {isSuperAdmin ? 'SUPER ADMIN · ALL ACCESS' : effectiveRole.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Direct Super Admin Console Link if Super Admin */}
        {isSuperAdmin && (
          <Link
            to="/admin"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 dark:bg-blue-950/80 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Super Admin Panel</span>
            </span>
            <span className="font-mono text-[10px] text-blue-300">/admin</span>
          </Link>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {allowedMenus.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={
                  isActive ? { backgroundColor: 'var(--brand-primary, #1d4ed8)' } : undefined
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{t(item.labelKey, item.fallbackLabel)}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sign Out */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sticky top-0 h-screen overflow-y-auto">
        <SidebarNavigation />
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNavigation />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Portal Header */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 lg:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {institution?.name || 'EDUWORK'}
              </span>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span>
                {t(
                  allowedMenus.find((m) => m.id === activeTab)?.labelKey || 'menu_dashboard',
                  allowedMenus.find((m) => m.id === activeTab)?.fallbackLabel || 'Portal'
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role View Switcher for Super Admin / Institution Admin */}
            {canSwitchRoles && (
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  VIEW ROLE:
                </label>
                <select
                  aria-label="Switch Role View"
                  value={activeRoleOverride || 'all'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') {
                      setActiveRoleOverride(null);
                      setShowAllModules(true);
                    } else {
                      setShowAllModules(false);
                      setActiveRoleOverride(val as InstitutionRole);
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                >
                  <option value="all">All Roles & Modules (Full Access)</option>
                  <option value="institution_admin">Institution Admin</option>
                  <option value="principal">Principal</option>
                  <option value="hr_staff">HR Staff</option>
                  <option value="accountant">Accountant</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            )}

            <LanguageThemeControls compact />

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('notifications')} ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{t('mark_all_read')}</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {!notifications || notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        {t('no_notifications')}
                      </div>
                    ) : (
                      notifications.map((n: any) => {
                        const isUnread =
                          n.read === false ||
                          n.is_read === false ||
                          (!n.read && !n.is_read && !n.read_at);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleMarkNotificationRead(n.id)}
                            className={`p-3.5 text-xs cursor-pointer transition-colors ${
                              isUnread
                                ? 'bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-50/80'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {n.title || 'Campus Notification'}
                              </p>
                              {isUnread && (
                                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                                  Unread
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                              {n.message || n.body || n.content}
                            </p>
                            {n.created_at && (
                              <p className="font-mono text-[10px] text-slate-400 mt-1 tabular-nums">
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Button */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 truncate max-w-[140px]"
            >
              {profile?.full_name || profile?.name || user.email?.split('@')[0] || 'Account'}
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};
