export type ReferralTone = "Professional" | "Friendly" | "Confident" | "Casual";

export type ConnectionContext =
  | "Cold outreach"
  | "Same college"
  | "Mutual connection"
  | "Recruiter"
  | "Employee";

export type MessageLength = "Short" | "Medium" | "Detailed";

export type CallToAction =
  | "Ask for referral"
  | "Ask for quick chat"
  | "Ask for guidance";

export interface ReferralFormValues {
  jobRole: string;
  company: string;
  tone: ReferralTone;
  recipientName: string;
  background: string;
  keySkills: string;
  whyCompany: string;
  connectionContext: ConnectionContext;
  jobLink: string;
  portfolioLink: string;
  messageLength: MessageLength;
  callToAction: CallToAction;
}

export interface ReferralResponse {
  linkedinMessage: string;
  email: {
    subject: string;
    body: string;
  };
}
