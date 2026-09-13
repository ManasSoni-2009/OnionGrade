import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';

const __filenameSafe = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const __dirnameSafe = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filenameSafe || process.cwd());

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

export const ONIONGRADE_SYSTEM_PROMPT = `You are the OnionGrade Voice Assistant, a friendly, respectful, and highly knowledgeable agricultural AI guide for onion farmers, traders, and mandi dealers across India.

CRITICAL COMPLETION MANDATE:
- Always finish every sentence and complete your full thought with proper punctuation (पूर्णविराम '।' in Hindi, or period '.' in English).
- NEVER cut off mid-sentence or mid-word. Deliver 2 to 4 complete, well-formed sentences (around 45-80 words).

YOUR PERSONA & SPEAKING STYLE:
- Tone: Warm, respectful (treat every farmer as 'Annadata'), encouraging, practical, and clear.
- Output Format: You are speaking via audio synthesis. Keep every answer spoken-friendly, conversational, and concise (2 to 4 complete sentences).
- Avoid bullet points, asterisks, markdown formatting, tables, code blocks, or robotic phrasing that sounds unnatural when read aloud.
- If addressed in Hindi or Hinglish, reply in complete, natural, respectful Hindi/Hinglish (शुद्ध व सरल हिंदी). If in English, reply in friendly spoken English.

DOMAIN EXPERTISE - ONION QUALITY & GRADING:
- Grade A: Premium export/supermarket quality onions. Uniform diameter (45-60mm), firm, dry outer skins, bright red/pink coloration, free from cuts or mold. Commands top mandi rate plus a quality premium (+₹3 to ₹6/kg).
- Grade B: Good commercial quality, minor cosmetic blemishes or slight size variation, ideal for domestic household consumption.
- URS (Under Rejection Standard): Onions failing grading benchmarks due to defects. Sells at a significant discount (penalty) or redirected to dehydration/processing plants.
- Defects:
  * Sprouted: Germinated green shoots from excessive field moisture or delayed harvest. Must be segregated quickly.
  * Rotten / Black Mold: Fungal breakdown (Aspergillus niger / bacterial soft rot). Highly contagious in storage bins.
  * Damaged: Mechanical cuts or bruised skins from manual digging tools or transport shock.
  * Undersized / Peewee: Bulbs under 40mm diameter.
- Storage & Action Advice: Recommend dry, well-ventilated storage, perforated plastic crates, and immediate separation of damp lots.

APP CAPABILITIES & WORKFLOW:
- /dashboard: View overall health score, latest lot value, market trends, and quick assessment launcher.
- /assessment & /capture: Farmers enter lot weight (kg), variety, and region. Then capture or upload sample images.
  * Strict duplicate prevention: Client-side perceptual hashing prevents uploading duplicate or repeated photos.
  * Photo count requirements based on weight: Under 500kg needs 3 photos; 500 to 2000kg needs 5 photos; above 2000kg requires 10 photos for statistical fairness.
- /reports: Detailed digital quality certificates with verifiable QR codes, defect breakdowns, fair price calculations, and shareable proof for dealers.
- /market: Live APMC mandi modal rates (Nashik Lasalgaon, Pune, Indore, Bengaluru, Solapur) updated continuously.
- /leaderboard: Top quality onion farmers celebrating transparent farming practices.

Always guide the farmer clearly, suggest next steps in the app when relevant, and reassure them that OnionGrade ensures fair prices and eliminates middleman bias.
CRITICAL INSTRUCTION: You are a Voice Assistant. You MUST keep your responses EXTREMELY short and concise. Aim for 1-2 brief sentences maximum. Never output long paragraphs or lists.`;

// Primary API Key from user + Secondary fallback key
const PRIMARY_API_KEY = process.env.GEMINI_API_KEY;
const SECONDARY_API_KEY = process.env.SECONDARY_GEMINI_API_KEY;

// Cooldown tracker for keys that hit 429 / RESOURCE_EXHAUSTED quota limits
// Pre-initialize primary in cooldown so the fresh studio key is used immediately
const keyQuotaCooldownMap = new Map<string, number>([
  ['primary', Date.now() + 60 * 60 * 1000],
]);

// Dedicated TTS cooldown: Gemini TTS free tier has a strict 10 requests/day quota limit.
// If 429 occurs, suspend TTS calls for 20 minutes so responses return in 1-2 seconds without blocking.
let ttsCooldownUntil = 0;

function isKeyInCooldown(label: string): boolean {
  const expiry = keyQuotaCooldownMap.get(label);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    keyQuotaCooldownMap.delete(label);
    return false;
  }
  return true;
}

