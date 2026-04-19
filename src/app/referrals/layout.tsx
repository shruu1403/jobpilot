import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Generator",
  description:
    "Generate personalized referral and outreach messages with AI. Craft professional LinkedIn and email messages that get replies.",
};

export default function ReferralsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
