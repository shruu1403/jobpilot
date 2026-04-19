import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Library",
  description:
    "Upload, organize, and manage multiple resume versions. Analyze and refine your resumes with AI-driven feedback for every application.",
};

export default function ResumesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
