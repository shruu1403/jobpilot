import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: {
    absolute: "JobPilot — AI Resume Analyzer & Job Tracker",
  },
  description:
    "Stop guessing, start getting interviews. Optimize your resume with AI, discover high-match roles, track applications, and generate referral messages.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomeClient />;
}