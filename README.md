🚀 JobPilot: Your AI-Powered Career Co-Pilot
JobPilot is a next-generation career assistant designed to automate the most tedious parts of the job search. Built with the latest Next.js 15, Google Gemini AI, and Supabase, it helps you analyze job descriptions, track applications via a Kanban board, and generate personalized referrals in seconds.

<img width="1906" height="897" alt="image" src="https://github.com/user-attachments/assets/f448b090-baef-4d02-8fbc-6c00bc5885a6" />


🔗 Live Demo : https://jobpilot-zeta-rust.vercel.app/
✨ Key Features
🤖 AI Job Analyzer: Paste a URL or text to get an instant match score. JobPilot extracts requirements using Puppeteer and matches them against your resume using Gemini AI.
📋 Smart Kanban Board: Manage your application pipeline with a sleek, drag-and-drop interface powered by @hello-pangea/dnd.
✉️ AI Referral Generator: Automatically craft personalized LinkedIn and Email outreach messages tailored to the job and company culture.
🛡️ Intelligent Rate Limiting: Advanced server-side usage tracking using Supabase RLS and IP-based gating to manage AI token consumption.
📱 Ultra-Responsive UI: Built with Tailwind CSS 4 and Framer Motion for a smooth, premium "glassmorphism" experience.
🛠️ Tech Stack
Framework: Next.js 15 (App Router)
AI Engine: Google Generative AI (Gemini 1.5 Pro/Flash)
Database & Auth: Supabase (PostgreSQL, RLS)
State Management: Zustand
Animations: Framer Motion
Styling: Tailwind CSS 4
Extraction: Puppeteer & Cheerio (Web Scraping)
Parsing: PDFjs & Mammoth (Resume Parsing)


💡 How it Works
Upload Resume: Your resume is parsed and stored securely.
Analyze Jobs: Paste a LinkedIn or Indeed URL. JobPilot scrapes the job details and compares them with your profile.
Get Insights: Identify skill gaps, get interview tips, and a "Readiness Score."
Network: Generate a referral request and track your progress on the dashboard.


If you like this project, feel free to ⭐ the repo!
