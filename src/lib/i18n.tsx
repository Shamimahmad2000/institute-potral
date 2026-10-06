import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi' | 'ur';
export type ThemeMode = 'light' | 'dark';

const translations: Record<Language, Record<string, string>> = {
  en: {
    brand: 'EDUWORK',
    nav_features: 'Features',
    nav_how_it_works: 'How It Works',
    nav_pricing: 'Pricing',
    nav_contact: 'Contact',
    nav_login: 'Sign In',
    nav_signup: 'Register',
    nav_portal: 'Open Portal',
    hero_kicker: 'Multi-Tenant Academic & Institutional Operating System',
    hero_title: 'Unified governance for schools, colleges, and academies.',
    hero_subtitle:
      'Isolate every campus with Row-Level Security, verify role-based join requests via unique EDU-XXXXX institution codes, and manage student attendance, faculty rosters, and parent visibility in one platform.',
    hero_cta_primary: 'Create Institution Account',
    hero_cta_secondary: 'Join With Institution Code',
    features_heading: 'Engineered for institutional clarity and daily reliability',
    how_heading: 'How EDUWORK connects every campus role',
    pricing_heading: 'Transparent institutional plans for every campus scale',
    contact_heading: 'Connect with our institutional onboarding team',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_super_admin: 'Super Admin Console',
    login_title: 'Sign in to EDUWORK',
    login_subtitle: 'Access your institution portal using your verified email and password.',
    signup_title: 'Create your EDUWORK account',
    signup_subtitle: 'Select your role to register a new institution or join an existing campus.',
    role_new_institution: 'New Institution',
    role_teacher_staff: 'Teacher / Staff',
    role_student: 'Student',
    role_parent: 'Parent',
    email_label: 'Email Address',
    password_label: 'Password',
    name_label: 'Full Name',
    mobile_label: 'Mobile Number',
    consent_label: 'I agree to the Terms of Service and Privacy Policy',
    sign_in_btn: 'Sign In',
    sign_up_btn: 'Create Account',
    forgot_password: 'Forgot password?',
    waiting_approval_title: 'Waiting for Institutional Approval',
    waiting_approval_desc:
      'Your join request has been submitted to the institution administrator. This page will unlock automatically once your membership is approved.',
    suspended_institution_title: 'Institution Access Suspended',
    suspended_institution_desc:
      'This institution account is currently suspended or awaiting activation. Please contact your institution administrator or platform support.',
    disabled_member_title: 'Membership Disabled',
    disabled_member_desc:
      'Your membership in this institution has been disabled by an administrator.',
    menu_dashboard: 'Dashboard',
    menu_approvals: 'Join Approvals',
    menu_members: 'Members',
    menu_classes: 'Classes & Sections',
    menu_students: 'Students',
    menu_employees: 'Employees',
    menu_student_attendance: 'Student Attendance',
    menu_staff_attendance: 'Staff Attendance',
    menu_mark_attendance: 'Mark Attendance',
    menu_my_sections: 'My Sections',
    menu_check_in_out: 'Check-In / Out',
    menu_my_attendance: 'My Attendance',
    menu_child_attendance: 'Child Attendance',
    menu_notices: 'Notices',
    menu_branding: 'Branding Settings',
    menu_audit_logs: 'Audit Logs',
    menu_profile: 'Profile & Settings',
    menu_timetable: 'Timetable',
    menu_homework: 'Homework',
    menu_leave: 'Leave Management',
    menu_fees: 'Fees & Accounts',
    menu_exams: 'Exams & Grading',
    menu_reports: 'Academic Reports',
    coming_soon: 'Coming soon',
    coming_soon_desc:
      'This module is scheduled for an upcoming schema release. No mock data is shown.',
    notifications: 'Notifications',
    mark_all_read: 'Mark all read',
    no_notifications: 'No notifications yet.',
    logout: 'Sign Out',
    delete_account: 'Delete My Account',
    change_password: 'Change Password',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    leave: 'Leave',
    mark_all_present: 'Mark All Present',
  },
  hi: {
    brand: 'EDUWORK',
    nav_features: 'विशेषताएँ',
    nav_how_it_works: 'यह कैसे काम करता है',
    nav_pricing: 'मूल्य निर्धारण',
    nav_contact: 'संपर्क करें',
    nav_login: 'लॉग इन',
    nav_signup: 'पंजीकरण करें',
    nav_portal: 'पोर्टल खोलें',
    hero_kicker: 'मल्टी-टेनेंट स्कूल और संस्थान प्रबंधन प्रणाली',
    hero_title: 'स्कूलों, कॉलेजों और अकादमियों के लिए एकीकृत प्रबंधन।',
    hero_subtitle:
      'रो-लेवल सिक्योरिटी के साथ प्रत्येक कैंपस को सुरक्षित रखें, EDU-XXXXX कोड के माध्यम से शिक्षकों, छात्रों और अभिभावकों को जोड़ें, और उपस्थिति व सूचनाओं का प्रबंधन करें।',
    hero_cta_primary: 'नया संस्थान पंजीकृत करें',
    hero_cta_secondary: 'संस्थान कोड से जुड़ें',
    features_heading: 'संस्थागत स्पष्टता और दैनिक विश्वसनीयता के लिए निर्मित',
    how_heading: 'EDUWORK प्रत्येक कैंपस भूमिका को कैसे जोड़ता है',
    pricing_heading: 'प्रत्येक संस्थान के आकार के लिए पारदर्शी योजनाएँ',
    contact_heading: 'हमारी संस्थागत सहायता टीम से संपर्क करें',
    footer_privacy: 'गोपनीयता नीति',
    footer_terms: 'सेवा की शर्तें',
    footer_super_admin: 'सुपर एडमिन पैनल',
    login_title: 'EDUWORK में साइन इन करें',
    login_subtitle: 'अपने सत्यापित ईमेल और पासवर्ड का उपयोग करके अपने संस्थान पोर्टल तक पहुँचें।',
    signup_title: 'अपना EDUWORK खाता बनाएँ',
    signup_subtitle: 'नया संस्थान बनाने या मौजूदा कैंपस से जुड़ने के लिए अपनी भूमिका चुनें।',
    role_new_institution: 'नया संस्थान',
    role_teacher_staff: 'शिक्षक / स्टाफ',
    role_student: 'छात्र',
    role_parent: 'अभिभावक',
    email_label: 'ईमेल पता',
    password_label: 'पासवर्ड',
    name_label: 'पूरा नाम',
    mobile_label: 'मोबाइल नंबर',
    consent_label: 'मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूँ',
    sign_in_btn: 'साइन इन करें',
    sign_up_btn: 'खाता बनाएँ',
    forgot_password: 'पासवर्ड भूल गए?',
    waiting_approval_title: 'संस्थान की स्वीकृति की प्रतीक्षा है',
    waiting_approval_desc:
      'आपका अनुरोध संस्थान के व्यवस्थापक को भेज दिया गया है। स्वीकृत होते ही आपका पोर्टल खुल जाएगा।',
    suspended_institution_title: 'संस्थान निलंबित है',
    suspended_institution_desc:
      'यह संस्थान खाता वर्तमान में निलंबित है। कृपया अपने संस्थान व्यवस्थापक से संपर्क करें।',
    disabled_member_title: 'सदस्यता निष्क्रिय है',
    disabled_member_desc:
      'इस संस्थान में आपकी सदस्यता व्यवस्थापक द्वारा निष्क्रिय कर दी गई है।',
    menu_dashboard: 'डैशबोर्ड',
    menu_approvals: 'जुड़ने के अनुरोध',
    menu_members: 'सदस्य',
    menu_classes: 'कक्षाएँ और सेक्शन',
    menu_students: 'छात्र',
    menu_employees: 'कर्मचारी',
    menu_student_attendance: 'छात्र उपस्थिति',
    menu_staff_attendance: 'स्टाफ उपस्थिति',
    menu_mark_attendance: 'उपस्थिति दर्ज करें',
    menu_my_sections: 'मेरे सेक्शन',
    menu_check_in_out: 'चेक-इन / चेक-आउट',
    menu_my_attendance: 'मेरी उपस्थिति',
    menu_child_attendance: 'बच्चे की उपस्थिति',
    menu_notices: 'सूचनाएँ',
    menu_branding: 'ब्रांडिंग सेटिंग्स',
    menu_audit_logs: 'ऑडिट लॉग्स',
    menu_profile: 'प्रोफ़ाइल और सेटिंग्स',
    menu_timetable: 'समय सारिणी',
    menu_homework: 'गृहकार्य',
    menu_leave: 'अवकाश',
    menu_fees: 'शुल्क और लेखा',
    menu_exams: 'परीक्षाएँ',
    menu_reports: 'रिपोर्ट्स',
    coming_soon: 'जल्द आ रहा है',
    coming_soon_desc: 'यह मॉड्यूल आगामी अपडेट में उपलब्ध होगा। कोई नकली डेटा नहीं दिखाया गया है।',
    notifications: 'अधिसूचनाएँ',
    mark_all_read: 'सभी को पढ़ा हुआ चिह्नित करें',
    no_notifications: 'अभी कोई अधिसूचना नहीं है।',
    logout: 'लॉग आउट',
    delete_account: 'मेरा खाता हटाएँ',
    change_password: 'पासवर्ड बदलें',
    present: 'उपस्थित',
    absent: 'अनुपस्थित',
    late: 'देरी से',
    leave: 'अवकाश',
    mark_all_present: 'सभी को उपस्थित चिह्नित करें',
  },
  ur: {
    brand: 'EDUWORK',
    nav_features: 'خصوصیات',
    nav_how_it_works: 'طریقہ کار',
    nav_pricing: 'قیمتوں کے منصوبے',
    nav_contact: 'رابطہ کریں',
    nav_login: 'لاگ ان',
    nav_signup: 'رجسٹر کریں',
    nav_portal: 'پورٹل کھولیں',
    hero_kicker: 'ملٹی ٹیننٹ اسکول اور تعلیمی ادارہ جاتی مینجمنٹ سسٹم',
    hero_title: 'اسکولوں، کالجوں اور اکیڈمیوں کے لیے جامع انتظامی پلیٹ فارم۔',
    hero_subtitle:
      'رو لیول سیکیورٹی کے ساتھ ہر کیمپس کا ڈیٹا محفوظ رکھیں، منفرد EDU-XXXXX کوڈ کے ذریعے اساتذہ، طلباء اور والدین کو شامل کریں، اور حاضری و نوٹسز کا مکمل انتظام کریں۔',
    hero_cta_primary: 'نیا ادارہ رجسٹر کریں',
    hero_cta_secondary: 'ادارہ کوڈ کے ساتھ شامل ہوں',
    features_heading: 'ادارہ جاتی شفافیت اور روزمرہ اعتماد کے لیے تیار کردہ',
    how_heading: 'ایجوورک ہر تعلیمی کردار کو کیسے جوڑتا ہے',
    pricing_heading: 'ہر کیمپس کے حجم کے مطابق شفاف منصوبے',
    contact_heading: 'ہماری ادارہ جاتی ٹیم سے رابطہ کریں',
    footer_privacy: 'رازداری کی پالیسی',
    footer_terms: 'شرائط و ضوابط',
    footer_super_admin: 'سپر ایڈمن پینل',
    login_title: 'EDUWORK میں سائن ان کریں',
    login_subtitle: 'اپنے تصدیق شدہ ای میل اور پاس ورڈ کے ذریعے اپنے ادارے کے پورٹل تک رسائی حاصل کریں۔',
    signup_title: 'اپنا EDUWORK اکاؤنٹ بنائیں',
    signup_subtitle: 'نیا ادارہ رجسٹر کرنے یا موجودہ کیمپس میں شامل ہونے کے لیے اپنا کردار منتخب کریں۔',
    role_new_institution: 'نیا تعلیمی ادارہ',
    role_teacher_staff: 'استاد / اسٹاف',
    role_student: 'طالب علم',
    role_parent: 'والدین',
    email_label: 'ای میل ایڈریس',
    password_label: 'پاس ورڈ',
    name_label: 'پورا نام',
    mobile_label: 'موبائل نمبر',
    consent_label: 'میں شرائط و ضوابط اور رازداری کی پالیسی سے اتفاق کرتا/کرتی ہوں',
    sign_in_btn: 'سائن ان کریں',
    sign_up_btn: 'اکاؤنٹ بنائیں',
    forgot_password: 'پاس ورڈ بھول گئے؟',
    waiting_approval_title: 'ادارے کی منظوری کا انتظار ہے',
    waiting_approval_desc:
      'آپ کی شمولیت کی درخواست ادارے کے ایڈمنسٹریٹر کو بھیج دی گئی ہے۔ منظوری کے بعد پورٹل خودکار طور پر فعال ہو جائے گا۔',
    suspended_institution_title: 'ادارے کی رسائی معطل ہے',
    suspended_institution_desc:
      'اس تعلیمی ادارے کا اکاؤنٹ اس وقت معطل ہے۔ براہ کرم اپنے ایڈمنسٹریٹر سے رابطہ کریں۔',
    disabled_member_title: 'رکنیت غیر فعال ہے',
    disabled_member_desc:
      'اس ادارے میں آپ کی رکنیت ایڈمنسٹریٹر کی طرف سے غیر فعال کر دی گئی ہے۔',
    menu_dashboard: 'ڈیش بورڈ',
    menu_approvals: 'شمولیت کی منظوریاں',
    menu_members: 'اراکین',
    menu_classes: 'کلاسز اور سیکشنز',
    menu_students: 'طلباء',
    menu_employees: 'ملازمین',
    menu_student_attendance: 'طلباء کی حاضری',
    menu_staff_attendance: 'اسٹاف کی حاضری',
    menu_mark_attendance: 'حاضری لگائیں',
    menu_my_sections: 'میرے سیکشنز',
    menu_check_in_out: 'چیک ان / چیک آؤٹ',
    menu_my_attendance: 'میری حاضری',
    menu_child_attendance: 'بچے کی حاضری',
    menu_notices: 'نوٹس بورڈ',
    menu_branding: 'برانڈنگ کی ترتیبات',
    menu_audit_logs: 'آڈٹ لاگز',
    menu_profile: 'پروفائل اور ترتیبات',
    menu_timetable: 'ٹائم ٹیبل',
    menu_homework: 'ہوم ورک',
    menu_leave: 'رخصت',
    menu_fees: 'فیس اور اکاؤنٹس',
    menu_exams: 'امتحانات',
    menu_reports: 'رپورٹس',
    coming_soon: 'جلد آ رہا ہے',
    coming_soon_desc: 'یہ ماڈیول جلد ہی دستیاب ہوگا۔ کوئی فرضی ڈیٹا نہیں دکھایا گیا ہے۔',
    notifications: 'اطلاعات',
    mark_all_read: 'سب کو پڑھا ہوا نشان زد کریں',
    no_notifications: 'کوئی نئی اطلاع نہیں ہے۔',
    logout: 'سائن آؤٹ',
    delete_account: 'میرا اکاؤنٹ حذف کریں',
    change_password: 'پاس ورڈ تبدیل کریں',
    present: 'حاضر',
    absent: 'غیر حاضر',
    late: 'تاخیر',
    leave: 'رخصت',
    mark_all_present: 'سب کو حاضر لگائیں',
  },
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  isRtl: boolean;
  t: (key: string, fallback?: string) => string;
  theme: ThemeMode;
  toggleTheme: () => void;
  brandColor: string;
  setBrandColor: (color: string) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('eduwork_lang');
    if (saved === 'en' || saved === 'hi' || saved === 'ur') return saved;
    return 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('eduwork_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [brandColor, setBrandColorState] = useState<string>('#1d4ed8');

  useEffect(() => {
    localStorage.setItem('eduwork_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('eduwork_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', brandColor);
  }, [brandColor]);

  const setLang = (newLang: Language) => setLangState(newLang);
  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  const setBrandColor = (color: string) => {
    if (color && /^#[0-9A-Fa-f]{3,8}$/.test(color)) {
      setBrandColorState(color);
    }
  };

  const t = (key: string, fallback?: string): string => {
    return translations[lang]?.[key] || translations.en[key] || fallback || key;
  };

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        isRtl: lang === 'ur',
        t,
        theme,
        toggleTheme,
        brandColor,
        setBrandColor,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
