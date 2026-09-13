import { useState, useCallback, useEffect, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Convert audio buffer Float32Array to 16kHz 16-bit mono WAV Blob
function exportWavBlob(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);  // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate (sampleRate * 1 * 16/8)
  view.setUint16(32, 2, true);  // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [replyText, setReplyText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordedPcmChunksRef = useRef<Float32Array[]>([]);
  const currentBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const maxRecordTimerRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const historyRef = useRef<ChatMessage[]>([]);

  const playbackAnimFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const isCancelledByUserRef = useRef(false);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Stop currently playing speech completely
  const stopSpeaking = useCallback(() => {
    if (playbackAnimFrameRef.current) {
      cancelAnimationFrame(playbackAnimFrameRef.current);
      playbackAnimFrameRef.current = null;
    }

    if (currentBufferSourceRef.current) {
      try {
        currentBufferSourceRef.current.onended = null;
        currentBufferSourceRef.current.stop();
        currentBufferSourceRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      currentBufferSourceRef.current = null;
    }

    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      } catch (e) {
        // ignore
      }
      audioElementRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  // Browser Web Speech API fallback for instant, zero-latency speech (Hindi & English)
  const speakBrowserTts = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const isHindi = /[\u0900-\u097F]/.test(cleanText);
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      if (isHindi) {
        const hindiVoice = voices.find(v => v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const englishVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }

      utterance.rate = 1.05;
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setAudioLevel(0);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setAudioLevel(0);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Browser TTS speech error:', err);
      setIsSpeaking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      if (maxRecordTimerRef.current) window.clearTimeout(maxRecordTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (playbackAnimFrameRef.current) cancelAnimationFrame(playbackAnimFrameRef.current);
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, [stopSpeaking]);

  // Rock-solid Web Audio API playback using decodeAudioData (never cuts off or stalls in between)
  const playAudioWav = useCallback(async (base64Wav: string, mimeType = 'audio/wav') => {
    if (!base64Wav) return;
    stopSpeaking();
    setIsSpeaking(true);

    try {
      const binaryString = window.atob(base64Wav);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // decode audio buffer
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      source.connect(analyser);
      analyser.connect(ctx.destination);
      currentBufferSourceRef.current = source;

      // Monitor playback volume in real-time to animate visual equalizer
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!currentBufferSourceRef.current) {
          setAudioLevel(0);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(1, avg / 65));
        playbackAnimFrameRef.current = requestAnimationFrame(updateVolume);
      };
      playbackAnimFrameRef.current = requestAnimationFrame(updateVolume);

      source.onended = () => {
        if (playbackAnimFrameRef.current) {
          cancelAnimationFrame(playbackAnimFrameRef.current);
          playbackAnimFrameRef.current = null;
        }
        setIsSpeaking(false);
        setAudioLevel(0);
        currentBufferSourceRef.current = null;
      };

      source.start(0);
    } catch (err) {
      console.warn('decodeAudioData playback error, falling back to Audio element:', err);
      try {
        const audio = new Audio(`data:${mimeType};base64,${base64Wav}`);
        audioElementRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          setAudioLevel(0);
          audioElementRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setAudioLevel(0);
          audioElementRef.current = null;
        };
        await audio.play();
      } catch (e2) {
        setIsSpeaking(false);
      }
    }
  }, [stopSpeaking]);

  // Cancel any active AI formulation cleanly
  const cancelThinking = useCallback(() => {
    isCancelledByUserRef.current = true;
    if (activeRequestControllerRef.current) {
      try {
        activeRequestControllerRef.current.abort();
      } catch (e) {
        // ignore
      }
      activeRequestControllerRef.current = null;
    }
    stopSpeaking();
    setIsThinking(false);
  }, [stopSpeaking]);

  // Clear chat conversation history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setTranscript('');
    setReplyText('');
    setErrorMessage(null);
    stopSpeaking();
  }, [stopSpeaking]);

  // Send query (typed text or prompt click) to Gemini
  const askGemini = useCallback(async (query: string) => {
    if (!query || !query.trim()) return;
    const trimmed = query.trim();

    setIsThinking(true);
    setErrorMessage(null);
    setIsPanelOpen(true);
    stopSpeaking();

    const newHistory: ChatMessage[] = [
      ...historyRef.current,
      { role: 'user', content: trimmed, timestamp: Date.now() }
    ];
    setHistory(newHistory);

    // Abort any previous pending request
    if (activeRequestControllerRef.current) {
      try {
        activeRequestControllerRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    isCancelledByUserRef.current = false;
    const timeoutId = window.setTimeout(() => {
      try {
        controller.abort();
      } catch (e) {
        // ignore
      }
    }, 45000);

    try {
      const response = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: newHistory.slice(-4),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || "OnionGrade grades onion lots to calculate fair mandi prices and eliminate middleman bias.";

      setReplyText(reply);
      setHistory(prev => [
        ...prev,
        { role: 'assistant', content: reply, timestamp: Date.now() }
      ]);

      if (data.audio) {
        playAudioWav(data.audio, data.audioMime || 'audio/wav');
      } else {
        speakBrowserTts(reply);
      }
    } catch (err: any) {
      if (isCancelledByUserRef.current) {
        return;
      }
      const isAbort = err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort');
      if (isAbort) {
        console.warn('Gemini query timed out or was aborted');
      } else {
        console.error('Gemini query error:', err);
      }
      const isHindi = /[\u0900-\u097F]/.test(trimmed);
      const fallbackReply = isHindi
        ? "ओनियनग्रेड ऐप प्याज के आकार (45-60mm ग्रेड A) और खराबी की जांच करके निष्पक्ष मंडी भाव तय करता है।"
        : "OnionGrade calculates fair mandi prices from sample photos, detecting Grade A quality and URS defects.";
      setReplyText(fallbackReply);
      setHistory(prev => [
        ...prev,
        { role: 'assistant', content: fallbackReply, timestamp: Date.now() }
      ]);
      speakBrowserTts(fallbackReply);
      setErrorMessage(isAbort ? "Network delay detected. Using instant agricultural guide." : "Using local agricultural guide.");
    } finally {
      window.clearTimeout(timeoutId);
      if (activeRequestControllerRef.current === controller) {
        activeRequestControllerRef.current = null;
      }
      setIsThinking(false);
    }
  }, [playAudioWav, speakBrowserTts, stopSpeaking]);

  // Process recorded audio Blob
  const processRecordedAudio = useCallback(async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setIsListening(false);
      return;
    }

    setIsThinking(true);
    setErrorMessage(null);
    setIsPanelOpen(true);
    stopSpeaking();

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Abort any previous pending request
        if (activeRequestControllerRef.current) {
          try {
            activeRequestControllerRef.current.abort();
          } catch (e) {
            // ignore
          }
        }

        const controller = new AbortController();
        activeRequestControllerRef.current = controller;
        isCancelledByUserRef.current = false;
        const timeoutId = window.setTimeout(() => {
          try {
            controller.abort();
          } catch (e) {
            // ignore
          }
        }, 45000);

        try {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          if (!base64Data) {
            setIsThinking(false);
            return;
          }

          const response = await fetch('/api/voice-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Data,
              mimeType: 'audio/wav',
              history: historyRef.current.slice(-4),
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Server status ${response.status}`);
          }

          const data = await response.json();
          const userTranscript = data.transcript?.trim();
          const reply = data.reply || "I am your OnionGrade assistant. How can I assist with your onion lot?";

          if (userTranscript) {
            setTranscript(userTranscript);
            setHistory(prev => [
              ...prev,
              { role: 'user', content: userTranscript, timestamp: Date.now() },
              { role: 'assistant', content: reply, timestamp: Date.now() + 1 }
            ]);
          } else {
            setHistory(prev => [
              ...prev,
              { role: 'assistant', content: reply, timestamp: Date.now() }
            ]);
          }

          setReplyText(reply);

          // Play audio or fallback to high-quality browser TTS
          if (data.audio) {
            playAudioWav(data.audio, data.audioMime || 'audio/wav');
          } else {
            speakBrowserTts(reply);
          }
        } catch (postErr: any) {
          if (isCancelledByUserRef.current) {
            return;
          }
          const isAbort = postErr?.name === 'AbortError' || String(postErr?.message || '').toLowerCase().includes('abort');
          if (isAbort) {
            console.warn('Audio query request timed out or was aborted');
          } else {
            console.error('Audio query error:', postErr);
          }
          const fallbackReply = "ओनियनग्रेड ऐप आपकी प्याज फसल की सटीक ग्रेडिंग और उचित मंडी भाव निकालने में मदद करता है।";
          setReplyText(fallbackReply);
          speakBrowserTts(fallbackReply);
          setErrorMessage(isAbort ? "Processing took longer than expected. Using local answer." : "Failed to process speech. You can type your question below.");
        } finally {
          window.clearTimeout(timeoutId);
          if (activeRequestControllerRef.current === controller) {
            activeRequestControllerRef.current = null;
          }
          setIsThinking(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e: any) {
      console.error('Error processing audio blob:', e);
      setIsThinking(false);
      setErrorMessage("Could not read audio recording.");
    }
  }, [playAudioWav, speakBrowserTts, stopSpeaking]);

  // Stop recording and dispatch collected WAV samples
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxRecordTimerRef.current) {
      window.clearTimeout(maxRecordTimerRef.current);
      maxRecordTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setIsListening(false);
    setAudioLevel(0);

    // Disconnect script processor
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      processorNodeRef.current = null;
    }

    // Convert collected PCM Float32 chunks into standard WAV
    const chunks = recordedPcmChunksRef.current;
    if (chunks.length > 0) {
      let totalLength = 0;
      for (const c of chunks) totalLength += c.length;

      const mergedSamples = new Float32Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        mergedSamples.set(c, offset);
        offset += c.length;
      }
      recordedPcmChunksRef.current = [];

      // Only process if we collected meaningful samples
      if (totalLength > 4000 && hasSpokenRef.current) {
        const sampleRate = audioContextRef.current?.sampleRate || 16000;
        const wavBlob = exportWavBlob(mergedSamples, sampleRate);
        processRecordedAudio(wavBlob);
      } else if (totalLength > 16000) {
        const sampleRate = audioContextRef.current?.sampleRate || 16000;
        const wavBlob = exportWavBlob(mergedSamples, sampleRate);
        processRecordedAudio(wavBlob);
      } else {
        setErrorMessage("No voice detected. Tap the mic and speak clearly, or type below.");
      }
    }

    // Stop microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }, [processRecordedAudio]);

  // Start microphone recording with 16kHz AudioContext + ScriptProcessor
  const startListening = useCallback(async () => {
    if (isListening || isThinking) return;

    setErrorMessage(null);
    setIsPanelOpen(true);
    stopSpeaking();
    setTranscript('');
    setReplyText('');
    recordedPcmChunksRef.current = [];
    hasSpokenRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Microphone access is not supported in this browser. You can type your question!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      // ScriptProcessor to capture raw PCM samples directly
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        recordedPcmChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Real-time audio level monitoring and speech detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!mediaStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 60);
        setAudioLevel(normalized);

        // Sensitive voice activity detection (threshold 0.04)
        if (normalized > 0.04) {
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) {
            window.clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpokenRef.current && normalized < 0.035) {
          // If user was speaking and paused for 1.6s, auto-stop
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = window.setTimeout(() => {
              stopListening();
            }, 1600);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      animFrameRef.current = requestAnimationFrame(checkVolume);

      setIsListening(true);

      // Max recording cap (8s max for questions)
      maxRecordTimerRef.current = window.setTimeout(() => {
        stopListening();
      }, 8000);

    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone permission was denied. Please allow microphone access or type below.");
      } else {
        setErrorMessage("Could not access microphone. You can type your question below.");
      }
    }
  }, [isListening, isThinking, stopSpeaking, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  return {
    isListening,
    isThinking,
    setIsThinking,
    cancelThinking,
    isSpeaking,
    transcript,
    replyText,
    audioLevel,
    errorMessage,
    history,
    isPanelOpen,
    setIsPanelOpen,
    clearHistory,
    startListening,
    stopListening,
    toggleListening,
    stopSpeaking,
    askGemini,
    playAudioWav,
  };
}
