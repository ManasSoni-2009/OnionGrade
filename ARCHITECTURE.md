# OnionGrade Architecture

## Project Goals
OnionGrade is an AI-powered PWA designed to assess onion quality, identify defects, estimate grading percentages, and generate a digital quality report to reduce human bias and improve transparency in procurement centers. It is designed as a farmer-first, responsive web application that accurately simulates the AI inference flow.

## Tech Stack
- **Frontend Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Custom CSS (optimized for responsive mobile and desktop PWA), Lucide React (Icons)
- **Animations**: GSAP (GreenSock Animation Platform)
- **Routing**: React Router DOM

## File Structure
- `index.html`: Main entry point and PWA metadata
- `package.json`: Dependencies and scripts
- `src/main.tsx`: React application bootstrapper
- `src/App.tsx`: Main application routing and UI components
- `src/styles.css`: Global CSS containing custom PWA and responsive styles
- `src/types.ts`: TypeScript interfaces for data models
- `src/data.ts`: Seed data / mock data logic
- `vite.config.ts`: Vite build configuration

## Data Models / Schema
Though currently functioning without a database, the core entities established in `src/types.ts` are:
- **QualityMetrics**: Holds data about grade percentages, defects, size, appearance, and confidence.
- **PricingEstimate**: Stores calculated market rate, fair price, premium/penalty, and total estimated value.
- **MarketRegion**: Defines a region's market context and baseline rate.
- **CaptureImage**: Represents images uploaded/captured in the UI.
- **LotAssessment**: The central entity representing a batch of onions. It ties together the captured images, region, variety, weight, pricing, and quality metrics, tracking its current report status (`verified` or `draft`).
