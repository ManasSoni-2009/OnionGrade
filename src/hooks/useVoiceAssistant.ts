import { useState, useCallback, useEffect, useRef } from 'react';

const SYSTEM_PROMPT = `You are a smart AI voice assistant for OnionGrade, an AI-powered PWA designed to assess onion quality, identify defects, estimate grading percentages, and generate digital quality reports to reduce human bias and improve transparency for farmers.

Context about the app:
- Frontend: React 18, TypeScript, custom CSS, mobile-first PWA.
- Backend: FastAPI Python environment wrapping a YOLOv8 object detection model to identify defects (Grade A, URS, damaged, rotten, sprouted, undersized).
- App Navigation: /dashboard, /assessment (capture images), /reports, /market, /leaderboard.
- Features: We have strict constraints that prevent farmers from uploading duplicate photos (client-side hashing). The system determines minimum photos based on the lot's weight (e.g. >2000kg requires 10 photos).
- Onions Info: Grade A onions are premium quality. URS means Under Rejection Standard. Defects like 'sprouted', 'rotten', or 'undersized' reduce the fair market value.

Your job is to act as a helpful guide for farmers. Keep answers concise, spoken-friendly, and highly accurate.`;

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [replyText, setReplyText] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
      }
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel(); // Stop any ongoing speech

    setReplyText(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); setReplyText(''); setTranscript(''); };
    utterance.onerror = () => { setIsSpeaking(false); setReplyText(''); setTranscript(''); };
    
    // Choose a friendly voice if available
    const voices = synthesisRef.current.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;

    synthesisRef.current.speak(utterance);
  }, []);

  const queryOpenRouter = useCallback(async (text: string) => {
    setIsThinking(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (import.meta.env.VITE_OPENROUTER_API_KEY || "YOUR_API_KEY"), 
          "HTTP-Referer": "https://oniongrade-sih.vercel.app",
          "X-Title": "OnionGrade AI",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text }
          ]
        })
      });
      
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const reply = data.choices[0].message.content;
        speak(reply);
      } else {
        speak("I'm sorry, I couldn't reach my brain right now.");
      }
    } catch (e) {
      console.error(e);
      speak("Network error. Please try again later.");
    } finally {
      setIsThinking(false);
    }
  }, [speak]);

  const silenceTimerRef = useRef<number | null>(null);

  const stopAndProcess = useCallback((textToProcess: string) => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    setIsListening(false);
    
    try {
      recognitionRef.current.stop();
    } catch(e) {}
    
    if (textToProcess.trim()) {
      queryOpenRouter(textToProcess.trim());
    } else {
      setTranscript('');
    }
  }, [queryOpenRouter]);

  const startListening = useCallback(() => {
    if (isListening || isThinking) return;
    
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    
    if (isSpeaking && synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
      setReplyText('');
    }

    try {
      setTranscript('');
      setReplyText('');
      
      let hasProcessed = false;
      let currentTranscript = '';
      
      // Enforce settings for maximum compatibility
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        if (hasProcessed) return;
        
        let finalTrans = '';
        let interimTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        
        currentTranscript = finalTrans || interimTrans;
        setTranscript(currentTranscript);

        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        
        if (finalTrans) {
          hasProcessed = true;
          stopAndProcess(currentTranscript);
        } else {
          silenceTimerRef.current = window.setTimeout(() => {
            if (!hasProcessed && currentTranscript.trim()) {
              hasProcessed = true;
              stopAndProcess(currentTranscript);
            }
          }, 2500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        
        // Debug alert to help us identify what's failing on the device
        if (event.error !== 'no-speech') {
          alert("Mic Error: " + event.error);
          setIsListening(false);
        }
        
        if (event.error === 'not-allowed') {
          alert("Microphone access is blocked. Please allow microphone permissions in your browser.");
        }
      };
      
      recognitionRef.current.onend = () => {
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        if (!hasProcessed) {
          setIsListening(false);
          if (currentTranscript.trim()) {
            hasProcessed = true;
            stopAndProcess(currentTranscript);
          }
        }
      };
      
      recognitionRef.current.start();
      setIsListening(true);
      
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
    }
  }, [isListening, isThinking, isSpeaking, speak, stopAndProcess]);

  return {
    isListening,
    isThinking,
    isSpeaking,
    transcript,
    replyText,
    startListening,
  };
}