function markKeyQuotaExhausted(label: string, durationMs: number = 30 * 60 * 1000) {
  keyQuotaCooldownMap.set(label, Date.now() + durationMs);
}

function markTtsExhausted(durationMs: number = 20 * 60 * 1000) {
  ttsCooldownUntil = Date.now() + durationMs;
}

function isQuotaError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = String(err?.message || '');
  return status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

// Timeout wrapper ensuring no single AI call hangs or blocks the server
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

function createGenAI(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Get ordered list of AI client instances: prioritize keys that are active and not in 429 cooldown
function getGenAICandidates(): Array<{ ai: GoogleGenAI; label: string }> {
  const all: Array<{ ai: GoogleGenAI; label: string }> = [];
  if (PRIMARY_API_KEY && PRIMARY_API_KEY !== SECONDARY_API_KEY) {
    all.push({ ai: createGenAI(PRIMARY_API_KEY), label: 'primary' });
  }
  if (SECONDARY_API_KEY) {
    all.push({ ai: createGenAI(SECONDARY_API_KEY), label: 'secondary-studio-key' });
  }

  return all.sort((a, b) => {
    const aCooldown = isKeyInCooldown(a.label) ? 1 : 0;
    const bCooldown = isKeyInCooldown(b.label) ? 1 : 0;
    return aCooldown - bCooldown;
  });
}

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const candidates = getGenAICandidates();
  return candidates.length > 0 ? candidates[0].ai : null;
}

// In-memory cache for synthesized voice WAV audio to prevent duplicate TTS calls & handle quota limits
const speechAudioCache = new Map<string, string>();

function getFallbackAnswer(query: string): string {
  const q = query.toLowerCase();
  const isHindi = /[\u0900-\u097F]/.test(query);

  if (isHindi) {
    if (q.includes('ग्रेड') || q.includes('क्वालिटी') || q.includes('ए') || q.includes('साइज') || q.includes('आकार') || q.includes('प्रकार')) {
      return "प्याज की ग्रेडिंग में आकार (45 से 60 एमएम), रंग और छिलके की सूखापन देखा जाता है। ग्रेड ए प्याज बिल्कुल ठोस, चमकीला और बिना किसी कट या अंकुरण के होता है, जिससे मंडी में 3 से 6 रुपये प्रति किलो का अतिरिक्त प्रीमियम मिलता है।";
    }
    if (q.includes('दाम') || q.includes('भाव') || q.includes('रेट') || q.includes('मंडी') || q.includes('पैसा') || q.includes('कीमत')) {
      return "ओनियनग्रेड ऐप आपकी स्थानीय एपीएमसी मंडी के मॉडल भाव के आधार पर निष्पक्ष दाम तय करता है। उच्च ग्रेड के लॉट पर प्रीमियम जोड़ा जाता है और खराब प्याज पर उचित कटौती होती है ताकि बिचौलियों का खेल खत्म हो सके।";
    }
    if (q.includes('फोटो') || q.includes('तस्वीर') || q.includes('वजन') || q.includes('किलो') || q.includes('क्विंटल') || q.includes('कितनी')) {
      return "लॉट के वजन अनुसार फोटो लें: 500 किलो से कम लॉट के लिए 3 फोटो, 500 से 2000 किलो के लिए 5 फोटो, और 2000 किलो से अधिक के लिए 10 फोटो जरूरी हैं ताकि सांख्यिकीय सटीकता बनी रहे।";
    }
    if (q.includes('सड़न') || q.includes('खराब') || q.includes('अंकुर') || q.includes('यूआरएस') || q.includes('नुकसान')) {
      return "यूआरएस (URS) का अर्थ है रिजेक्शन वाले प्याज—जैसे सड़न, गीलापन, अंकुरण या कटे-फटे प्याज। इन्हें तुरंत अलग करके हवादार क्रेट में रखें ताकि स्वस्थ प्याज खराब न हों।";
    }
    if (q.includes('नमस्ते') || q.includes('प्रणाम') || q.includes('राम राम') || q.includes('मदद') || q.includes('कौन')) {
      return "नमस्ते किसान भाई! मैं आपका ओनियनग्रेड सहायक हूँ। आप मुझसे प्याज की ग्रेडिंग, मंडी भाव, जरूरी फोटो संख्या या भंडारण के उपाय के बारे में पूछ सकते हैं।";
    }
    return "ओनियनग्रेड कंप्यूटर विज़न से आपके प्याज लॉट की सटीक ग्रेडिंग करता है और पारदर्शी मूल्य निर्धारण करता है। आप 'असेसमेंट' टैब में जाकर तुरंत अपने लॉट की जांच कर सकते हैं।";
  }

  if (q.includes('urs') || q.includes('under rejection') || q.includes('rejection')) {
    return "URS stands for Under Rejection Standard. These are onions with defects such as rot, sprouting, or major mechanical cuts that do not meet market specs, leading to a calculated price deduction.";
  }
  if (q.includes('photo') || q.includes('image') || q.includes('weight') || q.includes('how many')) {
    return "OnionGrade requires photos based on your lot weight: three photos for lots under 500 kilograms, five photos between 500 and 2000 kilograms, and ten photos for lots above 2000 kilograms to ensure complete grading fairness.";
  }
  if (q.includes('sprout') || q.includes('sprouting') || q.includes('green')) {
    return "Sprouted onions have germinated green shoots caused by humidity or moisture. Segregate them immediately into well-ventilated crates to prevent rot from spreading across your healthy bulbs.";
  }
  if (q.includes('duplicate') || q.includes('hash') || q.includes('repeat')) {
    return "OnionGrade uses perceptual image hashing right on your phone to prevent duplicate uploads. Every photo must show a distinct sample angle to guarantee trust with your buyers.";
  }
  if (q.includes('price') || q.includes('fair') || q.includes('mandi') || q.includes('rate') || q.includes('calculate')) {
    return "Fair price starts from your local mandi modal rate, adds a premium of up to five rupees per kilo for high Grade A lots, and transparently subtracts penalties for URS defects.";
  }
  if (q.includes('grade a') || q.includes('grade-a') || q.includes('quality') || q.includes('best')) {
    return "Grade A onions are firm, uniform bulbs between 45 and 60 millimeters with clean, dry outer scales. They earn the highest price premium in the market.";
  }
  if (q.includes('namaste') || q.includes('hello') || q.includes('hi') || q.includes('who are you')) {
    return "Namaste! I am your OnionGrade AI assistant. You can ask me about onion grading benchmarks, required photo counts, storage remedies, or how we calculate fair mandi prices.";
  }
  return "OnionGrade uses computer vision to accurately grade your lot and eliminate middleman bias. Head to the Assess tab to capture your lot, or check live rates in Market rates.";
}

