/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './contexts/AuthContext';
import {
  ForgotPasswordPage,
  LandingPage,
  PrivacyPage,
  TermsPage,
} from './pages/PublicPages';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { InstitutionPortal } from './pages/portal/InstitutionPortal';
import { SuperAdminLoginPage, SuperAdminPanel } from './pages/admin/SuperAdminPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Multi-Tenant Institution Portal */}
              <Route path="/app/*" element={<InstitutionPortal />} />

              {/* Super Admin Console */}
              <Route path="/admin/login" element={<SuperAdminLoginPage />} />
              <Route path="/admin/*" element={<SuperAdminPanel />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
