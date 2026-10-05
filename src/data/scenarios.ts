import type { Scenario } from "../types";

// All scenarios are fully synthetic and used strictly for illustrative purposes.
// Phone numbers, names, and organizations are fictional.

export const SCENARIOS: Scenario[] = [
  {
    id: "dental-appointment",
    title: "Dental Appointment Confirmation",
    shortLabel: "Dental Office",
    callerName: "Sarah",
    callerNumber: "(416) 555-0176",
    recognized: false,
    approximateLocation: "Toronto, ON (approximate)",
    category: "appointment",
    finalDisposition: "ask",
    decisionExplanation:
      "The caller says they are from the dental office and need to confirm tomorrow's appointment. The call appears routine, but the number is not recognized.",
    subscriberNotification:
      "Lakeside Dental is calling from an unfamiliar number to confirm an appointment tomorrow at 2:30. Would you like to take the call?",
    steps: [
      {
        callerLine:
          "Hi, this is Sarah from Lakeside Dental. I'm calling to confirm Mike's appointment tomorrow at 2:30.",
        understanding: {
          callerName: "Sarah",
          organization: "Lakeside Dental",
          purpose: "Confirm tomorrow's appointment",
          urgency: "low",
          callCategory: "appointment",
          identityConfidence: "medium",
        },
      },
      {
        doorpersonLine: "Thank you, Sarah. Is any action required from Mike today?",
      },
      {
        callerLine: "We just need confirmation that he will attend.",
        understanding: {
          requestedAction: "Confirm attendance",
          riskLevel: "low",
          recommendedOutcome: "ask",
        },
      },
    ],
    presenterNotes: {
      callerWants: "A quick confirmation that Mike will attend tomorrow's appointment.",
      doorpersonAsks: "Whether any action is required from Mike today.",
      relevantPreferences: "Appointments are set to 'Notify Me', but the ask flow is shown here to demonstrate subscriber control.",
      whyThisOutcome:
        "Routine, low-risk purpose from an unrecognized number — Doorperson AI asks Mike rather than connecting or declining automatically.",
      whatIsSimulated: "The appointment, dental office, and confirmation action are all synthetic.",
      whatRequiresProduction: "Real caller ID reputation and an authorized calendar integration.",
    },
  },
  {
    id: "school-priority",
    title: "School Priority Call",
    shortLabel: "School Office",
    callerName: "Riverside Public School",
    callerNumber: "(416) 555-0142",
    recognized: true,
    category: "school",
    finalDisposition: "ask",
    decisionExplanation:
      "The caller says the matter concerns one of your children. They described it as important but not an emergency.",
    subscriberNotification:
      "Priority call from a school office. The caller says the matter concerns one of your children. They described it as important but not an emergency.",
    steps: [
      {
        callerLine:
          "Hello, this is the school office. We are trying to reach Mike regarding one of his children. It is important, but not an emergency.",
        understanding: {
          organization: "Riverside Public School",
          purpose: "A matter concerning one of Mike's children",
          urgency: "medium",
          callCategory: "school",
          identityConfidence: "high",
          riskLevel: "low",
          recommendedOutcome: "ask",
        },
        systemNote: "Call category recognized as School — marked high priority. Unnecessary questions are skipped.",
      },
    ],
    presenterNotes: {
      callerWants: "To reach Mike about a non-emergency matter involving his child.",
      doorpersonAsks: "Nothing further — priority categories skip extra questioning.",
      relevantPreferences: "Schools are set to 'Ask Me' with high-priority handling.",
      whyThisOutcome: "Family/school calls are treated as high priority and routed to Mike immediately for a decision.",
      whatIsSimulated: "The school name and child reference are synthetic; no real student data is used.",
      whatRequiresProduction: "Verified caller ID for school district phone numbers.",
    },
  },
  {
    id: "delivery-driver",
    title: "Delivery Driver",
    shortLabel: "Delivery Driver",
    callerName: "Unknown Driver",
    callerNumber: "(647) 555-0188",
    recognized: false,
    category: "delivery",
    finalDisposition: "notify",
    decisionExplanation:
      "A delivery driver needs help locating the entrance. Doorperson AI does not disclose whether Mike is home and offers safe, generic delivery guidance.",
    subscriberNotification: "Delivery driver needs help locating the entrance.",
    steps: [
      {
        callerLine: "I have a delivery for Mike, but I need help finding the entrance.",
        understanding: {
          purpose: "Needs help locating the delivery entrance",
          urgency: "low",
          callCategory: "delivery",
          riskLevel: "low",
          recommendedOutcome: "notify",
        },
      },
      {
        doorpersonLine:
          "Thank you for letting me know. I can share general delivery instructions, but I'm not able to confirm whether anyone is home right now.",
      },
    ],
    presenterNotes: {
      callerWants: "Directions to the entrance to complete a delivery.",
      doorpersonAsks: "Nothing further — Doorperson AI offers safe generic guidance.",
      relevantPreferences: "Deliveries are set to 'Notify Me' so Mike is not interrupted.",
      whyThisOutcome: "Low-risk, routine request handled with a silent notification instead of an interruption.",
      whatIsSimulated: "The delivery address, access instructions, and driver identity are synthetic.",
      whatRequiresProduction: "Integration with a real delivery/courier verification service.",
    },
  },
  {
    id: "sales-call",
    title: "Unsolicited Sales Call",
    shortLabel: "Sales Call",
    callerName: "Unknown Caller",
    callerNumber: "(905) 555-0122",
    recognized: false,
    category: "sales",
    finalDisposition: "decline",
    decisionExplanation: "An unsolicited sales call was declined. No action is required.",
    subscriberNotification: "An unsolicited sales call was declined. No action is required.",
    steps: [
      {
        callerLine: "Hi, we are offering homeowners a free assessment and would like to book a visit.",
        understanding: {
          purpose: "Unsolicited home-assessment sales offer",
          urgency: "low",
          callCategory: "sales",
          riskLevel: "low",
          recommendedOutcome: "decline",
        },
      },
      {
        doorpersonLine:
          "Thank you. Mike is not accepting unsolicited sales calls. Please remove this number from your calling list.",
      },
    ],
    presenterNotes: {
      callerWants: "To book an unsolicited sales visit.",
      doorpersonAsks: "Nothing further — sales calls are declined per preference.",
      relevantPreferences: "Sales calls are set to 'Automatically Decline'.",
      whyThisOutcome: "Matches the subscriber's preference to automatically decline unsolicited sales calls.",
      whatIsSimulated: "The caller, company, and offer are synthetic.",
      whatRequiresProduction: "Real do-not-call list integration.",
    },
  },
  {
    id: "refuses-identify",
    title: "Caller Refuses to Identify",
    shortLabel: "No Identification",
    callerName: "Unknown Caller",
    callerNumber: "(437) 555-0104",
    recognized: false,
    category: "unknown",
    finalDisposition: "voicemail",
    decisionExplanation: "An unknown caller declined to provide a name or reason for calling.",
    subscriberNotification: "An unknown caller declined to provide a name or reason and was sent to voicemail.",
    steps: [
      {
        callerLine: "I just need to speak to Mike directly.",
        understanding: { callCategory: "unknown", urgency: "low", identityConfidence: "low" },
      },
      {
        doorpersonLine: "Before I can connect the call, I need your name and a brief reason for calling.",
      },
      {
        callerLine: "It's personal. I'd rather not say.",
        understanding: { riskLevel: "moderate", recommendedOutcome: "voicemail" },
        riskSignals: ["Caller refuses reasonable identification questions"],
      },
      {
        doorpersonLine: "I'm unable to connect the call without that information. You may leave a voicemail if you wish.",
      },
    ],
    presenterNotes: {
      callerWants: "To speak to Mike without identifying themselves.",
      doorpersonAsks: "Name and reason for calling, twice.",
      relevantPreferences: "Unknown callers are set to 'Ask Me', but identity refusal routes to voicemail instead.",
      whyThisOutcome: "Refusing reasonable identification questions is treated as a mild risk signal and routed to voicemail.",
      whatIsSimulated: "The caller and refusal dialogue are scripted for demonstration.",
      whatRequiresProduction: "Nothing additional — this logic can run as described.",
    },
  },
  {
    id: "rogers-impersonation",
    title: "Potential Rogers Impersonation",
    shortLabel: "Scam: Rogers Impersonator",
    callerName: "Unknown Caller",
    callerNumber: "(778) 555-0119",
    recognized: false,
    category: "suspicious",
    finalDisposition: "block",
    decisionExplanation:
      "A caller claiming to represent Rogers requested a verification code and threatened immediate account suspension. Doorperson AI ended the call.",
    subscriberNotification:
      "Potential scam call blocked. A caller claiming to represent Rogers requested a verification code and threatened immediate account suspension. Doorperson AI ended the call.",
    steps: [
      {
        callerLine: "This is Rogers Security. Your account is about to be suspended. I need your verification code immediately.",
        understanding: {
          organization: "Claimed: Rogers Security (unverified)",
          purpose: "Requesting a verification code",
          urgency: "high",
          callCategory: "suspicious",
          riskLevel: "high",
          identityConfidence: "low",
          recommendedOutcome: "block",
        },
        riskSignals: [
          "Unsolicited call",
          "Threat of immediate service interruption",
          "Request for an authentication code",
          "Pressure to act quickly",
          "Unverified organizational identity",
        ],
      },
      {
        doorpersonLine: "I cannot assist with requests for passwords, PINs, or verification codes. This call will now end.",
        systemNote: "Call ended and blocked. Subscriber alerted.",
      },
    ],
    presenterNotes: {
      callerWants: "To extract a verification code using urgency and impersonation.",
      doorpersonAsks: "Nothing — the request for a verification code immediately ends the call.",
      relevantPreferences: "Suspicious calls are set to 'Block and Alert'.",
      whyThisOutcome: "Multiple high-risk signals (urgency, credential request, unverified identity) trigger immediate termination.",
      whatIsSimulated: "The impersonation script and phone number are synthetic.",
      whatRequiresProduction: "Verified carrier-level caller authentication (e.g., STIR/SHAKEN) and fraud-intelligence feeds.",
    },
  },
  {
    id: "family-emergency-scam",
    title: "Family Emergency Payment Scam",
    shortLabel: "Scam: Family Emergency",
    callerName: "Unknown Caller",
    callerNumber: "(581) 555-0167",
    recognized: false,
    category: "suspicious",
    finalDisposition: "block",
    decisionExplanation:
      "The caller used urgency, secrecy, and a payment request involving a vague family emergency. Doorperson AI ended the call and recommended independent verification.",
    subscriberNotification:
      "A caller described a family emergency requiring an immediate money transfer and asked for secrecy. Contact the family member using a known number before taking any action.",
    steps: [
      {
        callerLine:
          "Mike, this is urgent. A member of your family is in trouble, and money needs to be transferred immediately. Please do not call anyone else.",
        understanding: {
          purpose: "Urgent payment request tied to a vague family emergency",
          urgency: "high",
          callCategory: "suspicious",
          riskLevel: "high",
          identityConfidence: "low",
          recommendedOutcome: "block",
        },
        riskSignals: [
          "Emotional pressure",
          "Urgent payment request",
          "Request for secrecy",
          "Vague identity",
          "Discouragement from independent verification",
        ],
      },
      {
        doorpersonLine:
          "I cannot assist with payment requests or provide personal information. Mike will be advised to verify this independently.",
        systemNote: "Call ended and blocked. Subscriber alerted with independent-verification guidance.",
      },
    ],
    presenterNotes: {
      callerWants: "To pressure a payment using emotional manipulation and urgency.",
      doorpersonAsks: "Nothing — family names and relationships are never confirmed to an unverified caller.",
      relevantPreferences: "Suspicious calls are set to 'Block and Alert'.",
      whyThisOutcome: "Emotional manipulation plus a payment request and secrecy request are strong combined risk signals.",
      whatIsSimulated: "No real family member or payment details are referenced or exposed.",
      whatRequiresProduction: "Integration with verified contact/caller reputation services.",
    },
  },
  {
    id: "recognized-family",
    title: "Recognized Family Member",
    shortLabel: "Family (Recognized)",
    callerName: "Alex",
    callerNumber: "(416) 555-0118",
    recognized: true,
    category: "family",
    finalDisposition: "connect",
    decisionExplanation: "The caller is a recognized family member on the always-allow list.",
    subscriberNotification: "Connecting call from Alex.",
    steps: [
      {
        callerLine: "Hey, it's me — just checking if you're free to talk.",
        understanding: {
          callerName: "Alex",
          purpose: "Casual check-in",
          urgency: "low",
          callCategory: "family",
          identityConfidence: "high",
          riskLevel: "low",
          recommendedOutcome: "connect",
        },
      },
      {
        systemNote: "Recognized contact on the always-allow list. Call connected immediately — no screening needed.",
      },
    ],
    presenterNotes: {
      callerWants: "A normal conversation with Mike.",
      doorpersonAsks: "Nothing — recognized family members are never screened.",
      relevantPreferences: "'Always allow favourites' and the Family call-type rule are both set to connect.",
      whyThisOutcome: "Recognized, trusted contact; Doorperson AI stays out of the way entirely.",
      whatIsSimulated: "The contact and relationship are synthetic.",
      whatRequiresProduction: "Access to a real, permissioned contacts list.",
    },
  },
  {
    id: "healthcare-callback",
    title: "Healthcare Callback",
    shortLabel: "Healthcare Office",
    callerName: "Dr. Chen's Office",
    callerNumber: "(416) 555-0199",
    recognized: true,
    category: "healthcare",
    finalDisposition: "ask",
    decisionExplanation: "A recognized healthcare office is calling with test results guidance. Mike is asked whether to take the call.",
    subscriberNotification:
      "Dr. Chen's Office is calling with guidance about recent test results. Would you like to take the call?",
    steps: [
      {
        callerLine:
          "Hello, this is Dr. Chen's office calling to go over some recent test results with Mike.",
        understanding: {
          organization: "Dr. Chen's Office",
          purpose: "Discuss recent test results",
          urgency: "medium",
          callCategory: "healthcare",
          identityConfidence: "high",
          riskLevel: "low",
          recommendedOutcome: "ask",
        },
      },
      {
        doorpersonLine: "Thank you. I'll let Mike know right away so he can decide how he'd like to proceed.",
      },
    ],
    presenterNotes: {
      callerWants: "To discuss test results directly with Mike.",
      doorpersonAsks: "Nothing further — healthcare matters are not probed for medical detail.",
      relevantPreferences: "Healthcare is set to 'Ask Me' to respect sensitivity and give Mike control.",
      whyThisOutcome: "Medically sensitive topics are routed to the subscriber rather than summarized by the assistant.",
      whatIsSimulated: "The clinic and test-result reference are synthetic; no real medical data is used.",
      whatRequiresProduction: "Verified healthcare-provider caller ID.",
    },
  },
  {
    id: "survey-call",
    title: "Survey Caller",
    shortLabel: "Survey Call",
    callerName: "Unknown Caller",
    callerNumber: "(226) 555-0143",
    recognized: false,
    category: "survey",
    finalDisposition: "decline",
    decisionExplanation: "An unsolicited survey call was declined per subscriber preference.",
    subscriberNotification: "An unsolicited survey call was declined. No action is required.",
    steps: [
      {
        callerLine: "Hi, do you have a few minutes for a short consumer opinion survey?",
        understanding: {
          purpose: "Unsolicited consumer survey",
          urgency: "low",
          callCategory: "survey",
          riskLevel: "low",
          recommendedOutcome: "decline",
        },
      },
      {
        doorpersonLine: "Thank you, but Mike is not participating in unsolicited surveys at this time.",
      },
    ],
    presenterNotes: {
      callerWants: "A few minutes of Mike's time for a survey.",
      doorpersonAsks: "Nothing further — surveys are declined per preference.",
      relevantPreferences: "Surveys are set to 'Automatically Decline'.",
      whyThisOutcome: "Low-value, unsolicited request matching an automatic-decline preference.",
      whatIsSimulated: "The survey topic and caller are synthetic.",
      whatRequiresProduction: "None — this flow is fully demonstrable as scripted.",
    },
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
