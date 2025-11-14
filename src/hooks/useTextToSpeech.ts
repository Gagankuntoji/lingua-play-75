import { useState, useEffect, useCallback } from 'react';

interface TextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useTextToSpeech = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string, options: TextToSpeechOptions = {}) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    if (options.lang) {
      utterance.lang = options.lang;
      
      // Try to find a voice for the specified language
      const voice = availableVoices.find(v => v.lang.startsWith(options.lang!));
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set other options
    utterance.rate = options.rate || 0.9; // Slightly slower for learning
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, availableVoices]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    availableVoices,
  };
};

// Language code mapping for the supported languages
export const getLanguageCode = (languageTo: string): string => {
  const languageMap: Record<string, string> = {
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'Hindi': 'hi-IN',
  };
  return languageMap[languageTo] || 'en-US';
};
