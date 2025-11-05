import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { SignInPage } from './pages/SignInPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { ApiKeysPage } from './pages/settings/ApiKeysPage';
import { ProjectsPage } from './pages/settings/ProjectsPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <h1 className="text-lg font-semibold">{title}</h1>
    </section>
  );
}

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
        <Route index element={<PlaceholderPage title="Dashboard" />} />
        <Route path="traces" element={<PlaceholderPage title="Traces" />} />
        <Route path="exports" element={<PlaceholderPage title="Exports" />} />
        <Route path="settings/projects" element={<ProjectsPage />} />
        <Route path="settings/api-keys" element={<ApiKeysPage />} />
      </Route>
    </Routes>
  );
}
