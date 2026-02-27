import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SignInPage } from './pages/SignInPage';
import { ExportsPage } from './pages/exports/ExportsPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { ApiKeysPage } from './pages/settings/ApiKeysPage';
import { BillingPage } from './pages/settings/BillingPage';
import { ProjectsPage } from './pages/settings/ProjectsPage';
import { ReplayPage } from './pages/traces/ReplayPage';
import { TraceDetailPage } from './pages/traces/TraceDetailPage';
import { TraceExplorerPage } from './pages/traces/TraceExplorerPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="traces" element={<TraceExplorerPage />} />
        <Route path="traces/:traceId" element={<TraceDetailPage />} />
        <Route path="traces/:traceId/replay" element={<ReplayPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="settings/projects" element={<ProjectsPage />} />
        <Route path="settings/api-keys" element={<ApiKeysPage />} />
        <Route path="settings/billing" element={<BillingPage />} />
      </Route>
    </Routes>
  );
}
