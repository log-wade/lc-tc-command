export const ONBOARDING_STORAGE_KEY = "lc-tc-onboarding-v1-complete";

/** Tour targets that live in the sidebar — open mobile drawer before highlighting */
export const SIDEBAR_TOUR_TARGETS = new Set([
  "start-here",
  "nav-today",
  "nav-review",
  "nav-inbox",
  "nav-files",
]);

/** Pages the tour may highlight or navigate to — leaving these dismisses the tour */
export const TOUR_ROUTES = new Set([
  "/",
  "/reviews",
  "/inbox",
  "/listings",
  "/transactions",
]);

export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector or data-tour id */
  target?: string;
  /** Navigate before highlighting */
  route?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LC/TC Command",
    body: "This is your coordination workspace — built for Texas listing and transaction coordinators. This 2-minute tour shows you where everything lives on day one.",
    placement: "center",
  },
  {
    id: "start-here",
    title: "Start every file here",
    body: "New listing questionnaire or executed contract? Start here. The system creates the file, computes deadlines, and queues the first client email for your review — nothing sends without you.",
    target: "start-here",
    placement: "right",
  },
  {
    id: "nav-today",
    title: "Your Today screen",
    body: "Open this every morning. You'll see what's overdue, due today, and waiting for review — plus a Tuesday reminder when client updates are due by 3 PM CT.",
    target: "nav-today",
    route: "/",
    placement: "right",
  },
  {
    id: "needs-attention",
    title: "Needs attention",
    body: "Deadlines and review items land here first. Overdue dates show in red. Tap anything to open the file or the review queue.",
    target: "needs-attention",
    route: "/",
    placement: "top",
  },
  {
    id: "nav-review",
    title: "Review queue",
    body: "Every email draft and system-generated message waits here. Approve before it sends — that's your human-in-the-loop checkpoint.",
    target: "nav-review",
    placement: "right",
  },
  {
    id: "nav-inbox",
    title: "Inbox triage",
    body: "Paste an incoming email to classify priority (P0–P3). Wire-change language auto-escalates — never act on wire instructions from email alone.",
    target: "nav-inbox",
    placement: "right",
  },
  {
    id: "nav-files",
    title: "Active files",
    body: "All listings and transactions in one place. Click any address to see deadlines, compliance status, and next actions.",
    target: "nav-files",
    placement: "right",
  },
  {
    id: "header-actions",
    title: "Quick actions",
    body: "On mobile or when you're in a hurry, use these header buttons to start intake without opening the sidebar.",
    target: "header-actions",
    placement: "bottom",
  },
  {
    id: "complete",
    title: "You're ready",
    body: "Try a listing intake when you're ready. You can replay this tour anytime from the sidebar. Let's go sell some houses.",
    placement: "center",
  },
];
