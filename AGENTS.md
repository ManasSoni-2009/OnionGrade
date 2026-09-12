# Codex / Agent Knowledge & Instructions

## Collaboration & Planning Modes
- The original Codex workflow utilized a "Plan Mode" to ground decisions and draft detailed implementation plans before execution.
- Decisions were typically formulated in `<proposed_plan>` blocks to ensure alignment before generating files.

## Coding Conventions & Tech Preferences
- **GSAP for Animations**: Heavy preference for GSAP (GreenSock) for route/card entrances, progress analysis, number counters, chart reveals, and transitions. Respect `prefers-reduced-motion` settings.
- **Styling**: Extensive use of custom CSS in `styles.css`. The UI adapts a dark sidebar, soft-gray content area, rounded data cards, and lime accents (`#d9f95a`). Tailwind CSS is NOT heavily featured despite the initial plan, relying rather on meticulously tuned custom CSS.
- **Mocking Data**: The app simulates AI analysis, OTP, camera inputs, and geolocation using strictly frontend state (in-browser). Deterministic mock data is used for region and quality choices.
- **Responsive Layout**: Adheres to mobile-first/PWA principles with large tap targets, distinct desktop (sidebar) and mobile (bottom navigation) states, and optimized print layouts for PDF generation of reports.
- **Icons**: Lucide-react for scalable vector graphics.

## Project Scope
- Focus exclusively on the frontend workflow for farmers (onboarding -> lot data -> capture/upload -> analysis -> report -> QR/share/print) and a compact dealer-facing report-verification page.
- The UI should closely match the reference design (smooth UI, widgets, cards), converting health-focused metrics into onion-specific grading parameters.
