import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Lessons from "./pages/Lessons";
import LessonPlayer from "./pages/LessonPlayer";
import Profile from "./pages/Profile";
import DailyReview from "./pages/DailyReview";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Playlists from "./pages/Playlists";
import AutoSeedPage from "./pages/AutoSeedPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/lessons"
            element={
              <ProtectedRoute>
                <Lessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <DailyReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auto-seed"
            element={
              <ProtectedRoute>
                <AutoSeedPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;