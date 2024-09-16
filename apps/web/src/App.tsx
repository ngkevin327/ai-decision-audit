import { Link, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { SignInPage } from './pages/SignInPage';

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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
