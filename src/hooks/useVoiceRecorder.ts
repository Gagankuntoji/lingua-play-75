import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecorder = (options: VoiceRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsSupported(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      options.onError?.('Voice recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        options.onRecordingComplete?.(audioBlob, url);
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Track recording duration
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      options.onError?.(error instanceof Error ? error.message : 'Failed to start recording');
      setIsRecording(false);
    }
  }, [isSupported, options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setAudioUrl(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    
    // Clean up stream
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, [isRecording, stopRecording]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isSupported,
    isRecording,
    audioUrl,
    recordingDuration: formatDuration(recordingDuration),
    startRecording,
    stopRecording,
    resetRecording,
  };
};