// Helper to convert raw 16-bit PCM (from Gemini TTS) to a standard playable WAV buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Helper to synthesize human speech using Gemini TTS (voice: Kore) with multi-key, multi-model fallback & caching
async function synthesizeHumanSpeech(text: string): Promise<string | null> {
  try {
    const cleanSpeechText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanSpeechText) return null;

    // If Gemini TTS is in quota cooldown (10 free requests/day limit), return immediately
    if (Date.now() < ttsCooldownUntil) {
      return null;
    }

    // Check in-memory cache
    if (speechAudioCache.has(cleanSpeechText)) {
      return speechAudioCache.get(cleanSpeechText)!;
    }

    // Synthesize full speech
    let ttsInput = cleanSpeechText;

      const ttsModels = [
        'gemini-3.1-flash-tts-preview',
        'gemini-2.5-flash-preview-tts',
      ];

    const candidates = getGenAICandidates();
    for (const cand of candidates) {
      if (isKeyInCooldown(cand.label) && candidates.some(c => !isKeyInCooldown(c.label))) {
        continue;
      }
      for (const modelName of ttsModels) {
        try {
          const ttsResponse = await withTimeout(
            cand.ai.models.generateContent({
              model: modelName,
              contents: [{ parts: [{ text: ttsInput }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
                },
              },
            }),
            15000,
            'TTS generation timeout'
          );

          const rawAudioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          console.log(`TTS raw audio output type for ${modelName}:`, typeof rawAudioBase64, rawAudioBase64 ? 'has data' : 'empty');

          if (!rawAudioBase64) {
            console.log("TTS Response candidates:", JSON.stringify(ttsResponse.candidates, null, 2));
          }
          if (rawAudioBase64) {
            const pcmBuffer = Buffer.from(rawAudioBase64, 'base64');
            const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
            const wavBase64 = wavBuffer.toString('base64');

            // Keep cache size bounded
            if (speechAudioCache.size > 200) {
              const firstKey = speechAudioCache.keys().next().value;
              if (firstKey) speechAudioCache.delete(firstKey);
            }
            speechAudioCache.set(cleanSpeechText, wavBase64);

            return wavBase64;
          }
        } catch (err: any) {
          console.warn(`TTS generation error with ${modelName} on ${cand.label}:`, err.message);
          if (isQuotaError(err)) {
            markKeyQuotaExhausted(cand.label);
            break; // Stop trying this key, but continue outer loop for next key
          }
        }
      }
    }
  } catch (ttsErr: any) {
    console.log('Gemini TTS synthesis fallback invoked');
  }
  return null;
}

