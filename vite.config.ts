import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from '@tailwindcss/vite'

function apiPlugin(): Plugin {
  return {
    name: 'oniongrade-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''

        if (url === '/api/voice-assistant' && req.method === 'POST') {
          let bodyStr = ''
          req.on('data', (chunk) => { bodyStr += chunk })
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}')
              const message = (body.message || '').trim()
              if (!message) {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Message required' }))
                return
              }

              let reply = ''
              if (process.env.GEMINI_API_KEY) {
                try {
                  const { GoogleGenAI } = await import('@google/genai')
                  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
                  const aiResponse = await ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: message,
                    config: {
                      systemInstruction: "You are the OnionGrade Voice Assistant, an AI guide for onion farmers. Answer in concise, spoken-friendly language (2 to 4 sentences max). Grade A is premium quality (45-60mm), URS means Under Rejection Standard, sprouted/rotten/undersized onions decrease market value, and photos required are 3 for <500kg, 5 for 500-2000kg, 10 for >2000kg.",
                      temperature: 0.7,
                      maxOutputTokens: 250,
                    }
                  })
                  reply = aiResponse.text?.trim() || ''
                } catch (e) {
                  console.warn('Gemini call failed in vite plugin:', e)
                }
              }

              if (!reply) {
                const q = message.toLowerCase()
                if (q.includes('urs') || q.includes('rejection')) {
                  reply = "URS stands for Under Rejection Standard. These are onions with defects like rot, sprouting, or cuts that fall below commercial grade standards and receive a price deduction."
                } else if (q.includes('photo') || q.includes('image') || q.includes('weight') || q.includes('how many')) {
                  reply = "For lots under 500 kilograms, you need 3 photos. Between 500 and 2000 kilograms, take 5 photos. And for lots over 2000 kilograms, OnionGrade requires 10 distinct photos to ensure fair grading."
                } else if (q.includes('sprout') || q.includes('green')) {
                  reply = "Sprouted onions develop green shoots due to humidity or late harvest. You should separate them immediately to prevent rot from spreading in your storage lot."
                } else if (q.includes('fair price') || q.includes('price') || q.includes('rate')) {
                  reply = "Fair price starts from your local mandi modal rate, adds a premium of up to five rupees per kilo for high Grade A lots, and transparently subtracts penalties for URS defects."
                } else {
                  reply = "OnionGrade uses computer vision to grade your onion lot and eliminate middleman bias. Head to the Assess tab to capture your lot, or check live rates in Market rates."
                }
              }

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({ reply, engine: process.env.GEMINI_API_KEY ? 'gemini-3.8-flash' : 'fallback' }))
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message, reply: "I couldn't process that right now. Please try again." }))
            }
          })
          return
        }

        if (url === '/api/analyze' && req.method === 'POST') {
          const seed = Math.floor(Math.random() * 100) + 1
          const gradeA = 68 + (seed % 12)
          const urs = 7 + (seed % 5)
          const damaged = 4 + (seed % 3)
          const rotten = 2 + (seed % 2)
          const sprouted = 1 + (seed % 2)

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
          }

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(mockResults))
          return
        }

        if (url === '/api/market-rates' && req.method === 'GET') {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 4000)
            const response = await fetch('https://mandi-api.onrender.com/v1/prices?commodity=Onion', {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: controller.signal,
            })
            clearTimeout(timeoutId)

            const data = await response.json()
            const regions: Array<{ id: string; name: string; market: string; rate: number }> = []
            const seenDistricts = new Set<string>()
            const priorityDistricts = ['Nashik', 'Pune', 'Indore', 'Bangalore', 'Solapur', 'Ahilyanagar']

            for (const item of (data.data || [])) {
              const district = item.district || ''
              if (!seenDistricts.has(district)) {
                seenDistricts.add(district)
                regions.push({
                  id: district.toLowerCase(),
                  name: `${district}, ${item.state || ''}`,
                  market: (item.market || '').trim(),
                  rate: Math.round(((item.modal_price || 0) / 100) * 10) / 10,
                })
              }
            }

            regions.sort((a, b) => {
              const aName = a.name.split(',')[0]
              const bName = b.name.split(',')[0]
              let aIdx = priorityDistricts.indexOf(aName)
              let bIdx = priorityDistricts.indexOf(bName)
              if (aIdx === -1) aIdx = 999
              if (bIdx === -1) bIdx = 999
              if (aIdx !== bIdx) return aIdx - bIdx
              return a.name.localeCompare(b.name)
            })

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ status: 'success', data: regions }))
            return
          } catch {
            const fallback = [
              { id: 'nashik', name: 'Nashik, Maharashtra', market: 'Lasalgaon APMC', rate: 31.5 },
              { id: 'pune', name: 'Pune, Maharashtra', market: 'Pune Market Yard', rate: 29.0 },
              { id: 'indore', name: 'Indore, Madhya Pradesh', market: 'Choithram Mandi', rate: 27.5 },
              { id: 'bengaluru', name: 'Bengaluru, Karnataka', market: 'Yeshwanthpur APMC', rate: 34.0 },
            ]
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ status: 'error', message: 'Using fallback rates', data: fallback }))
            return
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
})
