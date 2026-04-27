import { Routes, Route } from "react-router-dom";
import WorldMap from "@/components/courses/WorldMap";
import LessonPath from "@/components/courses/LessonPath";
import LessonPlayer from "@/components/courses/LessonPlayer";
import AdminPanel from "@/components/courses/AdminPanel";
import StudentHubPage from "@/pages/StudentHubPage";
import CertificatePage from "@/pages/CertificatePage";

const CoursesPage = () => {
  return (
    <Routes>
      <Route index element={<WorldMap />} />
      <Route path="admin" element={<AdminPanel />} />
      <Route path="progresso" element={<StudentHubPage />} />
      <Route path="certificado/:id" element={<CertificatePage />} />
      <Route path="aula/:lessonId" element={<LessonPlayer />} />
      <Route path=":courseId" element={<LessonPath />} />
    </Routes>
  );
};

export default CoursesPage;