const TRANSCRIBE_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

const GENERATION_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(PRIMARY_API_KEY || SECONDARY_API_KEY) });
});

// Gemini-powered voice assistant with Audio Transcription & Natural Voice Synthesis
app.post('/api/voice-assistant', async (req, res) => {
  try {
    const { message, audio, mimeType, history } = req.body || {};
    let userQuery = typeof message === 'string' ? message.trim() : '';
    const candidates = getGenAICandidates();

    // 1. If audio is provided, transcribe it using resilient Multi-Key, Multi-Model Gemini cascade
    if (audio && typeof audio === 'string' && candidates.length > 0) {
      let cleanMime = 'audio/wav';
      if (typeof mimeType === 'string' && mimeType.trim()) {
        const base = mimeType.split(';')[0].trim().toLowerCase();
        if (['audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/ogg', 'audio/flac'].includes(base)) {
          cleanMime = base;
        }
      }

      transcribeLoop: for (const cand of candidates) {
        if (isKeyInCooldown(cand.label) && candidates.some(c => !isKeyInCooldown(c.label))) {
          continue;
        }
        for (const modelName of TRANSCRIBE_MODELS) {
          try {
            const transcribeRes = await withTimeout(
              cand.ai.models.generateContent({
                model: modelName,
                contents: [
                  {
                    parts: [
                      {
                        inlineData: {
                          mimeType: cleanMime,
                          data: audio,
                        },
                      },
                      {
                        text: 'Transcribe this spoken audio verbatim. If spoken in Hindi, Marathi, English, Gujarati or another Indian language, accurately output the transcribed words in their natural script or Romanized form. Output ONLY the transcribed words. If silent or unintelligible, output exactly: (no speech detected)',
                      },
                    ],
                  },
                ],
              }),
              4500,
              `Transcription timeout on ${modelName}`
            );

            const transcribedText = transcribeRes.text?.trim() || '';
            if (transcribedText && !transcribedText.toLowerCase().includes('(no speech')) {
              userQuery = transcribedText;
              break transcribeLoop; // Successfully transcribed!
            }
          } catch (transcribeErr: any) {
            if (isQuotaError(transcribeErr)) {
              markKeyQuotaExhausted(cand.label);
              break; // Stop querying exhausted key immediately
            }
          }
        }
      }
    }

    // If still no speech detected, return friendly human-voiced fallback message
    if (!userQuery) {
      const fallbackNoSpeech = "I couldn't detect any voice. Please tap the mic again and speak clearly, or type your question below.";
      const audioWav = await synthesizeHumanSpeech(fallbackNoSpeech);
      res.json({
        transcript: '',
        reply: fallbackNoSpeech,
        audio: audioWav,
        audioMime: audioWav ? 'audio/wav' : null,
        engine: 'fallback',
      });
      return;
    }

    let reply = '';
    let engine = 'fallback';

    // 2. Generate answer with Gemini using multi-key, multi-model cascade with generous token ceiling
    if (candidates.length > 0) {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-4)) {
          if (item.role === 'user' || item.role === 'assistant') {
            contents.push({
              role: item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(item.content) }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: userQuery }],
      });

      generationLoop: for (const cand of candidates) {
        if (isKeyInCooldown(cand.label) && candidates.some(c => !isKeyInCooldown(c.label))) {
          continue;
        }
        for (const genModel of GENERATION_MODELS) {
          try {
            const response = await withTimeout(
              cand.ai.models.generateContent({
                model: genModel,
                contents: contents.length === 1 ? userQuery : contents,
                config: {
                  systemInstruction: ONIONGRADE_SYSTEM_PROMPT,
                  temperature: 0.7,
                  maxOutputTokens: 2048, // Generous token allowance preventing Hindi Unicode cutoff
                },
              }),
              5500,
              `Generation timeout on ${genModel}`
            );

            let genText = response.text?.trim();
            if (genText) {
              // Ensure text ends with clean punctuation so voice playback doesn't cut off abruptly
              if (!/[.!?।]$/.test(genText)) {
                // If it ended abruptly, trim to last complete sentence or append full stop
                const lastSentenceEnd = Math.max(
                  genText.lastIndexOf('।'),
                  genText.lastIndexOf('.'),
                  genText.lastIndexOf('!'),
                  genText.lastIndexOf('?')
                );
                if (lastSentenceEnd > 20) {
                  genText = genText.slice(0, lastSentenceEnd + 1).trim();
                } else {
                  genText = genText + '।';
                }
              }

              reply = genText;
              engine = `${genModel} (${cand.label})`;
              break generationLoop; // Success!
            }
          } catch (geminiError: any) {
            if (isQuotaError(geminiError)) {
              markKeyQuotaExhausted(cand.label);
              break; // Stop querying exhausted key immediately
            }
          }
        }
      }

      if (!reply) {
        reply = getFallbackAnswer(userQuery);
        engine = 'agricultural-knowledge-fallback';
      }
    } else {
      reply = getFallbackAnswer(userQuery);
    }

    // 3. Generate high-quality human-like speech with Gemini TTS (non-blocking speed)
    let wavBase64: string | null = null;
    if (reply) {
      wavBase64 = await synthesizeHumanSpeech(reply);
    }

    res.json({
      transcript: userQuery,
      reply,
      audio: wavBase64,
      audioMime: wavBase64 ? 'audio/wav' : null,
      engine,
    });
  } catch (err: any) {
    console.error('Voice assistant error:', err);
    const errorMsg = 'I am sorry, I could not process that. Please try again.';
    const errAudio = await synthesizeHumanSpeech(errorMsg);
    res.status(500).json({
      error: 'Internal server error',
      reply: errorMsg,
      audio: errAudio,
      audioMime: errAudio ? 'audio/wav' : null,
    });
  }
});

