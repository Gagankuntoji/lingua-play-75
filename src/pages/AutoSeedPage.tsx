/**
 * One-time page to auto-seed all courses with exercises
 * Access at: /auto-seed (or add to admin panel)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { autoSeedAllCourses } from "@/lib/autoSeedExercises";
import { useToast } from "@/hooks/use-toast";

const AutoSeedPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processed: number;
    added: number;
    errors: string[];
  } | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    
    try {
      const seedResult = await autoSeedAllCourses();
      setResult(seedResult);
      
      if (seedResult.success) {
        toast({
          title: "Success!",
          description: `Added ${seedResult.added} exercises to ${seedResult.processed} courses`,
        });
      } else {
        toast({
          title: "Completed with errors",
          description: `Processed ${seedResult.processed} courses. ${seedResult.errors.length} error(s).`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Auto-Seed Exercises to All Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                This will automatically add exercises to all courses that don't have any yet.
                Language-specific exercises will be added for Spanish, French, and Hindi courses.
                Generic exercises will be added for other languages.
              </p>
              
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
                <li>Skips courses that already have exercises</li>
                <li>Creates lessons if they don't exist</li>
                <li>Adds multiple exercise types (multiple choice, translate, fill blank, speaking)</li>
              </ul>
            </div>

            <Button
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full"
              size="lg"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding exercises...
                </>
              ) : (
                "Seed Exercises to All Courses"
              )}
            </Button>

            {result && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <h3 className="font-semibold">
                    {result.success ? "Success!" : "Completed with errors"}
                  </h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Processed:</span> {result.processed} course(s)
                  </p>
                  <p>
                    <span className="font-medium">Exercises added:</span> {result.added}
                  </p>
                  
                  {result.errors.length > 0 && (
                    <div>
                      <p className="font-medium text-destructive mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-destructive">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/admin")}
                className="flex-1"
              >
                Back to Admin
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutoSeedPage;

