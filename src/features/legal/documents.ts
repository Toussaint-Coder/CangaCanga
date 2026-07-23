/**
 * In-app legal documents for store compliance.
 * Host the same content at a public URL for Play Console / App Store Connect.
 */

export type LegalDocId =
  | "privacy"
  | "terms"
  | "community"
  | "safety"
  | "data";

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  id: LegalDocId;
  titleKey: string;
  updated: string;
  sections: LegalSection[];
};

const PRIVACY: LegalDocument = {
  id: "privacy",
  titleKey: "legal.privacy.title",
  updated: "2026-07-22",
  sections: [
    {
      heading: "Who we are",
      body: "CangaCanga (“we”, “us”) is a community ride-sharing app for Burundi. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and your rights.",
    },
    {
      heading: "Data we collect",
      body: "Account data: full name, phone number, profile photo, optional vehicle plate. Location data: approximate or precise location when you grant permission, including last known location used to show nearby rides and send nearby-ride alerts. Ride data: pickup and destination, times, seats, price, notes, vehicle photo. Device data: push notification token and platform (iOS/Android). Usage data: reservations, ratings, and in-app notifications related to your trips.",
    },
    {
      heading: "Why we collect it",
      body: "To create and secure your account, match riders and drivers, show maps and nearby rides, send reservation and safety-related notifications, display profiles to other users when you participate in a ride, improve reliability, and comply with legal obligations.",
    },
    {
      heading: "Sharing",
      body: "We share limited profile and ride details with other users only as needed to complete a trip (for example driver name, photo, phone, plate, and route labels). We use infrastructure providers (hosting, maps, push delivery, object storage) as processors under contract. We do not sell your personal data.",
    },
    {
      heading: "Retention",
      body: "We keep your account data while your account is active. After account deletion we remove or anonymize personal data that is no longer needed, except information we must retain for legal, safety, fraud-prevention, or accounting reasons (for example completed trip records that may be required for dispute resolution).",
    },
    {
      heading: "Security",
      body: "Data in transit is protected with HTTPS/TLS. Access to production systems is restricted. No method of transmission is 100% secure; please use a strong password and protect your device.",
    },
    {
      heading: "Your rights",
      body: "You may access and update your profile in the app, export a copy of your data, withdraw location/notification/camera permissions in system settings, and delete your account in Profile → Delete account. Contact support if you need help exercising these rights.",
    },
    {
      heading: "Children",
      body: "CangaCanga is not directed at children under 13. Do not create an account if you are under 13.",
    },
    {
      heading: "Contact",
      body: "For privacy questions, contact us at privacy@cangacanga.app (replace with your real support email before store submission).",
    },
  ],
};

const TERMS: LegalDocument = {
  id: "terms",
  titleKey: "legal.terms.title",
  updated: "2026-07-22",
  sections: [
    {
      heading: "Agreement",
      body: "By creating an account or using CangaCanga you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the app.",
    },
    {
      heading: "The service",
      body: "CangaCanga helps people in Burundi discover and share rides. We are a technology platform. We are not a taxi company, insurer, or employer of drivers or passengers.",
    },
    {
      heading: "Eligibility",
      body: "You must be at least 13 years old (or the minimum digital consent age in your jurisdiction) and able to form a binding contract. Drivers must hold any licenses and insurance required by local law.",
    },
    {
      heading: "Your responsibilities",
      body: "Provide accurate information. Treat other users with respect. Do not use the app for illegal activity, harassment, fraud, or unsafe driving. You are responsible for your own safety decisions when meeting, traveling with, or transporting others.",
    },
    {
      heading: "Payments",
      body: "Any price shown in the app is an agreement between users unless we state otherwise. CangaCanga may not process payments for every trip; settle fares as agreed and required by local law.",
    },
    {
      heading: "Content and accounts",
      body: "You grant us a license to host and display your profile and ride content as needed to operate the service. We may suspend or terminate accounts that violate these terms or create safety risks.",
    },
    {
      heading: "Disclaimers",
      body: "The app is provided “as is”. To the fullest extent permitted by law we disclaim warranties of uninterrupted availability, fitness for a particular purpose, and non-infringement. Travel involves risks; verify identity and vehicle details yourself.",
    },
    {
      heading: "Limitation of liability",
      body: "To the fullest extent permitted by law, CangaCanga is not liable for indirect, incidental, or consequential damages arising from rides arranged through the app, including accidents, delays, or disputes between users.",
    },
    {
      heading: "Changes",
      body: "We may update these terms. Continued use after changes means you accept the updated terms. Material changes will be highlighted in the app when practical.",
    },
  ],
};

const COMMUNITY: LegalDocument = {
  id: "community",
  titleKey: "legal.community.title",
  updated: "2026-07-22",
  sections: [
    {
      heading: "Be respectful",
      body: "No hate speech, harassment, discrimination, threats, or sexual misconduct. Communicate clearly about pickup times and locations.",
    },
    {
      heading: "Be honest",
      body: "Use your real name and accurate photos. Do not create fake rides, spam listings, or misrepresent seats, price, or vehicle details.",
    },
    {
      heading: "Be safe",
      body: "Meet in public places when possible. Share your trip details with a trusted contact. Do not pressure anyone to travel against their judgment.",
    },
    {
      heading: "Enforcement",
      body: "Violations may result in warnings, content removal, or account suspension/deletion. Report problems from the ride or profile screens when available, or contact support.",
    },
  ],
};

const SAFETY: LegalDocument = {
  id: "safety",
  titleKey: "legal.safety.title",
  updated: "2026-07-22",
  sections: [
    {
      heading: "Before you go",
      body: "Confirm the driver/passenger name, phone number, and vehicle plate shown in the app. Wait in a well-lit public area. Tell a friend where you are going.",
    },
    {
      heading: "During the trip",
      body: "Wear a seatbelt. Do not accept unsafe driving. You may cancel or leave if you feel unsafe. Call local emergency services if you are in danger.",
    },
    {
      heading: "After the trip",
      body: "Leave honest ratings. Report harassment, scams, or dangerous behavior to support so we can investigate.",
    },
    {
      heading: "Our role",
      body: "We provide tools to connect users and notify them about reservations. We do not continuously track live trips. Users remain responsible for their conduct and compliance with Burundi traffic and safety laws.",
    },
  ],
};

const DATA: LegalDocument = {
  id: "data",
  titleKey: "legal.data.title",
  updated: "2026-07-22",
  sections: [
    {
      heading: "Overview",
      body: "This page summarizes data collection for Google Play Data Safety and Apple Privacy labels. Details are in the Privacy Policy.",
    },
    {
      heading: "Collected",
      body: "Name, phone number, profile photo, vehicle plate, location (precise/approximate when permitted), ride routes and schedules, reservation status, ratings, device push token, app language/theme preferences stored on device.",
    },
    {
      heading: "Purpose",
      body: "App functionality, account management, fraud prevention, notifications, and personalization of nearby rides.",
    },
    {
      heading: "Sharing",
      body: "Shared with other users as needed for a trip. Processed by infrastructure providers. Not sold.",
    },
    {
      heading: "Security & deletion",
      body: "Encrypted in transit (HTTPS). You can request deletion via Delete account. Some trip records may be retained where required by law or for safety investigations.",
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDocument> = {
  privacy: PRIVACY,
  terms: TERMS,
  community: COMMUNITY,
  safety: SAFETY,
  data: DATA,
};

export const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCS) as LegalDocId[];
