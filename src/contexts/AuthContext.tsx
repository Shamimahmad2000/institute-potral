import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  SUPER_ADMIN_EMAILS,
  SUPER_ADMIN_USER_ID,
} from '../lib/supabase';
import { useI18n } from '../lib/i18n';

export type InstitutionRole =
  | 'institution_admin'
  | 'principal'
  | 'hr_staff'
  | 'accountant'
  | 'teacher'
  | 'student'
  | 'parent';

export interface MembershipRecord {
  id: string;
  user_id: string;
  institution_id?: string;
  role: InstitutionRole;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  institution?: InstitutionRecord | null;
}

export interface InstitutionRecord {
  id: string;
  name: string;
  code?: string;
  institution_code?: string;
  status?: string;
  plan?: string;
  logo_url?: string;
  theme_color?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export interface JoinRequestRecord {
  id: string;
  user_id?: string;
  institution_id?: string;
  code?: string;
  institution_code?: string;
  role: string;
  status: string;
  details?: Record<string, any>;
  created_at?: string;
}

export interface ProfileRecord {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  avatar_url?: string;
  language?: string;
  created_at?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRecord | null;
  membership: MembershipRecord | null;
  institution: InstitutionRecord | null;
  joinRequest: JoinRequestRecord | null;
  isSuperAdmin: boolean;
  activeRoleOverride: InstitutionRole | null;
  setActiveRoleOverride: (role: InstitutionRole | null) => void;
  loading: boolean;
  authError: string | null;
  refreshUserContext: () => Promise<{
    membership: MembershipRecord | null;
    institution: InstitutionRecord | null;
    joinRequest: JoinRequestRecord | null;
    isSuperAdmin: boolean;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setBrandColor } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [membership, setMembership] = useState<MembershipRecord | null>(null);
  const [institution, setInstitution] = useState<InstitutionRecord | null>(null);
  const [joinRequest, setJoinRequest] = useState<JoinRequestRecord | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [activeRoleOverride, setActiveRoleOverride] = useState<InstitutionRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchContextForUser = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null);
        setMembership(null);
        setInstitution(null);
        setJoinRequest(null);
        setIsSuperAdmin(false);
        setActiveRoleOverride(null);
        setBrandColor('#1d4ed8');
        setLoading(false);
        return {
          membership: null,
          institution: null,
          joinRequest: null,
          isSuperAdmin: false,
        };
      }

      setAuthError(null);
      const emailLower = String(currentUser.email || '').toLowerCase();
      const isConfiguredSuperAdmin =
        SUPER_ADMIN_EMAILS.includes(emailLower) || currentUser.id === SUPER_ADMIN_USER_ID;

      try {
        // 1. Load Profile
        let loadedProfile: ProfileRecord | null = null;
        const profRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!profRes.error && profRes.data) {
          loadedProfile = profRes.data as ProfileRecord;
        } else {
          const profAlt = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          if (!profAlt.error && profAlt.data) {
            loadedProfile = profAlt.data as ProfileRecord;
          }
        }
        setProfile(loadedProfile);

        // 2. Load Membership
        let loadedMembership: MembershipRecord | null = null;
        let loadedInstitution: InstitutionRecord | null = null;

        const memWithJoin = await supabase
          .from('memberships')
          .select('*, institutions(*)')
          .eq('user_id', currentUser.id)
          .limit(1)
          .maybeSingle();

        if (!memWithJoin.error && memWithJoin.data) {
          const raw = memWithJoin.data as any;
          loadedMembership = raw;
          if (raw.institutions) {
            loadedInstitution = Array.isArray(raw.institutions)
              ? raw.institutions[0]
              : raw.institutions;
          }
        } else {
          const memPlain = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', currentUser.id)
            .limit(1)
            .maybeSingle();

          if (!memPlain.error && memPlain.data) {
            loadedMembership = memPlain.data as MembershipRecord;
          }
        }

        if (!loadedInstitution) {
          const instRes = await supabase
            .from('institutions')
            .select('*')
            .limit(1)
            .maybeSingle();
          if (!instRes.error && instRes.data) {
            loadedInstitution = instRes.data as InstitutionRecord;
          }
        }

        // If configured Super Admin doesn't have a membership row yet, grant default institution_admin membership
        if (!loadedMembership && isConfiguredSuperAdmin) {
          loadedMembership = {
            id: 'mem-super-admin-001',
            user_id: currentUser.id,
            institution_id: loadedInstitution?.id || 'inst-default-001',
            role: 'institution_admin',
            status: 'active',
            is_active: true,
          };
        }

        if (loadedInstitution?.theme_color) {
          setBrandColor(loadedInstitution.theme_color);
        } else {
          setBrandColor('#1d4ed8');
        }

        setMembership(loadedMembership);
        setInstitution(loadedInstitution);

        // 3. Load latest Join Request
        let loadedJoinReq: JoinRequestRecord | null = null;
        const jrRes = await supabase
          .from('join_requests')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!jrRes.error && jrRes.data) {
          loadedJoinReq = jrRes.data as JoinRequestRecord;
        }
        setJoinRequest(loadedJoinReq);

        // 4. Check Super Admin status
        let superAdminFlag = isConfiguredSuperAdmin;
        if (!superAdminFlag) {
          const saRes = await supabase
            .from('super_admins')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (!saRes.error && saRes.data) {
            superAdminFlag = true;
          } else {
            const saAlt = await supabase
              .from('super_admins')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle();
            if (!saAlt.error && saAlt.data) {
              superAdminFlag = true;
            }
          }
        }
        setIsSuperAdmin(superAdminFlag);

        setLoading(false);
        return {
          membership: loadedMembership,
          institution: loadedInstitution,
          joinRequest: loadedJoinReq,
          isSuperAdmin: superAdminFlag,
        };
      } catch (err: any) {
        setAuthError(err?.message || 'Failed to load user membership context');
        setLoading(false);
        return {
          membership: null,
          institution: null,
          joinRequest: null,
          isSuperAdmin: isConfiguredSuperAdmin,
        };
      }
    },
    [setBrandColor]
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      fetchContextForUser(initialSession?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      fetchContextForUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchContextForUser]);

  const refreshUserContext = async () => {
    const {
      data: { user: latestUser },
    } = await supabase.auth.getUser();
    setUser(latestUser ?? null);
    return fetchContextForUser(latestUser ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setMembership(null);
    setInstitution(null);
    setJoinRequest(null);
    setIsSuperAdmin(false);
    setActiveRoleOverride(null);
    setBrandColor('#1d4ed8');
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        membership,
        institution,
        joinRequest,
        isSuperAdmin,
        activeRoleOverride,
        setActiveRoleOverride,
        loading,
        authError,
        refreshUserContext,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
