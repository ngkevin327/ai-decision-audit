import { Link, Route, Routes } from 'react-router-dom';

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
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}
