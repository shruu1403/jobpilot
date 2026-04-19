import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Tracker",
  description:
    "Track your job applications with a visual Kanban board. Manage applied, interview, offer, and rejected stages in one place.",
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
