import { Routes, Route } from "react-router-dom";
import WorldMap from "@/components/courses/WorldMap";
import LessonPath from "@/components/courses/LessonPath";
import LessonPlayer from "@/components/courses/LessonPlayer";
import AdminPanel from "@/components/courses/AdminPanel";
import MockExamPlayer from "@/components/courses/MockExamPlayer";

const CoursesPage = () => {
  return (
    <Routes>
      <Route index element={<WorldMap />} />
      <Route path="admin" element={<AdminPanel />} />
      <Route path="treino" element={<MockExamPlayer />} />
      <Route path="aula/:lessonId" element={<LessonPlayer />} />
      <Route path=":courseId/treino" element={<MockExamPlayer />} />
      <Route path=":courseId" element={<LessonPath />} />
    </Routes>
  );
};

export default CoursesPage;
