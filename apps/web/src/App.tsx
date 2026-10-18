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

export default function App() {
  const { student, login, logout } = useStudent();
  // Escucha a la extensión siempre, incluso en la pantalla de login
  useExtensionBridge();
  const imported = useOfferStore((s) => s.imported);

  if (!student) return <LoginPage onLogin={login} imported={imported} />;

  return (
    <Routes>
      <Route element={<Layout student={student} onLogout={logout} />}>
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
