import { Link, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { SignInPage } from './pages/SignInPage';
import { ApiKeysPage } from './pages/settings/ApiKeysPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { ProjectsPage } from './pages/settings/ProjectsPage';

function HomePage() {
  return (
    <section>
      <h1>AI Audit Trail</h1>
      <p>Forensic trace explorer and replay console.</p>
    </section>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <header>
        <nav>
          <Link to="/">Traces</Link>
          <Link to="/settings/projects">Projects</Link>
          <Link to="/settings/api-keys">API Keys</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/settings/projects" element={<ProjectsPage />} />
          <Route path="/settings/api-keys" element={<ApiKeysPage />} />
        </Routes>
      </main>
    </div>
  );
}
