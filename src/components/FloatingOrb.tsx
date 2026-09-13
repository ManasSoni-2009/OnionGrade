import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Check,
  Bot,
  Trash2,
  Copy,
  ChevronDown,
} from "lucide-react";

interface QuickPrompt {
  label: string;
  query: string;
  icon: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Grade A vs URS limits", query: "What is the difference between Grade A and URS defect tolerances?", icon: "🧅" },
  { label: "Fair mandi rate formula", query: "How is the fair mandi price calculated based on quality metrics?", icon: "💰" },
  { label: "Photo count for lot size", query: "How many photos should I capture for my onion lot weight?", icon: "📸" },
  { label: "Sprouted lot remedies", query: "What are the storage remedies for sprouted or soft onion lots?", icon: "🌱" },
];

/**
 * Formatter for clean assistant responses with bullet points and bold highlights
 */
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed);
        const cleanContent = isBullet ? trimmed.replace(/^[-•]\s+|\d+\.\s+/, "") : trimmed;

        // Parse bold **text**
        const parts = cleanContent.split(/(\*\*.*?\*\*)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-0.5">
              <span className="text-[#d9f95a] text-[10px] mt-1 leading-none select-none">●</span>
              <span className="flex-1">{rendered}</span>
            </div>
          );
        }

        return <p key={idx}>{rendered}</p>;
      })}
    </div>
  );
}

