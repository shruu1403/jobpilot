import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://jobpilot.app"),
  title: {
    default: "JobPilot — AI Resume Analyzer & Job Tracker",
    template: "%s | JobPilot",
  },
  description:
    "Optimize your resume with AI, discover high-match roles, track applications on a Kanban board, and generate referral messages — all in one place.",
  keywords: [
    "resume analyzer",
    "AI resume",
    "job tracker",
    "ATS optimization",
    "resume builder",
    "job application tracker",
    "referral generator",
    "career tools",
  ],
  applicationName: "JobPilot",
  authors: [{ name: "JobPilot" }],
  creator: "JobPilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "JobPilot",
    title: "JobPilot — AI Resume Analyzer & Job Tracker",
    description:
      "Optimize your resume with AI, discover high-match roles, track applications, and generate referral messages.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "JobPilot Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobPilot — AI Resume Analyzer & Job Tracker",
    description:
      "Optimize your resume with AI, discover high-match roles, track applications, and generate referral messages.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "JobPilot",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://jobpilot.app",
              description:
                "AI-powered resume analyzer, job tracker, and referral generator for job seekers.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "AI Resume Analysis",
                "ATS Optimization",
                "Job Application Tracking",
                "Referral Message Generator",
                "Cover Letter Generation",
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}