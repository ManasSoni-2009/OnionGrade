import React, { Component, ErrorInfo, ReactNode } from "react"
import { Orb } from "./ui/orb"
import { cn } from "../lib/utils"
import { useVoiceAssistant } from "../hooks/useVoiceAssistant"

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Orb Error:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function FloatingOrb() {
  const { isListening, isThinking, isSpeaking, transcript, replyText, startListening } = useVoiceAssistant();

  // Determine visual state
  let agentState: "listening" | "talking" | "thinking" | null = null;
  if (isListening) agentState = "listening";
  else if (isThinking) agentState = "thinking";
  else if (isSpeaking) agentState = "talking";

  const orbColors: [string, string] =
    agentState === "listening"
      ? ["#A0B9D1", "#CADCFC"]
      : agentState === "talking"
      ? ["#d9f95a", "#b5d836"] // matching lime accents
      : agentState === "thinking"
      ? ["#E5E7EB", "#9CA3AF"]
      : ["#CADCFC", "#A0B9D1"]

  const isPulsing = isListening || isSpeaking;

  const showPill = Boolean(transcript || replyText || isThinking);
  const textToShow = isThinking ? "Thinking..." : (replyText || transcript);

  return (
    <>
      <style>{`
        @keyframes orbGrowShrink {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .orb-pulse {
          animation: orbGrowShrink 1.5s infinite ease-in-out;
        }
      `}</style>
      
      {showPill && (
        <div className="fixed bottom-26 right-24 md:bottom-10 md:right-32 z-50 max-w-[260px] sm:max-w-[320px] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md text-[#222] px-5 py-3 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] text-[13px] sm:text-sm font-medium leading-relaxed animate-in fade-in slide-in-from-right-4 duration-300 line-clamp-3">
            {textToShow}
          </div>
        </div>
      )}

      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 md:bottom-8 md:right-8",
          "h-16 w-16 md:h-20 md:w-20",
          "cursor-pointer rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden",
          "bg-background/50 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95",
          isPulsing ? "orb-pulse" : ""
        )}
        onClick={startListening}
        title="Click to speak to the OnionGrade AI Assistant"
      >
        <ErrorBoundary>
          <Orb
            colors={orbColors}
            agentState={agentState}
            className="relative h-full w-full"
          />
        </ErrorBoundary>
      </div>
    </>
  )
}