export function FloatingOrb() {
  const {
    isListening,
    isThinking,
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
  } = useVoiceAssistant();

  const [inputQuery, setInputQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat smoothly to latest message
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [history, transcript, replyText, isThinking, isListening]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;
    const q = inputQuery.trim();
    setInputQuery("");
    askGemini(q);
  };

  const handleQuickPrompt = (prompt: QuickPrompt) => {
    askGemini(prompt.query);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1800);
    });
  };

  return (
    <>
      {/* Sleek, Compact, Mobile-Optimized AI Chatbox Panel */}
      {isPanelOpen && (
        <div
          id="oniongrade-assistant-panel"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden chatbox-panel-enter",
            // Mobile: sits cleanly above the bottom tab bar with side breathing room
            "inset-x-2.5 bottom-[78px] h-[min(540px,calc(100dvh-94px))]",
            // Desktop: bottom-right anchored card
            "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[410px] sm:h-[580px]",
            "bg-[#18191c] rounded-2xl sm:rounded-3xl border border-[#2f3137] shadow-[0_24px_70px_rgba(0,0,0,0.88)]"
          )}
        >
          {/* Header Bar - Ultra Compact 48px */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#202125] border-b border-[#2d2f35] select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Dynamic Status Avatar */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 transition-colors shadow-inner",
                  isListening
                    ? "bg-[#d9f95a] text-[#141517] animate-pulse"
                    : isSpeaking
                    ? "bg-[#d9f95a] text-[#141517]"
                    : isThinking
                    ? "bg-[#25262c] text-[#b7a5f9] border border-[#b7a5f9]/50"
                    : "bg-[#25272c] text-[#d9f95a] border border-[#383a42]"
                )}
              >
                {isListening ? (
                  <Mic className="w-3.5 h-3.5" />
                ) : isSpeaking ? (
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                ) : isThinking ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                {/* Status Dot */}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#202125]",
                    isThinking ? "bg-[#b7a5f9]" : "bg-[#d9f95a]"
                  )}
                />
              </div>

              {/* Title & Live Status */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-[13px] font-bold text-white tracking-wide truncate">
                    OnionGrade AI
                  </h4>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-[#d9f95a]/15 text-[#d9f95a] border border-[#d9f95a]/30 uppercase tracking-wider hidden sm:inline-block">
                    Voice
                  </span>
                </div>
                <p className="text-[10px] text-[#9aa0a6] truncate font-medium">
                  {isListening
                    ? "Listening... Speak now"
                    : isThinking
                    ? "Formulating answer..."
                    : isSpeaking
                    ? "Speaking guidance..."
                    : "Hindi • English • Marathi"}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-lg bg-[#2b2c31] hover:bg-[#36373e] text-[#d9f95a] transition-colors border border-[#3a3c44]"
                  title="Mute voice"
                  aria-label="Mute voice"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              )}

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="p-1.5 rounded-lg bg-[#27282d] hover:bg-[#33353c] text-[#9aa0a6] hover:text-[#d9f95a] transition-colors border border-[#34363d]"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                id="assistant-close-btn"
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setIsPanelOpen(false);
                }}
                className="p-1.5 rounded-lg bg-[#27282d] hover:bg-[#33353c] text-[#9aa0a6] hover:text-white transition-colors border border-[#34363d]"
                title="Minimize assistant"
                aria-label="Close assistant"
              >
                <ChevronDown className="w-4 h-4 sm:hidden" />
                <X className="w-3.5 h-3.5 hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 bg-[#141517] scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#2f3137 transparent",
            }}
          >
            {/* Welcome & Compact Quick Prompts */}
            {history.length === 0 && !transcript && !replyText && (
              <div className="rounded-xl p-3 sm:p-3.5 bg-[#1d1e22] border border-[#2d2f35] text-white space-y-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-[#d9f95a] font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#d9f95a]" />
                  <span>Kisan Sahayak AI Voice Assistant</span>
                </div>
                <p className="text-[11.5px] sm:text-xs text-[#c6c8ce] leading-relaxed">
                  Ask in <strong>Hindi, Marathi, or English</strong> about defect tolerances, sample photos for your lot size, fair mandi pricing, and storage remedies.
                </p>

                {/* Compact Prompt Chips - 2-Column Responsive Grid */}
                <div className="pt-1">
                  <p className="text-[9.5px] font-bold text-[#83868f] uppercase tracking-wider mb-1.5">
                    Frequently Asked:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {QUICK_PROMPTS.map((prompt, pIdx) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleQuickPrompt(prompt)}
                        className="chat-prompt-chip text-left text-[11px] sm:text-xs px-2.5 py-2 rounded-lg bg-[#25262c] hover:bg-[#2e3037] text-[#dcdee3] hover:text-[#d9f95a] border border-[#32343b] hover:border-[#d9f95a]/40 flex items-center justify-between gap-1.5 group active:scale-[0.97]"
                        style={{ animationDelay: `${pIdx * 50}ms` }}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="group-hover:scale-110 transition-transform">{prompt.icon}</span>
                          <span>{prompt.label}</span>
                        </span>
                        <Sparkles className="w-2.5 h-2.5 text-[#d9f95a] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all group-hover:rotate-12" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages with snappy, intuitive entrance animation */}
            {history.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className={cn(
                  "flex flex-col text-xs sm:text-[13px] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-sm transition-all",
                  msg.role === "user"
                    ? "ml-auto bg-[#d9f95a] text-[#141517] font-semibold rounded-br-xs max-w-[85%] chat-msg-user"
                    : "mr-auto bg-[#202126] text-[#e8eaed] border border-[#2d2f35] rounded-bl-xs max-w-[92%] chat-msg-ai"
                )}
              >
                {msg.role === "assistant" ? (
                  <FormattedMessage text={msg.content} />
                ) : (
                  <span className="leading-relaxed">{msg.content}</span>
                )}

                {/* Assistant Message Footer Actions */}
                {msg.role === "assistant" && (
                  <div className="mt-2 pt-1.5 border-t border-[#2d2f35] flex items-center justify-between text-[10px] text-[#868993] select-none">
                    <span className="font-semibold text-[#a5a8b2]">OnionGrade AI</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, i)}
                        className="hover:text-[#d9f95a] flex items-center gap-1 transition-colors font-medium p-0.5"
                        title="Copy answer"
                      >
                        {copiedIndex === i ? (
                          <span className="flex items-center gap-1 text-[#d9f95a] animate-in zoom-in-75 duration-150">
                            <Check className="w-2.5 h-2.5" />
                            <span>Copied</span>
                          </span>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => askGemini(msg.content)}
                        className="hover:text-[#d9f95a] flex items-center gap-1 transition-colors font-medium p-0.5"
                        title="Re-ask or clarify"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Re-ask</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Live Listening Banner */}
            {isListening && (
              <div className="mr-auto w-full bg-[#1b1c20] border border-[#d9f95a]/50 text-white rounded-xl p-2.5 sm:p-3 shadow-md space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#d9f95a] font-bold text-xs">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d9f95a] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d9f95a]" />
                    </span>
                    <span>Listening... speak clearly</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-2.5 py-1 rounded-md bg-[#d9f95a] hover:bg-[#c9e84e] text-[#141517] text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-[#9aa0a6] italic truncate pr-2">
                    {transcript ? `Hearing: "${transcript}"` : "Speak in Hindi or English..."}
                  </span>
                  {/* Dynamic Soundwave Visualizer */}
                  <div className="flex items-end gap-1 h-3.5 flex-shrink-0">
                    {[0.3, 0.7, 0.5, 1.0, 0.8, 0.9, 0.4].map((hMul, idx) => {
                      const barHeight = Math.max(
                        3,
                        Math.min(14, 14 * (audioLevel > 0.04 ? audioLevel * hMul * 1.8 : 0.25))
                      );
                      return (
                        <div
                          key={idx}
                          className="w-0.5 sm:w-1 rounded-full bg-[#d9f95a] transition-all duration-75"
                          style={{ height: `${barHeight}px` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Thinking / AI Formulation Banner */}
            {isThinking && (
              <div className="mr-auto flex items-center justify-between w-full bg-[#1e1f24] border border-[#b7a5f9]/40 text-[#b7a5f9] rounded-xl px-3 py-2 text-xs shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#b7a5f9]" />
                  <span className="font-semibold text-[11.5px] shimmer-text">Finding answer & voice...</span>
                </div>
                <button
                  type="button"
                  onClick={cancelThinking}
                  className="text-[10.5px] text-[#9aa0a6] hover:text-white underline font-semibold ml-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="text-[11.5px] bg-amber-950/40 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-xl font-medium">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Active Speaking Notification Bar */}
          {isSpeaking && (
            <div className="px-3.5 py-1.5 bg-[#1b1c20] border-t border-[#292b30] flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-[#d9f95a] animate-pulse" />
                <span className="text-[10.5px] text-[#dcdee3] font-medium truncate">
                  Speaking response with natural voice
                </span>
              </div>
              <button
                type="button"
                onClick={stopSpeaking}
                className="text-[10.5px] font-bold text-[#d9f95a] hover:underline flex-shrink-0 ml-2"
              >
                Stop
              </button>
            </div>
          )}

          {/* Compact Ergonomic Input Bar */}
          <div className="p-2 sm:p-2.5 bg-[#202125] border-t border-[#2d2f35]">
            <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2">
              {/* Mic Toggle Button */}
              <button
                type="button"
                id="mic-toggle-btn"
                onClick={toggleListening}
                className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 active:scale-95",
                  isListening
                    ? "bg-[#d9f95a] text-[#141517] shadow-[0_0_16px_rgba(217,249,90,0.6)] animate-pulse"
                    : isSpeaking
                    ? "bg-[#d9f95a] text-[#141517]"
                    : "bg-[#282a30] hover:bg-[#32343c] text-[#d9f95a] border border-[#383a42]"
                )}
                title={isListening ? "Stop listening & send" : "Tap to speak with Gemini"}
                aria-label={isListening ? "Stop recording" : "Start voice recording"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : isSpeaking ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Text Input (16px on mobile prevents iOS viewport zoom, 13px on desktop) */}
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening to voice..."
                      : "Type question or tap mic..."
                  }
                  className="w-full bg-[#141517] border border-[#32343a] focus:border-[#d9f95a] text-white placeholder-[#7c7f8a] rounded-full px-3.5 py-2 text-[16px] sm:text-[13px] focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                id="send-question-btn"
                disabled={!inputQuery.trim() || isThinking}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#d9f95a] hover:bg-[#c9e84e] disabled:opacity-30 disabled:hover:bg-[#d9f95a] text-[#141517] flex items-center justify-center font-bold transition-all shadow-sm flex-shrink-0 active:scale-95"
                title="Send query"
                aria-label="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modern Compact Floating Trigger Button */}
      {/* On mobile, hidden when panel is open so it doesn't collide with the open panel */}
      <div
        id="voice-assistant-button-wrapper"
        className={cn(
          "fixed z-40 select-none transition-all duration-200",
          // Mobile position: above the bottom tab bar
          "bottom-[80px] right-3 sm:bottom-6 sm:right-6",
          isPanelOpen && "hidden sm:block"
        )}
      >
        <button
          type="button"
          id="oniongrade-floating-ai-btn"
          onClick={() => {
            if (!isPanelOpen) {
              setIsPanelOpen(true);
            } else {
              toggleListening();
            }
          }}
          className={cn(
            "group relative flex items-center gap-2 cursor-pointer rounded-full transition-all duration-300 active:scale-95 shadow-[0_10px_28px_rgba(0,0,0,0.65)]",
            "bg-[#1c1d20] border",
            isListening
              ? "border-[#d9f95a] shadow-[0_0_24px_rgba(217,249,90,0.5)] p-1.5 pr-3.5 bg-[#222428]"
              : isSpeaking
              ? "border-[#d9f95a] shadow-[0_0_18px_rgba(217,249,90,0.4)] p-1.5 pr-3.5 bg-[#222428]"
              : isThinking
              ? "border-[#b7a5f9] shadow-[0_0_18px_rgba(183,165,249,0.4)] p-1.5 pr-3.5 bg-[#222428]"
              : "border-[#35373f] hover:border-[#d9f95a] p-1.5 pr-3.5 hover:scale-105"
          )}
          title="OnionGrade AI Voice Assistant"
          aria-label="Open AI Assistant"
        >
          {/* Subtle Ambient Glow */}
          <div
            className={cn(
              "absolute -inset-0.5 rounded-full blur-sm transition-opacity duration-300 pointer-events-none",
              isListening || isSpeaking
                ? "bg-[#d9f95a]/35 opacity-100"
                : isThinking
                ? "bg-[#b7a5f9]/35 opacity-100"
                : "bg-[#d9f95a]/15 opacity-0 group-hover:opacity-100"
            )}
          />

          {/* Hardware-Inspired Icon Badge */}
          <div
            className={cn(
              "relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors flex-shrink-0 shadow-inner",
              isListening
                ? "bg-[#d9f95a] text-[#141517] animate-pulse"
                : isSpeaking
                ? "bg-[#d9f95a] text-[#141517]"
                : isThinking
                ? "bg-[#b7a5f9]/20 text-[#b7a5f9] border border-[#b7a5f9]/50"
                : "bg-[#25272c] text-[#d9f95a] border border-[#383a42] group-hover:border-[#d9f95a]/50"
            )}
          >
            {isListening ? (
              <Mic className="w-4 h-4" />
            ) : isSpeaking ? (
              <Volume2 className="w-4 h-4 animate-bounce" />
            ) : isThinking ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>

          {/* Label & Dynamic Indicator */}
          <div className="flex flex-col text-left pr-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] sm:text-xs font-bold text-white tracking-wide">
                {isListening
                  ? "Listening..."
                  : isSpeaking
                  ? "Speaking..."
                  : isThinking
                  ? "Thinking..."
                  : "Ask AI"}
              </span>
              {/* Dynamic Sound Equalizer Bar */}
              {isListening || isSpeaking ? (
                <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                  <span className="w-0.5 h-2 bg-[#d9f95a] animate-pulse rounded-full" />
                  <span className="w-0.5 h-2.5 bg-[#d9f95a] animate-ping rounded-full" />
                  <span className="w-0.5 h-1.5 bg-[#d9f95a] animate-pulse rounded-full" />
                </div>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d9f95a]" />
              )}
            </div>
            <span className="text-[9.5px] text-[#9aa0a6] font-medium leading-none mt-0.5">
              {isListening ? "Tap to finish" : "Voice Assistant"}
            </span>
          </div>

          {/* Active status pulse dot */}
          {(isListening || isSpeaking || isThinking) && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isThinking ? "bg-[#b7a5f9]" : "bg-[#d9f95a]"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-[#1c1d20]",
                  isThinking ? "bg-[#b7a5f9]" : "bg-[#d9f95a]"
                )}
              />
            </span>
          )}
        </button>
      </div>
    </>
  );
}
