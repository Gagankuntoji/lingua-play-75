import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BookOpen, GraduationCap, FileText, BarChart3 } from "lucide-react";

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Manage Courses
              </CardTitle>
              <CardDescription>
                Create, edit, and manage language courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Courses</Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-secondary" />
                Manage Lessons
              </CardTitle>
              <CardDescription>
                Add and organize lessons within courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Lessons</Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Manage Exercises
              </CardTitle>
              <CardDescription>
                Create and edit exercise items and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Exercises</Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-success" />
                Analytics
              </CardTitle>
              <CardDescription>
                View user progress and completion statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Analytics</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 mt-6">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary">3</p>
                <p className="text-sm text-muted-foreground">Total Lessons</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">11</p>
                <p className="text-sm text-muted-foreground">Total Exercises</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-6 bg-muted/50 rounded-lg border-2">
          <h3 className="font-bold mb-2">Admin Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ View all courses, lessons, and exercises</li>
            <li>✅ Database managed through Lovable Cloud</li>
            <li>✅ Direct SQL access for advanced management</li>
            <li>🔄 Full CRUD interface (can be expanded)</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Admin;