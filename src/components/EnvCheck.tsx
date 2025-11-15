import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const EnvCheck = () => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Environment Variables Status</h3>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          {supabaseUrl ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          <span>VITE_SUPABASE_URL: {supabaseUrl ? "✓ Set" : "✗ Missing"}</span>
        </div>
        <div className="flex items-center gap-2">
          {supabaseKey ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          <span>VITE_SUPABASE_PUBLISHABLE_KEY: {supabaseKey ? "✓ Set" : "✗ Missing"}</span>
        </div>
        <div className="flex items-center gap-2">
          {geminiKey ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          <span>VITE_GEMINI_API_KEY: {geminiKey ? "✓ Set" : "✗ Missing"}</span>
        </div>
        <div className="flex items-center gap-2">
          {openaiKey ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          )}
          <span>VITE_OPENAI_API_KEY: {openaiKey ? "✓ Set" : "○ Optional"}</span>
        </div>
      </div>
      {!geminiKey && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gemini API key is not set. Add <code className="text-xs">VITE_GEMINI_API_KEY=your_key</code> to your <code className="text-xs">.env</code> file and restart the dev server.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EnvCheck;

