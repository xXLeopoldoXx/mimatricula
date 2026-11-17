import { Route, Routes } from "react-router";
import Layout from "./components/Layout";
import { useStudent } from "./auth/useStudent";
import { useExtensionBridge } from "./import/useExtensionBridge";
import { useOfferStore } from "./store/offer";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import SchedulePage from "./pages/SchedulePage";
import ProfessorsPage from "./pages/ProfessorsPage";
import ProfessorDetailPage from "./pages/ProfessorDetailPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import GeneratorPage from "./pages/GeneratorPage";
import NotFoundPage from "./pages/NotFoundPage";
import { LogoMark, Wordmark } from "./components/Logo";

export default function App() {
  const { student, loading, sessionError, authError, login, register, logout } = useStudent();
  // Escucha a la extensión siempre, incluso en la pantalla de login
  useExtensionBridge();
  const imported = useOfferStore((s) => s.imported);

  if (loading) {
    return <Splash />;
  }
  if (!student) {
    return (
      <LoginPage
        onLogin={login}
        onRegister={register}
        imported={imported}
        initialError={sessionError}
      />
    );
  }

  return (
    <Routes>
      <Route element={<Layout student={student} onLogout={logout} authError={authError} />}>
        <Route index element={<HomePage student={student} />} />
        <Route path="cursos" element={<CoursesPage />} />
        <Route path="horario" element={<SchedulePage />} />
        <Route path="profesores" element={<ProfessorsPage />} />
        <Route path="profesores/:id" element={<ProfessorDetailPage student={student} />} />
        <Route path="recomendaciones" element={<RecommendationsPage />} />
        <Route path="generador" element={<GeneratorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

/** Pantalla de carga de marca mientras se verifica la sesión. */
function Splash() {
  return (
    <div className="geo-bg flex min-h-screen flex-col items-center justify-center gap-6 text-white" role="status" aria-live="polite">
      <div className="reveal flex items-center gap-3">
        <LogoMark size={48} />
        <Wordmark dark />
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <div className="bg-utp-orange h-full w-2/5 rounded-full" style={{ animation: "splash-bar 1.1s ease-in-out infinite" }} />
      </div>
      <span className="sr-only">Verificando sesión…</span>
    </div>
  );
}
