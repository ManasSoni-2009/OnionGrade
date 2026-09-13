<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=40&duration=3000&pause=1000&color=10B981&center=true&vCenter=true&width=800&lines=Welcome+to+OnionGrade+%F0%9F%A7%85;AI-Powered+Onion+Quality+Assessment;Farmer-First+Digital+Grading;Empowering+Procurement+Centers" alt="Typing SVG" />
</div>

<p align="center">
  <strong>Revolutionizing onion procurement with AI-driven quality assessment and transparent grading.</strong>
</p>

<div align="center">
  <img src="https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white" alt="GSAP" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</div>

<br />

---

## 🌟 Overview

**OnionGrade** is a cutting-edge, AI-powered Progressive Web App (PWA) engineered to transform how onion quality is assessed. By combining computer vision with sophisticated AI models, OnionGrade identifies defects, estimates grading percentages accurately, and generates comprehensive digital quality reports.

Designed with a **farmer-first** approach, it eliminates human bias and brings unprecedented transparency to procurement centers, ensuring fair pricing and rapid assessments.

---

## ✨ Key Features

- 🤖 **AI-Powered Assessment**: State-of-the-art AI inference flow for precision grading.
- 📱 **PWA Ready**: Seamless mobile-first experience, responsive across all devices.
- 🎨 **Sleek Animations**: Butter-smooth UI transitions powered by **GSAP** and 3D elements via **Three.js**.
- 📊 **Digital Quality Reports**: Instant, shareable, and verified quality breakdown.
- ⚖️ **Fair Pricing Estimation**: Calculates market rate, fair price, and total value dynamically based on region.
- ⚡ **Lightning Fast**: Built on Vite and React 18 for peak performance.

---

## 🏗️ Architecture & Tech Stack

<details>
<summary><b>Click to expand Architecture Details</b></summary>

### Core Entities
- **`QualityMetrics`**: Grade percentages, defects, size, appearance, and confidence scores.
- **`PricingEstimate`**: Dynamic calculation of fair price, premiums, and penalties.
- **`LotAssessment`**: The heart of the app—binds captured images, region context, and quality metrics to generate a verified or draft report.

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Custom CSS optimized for PWAs
- **Animations**: GSAP (GreenSock)
- **Routing**: React Router DOM
- **Icons**: Lucide React / Phosphor Icons

### Backend & AI
- **Runtime**: Node.js & Express
- **AI Integration**: `@google/genai` (Google Gemini API)

</details>

---

## 🚀 Getting Started

Ready to run OnionGrade locally? Follow these simple steps.

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**, **yarn**, or **bun**

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/your-username/oniongrade.git
   cd oniongrade
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to `http://localhost:5173` to see the magic happen! ✨

---

## 🤝 Contributing

We welcome contributions to make OnionGrade even better! Feel free to fork the repository, create a new branch, and submit a pull request.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=10B981&height=200&section=footer&text=Built%20with%20%E2%9D%A4%EF%B8%8F%20for%20Farmers&fontSize=24&fontAlignY=70" alt="Footer Waving Animation" width="100%"/>
</div>
