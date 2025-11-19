import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManager from "@/components/admin/CourseManager";
import LessonManager from "@/components/admin/LessonManager";
import ItemManager from "@/components/admin/ItemManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import AdminSummaryCards from "@/components/admin/AdminSummaryCards";
import BacklogHeatmap from "@/components/admin/BacklogHeatmap";
import CurriculumToolbox from "@/components/admin/CurriculumToolbox";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <AdminSummaryCards />

        <BacklogHeatmap />

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="items">Exercises</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <CourseManager />
          </TabsContent>

          <TabsContent value="lessons">
            <LessonManager />
          </TabsContent>

          <TabsContent value="items">
            <ItemManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="curriculum">
            <CurriculumToolbox />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;