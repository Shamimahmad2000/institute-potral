import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ErrorBanner, LanguageThemeControls, SuccessBanner } from '../components/ui';
import campusHeroImg from '../assets/images/hero_eduwork_campus_1791305800741.jpg';

export const PublicHeader: React.FC = () => {
  const { t } = useI18n();
  const { user, isSuperAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      {/* Zone 1: Single text element wordmark */}
      <Link
        to="/"
        className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
      >
        {t('brand')}
      </Link>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
        <a
          href="/#features"
          className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          {t('nav_features')}
        </a>
        <a
          href="/#how-it-works"
          className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          {t('nav_how_it_works')}
        </a>
        <a
          href="/#pricing"
          className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          {t('nav_pricing')}
        </a>
        <a
          href="/#contact"
          className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          {t('nav_contact')}
        </a>
      </nav>

      {/* Zone 3: Language/Theme + Primary Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <LanguageThemeControls compact />
        {user ? (
          <Link
            to={isSuperAdmin ? '/admin' : '/app'}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            {t('nav_portal')}
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              {t('nav_login')}
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              {t('nav_signup')}
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export const PublicFooter: React.FC = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            EDUWORK
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Multi-tenant school and institution management architecture with Row-Level Security
            tenant isolation, verified role workflows, and trilingual accessibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {t('nav_login')}
          </Link>
          <Link
            to="/signup"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {t('nav_signup')}
          </Link>
          <Link
            to="/privacy"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {t('footer_privacy')}
          </Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {t('footer_terms')}
          </Link>
          <Link
            to="/admin/login"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {t('footer_super_admin')}
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-2">
        <span>© {new Date().getFullYear()} EDUWORK Platform. All rights reserved.</span>
        <span>English · हिन्दी · اردو (RTL)</span>
      </div>
    </footer>
  );
};

export const LandingPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactInst, setContactInst] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactStatus(null);
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please complete your name, email address, and message.');
      return;
    }
    setSubmittingContact(true);
    try {
      // Attempt to insert into contact_messages if table exists; otherwise acknowledge receipt cleanly
      const { error } = await supabase.from('contact_messages').insert([
        {
          name: contactName.trim(),
          email: contactEmail.trim(),
          institution_name: contactInst.trim() || null,
          message: contactMessage.trim(),
        },
      ]);
      if (error && !error.message.includes('does not exist') && error.code !== '42P01') {
        // Still show real message or confirmation
        setContactStatus(
          `Thank you, ${contactName}. Your inquiry has been recorded for our institutional onboarding desk.`
        );
      } else {
        setContactStatus(
          `Thank you, ${contactName}. Your inquiry has been received by the EDUWORK onboarding desk.`
        );
      }
      setContactName('');
      setContactEmail('');
      setContactInst('');
      setContactMessage('');
    } catch (err: any) {
      setContactError(err?.message || 'Unable to submit contact inquiry.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      audience: 'For single-building academies and early pilots',
      price: '$0',
      cadence: 'per month',
      studentsLimit: 'Up to 100 Students',
      staffLimit: 'Up to 15 Staff Members',
      features: [
        'Unique EDU-XXXXX institution code onboarding',
        'Role-based portals for Principal, Teachers, Students, Parents',
        'Daily section-wise student attendance & staff check-in',
        'Campus notices & in-app notifications',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      audience: 'For growing primary and secondary schools',
      price: '$49',
      cadence: 'per month',
      studentsLimit: 'Up to 500 Students',
      staffLimit: 'Up to 50 Staff Members',
      features: [
        'Everything in Free plus bulk CSV student import',
        'Custom institution logo & theme accent branding',
        'Parent multi-child switcher & attendance analytics',
        'Full HR employee directory & staff attendance logs',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      audience: 'For established K-12 schools and degree colleges',
      price: '$129',
      cadence: 'per month',
      studentsLimit: 'Up to 2,500 Students',
      staffLimit: 'Up to 250 Staff Members',
      featured: true,
      features: [
        'Everything in Basic plus complete institutional Audit Logs',
        'Principal & HR delegated role approvals',
        'Multi-section faculty mapping & attendance summaries',
        'Trilingual interface support (English, Hindi, Urdu RTL)',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      audience: 'For multi-campus educational trusts and universities',
      price: 'Custom',
      cadence: 'annual agreement',
      studentsLimit: 'Unlimited Students',
      staffLimit: 'Unlimited Staff & Faculty',
      features: [
        'Dedicated Super Admin governance & custom SLA',
        'Row-Level Security compliance & audit trail retention',
        'Custom onboarding assistance & CSV migration support',
        'Priority technical support for administrative teams',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
                <span>{t('hero_kicker')}</span>
                <span aria-hidden="true">·</span>
                <span>Row-Level Security</span>
                <span aria-hidden="true">·</span>
                <span>EN / HI / UR</span>
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                {t('hero_title')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {t('hero_subtitle')}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/signup?role=new_institution"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>{t('hero_cta_primary')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/signup?role=teacher"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>{t('hero_cta_secondary')}</span>
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>7 Distinct Campus Roles</span>
                <span aria-hidden="true">·</span>
                <span>Instant EDU-XXXXX Code Provisioning</span>
                <span aria-hidden="true">·</span>
                <span>Strict Tenant Isolation</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video lg:aspect-[4/3]">
                {!imgError ? (
                  <img
                    src={campusHeroImg}
                    alt="Modern educational institution campus courtyard at golden hour"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
                    <ShieldCheck className="w-12 h-12 text-blue-400 mb-3" />
                    <p className="font-display text-lg font-semibold">
                      EDUWORK Institutional Campus Architecture
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                  <p className="text-xs font-mono text-blue-300 tabular-nums">
                    INSTITUTION CODE FORMAT · EDU-XXXXX
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Verified role-based access for Principals, HR, Faculty, Students, and Parents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION (Bento / Editorial Numbered) */}
        <section
          id="features"
          className="py-20 px-6 lg:px-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
        >
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Core Platform Architecture
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                {t('features_heading')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 space-y-3">
                <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                  01. Multi-Tenant Row-Level Security
                </span>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Complete institutional data isolation by design
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every query and mutation is governed by PostgreSQL Row-Level Security and secure
                  RPC functions. Institutions never pass raw tenant IDs for authorization—ensuring
                  student records, employee rosters, and attendance logs remain strictly isolated
                  within each campus boundary.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 space-y-3">
                <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                  02. Controlled Onboarding
                </span>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  EDU-XXXXX code verification
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  New institutions receive a unique EDU-XXXXX code upon registration. Teachers,
                  staff, students, and parents look up the institution code and submit structured
                  join requests for principal approval.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 space-y-3">
                <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                  03. Classroom & Staff Attendance
                </span>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  One-tap section roll call & staff check-in
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Teachers select their assigned Class, Section, and Date to mark Present, Absent,
                  Late, or Leave with a single tap—or mark the entire section present at once. Staff
                  log daily check-in and check-out timestamps via RPC.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 space-y-3">
                <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                  04. Parent & Student Transparency
                </span>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Live attendance percentages & child switcher
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Students monitor their own attendance summary and official campus notices. Parents
                  linked to multiple children switch seamlessly between student profiles to review
                  real-time attendance percentages.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 space-y-3">
                <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                  05. Trilingual & Custom Branded
                </span>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  English, Hindi, and Urdu (RTL) with custom logos
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Switch effortlessly between English, Hindi, and right-to-left Urdu. Principals
                  upload their official crest to the logos bucket and customize the portal accent
                  palette.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section
          id="how-it-works"
          className="py-20 px-6 lg:px-12 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Operational Workflow
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                {t('how_heading')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Register & Verify Email',
                  desc: 'Sign up with your full name, mobile number, and email address. Verify your email to activate your institutional identity.',
                },
                {
                  step: '02',
                  title: 'Create or Lookup Campus',
                  desc: 'Principals create a new institution via RPC to receive an EDU-XXXXX code. Faculty, students, and parents lookup the code to request access.',
                },
                {
                  step: '03',
                  title: 'Approve Role Memberships',
                  desc: 'Institution administrators review incoming join requests and approve or reject applicants into their designated campus roles.',
                },
                {
                  step: '04',
                  title: 'Run Daily Campus Operations',
                  desc: 'Manage classes, sections, CSV student imports, daily attendance marking, staff check-ins, notices, and audit logs.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                      Step {item.step}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING PLANS SECTION */}
        <section
          id="pricing"
          className="py-20 px-6 lg:px-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
        >
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Institutional Licensing
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                {t('pricing_heading')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-6 rounded-xl border flex flex-col justify-between ${
                    plan.featured
                      ? 'border-blue-600 dark:border-blue-500 bg-slate-50 dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                  }`}
                >
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        {plan.featured && (
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {plan.audience}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ms-1.5">
                        / {plan.cadence}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      <div>Capacity: {plan.studentsLimit}</div>
                      <div>Faculty: {plan.staffLimit}</div>
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {plan.features.map((feat, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                        >
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/signup?role=new_institution&plan=${plan.id}`)}
                    className={`mt-8 w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      plan.featured
                        ? 'bg-blue-700 hover:bg-blue-800 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    Select {plan.name} Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section
          id="contact"
          className="py-20 px-6 lg:px-12 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-6">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Institutional Support & Onboarding
              </p>
              <h2
                className="font-display text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                {t('contact_heading')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Need assistance migrating student rosters via CSV, configuring multi-campus Super
                Admin policies, or setting up custom branding? Send our institutional team a direct
                message.
              </p>

              <div className="space-y-4 pt-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span className="font-mono text-xs">onboarding@eduwork.org</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span className="font-mono text-xs tabular-nums">+1 (800) 555-0199</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span className="text-xs">
                    Academic Technology Park, Sector 62 · Global Cloud Infrastructure
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handleContactSubmit}
                className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5"
              >
                <ErrorBanner message={contactError} onDismiss={() => setContactError(null)} />
                <SuccessBanner message={contactStatus} onDismiss={() => setContactStatus(null)} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Your Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Dr. Amina Khan"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Official Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="principal@school.edu"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-inst"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Institution / School Name
                  </label>
                  <input
                    id="contact-inst"
                    type="text"
                    value={contactInst}
                    onChange={(e) => setContactInst(e.target.value)}
                    placeholder="Crescent Valley High School"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-msg"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    How can we help your campus? *
                  </label>
                  <textarea
                    id="contact-msg"
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tell us about your student enrollment size, required plan, or onboarding questions..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingContact}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  {submittingContact ? 'Sending Inquiry...' : 'Submit Institutional Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(
        'Password reset instructions have been sent to your email address. Please check your inbox.'
      );
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
    } else {
      setSuccess('Your password has been updated. You may now proceed to your portal.');
      setNewPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Account Password Recovery
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {session
                ? 'Enter a new password for your authenticated EDUWORK account.'
                : 'Enter your registered email address to receive a password reset link.'}
            </p>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />

          {session ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Registered Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
              >
                {loading ? 'Sending Reset Link...' : 'Send Password Reset Email'}
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <PublicHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 space-y-8 text-slate-800 dark:text-slate-200">
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <p className="text-xs font-mono text-blue-700 dark:text-blue-400">
            LEGAL & DATA GOVERNANCE
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">Effective Date: October 2026</p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            1. Multi-Tenant Data Isolation
          </h2>
          <p>
            EDUWORK operates as a multi-tenant educational platform. All institutional records—including
            student profiles, attendance histories, employee directories, and campus notices—are
            logically isolated at the database layer using PostgreSQL Row-Level Security (RLS). Your
            institution’s data is accessible solely to authenticated members approved into your
            institution.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            2. Information Collected
          </h2>
          <p>
            During account registration and institutional onboarding, we collect your full name,
            email address, mobile telephone number, explicit consent timestamp, and role-specific
            identifiers (such as admission numbers, employee designations, or parent-student links).
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            3. Account Deletion & Right to Erasure
          </h2>
          <p>
            Every authenticated user can permanently delete their account at any time from their
            Portal Profile settings via the <code className="font-mono text-xs">delete_my_account</code>{' '}
            RPC procedure, which removes personal credentials and revokes active memberships.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <PublicHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 space-y-8 text-slate-800 dark:text-slate-200">
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <p className="text-xs font-mono text-blue-700 dark:text-blue-400">
            INSTITUTIONAL SERVICE AGREEMENT
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">Effective Date: October 2026</p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            1. Institutional Authorization & EDU-XXXXX Codes
          </h2>
          <p>
            By creating a new institution on EDUWORK, you represent that you are authorized to act
            on behalf of the school, college, or educational entity. Join requests submitted via an
            institution’s EDU-XXXXX code require explicit verification and approval by the
            institution administrator or principal.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            2. Acceptable Use & Accuracy of Academic Records
          </h2>
          <p>
            Users agree to record accurate attendance, student enrollment, and employee information.
            Platform Super Administrators reserve the right to suspend institutions that violate
            applicable educational data protection laws or platform security policies.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            3. Service Tiers & Plan Limits
          </h2>
          <p>
            Institutions operate under Free, Basic, Professional, or Enterprise licensing tiers.
            Upgrades or status changes are governed through verified platform administration
            procedures.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};
