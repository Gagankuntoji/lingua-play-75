import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Mic, MicOff, Loader2, Bot } from "lucide-react";
import { useTextToSpeech, getLanguageCode } from "@/hooks/useTextToSpeech";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { getTTSFeedback } from "@/lib/chatgpt";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TextToSpeechWithFeedbackProps {
  text: string;
  language: string;
  showFeedback?: boolean;
}

const TextToSpeechWithFeedback = ({
  text,
  language,
  showFeedback = true,
}: TextToSpeechWithFeedbackProps) => {
  const { speak, isSpeaking, stop } = useTextToSpeech();
  const { isRecording, audioUrl, recordingDuration, startRecording, stopRecording, resetRecording, isSupported: recorderSupported } = useVoiceRecorder({
    onRecordingComplete: async (audioBlob, url) => {
      if (showFeedback) {
        await getFeedbackForRecording(url);
      }
    },
  });
  const [geminiFeedback, setGeminiFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const handlePlayAudio = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, { lang: getLanguageCode(language) });
    }
  };

  const getFeedbackForRecording = async (recordingUrl: string) => {
    setIsLoadingFeedback(true);
    try {
      const feedback = await getTTSFeedback(text, language, recordingUrl);
      if (feedback.message && !feedback.error) {
        setGeminiFeedback(feedback.message);
      } else if (feedback.error) {
        console.error("Gemini feedback error:", feedback.error);
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleGetPronunciationGuide = async () => {
    setIsLoadingFeedback(true);
    setGeminiFeedback(null);
    try {
      const feedback = await getTTSFeedback(text, language);
      if (feedback.message && !feedback.error) {
        setGeminiFeedback(feedback.message);
      }
    } catch (error) {
      console.error("Error getting pronunciation guide:", error);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayAudio}
          disabled={isSpeaking}
          className="flex items-center gap-2"
        >
          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
          {isSpeaking ? 'Speaking...' : 'Play Audio'}
        </Button>

        {recorderSupported && (
          <>
            {!isRecording && !audioUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startRecording}
                className="flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Record
              </Button>
            ) : isRecording ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopRecording}
                className="flex items-center gap-2"
              >
                <MicOff className="w-4 h-4" />
                Stop ({recordingDuration})
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetRecording}
                  className="flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Record Again
                </Button>
                {audioUrl && (
                  <audio controls src={audioUrl} className="h-8" />
                )}
              </div>
            )}
          </>
        )}

        {showFeedback && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGetPronunciationGuide}
            disabled={isLoadingFeedback}
            className="flex items-center gap-2"
          >
            {isLoadingFeedback ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            Get Pronunciation Guide
          </Button>
        )}
      </div>

      {geminiFeedback && (
        <Alert>
          <Bot className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Pronunciation Guide:</strong> {geminiFeedback}
          </AlertDescription>
        </Alert>
      )}

      {isLoadingFeedback && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Getting AI feedback...
        </div>
      )}
    </div>
  );
};

export default TextToSpeechWithFeedback;

