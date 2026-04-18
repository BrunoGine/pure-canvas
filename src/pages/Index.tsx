import { Routes, Route } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import HomePage from "./HomePage";
import SpreadsheetsPage from "./SpreadsheetsPage";
import CoursesPage from "./CoursesPage";
import ChatPage from "./ChatPage";
import ProfilePage from "./ProfilePage";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center ambient-glow overflow-x-hidden">
      <main className="w-full max-w-lg px-4 pt-6 relative z-10">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="planilhas" element={<SpreadsheetsPage />} />
          <Route path="cursos" element={<CoursesPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