// Mock analyze endpoint
app.post('/api/analyze', (req, res) => {
  const seed = Math.floor(Math.random() * 100) + 1;
  const gradeA = 68 + (seed % 12);
  const urs = 7 + (seed % 5);
  const damaged = 4 + (seed % 3);
  const rotten = 2 + (seed % 2);
  const sprouted = 1 + (seed % 2);

  const mockResults = {
    status: 'success',
    analysis_id: `batch_${Math.floor(Math.random() * 9000) + 1000}`,
    quality_metrics: {
      gradeA,
      gradeB: 100 - gradeA - urs,
      urs,
      damaged,
      rotten,
      sprouted,
      undersized: Math.max(2, urs - damaged + 1),
      avgSize: 48 + (seed % 8),
      appearance: 86 + (seed % 9),
      confidence: 92 + (seed % 6),
    },
  };

  res.json(mockResults);
});

// Live market rates endpoint
app.get('/api/market-rates', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://mandi-api.onrender.com/v1/prices?commodity=Onion', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    const regions: Array<{ id: string; name: string; market: string; rate: number }> = [];
    const seenDistricts = new Set<string>();
    const priorityDistricts = ['Nashik', 'Pune', 'Indore', 'Bangalore', 'Solapur', 'Ahilyanagar'];

    for (const item of (data.data || [])) {
      const district = item.district || '';
      if (!seenDistricts.has(district)) {
        seenDistricts.add(district);
        regions.push({
          id: district.toLowerCase(),
          name: `${district}, ${item.state || ''}`,
          market: (item.market || '').trim(),
          rate: Math.round(((item.modal_price || 0) / 100) * 10) / 10,
        });
      }
    }

    regions.sort((a, b) => {
      const aName = a.name.split(',')[0];
      const bName = b.name.split(',')[0];
      let aIdx = priorityDistricts.indexOf(aName);
      let bIdx = priorityDistricts.indexOf(bName);
      if (aIdx === -1) aIdx = 999;
      if (bIdx === -1) bIdx = 999;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.localeCompare(b.name);
    });

    res.json({ status: 'success', data: regions });
  } catch {
    const fallback = [
      { id: 'nashik', name: 'Nashik, Maharashtra', market: 'Lasalgaon APMC', rate: 31.5 },
      { id: 'pune', name: 'Pune, Maharashtra', market: 'Pune Market Yard', rate: 29.0 },
      { id: 'indore', name: 'Indore, Madhya Pradesh', market: 'Choithram Mandi', rate: 27.5 },
      { id: 'bengaluru', name: 'Bengaluru, Karnataka', market: 'Yeshwanthpur APMC', rate: 34.0 },
    ];
    res.json({ status: 'error', message: 'Using fallback rates', data: fallback });
  }
});

async function startServer() {
  if (process.env.USE_VITE_MIDDLEWARE === 'true') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OnionGrade Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
