import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Analyzer",
  description:
    "Analyze your resume against job descriptions with AI. Get match scores, skill gap analysis, ATS optimization, and tailored cover letters.",
};

export default function AnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
