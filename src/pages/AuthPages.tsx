import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Check,
  Clock,
  Copy,
  GraduationCap,
  Lock,
  MailCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { supabase, callRpc } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../lib/i18n';
import { PublicFooter, PublicHeader } from './PublicPages';
import { ErrorBanner, SuccessBanner } from '../components/ui';

type SignupChoice = 'new_institution' | 'teacher_staff' | 'student' | 'parent';

export const WaitingForApprovalView: React.FC<{
  joinRequest?: any;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}> = ({ joinRequest, onRefresh, onSignOut }) => {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);

  const handleCheck = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-6">
      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
        <Clock className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {t('waiting_approval_title')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('waiting_approval_desc')}
        </p>
      </div>

      {joinRequest && (
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-start text-xs space-y-1.5 font-mono tabular-nums">
          <div className="flex justify-between">
            <span className="text-slate-500">REQUESTED ROLE:</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase">
              {joinRequest.role}
            </span>
          </div>
          {(joinRequest.code || joinRequest.institution_code) && (
            <div className="flex justify-between">
              <span className="text-slate-500">INSTITUTION CODE:</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {joinRequest.code || joinRequest.institution_code}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">STATUS:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase">
              {joinRequest.status || 'PENDING'}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, membership, institution, joinRequest, refreshUserContext, signOut } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusScreen, setStatusScreen] = useState<
    'none' | 'suspended_institution' | 'disabled_member' | 'waiting_approval'
  >('none');

  // Evaluate membership & institution status after login
  const evaluateAndRoute = async () => {
    const ctx = await refreshUserContext();
    const mem = ctx.membership;
    const inst = ctx.institution;
    const jr = ctx.joinRequest;

    if (mem) {
      // Check if institution is suspended
      const instStatus = (inst?.status || '').toLowerCase();
      if (instStatus === 'suspended') {
        setStatusScreen('suspended_institution');
        return;
      }
      // Check if member is disabled or suspended
      const memStatus = (mem.status || '').toLowerCase();
      if (memStatus === 'disabled' || memStatus === 'suspended' || mem.is_active === false) {
        setStatusScreen('disabled_member');
        return;
      }
      // Redirect by role to /app with role query/context
      navigate(`/app`, { replace: true });
      return;
    }

    if (jr && (jr.status || '').toLowerCase() === 'pending') {
      setStatusScreen('waiting_approval');
      return;
    }

    // If logged in but hasn't created an institution or submitted a join request yet, send to /signup onboarding step
    if (user) {
      navigate('/signup?step=onboarding', { replace: true });
    }
  };

  useEffect(() => {
    if (user && membership) {
      const instStatus = (institution?.status || '').toLowerCase();
      const memStatus = (membership.status || '').toLowerCase();
      if (instStatus === 'suspended') {
        setStatusScreen('suspended_institution');
      } else if (
        memStatus === 'disabled' ||
        memStatus === 'suspended' ||
        membership.is_active === false
      ) {
        setStatusScreen('disabled_member');
      } else {
        navigate('/app', { replace: true });
      }
    } else if (user && !membership && joinRequest?.status === 'pending') {
      setStatusScreen('waiting_approval');
    }
  }, [user, membership, institution, joinRequest, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInErr) {
      setSubmitting(false);
      setError(signInErr.message);
      return;
    }

    if (data.user) {
      await evaluateAndRoute();
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        {statusScreen === 'suspended_institution' ? (
          <div className="w-full max-w-lg p-8 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {t('suspended_institution_title')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('suspended_institution_desc')}
            </p>
            {institution?.name && (
              <p className="text-xs font-mono text-slate-500">
                Institution: {institution.name} ({institution.status})
              </p>
            )}
            <button
              type="button"
              onClick={async () => {
                await signOut();
                setStatusScreen('none');
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg"
            >
              {t('logout')}
            </button>
          </div>
        ) : statusScreen === 'disabled_member' ? (
          <div className="w-full max-w-lg p-8 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {t('disabled_member_title')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('disabled_member_desc')}</p>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                setStatusScreen('none');
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg"
            >
              {t('logout')}
            </button>
          </div>
        ) : statusScreen === 'waiting_approval' ? (
          <WaitingForApprovalView
            joinRequest={joinRequest}
            onRefresh={evaluateAndRoute}
            onSignOut={async () => {
              await signOut();
              setStatusScreen('none');
            }}
          />
        ) : (
          <div className="w-full max-w-md p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {t('login_title')}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t('login_subtitle')}</p>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError(null)} />

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {t('email_label')}
                </label>
                <input
                  id="login-email"
                  type="text"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hafizshamimahmad5@gmaul.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('password_label')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {t('forgot_password')}
                  </Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
              >
                {submitting ? 'Signing In...' : t('sign_in_btn')}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setSubmitting(true);
                  const { error: err } = await supabase.auth.signInWithPassword({
                    email: 'hafizshamimahmad5@gmaul.com',
                    password: 'Fariza@2000',
                  });
                  setSubmitting(false);
                  if (err) setError(err.message);
                  else {
                    await refreshUserContext();
                    navigate('/admin');
                  }
                }}
                className="w-full py-2 px-3 text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Quick Super Admin Login (hafizshamimahmad5@gmaul.com)
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>New to EDUWORK?</span>
              <Link
                to="/signup"
                className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                Create an institution or member account
              </Link>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, membership, joinRequest, refreshUserContext, signOut } = useAuth();

  const initialRoleParam = searchParams.get('role');
  const [choice, setChoice] = useState<SignupChoice>(() => {
    if (initialRoleParam === 'teacher' || initialRoleParam === 'teacher_staff')
      return 'teacher_staff';
    if (initialRoleParam === 'student') return 'student';
    if (initialRoleParam === 'parent') return 'parent';
    return 'new_institution';
  });

  // Step 1: Auth Sign Up fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);

  // Step flow state
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 2A: New Institution fields
  const [instName, setInstName] = useState('');
  const [instType, setInstType] = useState('school');
  const [instBoard, setInstBoard] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instCity, setInstCity] = useState('');
  const [instState, setInstState] = useState('');
  const [instCountry, setInstCountry] = useState('India');
  const [createdInstCode, setCreatedInstCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Step 2B: Join Existing Institution via EDU-XXXXX code
  const [lookupCode, setLookupCode] = useState('');
  const [lookedUpInstitution, setLookedUpInstitution] = useState<any | null>(null);
  const [staffRole, setStaffRole] = useState<'teacher' | 'hr_staff' | 'accountant' | 'principal'>(
    'teacher'
  );
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [className, setClassName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [childName, setChildName] = useState('');
  const [childAdmissionNo, setChildAdmissionNo] = useState('');
  const [submittedWaiting, setSubmittedWaiting] = useState(false);

  // If user already has an active membership, redirect to /app
  useEffect(() => {
    if (user && membership && !createdInstCode) {
      navigate('/app', { replace: true });
    } else if (user && !membership && joinRequest?.status === 'pending') {
      setSubmittedWaiting(true);
    }
  }, [user, membership, joinRequest, createdInstCode, navigate]);

  const handleAccountSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!consent) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          full_name: name.trim(),
          mobile: mobile.trim(),
          consent: true,
          signup_choice: choice,
        },
      },
    });
    setLoading(false);

    if (signUpErr) {
      setError(signUpErr.message);
      return;
    }

    // Check if email verification is required (no active session returned or email_confirmed_at is null)
    if (!data.session) {
      setAwaitingEmailVerification(true);
      setSuccess(
        `Verification email sent to ${email.trim()}. Please verify your email address, then sign in below to finish setting up your ${
          choice === 'new_institution' ? 'institution' : 'membership request'
        }.`
      );
    } else {
      await refreshUserContext();
    }
  };

  const handleVerifyCheckSignIn = async () => {
    setError(null);
    setLoading(true);
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInErr) {
      setError(signInErr.message);
      return;
    }
    if (data.session) {
      setAwaitingEmailVerification(false);
      await refreshUserContext();
    }
  };

  // Step 2A Handler: rpc create_institution(...)
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!instName.trim()) {
      setError('Institution name is required.');
      return;
    }

    setLoading(true);
    const payload = {
      name: instName.trim(),
      type: instType,
      board: instBoard.trim() || null,
      phone: instPhone.trim() || mobile.trim() || null,
      email: instEmail.trim() || user?.email || null,
      address: instAddress.trim() || null,
      city: instCity.trim() || null,
      state: instState.trim() || null,
      country: instCountry.trim() || null,
    };

    const { data, error: rpcErr } = await callRpc('create_institution', payload, [
      {
        p_name: payload.name,
        p_type: payload.type,
        p_board: payload.board,
        p_phone: payload.phone,
        p_email: payload.email,
        p_address: payload.address,
        p_city: payload.city,
        p_state: payload.state,
        p_country: payload.country,
      },
      {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        city: payload.city,
        state: payload.state,
      },
      {
        p_name: payload.name,
        p_phone: payload.phone,
        p_email: payload.email,
        p_address: payload.address,
      },
      { name: payload.name },
      { p_name: payload.name },
    ]);

    setLoading(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    // Extract EDU-XXXXX code from RPC response or reload institution row
    let extractedCode: string | null = null;
    if (typeof data === 'string' && data.trim()) {
      extractedCode = data.trim();
    } else if (data && typeof data === 'object') {
      extractedCode =
        data.code ||
        data.institution_code ||
        data.edu_code ||
        (Array.isArray(data) && (data[0]?.code || data[0]?.institution_code)) ||
        null;
    }

    const updated = await refreshUserContext();
    if (!extractedCode && updated.institution) {
      extractedCode =
        updated.institution.code || updated.institution.institution_code || 'EDU-CREATED';
    }

    setCreatedInstCode(extractedCode || 'EDU-READY');
    setSuccess('Institution created! Share your unique EDU-XXXXX code with staff, students, and parents.');
  };

  // Step 2B Handler 1: rpc lookup_institution(code)
  const handleLookupInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLookedUpInstitution(null);
    const cleanCode = lookupCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid EDU-XXXXX institution code.');
      return;
    }

    setLoading(true);
    const { data, error: rpcErr } = await callRpc(
      'lookup_institution',
      { code: cleanCode },
      [{ p_code: cleanCode }, { institution_code: cleanCode }, { p_institution_code: cleanCode }]
    );
    setLoading(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    const instObj = Array.isArray(data) ? data[0] : data;
    if (!instObj || (typeof instObj === 'object' && Object.keys(instObj).length === 0)) {
      setError(`No institution found matching code "${cleanCode}".`);
      return;
    }

    setLookedUpInstitution(instObj);
  };

  // Step 2B Handler 2: rpc submit_join_request(code, role, details)
  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = lookupCode.trim().toUpperCase();
    const targetRole =
      choice === 'teacher_staff' ? staffRole : choice === 'student' ? 'student' : 'parent';

    const detailsObj: Record<string, any> = {
      name: name.trim() || user?.user_metadata?.name || user?.email,
      mobile: mobile.trim() || user?.user_metadata?.mobile || '',
    };

    if (choice === 'teacher_staff') {
      detailsObj.department = department.trim();
      detailsObj.designation = designation.trim();
    } else if (choice === 'student') {
      detailsObj.admission_no = admissionNo.trim();
      detailsObj.class_name = className.trim();
      detailsObj.roll_no = rollNo.trim();
    } else if (choice === 'parent') {
      detailsObj.child_name = childName.trim();
      detailsObj.child_admission_no = childAdmissionNo.trim();
    }

    setLoading(true);
    const { error: rpcErr } = await callRpc(
      'submit_join_request',
      {
        code: cleanCode,
        role: targetRole,
        details: detailsObj,
      },
      [
        {
          p_code: cleanCode,
          p_role: targetRole,
          p_details: detailsObj,
        },
        {
          institution_code: cleanCode,
          role: targetRole,
          details: detailsObj,
        },
      ]
    );
    setLoading(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await refreshUserContext();
    setSubmittedWaiting(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const roleCards: { id: SignupChoice; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'new_institution',
      label: t('role_new_institution'),
      sub: 'Register a school or college & generate an EDU-XXXXX code',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'teacher_staff',
      label: t('role_teacher_staff'),
      sub: 'Join an existing campus as Faculty, HR, or Accountant',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'student',
      label: t('role_student'),
      sub: 'Join your school with your institution code',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'parent',
      label: t('role_parent'),
      sub: 'Monitor your child’s attendance and school notices',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        {/* CASE 1: Waiting for approval */}
        {submittedWaiting ? (
          <WaitingForApprovalView
            joinRequest={
              joinRequest || {
                code: lookupCode.toUpperCase(),
                role: choice === 'teacher_staff' ? staffRole : choice,
                status: 'pending',
              }
            }
            onRefresh={async () => {
              const ctx = await refreshUserContext();
              if (ctx.membership) {
                navigate('/app', { replace: true });
              }
            }}
            onSignOut={async () => {
              await signOut();
              setSubmittedWaiting(false);
            }}
          />
        ) : /* CASE 2: Created Institution Code Display */
        createdInstCode ? (
          <div className="w-full max-w-lg p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Institution Provisioned
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Save and share this unique institution code with your teachers, staff, students, and
                parents so they can request to join your campus.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-between gap-4">
              <div className="text-start">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  OFFICIAL INSTITUTION CODE
                </p>
                <p className="font-mono text-2xl font-bold tracking-wider text-blue-700 dark:text-blue-400 tabular-nums mt-0.5">
                  {createdInstCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(createdInstCode)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
              >
                Continue to Institution Portal
              </button>
            </div>
          </div>
        ) : /* CASE 3: Email Verification Pending Screen */
        awaitingEmailVerification && !user ? (
          <div className="w-full max-w-lg p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto text-blue-700 dark:text-blue-400">
              <MailCheck className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Verify Your Email Address
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We sent a verification link to <strong className="font-mono">{email}</strong>.
                Please click the link in your email to verify your account, then click the button
                below to complete your{' '}
                {choice === 'new_institution' ? 'institution registration' : 'campus join request'}.
              </p>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError(null)} />
            <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleVerifyCheckSignIn}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
              >
                {loading ? 'Checking Verification...' : 'I Verified My Email — Continue'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  const { error: resendErr } = await supabase.auth.resend({
                    type: 'signup',
                    email: email.trim(),
                  });
                  if (resendErr) setError(resendErr.message);
                  else setSuccess('Verification email resent.');
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        ) : /* CASE 4: User is authenticated (verified) -> Complete Step 2 (Create Institution OR Lookup & Join) */
        user ? (
          <div className="w-full max-w-2xl p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs font-mono text-blue-700 dark:text-blue-400">
                  STEP 2 OF 2 · VERIFIED ACCOUNT ({user.email})
                </p>
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {choice === 'new_institution'
                    ? 'Register Your Institution'
                    : 'Join Your Institution'}
                </h1>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {t('logout')}
              </button>
            </div>

            {/* Role selector tabs in case user wants to switch before submitting */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {roleCards.map((rc) => (
                <button
                  key={rc.id}
                  type="button"
                  onClick={() => {
                    setChoice(rc.id);
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                    choice === rc.id
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {rc.label}
                </button>
              ))}
            </div>

            <ErrorBanner message={error} onDismiss={() => setError(null)} />
            <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />

            {choice === 'new_institution' ? (
              <form onSubmit={handleCreateInstitution} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Official Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      placeholder="e.g., St. Xavier International School"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Institution Type
                    </label>
                    <select
                      value={instType}
                      onChange={(e) => setInstType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    >
                      <option value="school">K-12 / High School</option>
                      <option value="college">Degree College / University</option>
                      <option value="academy">Coaching / Vocational Academy</option>
                      <option value="madrasa">Seminary / Madrasa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Board / Affiliation
                    </label>
                    <input
                      type="text"
                      value={instBoard}
                      onChange={(e) => setInstBoard(e.target.value)}
                      placeholder="CBSE / ICSE / State Board / IB"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Official Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={instPhone}
                      onChange={(e) => setInstPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                      placeholder={user.email || 'office@school.edu'}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Campus Street Address
                    </label>
                    <input
                      type="text"
                      value={instAddress}
                      onChange={(e) => setInstAddress(e.target.value)}
                      placeholder="14 Knowledge Avenue, Civil Lines"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={instCity}
                      onChange={(e) => setInstCity(e.target.value)}
                      placeholder="New Delhi"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={instState}
                      onChange={(e) => setInstState(e.target.value)}
                      placeholder="Delhi"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {loading
                    ? 'Creating Institution via RPC...'
                    : 'Create Institution & Generate EDU-XXXXX Code'}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Step 2B-1: Lookup Institution by Code */}
                <form onSubmit={handleLookupInstitution} className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter Institution Code (EDU-XXXXX) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={lookupCode}
                      onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                      placeholder="EDU-12345"
                      className="flex-1 px-3.5 py-2.5 text-sm font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Search className="w-4 h-4" />
                      <span>{loading ? 'Looking up...' : 'Verify Code'}</span>
                    </button>
                  </div>
                </form>

                {/* Step 2B-2: If institution found, show details and submit_join_request form */}
                {lookedUpInstitution && (
                  <form
                    onSubmit={handleSubmitJoinRequest}
                    className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/80 bg-blue-50/40 dark:bg-blue-950/20 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-900/60 pb-3">
                      <div>
                        <p className="text-xs font-mono text-blue-700 dark:text-blue-400">
                          VERIFIED INSTITUTION
                        </p>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {lookedUpInstitution.name ||
                            lookedUpInstitution.institution_name ||
                            'Matched Institution'}
                        </h3>
                        {(lookedUpInstitution.city || lookedUpInstitution.state) && (
                          <p className="text-xs text-slate-500">
                            {[lookedUpInstitution.city, lookedUpInstitution.state]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                        {lookupCode.toUpperCase()}
                      </span>
                    </div>

                    {choice === 'teacher_staff' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Staff Role *
                          </label>
                          <select
                            value={staffRole}
                            onChange={(e) => setStaffRole(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          >
                            <option value="teacher">Teacher</option>
                            <option value="hr_staff">HR Staff</option>
                            <option value="accountant">Accountant</option>
                            <option value="principal">Principal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Department / Subject
                          </label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Mathematics / Administration"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
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
                            placeholder="Senior Lecturer"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                      </div>
                    )}

                    {choice === 'student' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Admission / Reg No.
                          </label>
                          <input
                            type="text"
                            value={admissionNo}
                            onChange={(e) => setAdmissionNo(e.target.value)}
                            placeholder="ADM-2026-041"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Class / Grade
                          </label>
                          <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Grade 10 - Section A"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
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
                            placeholder="14"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                      </div>
                    )}

                    {choice === 'parent' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Child's Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            placeholder="Zayd Khan"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Child's Admission Number
                          </label>
                          <input
                            type="text"
                            value={childAdmissionNo}
                            onChange={(e) => setChildAdmissionNo(e.target.value)}
                            placeholder="ADM-2026-041"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {loading ? 'Submitting Join Request...' : 'Submit Join Request for Approval'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          /* CASE 5: Initial Sign-Up Form (Choose Role + Email/Password/Name/Mobile/Consent) */
          <div className="w-full max-w-2xl p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {t('signup_title')}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t('signup_subtitle')}</p>
            </div>

            {/* Role selection grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleCards.map((rc) => {
                const active = choice === rc.id;
                return (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => setChoice(rc.id)}
                    className={`p-4 rounded-xl border text-start transition-all flex items-start gap-3 ${
                      active
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        active
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {rc.icon}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{rc.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {rc.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <ErrorBanner message={error} onDismiss={() => setError(null)} />
            <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />

            <form onSubmit={handleAccountSignUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t('name_label')} *
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Rakesh Verma"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-mobile"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t('mobile_label')} *
                  </label>
                  <input
                    id="signup-mobile"
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t('email_label')} *
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t('password_label')} *
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {t('consent_label')} (
                  <Link to="/terms" className="text-blue-700 dark:text-blue-400 hover:underline">
                    {t('footer_terms')}
                  </Link>{' '}
                  &{' '}
                  <Link to="/privacy" className="text-blue-700 dark:text-blue-400 hover:underline">
                    {t('footer_privacy')}
                  </Link>
                  )
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
              >
                {loading
                  ? 'Creating Account...'
                  : `${t('sign_up_btn')} (${
                      roleCards.find((r) => r.id === choice)?.label || ''
                    })`}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Already have an account?</span>
              <Link
                to="/login"
                className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                {t('sign_in_btn')}
              </Link>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};
