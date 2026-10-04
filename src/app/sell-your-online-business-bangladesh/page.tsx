import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Bitcoin,
  Boxes,
  Calendar,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Compass,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  FileWarning,
  Gamepad2,
  Globe,
  Handshake,
  HelpCircle,
  IdCard,
  Info,
  Landmark,
  Layers,
  Link as LinkIcon,
  Lock,
  Mail,
  MessagesSquare,
  Network,
  Package,
  PlaySquare,
  Repeat,
  Rocket as RocketGlyph,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Share2,
  Smartphone,
  Sparkles,
  TrendingUp,
  Unlock,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Container from "@/components/ui/Container";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import TrackedCta, { ArticleViewTracker } from "./CtaTracking";

// Oct 4, 2026 (fourth revision): the third revision (same day) rebuilt this
// page to match a visual mockup, but trimmed its text down to the mockup's
// own placeholder-length copy in the process. That mockup was for layout
// and component styling only - this revision restores and expands the
// page's full educational depth (the seller-education content this page
// carried before, plus the new Bangladesh-specific challenge/solution
// framing), while keeping this revision's visual system (icon-badge cards,
// the dark Transfer Room section, the "Durqo solution" callouts). Every
// factual claim is still checked against the live codebase, not assumed:
//   - Seller Success Fee tiers (10% / 7% / 5%) - src/lib/fees.ts.
//   - BDT payout methods/limits - PAYOUT_METHODS in
//     dashboard/seller/earnings/actions.ts; bKash/Nagad/Rocket each carry an
//     independent ৳50,000/day, ৳300,000/month cap (supabase/migrations/032,
//     033); Bank Transfer/PayPal/Wise have none. Same figures already on
//     /payments and /seller-payouts.
//   - KYC - Passport, National ID, Driving License and Birth Certificate are
//     the four document options in dashboard/seller/verification/page.tsx,
//     all equal standing. KYC is enforced before a first withdrawal at the
//     database level, not just in copy. Review time ~1-2 business days
//     (verification page copy); payout processing 3-5 business days
//     (/payments, /seller-payouts, the earnings dashboard).
//   - No formal offer/counter-offer feature exists anywhere in the
//     checkout/listing code - Durqo is direct-purchase-at-listed-price.
//     Nothing on this page describes negotiating a price.
//   - Only Escrow.com is ever called an escrow provider (src/lib/escrow.ts,
//     api/escrow/init); Stripe/SSLCommerz funds are held by Durqo itself
//     until the buyer approves the transfer (matches /after-you-pay).
//   - Transfer Room - real action labels, the 7-day inspection window from
//     the first item marked Received, and "opens only once payment is
//     confirmed" all come from /transfer-room's own copy and the
//     asset-transfer-room logic.
//   - The 16 category tiles are the real CATEGORIES entries in
//     src/lib/categories.ts.
//   - Every internal link below is a real route in src/app.
// No specific SDE multiple ranges are published (only that multiples are
// commonly referenced, never authoritative), and no guarantee of a buyer, a
// price, a timeframe, or a scam-free transaction is made anywhere on this
// page.
const META_TITLE = "How to Sell an Online Business from Bangladesh | Durqo";
const META_DESCRIPTION =
  "Learn how to sell a website or digital business from Bangladesh, reach buyers worldwide, transfer assets securely and receive eligible sale proceeds in BDT.";
const OG_TITLE = "How to Sell an Online Business from Bangladesh";
const OG_DESCRIPTION =
  "A practical guide to preparing, listing, transferring and selling your digital business through Durqo—with international buyer reach and supported BDT payouts.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: "https://www.durqo.com/sell-your-online-business-bangladesh",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: { canonical: "https://www.durqo.com/sell-your-online-business-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/sell-your-online-business-bangladesh";
const PAGE_TITLE = "How to Sell an Online Business from Bangladesh";
const PUBLISHED_DATE = "2026-09-27";
const MODIFIED_DATE = "2026-10-04";

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
    { "@type": "ListItem", position: 2, name: "Sell Your Online Business from Bangladesh", item: PAGE_URL },
  ],
};

const DURQO_ORG = { "@type": "Organization", name: "Durqo Marketplace Team", url: "https://www.durqo.com" };

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: META_DESCRIPTION,
  author: DURQO_ORG,
  publisher: DURQO_ORG,
  datePublished: PUBLISHED_DATE,
  dateModified: MODIFIED_DATE,
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
  url: PAGE_URL,
};

// Plain-text mirror of every question answered in FAQ_GROUPS below, for the
// FAQPage structured-data block (JSON-LD can't hold JSX). Keep both in sync.
const FAQ_PAIRS: { q: string; a: string }[] = [
  {
    q: "Can I sell a website from Bangladesh to an international buyer?",
    a: "Yes. Once a listing is reviewed and published, it can be discovered by buyers browsing Durqo from Bangladesh or elsewhere. Being listed does not guarantee a specific buyer, price or timeframe.",
  },
  {
    q: "What types of digital businesses can I sell?",
    a: "Websites, e-commerce stores, SaaS products, AI apps and tools, Android and iOS apps, YouTube channels, social media accounts, domains, plugins, themes and extensions, Amazon stores and KDP businesses, service businesses, digital agencies, games, newsletters, startup businesses, and crypto or blockchain projects.",
  },
  {
    q: "Does my business need to generate revenue to be listed?",
    a: "Follow the category and information requirements shown when you create a listing. If a business does not yet generate revenue, explain its assets, audience, product and growth stage clearly so buyers can still evaluate it.",
  },
  {
    q: "Is it free to create a listing?",
    a: "Yes. There is no upfront listing fee and no monthly subscription. Durqo deducts a success fee only once your business actually sells.",
  },
  {
    q: "How much does Durqo charge when my business sells?",
    a: "A tiered success fee applied to the full final sale price: 10% under $50,000, 7% from $50,000 to $250,000, and 5% above $250,000.",
  },
  {
    q: "Will my listing be visible to international buyers?",
    a: "Yes. Once published, a listing is visible to buyers browsing Durqo from any country, alongside buyers in Bangladesh. Visibility does not guarantee buyer interest.",
  },
  {
    q: "Can buyers submit offers I can negotiate?",
    a: "Durqo currently uses a direct-purchase model rather than a formal offer-and-counter-offer system. A buyer can message you with questions before deciding whether to purchase at your listed asking price.",
  },
  {
    q: "Can buyers message me before purchasing?",
    a: "Yes. A buyer can ask questions about the business before deciding to purchase. Avoid sending passwords, identity documents or financial-account credentials through ordinary messages.",
  },
  {
    q: "What happens during listing review?",
    a: "Durqo checks a submitted listing for completeness, internal consistency and compliance with current listing requirements before it is published, and may request corrections or additional information first.",
  },
  {
    q: "What financial information should I provide?",
    a: "Accurate, supportable revenue, profit, expense and traffic information. Do not present figures you cannot reasonably support if asked.",
  },
  {
    q: "How is an asking price calculated?",
    a: "Durqo does not calculate your asking price for you. Base it on your actual revenue, profit, growth, risk, transferable assets and the free valuation tool's estimate, which is a reference, not a guaranteed sale price.",
  },
  {
    q: "What does due diligence involve?",
    a: "A buyer may review relevant financial, traffic, operational, ownership and asset information before completing a purchase. Share only information that is accurate, relevant and lawful to disclose.",
  },
  {
    q: "When is a sale payment confirmed?",
    a: "Once the buyer's payment has actually cleared through Stripe, SSLCommerz or Escrow.com and Durqo's systems mark the order as paid - not simply because a buyer says they have paid.",
  },
  {
    q: "When does the Transfer Room become available?",
    a: "Only after the required payment has been received and verified. A partial payment does not unlock the Transfer Room.",
  },
  {
    q: "How long does the buyer get to inspect delivered assets?",
    a: "A 7-day inspection window that starts from the first item marked Received, during which the buyer can approve the transfer or report an issue.",
  },
  {
    q: "What if an asset is missing or doesn't match the listing?",
    a: "The buyer can report an issue instead of approving. Nothing is released automatically - your payout stays on hold while Durqo reviews the available evidence.",
  },
  {
    q: "What happens if the buyer reports an issue?",
    a: "Your payout remains on hold while Durqo reviews the available transaction records and evidence, and both sides may be asked for more information. Not every dispute is decided in the seller's favor.",
  },
  {
    q: "How can I receive my sale proceeds in Bangladesh?",
    a: "Once the buyer approves the completed transfer and any required review is finished, eligible earnings appear in your Earnings & Withdrawals dashboard for withdrawal via Bank Transfer, bKash, Nagad or Rocket, alongside PayPal and Wise.",
  },
  {
    q: "Are there limits on bKash, Nagad or Rocket withdrawals?",
    a: "Yes. Each of the three carries its own independent limit of ৳50,000 per day and ৳300,000 per month. Bank Transfer, PayPal and Wise have no such cap.",
  },
  {
    q: "Is KYC required for sellers?",
    a: "Yes, before your first withdrawal. You can verify using a Passport, National ID, Driving License or Birth Certificate.",
  },
  {
    q: "What identity documents are accepted?",
    a: "Passport, National ID, Driving License or Birth Certificate. Upload clear photos of the document along with your legal name exactly as it appears on the ID.",
  },
  {
    q: "Does my payout account name need to match my identity?",
    a: "Yes. The account holder name you enter when requesting a withdrawal must match the legal name on your identity verification, and Durqo's team checks this by hand before approving a withdrawal.",
  },
  {
    q: "How long does a payout take once requested?",
    a: "Durqo normally reviews and processes eligible payout requests within 3-5 business days. Your bank or mobile financial service provider may need additional time to credit the funds.",
  },
  {
    q: "Does Durqo guarantee my business will sell?",
    a: "No. Durqo provides a structured listing process, marketplace visibility and a tracked transaction process, but it does not guarantee a buyer, a sale, a specific price, or how long a sale will take.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PAIRS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

function DashEyebrow({
  children,
  onDark = false,
  center = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  center?: boolean;
}) {
  return (
    <p
      className={`mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider ${
        onDark ? "text-white/70" : "text-ink-soft"
      } ${center ? "justify-center" : ""}`}
    >
      <span className="h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1040px] ${className}`}>{children}</div>;
}

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
      {children}
    </li>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
      <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
      <p className="text-xs leading-relaxed text-ink-faint">{children}</p>
    </div>
  );
}

function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-gold-soft px-3.5 py-3">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#92730F]" />
      <p className="text-xs leading-relaxed text-[#6b5610]">{children}</p>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 max-w-[70ch]">
      <DashEyebrow>{eyebrow}</DashEyebrow>
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      {children && <div className="mt-3 flex flex-col gap-3 text-[0.95rem] leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
}

const GUIDE_NAV = [
  { href: "#challenges", label: "Challenges" },
  { href: "#preparing", label: "Preparing to Sell" },
  { href: "#valuation", label: "Valuation" },
  { href: "#process", label: "Selling Process" },
  { href: "#transfer-room", label: "Transfer Room" },
  { href: "#payouts", label: "Getting Paid" },
  { href: "#fees", label: "Fees" },
  { href: "#faq", label: "FAQ" },
];

const HERO_TRUST_ROW = [
  { icon: Globe, label: "Reach buyers in Bangladesh and worldwide" },
  { icon: ShieldCheck, label: "Transfer every agreed asset through the Transfer Room" },
  { icon: Wallet, label: "Request eligible sale proceeds through supported BDT payout methods" },
];

const HERO_PANEL_ITEMS = [
  {
    icon: Globe,
    title: "Global buyer reach",
    body: "Get your listing in front of international buyers looking for quality online businesses.",
  },
  {
    icon: DollarSign,
    title: "No upfront listing fee",
    body: "List your business for free. You only pay a success fee once your business sells.",
  },
  {
    icon: ShieldCheck,
    title: "Tracked asset transfer",
    body: "Use the Transfer Room to securely share and transfer your assets after payment is confirmed.",
  },
  {
    icon: Wallet,
    title: "BDT payout options",
    body: "Request your sale proceeds in BDT via Bank Transfer, bKash, Nagad or Rocket.",
  },
];

// The specific obstacles a founder selling from Bangladesh runs into,
// paired with how Durqo's existing mechanics address each one. Every
// "Durqo solution" half restates a real, already-live mechanic - nothing
// new is being claimed here.
const SELLER_CHALLENGES = [
  {
    icon: Globe,
    title: "Reaching international buyers",
    problem: "It can be difficult to find serious international buyers on your own, outside a handful of personal contacts or local groups.",
    solution: "Your listing is visible to a global pool of buyers once it is reviewed and published on the marketplace.",
  },
  {
    icon: Users,
    title: "Building buyer confidence",
    problem: "Buyers need clear information and some proof of legitimacy before they feel confident purchasing from a seller they have never met.",
    solution: "A structured listing format and review process before it goes live help buyers evaluate your business on real information.",
  },
  {
    icon: Wallet,
    title: "Receiving payouts in BDT",
    problem: "International payments can be complex to receive for sellers based in Bangladesh, without a suitable local method.",
    solution: "Multiple BDT payout options - Bank Transfer, bKash, Nagad and Rocket - give you a direct way to receive your funds.",
  },
  {
    icon: Lock,
    title: "Transferring assets safely",
    problem: "Sharing logins, code and other assets can be risky without a secure, tracked process - and before you know payment is confirmed.",
    solution: "Use the Transfer Room, which only opens once payment is confirmed, to track and complete the asset transfer securely.",
    link: { href: "#transfer-room", label: "How the Transfer Room works" },
  },
  {
    icon: ClipboardCheck,
    title: "Keeping the deal recorded",
    problem: "Important details can get lost or disputed in informal chats spread across email, WhatsApp or Messenger.",
    solution: "Buyer communication, payment status, the agreed asset list and delivery confirmation stay connected to the same order.",
  },
];

const SELLABLE_SIGNS = [
  "Clearly identified ownership",
  "Transferable digital assets",
  "Understandable operations",
  "Accurate financial or audience information",
  "A realistic asking price",
  "A practical asset-transfer plan",
  "No undisclosed ownership dispute",
  "No platform restriction that prevents transfer",
];

// The 16 live listing categories from src/lib/categories.ts, verbatim.
const BUSINESS_TYPES = [
  { icon: Globe, label: "Websites" },
  { icon: ShoppingCart, label: "E-commerce" },
  { icon: PlaySquare, label: "YouTube Channels" },
  { icon: Share2, label: "Social Media Accounts" },
  { icon: Layers, label: "SaaS" },
  { icon: Sparkles, label: "AI Apps & Tools" },
  { icon: Smartphone, label: "Android & iOS Apps" },
  { icon: RocketGlyph, label: "Startup Business" },
  { icon: Boxes, label: "Plugins, Themes & Extensions" },
  { icon: LinkIcon, label: "Domains" },
  { icon: Package, label: "Amazon Stores & KDP" },
  { icon: Handshake, label: "Service Business" },
  { icon: Users, label: "Digital Agencies" },
  { icon: Gamepad2, label: "Games" },
  { icon: Mail, label: "Newsletters" },
  { icon: Bitcoin, label: "Crypto & Blockchain" },
];

const WHY_FOUNDERS_SELL = [
  { icon: Compass, text: "Start or fund another project" },
  { icon: Layers, text: "Reduce the number of businesses being managed" },
  { icon: Clock, text: "Step away from daily operations" },
  { icon: DollarSign, text: "Free up capital" },
  { icon: ArrowRightLeft, text: "Change career or business direction" },
  { icon: Users, text: "Find an owner with the resources to expand it" },
  { icon: TrendingUp, text: "Realize value from years of work" },
];

const BUYER_EVALUATION = [
  { icon: DollarSign, title: "Revenue", body: "How much revenue does the business generate, and where does it come from?" },
  { icon: Wallet, title: "Profit", body: "What remains after hosting, advertising, contractors, tools, fulfilment and other operating costs?" },
  { icon: Repeat, title: "Revenue consistency", body: "Is revenue stable, growing, declining, recurring or seasonal?" },
  { icon: Activity, title: "Traffic and audience", body: "Where do visitors, users, subscribers or customers come from?" },
  { icon: Calendar, title: "Business age", body: "How long has the business been operating, and how much history can be reviewed?" },
  { icon: TrendingUp, title: "Growth history", body: "How have revenue, profit, traffic, users or customers changed over time?" },
  { icon: Clock, title: "Owner involvement", body: "How many hours does the current owner spend operating the business?" },
  { icon: Users, title: "Customer concentration", body: "Does a large percentage of revenue depend on one customer or client?" },
  { icon: Network, title: "Platform dependency", body: "Does the business depend heavily on Google, Amazon, Meta, YouTube, Shopify or another platform?" },
  { icon: Package, title: "Transferable assets", body: "Which domains, files, accounts, content, code, contracts and operating materials will transfer?" },
  { icon: AlertTriangle, title: "Risk", body: "What could reduce revenue, traffic, access or future performance?" },
  { icon: Compass, title: "Growth opportunities", body: "What realistic opportunities could a new owner pursue?" },
];

const VALUE_FACTORS = [
  "Historical revenue",
  "Net profit",
  "Revenue consistency",
  "Growth trend",
  "Business age",
  "Traffic quality",
  "Customer retention",
  "Recurring revenue",
  "Customer concentration",
  "Platform dependency",
  "Owner workload",
  "Transferability",
  "Documented processes",
  "Business risk",
  "Future opportunity",
];

// General, generalized mistakes commonly cited in digital-business M&A and
// marketplace guidance - not Durqo-specific claims, no invented numbers.
const COMMON_MISTAKES = [
  { icon: Clock, title: "Preparing too late", body: "Waiting until the listing is created to organize financial records, analytics and ownership information can delay review and reduce buyer confidence." },
  { icon: DollarSign, title: "Pricing on personal expectations", body: "A price that cannot be supported by profit, growth, assets or comparable performance may discourage serious buyers." },
  { icon: AlertTriangle, title: "Hiding business risks", body: "A known problem that appears later during buyer review can cause more damage than disclosing it clearly from the beginning." },
  { icon: FileWarning, title: "Unsupported financial claims", body: "Revenue and profit information should be accurate and reasonably supportable if a buyer asks for evidence." },
  { icon: Boxes, title: "Mixing personal and business assets", body: "Personal email accounts, payment accounts and files can make a business more difficult to transfer cleanly." },
  { icon: ClipboardList, title: "Not preparing an asset list", body: "Know exactly which domains, files, accounts, content, intellectual property and operating resources are included." },
  { icon: Lock, title: "Sharing credentials too early", body: "Do not hand over passwords or control of the business before the required payment is confirmed and the Transfer Room opens." },
  { icon: MessagesSquare, title: "Moving the deal outside Durqo", body: "Important communications and asset-delivery records may be lost when a transaction moves to unrecorded personal channels." },
  { icon: HelpCircle, title: "Treating interest as a completed sale", body: "Questions or expressions of interest do not mean a purchase has been completed - follow the order and payment status shown by Durqo." },
  { icon: Handshake, title: "Failing to plan the handover", body: "Consider how the buyer will receive the domain, hosting, code, analytics and operating knowledge before the purchase occurs." },
];

const PREPARE_CATEGORIES = [
  {
    icon: DollarSign,
    title: "Financial Information",
    intro: "Include:",
    items: ["Monthly and annual revenue", "Operating expenses", "Net profit", "Recurring expenses", "Revenue sources", "Refunds or chargebacks", "Seasonal changes", "Supporting records"],
  },
  {
    icon: Activity,
    title: "Traffic and Audience",
    intro: "Include:",
    items: ["Monthly visitors", "Traffic history", "Traffic sources", "Geographic distribution", "Organic and paid traffic", "Subscriber data", "Customer-acquisition channels", "Connected analytics where available"],
  },
  {
    icon: Settings,
    title: "Business Operations",
    intro: "Include:",
    items: ["Owner responsibilities", "Weekly and monthly workload", "Employees or contractors", "Suppliers", "Content process", "Customer support", "Marketing process", "Required software and tools"],
  },
  {
    icon: Package,
    title: "Ownership and Assets",
    intro: "Include:",
    items: ["Domain ownership", "Website files", "Source code", "Brand assets", "Content", "Social accounts", "Analytics", "Advertising accounts", "Customer information, where legally transferable", "Supplier information", "Operating documentation"],
    note: "Only include assets that you own or have the legal and practical right to transfer.",
  },
  {
    icon: AlertTriangle,
    title: "Risks and Dependencies",
    intro: "Include:",
    items: ["Platform dependency", "Customer concentration", "Traffic concentration", "Supplier dependency", "Licensing restrictions", "Intellectual-property concerns", "Revenue decline", "Pending disputes", "Accounts that cannot legally be transferred"],
  },
];

const CHECKLIST_ITEMS = [
  "I have the legal right to sell this business.",
  "I can clearly explain how it operates and generates revenue.",
  "My revenue, profit and traffic information is accurate and supportable.",
  "My asking price is based on real business information, not just what I hope to receive.",
  "I have listed every asset included in the sale.",
  "I know exactly how the domain, files, accounts and other assets will be transferred.",
  "I have removed personal or confidential information from the public listing.",
  "I have disclosed significant risks or dependencies rather than hiding them.",
  "I understand the buyer will inspect everything before approving the transfer.",
  "I will not share credentials before payment is confirmed and the Transfer Room opens.",
  "I understand KYC is required before my first withdrawal, and my payout account must match my verified name.",
];

const ASKING_PRICE_FACTORS = [
  "Recent revenue and profit",
  "Revenue stability",
  "Growth or decline",
  "Recurring income",
  "Traffic quality",
  "Customer concentration",
  "Owner workload",
  "Business age",
  "Transferable assets",
  "Platform and operational risks",
  "Quality of financial records",
  "Future opportunities",
];

type SellingStep = {
  n: string;
  icon: typeof FileText;
  title: string;
  body: string;
  link?: { href: string; label: string };
};

// Every step is phrased against the direct-purchase model Durqo actually
// runs today - no "offer," "counter-offer" or negotiation language, since
// no such feature exists in the checkout/listing code.
const SELLING_STEPS: SellingStep[] = [
  { n: "01", icon: UserPlus, title: "Create your seller account", body: "Register with your email address and confirm your account. Creating an account and submitting a listing does not require an upfront fee." },
  { n: "02", icon: DollarSign, title: "Estimate your business value", body: "Use Durqo's free valuation tool as a starting reference, then choose an asking price you can explain using the business's revenue, profit, traffic and transferable assets.", link: { href: "/valuation", label: "Get a free valuation" } },
  { n: "03", icon: FileText, title: "Build your listing", body: "Add the business description, category, financial information, traffic data, operating requirements, asking price and everything included in the sale." },
  { n: "04", icon: ClipboardCheck, title: "Submit it for review", body: "Durqo reviews the listing for completeness, clarity and compliance with its current listing requirements, and may request corrections before publishing.", link: { href: "/listing-review", label: "How listings are reviewed" } },
  { n: "05", icon: Globe, title: "Reach potential buyers", body: "Once approved, the listing becomes visible to buyers in Bangladesh and other countries. Interested buyers can review it and message you before deciding to purchase." },
  { n: "06", icon: ShoppingCart, title: "Buyer completes the purchase", body: "The buyer pays the listed price through one of Durqo's supported payment methods. The required payment must be received and verified before the asset-transfer stage begins.", link: { href: "/payments", label: "View payment & withdrawal details" } },
  { n: "07", icon: Handshake, title: "Transfer the agreed assets", body: "Once payment is confirmed, the order's private Transfer Room opens. Submit each agreed asset separately so the buyer can inspect and confirm what they have received.", link: { href: "#transfer-room", label: "How the Transfer Room works" } },
  { n: "08", icon: Wallet, title: "Complete the sale and request payout", body: "After the buyer approves the completed transfer and any required review is finished, eligible earnings become available. Complete identity verification before your first withdrawal, then request payment." },
];

const LISTING_REVIEW_OUTCOMES = [
  { icon: CheckCircle2, text: "Approved for publication" },
  { icon: ArrowRightLeft, text: "Returned for corrections" },
  { icon: HelpCircle, text: "Additional information requested" },
  { icon: AlertTriangle, text: "Not approved under current listing requirements" },
];

const BUYER_QUESTIONS = [
  "Why are you selling?",
  "How does the business generate revenue?",
  "What are the largest expenses?",
  "How much time does it require?",
  "What assets are included?",
  "Where does traffic come from?",
  "Are any contractors or suppliers required?",
  "What are the main risks?",
  "How will the assets be transferred?",
  "Will transition assistance be provided?",
];

const DUE_DILIGENCE_ITEMS = [
  "Remove unnecessary personal information",
  "Protect customer privacy",
  "Use read-only or limited access where possible",
  "Avoid sharing passwords",
  "Follow applicable platform rules",
  "Keep important communication connected to the transaction",
];

const PAYMENT_STATUS_STEPS = [
  { icon: CheckCircle2, title: "Payment confirmed", body: "Buyer's payment is held on Durqo or Escrow.com." },
  { icon: Unlock, title: "Transfer Room opens", body: "You can share your assets once the payment is confirmed." },
  { icon: Send, title: "Seller delivers", body: "Complete the asset transfer through the Transfer Room." },
];

const TRANSFER_ROOM_STEPS = [
  { n: "01", icon: Send, title: "Seller submits assets", body: "Share each agreed asset - domains, website files, source code, accounts and more - one at a time, inside the order's Transfer Room." },
  { n: "02", icon: Eye, title: "Buyer reviews", body: "The buyer inspects what has been delivered during a 7-day inspection window that starts from the first item marked Received." },
  { n: "03", icon: CheckCircle2, title: "Transfer completed", body: "Once satisfied, the buyer approves the transfer. If something is missing or does not match, they can report an issue instead." },
];

const TRANSFER_ROOM_DETAILS = [
  "The Transfer Room opens only after the required payment has been received and verified - a partial payment does not unlock it.",
  "The seller sees exactly which assets are included in the transaction.",
  "The seller submits each agreed asset separately, with enough detail for the buyer to identify and access it.",
  "The buyer confirms each item as it arrives by marking it Received.",
  "The buyer gets a 7-day inspection window from the first item marked Received.",
  "The buyer can approve the completed transfer once satisfied.",
  "The buyer can report an issue instead if something is missing or doesn't match.",
  "A reported issue keeps the seller's payout on hold while Durqo reviews the evidence.",
  "Every submission, confirmation and report stays connected to the same order.",
];

const TRANSFER_ROOM_PREVIEW_ROWS = [
  { n: "1", label: "Assets submitted", status: "Completed", tone: "done" as const },
  { n: "2", label: "Buyer reviewing", status: "In progress", tone: "active" as const },
  { n: "3", label: "Transfer completed", status: "Pending", tone: "pending" as const },
];

// The full seller-payout journey, from sale to funds in hand - a partial
// payment never creates a withdrawable balance, and KYC is a required step
// before the first request, not an optional one.
const PAYOUT_JOURNEY = [
  "Sale payment is confirmed.",
  "Transfer Room opens.",
  "Seller submits the agreed assets.",
  "Buyer inspects the assets.",
  "Buyer approves, or reports an issue.",
  "Any required review is completed.",
  "Earnings become available in the dashboard.",
  "Seller completes KYC before the first withdrawal.",
  "Seller selects Bank Transfer, bKash, Nagad or Rocket.",
  "Verified name is matched with the payout account.",
  "Seller reviews the displayed payout information.",
  "Withdrawal request is submitted.",
  "Durqo reviews and processes the request (normally 3-5 business days).",
  "The receiving bank or mobile financial service credits the account.",
];

const PAYOUT_METHODS = [
  { icon: Landmark, label: "Bank Transfer", tint: "text-brand-strong", cap: "No daily or monthly cap" },
  { icon: BkashIcon, label: "bKash", tint: "text-[#E2136E]", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: Smartphone, label: "Nagad", tint: "text-[#ED1C24]", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: RocketGlyph, label: "Rocket", tint: "text-[#7B1E3F]", cap: "Up to ৳50,000/day · ৳300,000/month" },
];

const KYC_FACTS = [
  "KYC is required before your first withdrawal, not before creating a listing.",
  "Passport, National ID, Driving License or Birth Certificate can each be submitted as your verification document.",
  "Upload clear photos of the document (front and back if applicable) along with your legal name as it appears on the ID.",
  "Submissions are reviewed by hand, usually within 1-2 business days.",
  "The verified legal or business name must match the payout account.",
  "Sensitive identity documents are never shown publicly on your listing.",
];

const RELATED_RESOURCES = [
  { href: "/how-to-sell", label: "How Selling on Durqo Works" },
  { href: "/valuation", label: "Free Business Valuation" },
  { href: "/seller-faq", label: "Full Seller FAQ" },
  { href: "/listing-review", label: "How Listings Are Reviewed" },
  { href: "/transfer-room", label: "The Transfer Room" },
  { href: "/payments", label: "Payments & Withdrawals" },
  { href: "/buy-and-sell-digital-businesses-in-bdt", label: "Buy & Sell in BDT" },
  { href: "/report-an-issue", label: "Reporting an Issue" },
];

// Grouped for the FAQ accordion; kept in sync with FAQ_PAIRS above for the
// FAQPage structured data. Facts corrected against the codebase research
// cited in the top-of-file comment: no offer system, the real 7-day
// inspection window, Escrow.com described accurately, PayPal/Wise included
// since they are real supported payout methods.
const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Listing and eligibility",
    items: [
      { question: "Can I sell a website from Bangladesh to an international buyer?", answer: "Yes. Once a listing is reviewed and published, it can be discovered by buyers browsing Durqo from Bangladesh or elsewhere. Being listed does not guarantee a specific buyer, price or timeframe." },
      { question: "What types of digital businesses can I sell?", answer: "Websites, e-commerce stores, SaaS products, AI apps and tools, Android and iOS apps, YouTube channels, social media accounts, domains, plugins, themes and extensions, Amazon stores and KDP businesses, service businesses, digital agencies, games, newsletters, startup businesses, and crypto or blockchain projects." },
      { question: "Does my business need to generate revenue?", answer: "Follow the category and information requirements shown when you create a listing. If a business does not yet generate revenue, explain its assets, audience, product and growth stage clearly so buyers can still evaluate it." },
      { question: "Is it free to create a listing?", answer: "Yes. There's no upfront listing fee and no monthly subscription. Durqo only charges a success fee, and only once your business actually sells." },
    ],
  },
  {
    heading: "Buyers, offers and listing review",
    items: [
      { question: "Will international buyers actually see my listing?", answer: "A published listing is visible to buyers browsing Durqo from any country, alongside buyers in Bangladesh. Visibility does not guarantee buyer interest or a sale." },
      { question: "Can buyers submit offers I can negotiate?", answer: "Durqo currently uses a direct-purchase model rather than a formal offer-and-counter-offer system. A buyer can message you with questions before deciding whether to purchase at your listed asking price." },
      { question: "What happens during listing review?", answer: "Durqo checks a submitted listing for completeness, internal consistency and compliance with current requirements before publishing, and may request corrections or additional information first." },
      { question: "What does due diligence involve?", answer: "A buyer may review relevant financial, traffic, operational, ownership and asset information before completing a purchase. Share only what is accurate, relevant and lawful to disclose." },
    ],
  },
  {
    heading: "Payment, Transfer Room and disputes",
    items: [
      {
        question: "When should I begin transferring the business?",
        answer: (
          <>
            Only once the buyer&rsquo;s payment has been received and confirmed and the order&rsquo;s Transfer Room
            has opened. <strong>Do not hand over a domain, source code or accounts before that stage</strong>, even
            if a buyer says payment has been sent.
          </>
        ),
      },
      {
        question: "What exactly is the Transfer Room?",
        answer: (
          <>
            It&rsquo;s the private, order-specific space where you submit each agreed asset and the buyer reviews
            what&rsquo;s been delivered. The buyer gets a <strong>7-day inspection window</strong> from the first
            item marked Received, then either approves the transfer or reports an issue.
          </>
        ),
      },
      {
        question: "What happens if the buyer reports an issue instead of approving?",
        answer: (
          <>
            <strong>Nothing is released automatically.</strong> Your payout stays on hold while Durqo&rsquo;s team
            reviews the available evidence and decides what happens next, and both sides may be asked for more
            information.
          </>
        ),
      },
    ],
  },
  {
    heading: "Payouts and verification",
    items: [
      {
        question: "How can I receive my sale proceeds in Bangladesh?",
        answer: (
          <>
            Once the buyer approves the completed transfer and any required review is finished, eligible earnings
            appear in your Earnings &amp; Withdrawals dashboard. You can request a withdrawal via Bank Transfer,
            bKash, Nagad or Rocket, alongside PayPal and Wise. See{" "}
            <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
              Buy and Sell Digital Businesses in BDT
            </Link>{" "}
            for the current conversion and limit details.
          </>
        ),
      },
      { question: "Is KYC required for sellers?", answer: "Yes, before your first withdrawal. You can verify using a Passport, National ID, Driving License or Birth Certificate." },
      { question: "Does my payout account name need to match my identity?", answer: "Yes. The account holder name you enter when requesting a withdrawal must match the legal name on your identity verification, and Durqo's team checks this by hand before approving a withdrawal." },
      { question: "How long does a payout take?", answer: "Durqo normally reviews and processes eligible payout requests within 3-5 business days. Your bank or mobile financial service provider may need additional time beyond that to credit the funds." },
      { question: "Does Durqo guarantee my business will sell?", answer: "No. Durqo provides a structured listing process and marketplace visibility, but it does not guarantee a buyer, a sale, a specific price, or how long a sale will take." },
    ],
  },
];

export default function SellYourOnlineBusinessBangladeshPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <ArticleViewTracker />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>Sell from Bangladesh</DashEyebrow>
                <h1 className="max-w-[24ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.2rem]">
                  How to Sell an Online Business from <span className="text-brand">Bangladesh</span>
                </h1>
                <div className="mt-5 flex flex-col gap-4 text-lg leading-relaxed text-ink-soft">
                  <p>
                    Selling a digital business from Bangladesh can be challenging when you need to reach serious
                    buyers, present reliable business information, transfer digital assets and receive your sale
                    proceeds securely.
                  </p>
                  <p className="text-[1.05rem]">
                    Durqo brings the listing, buyer communication, payment status, asset handover and payout process
                    into one structured marketplace.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated October 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <TrackedCta href="/sell" cta="hero_primary" size="lg">
                    List Your Business
                    <ArrowRight size={16} />
                  </TrackedCta>
                  <TrackedCta href="/valuation" cta="hero_secondary" variant="secondary" size="lg">
                    Get a Free Valuation
                  </TrackedCta>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-6">
                  {HERO_TRUST_ROW.map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Icon size={15} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Selling from Bangladesh
                </p>
                {HERO_PANEL_ITEMS.map(({ icon: Icon, title, body }, i) => (
                  <div key={title}>
                    {i > 0 && <div className="my-5 h-px bg-rule" aria-hidden />}
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                        <Icon size={16} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <InfoNote>A success fee applies only after a completed sale. See Marketplace Fees below.</InfoNote>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* IN THIS GUIDE - anchor nav */}
      <nav aria-label="In this guide" className="border-b border-rule bg-paper-sunk">
        <Container>
          <Inner>
            <div className="scrollbar-none flex items-center gap-1 overflow-x-auto py-3">
              <span className="mono mr-2 shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
                In this guide
              </span>
              {GUIDE_NAV.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper-raised hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </div>
          </Inner>
        </Container>
      </nav>

      {/* OVERVIEW */}
      <section className="border-b border-rule py-12 sm:py-14">
        <Container>
          <Inner>
            <p className="max-w-[80ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Durqo is built to support founders selling a digital business from Bangladesh to buyers anywhere in the
              world. This guide walks through the obstacles sellers in Bangladesh most often face, how Durqo&rsquo;s
              marketplace, review process, Transfer Room and local payout options address them, and everything else
              involved in preparing, listing, pricing and completing a sale.
            </p>
          </Inner>
        </Container>
      </section>

      {/* BANGLADESH SELLER CHALLENGES */}
      <section id="challenges" className="scroll-mt-16 border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <SectionIntro eyebrow="The challenge" title="Why selling a digital business from Bangladesh can be difficult.">
              <p>
                Bangladeshi founders can build valuable websites, e-commerce stores, SaaS products, apps and online
                brands. The difficult part is often finding the right buyer and completing the transaction through a
                process both sides can understand and trust.
              </p>
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {SELLER_CHALLENGES.map(({ icon: Icon, title, problem, solution, link }) => (
                <div key={title} className="flex flex-col rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <p className="mono text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">Challenge</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{problem}</p>
                  <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-brand-soft/60 p-2.5">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand-strong" />
                    <div>
                      <p className="mono text-[0.6rem] font-semibold uppercase tracking-wider text-brand-strong">
                        Durqo solution
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink">{solution}</p>
                    </div>
                  </div>
                  {link && (
                    <a href={link.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline">
                      {link.label}
                      <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* IS YOUR BUSINESS SELLABLE */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Where to start" title="Is your online business ready to sell?">
              <p>
                A digital business may be sellable when you have the legal right and practical ability to transfer
                its essential assets to a new owner. The business does not need to be large, but a potential buyer
                must be able to understand what is being sold, how it operates and what ownership will include.
              </p>
              <p className="font-medium text-ink">A stronger sale candidate normally has:</p>
            </SectionIntro>
            <ul className="grid max-w-[760px] gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {SELLABLE_SIGNS.map((s) => (
                <Dot key={s}>{s}</Dot>
              ))}
            </ul>
            <InfoNote>
              A listing application does not guarantee publication. Durqo may request clarification, supporting
              information or corrections before approving a listing.
            </InfoNote>
          </Inner>
        </Container>
      </section>

      {/* WHAT YOU CAN SELL */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="What you can list" title="Sell different types of digital businesses.">
              <p>
                You can list a digital business when you have the legal right and practical ability to transfer the
                included assets to a buyer. Durqo supports:
              </p>
            </SectionIntro>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BUSINESS_TYPES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-rule bg-paper-raised p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              A business does not necessarily need to be large, but the seller must accurately explain what is being
              sold, what is included, and how ownership can be transferred. Not every submitted listing is approved.
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHY FOUNDERS SELL */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Why founders sell" title="Selling does not mean the business failed.">
              <p>
                Founders sell digital businesses for many legitimate reasons. Some want to fund a new project, reduce
                their workload or realize part of the value they have created. Others may no longer have enough time
                to operate the business, or believe a new owner can take it to its next stage.
              </p>
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_FOUNDERS_SELL.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3.5 rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-ink">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              Whatever the reason, a clear explanation helps buyers understand the seller&rsquo;s decision and
              evaluate the opportunity more confidently.
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHAT BUYERS EVALUATE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Buyer's perspective" title="Understand what buyers will review.">
              <p>
                A buyer is not purchasing only a website or account. They are evaluating the income, assets, risks,
                workload and future potential connected to the complete business.
              </p>
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BUYER_EVALUATION.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <InfoNote>
              Do not present future growth as guaranteed. Clearly separate current, verified performance from
              opportunities that have not yet been implemented.
            </InfoNote>
          </Inner>
        </Container>
      </section>

      {/* VALUATION */}
      <section id="valuation" className="scroll-mt-16 border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[880px]">
            <SectionIntro eyebrow="Valuation" title="What could your online business be worth?">
              <p>
                There is no single price formula that applies to every digital business. Buyers usually consider
                profit, revenue quality, growth, risk, transferability and the amount of work required from the
                owner.
              </p>
            </SectionIntro>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-3">
              {VALUE_FACTORS.map((f) => (
                <Dot key={f}>{f}</Dot>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-ink-soft">
              A credible asking price should be explainable using real business information. The amount a seller
              hopes to receive is not, by itself, evidence of market value.
            </p>
            <div className="mt-6">
              <TrackedCta href="/valuation" cta="valuation_cta">
                Get a Free Valuation
                <ArrowRight size={16} />
              </TrackedCta>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SDE EXPLANATION */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Pricing fundamentals</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Understanding Seller&rsquo;s Discretionary Earnings.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Seller&rsquo;s Discretionary Earnings, commonly called SDE, is often used when evaluating smaller
              owner-operated businesses. It starts with the business&rsquo;s net profit and may add back certain
              owner-specific, personal or one-time expenses that a new owner would not reasonably be expected to
              continue paying.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              SDE is intended to help a buyer understand the approximate financial benefit the business currently
              provides to one owner-operator.
            </p>
            <WarningNote>
              SDE is not the same as revenue, and an SDE multiple is not a guaranteed valuation. The appropriate
              approach depends on the business model, financial records, growth, risk and buyer demand.
            </WarningNote>
          </Inner>
        </Container>
      </section>

      {/* COMMON MISTAKES */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Learn from others" title="Common mistakes that can weaken a sale.">
              <p>These mistakes come up repeatedly across digital-business sales, regardless of the platform used to sell:</p>
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COMMON_MISTAKES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gold-soft text-[#92730F]">
                    <Icon size={16} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER PREPARATION GUIDE */}
      <section id="preparing" className="scroll-mt-16 border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Before you list" title="Prepare your business before you list.">
              <p>
                A clear and well-supported listing helps buyers understand the opportunity and reduces avoidable
                questions during the transaction.
              </p>
            </SectionIntro>
            <div className="grid gap-5 sm:grid-cols-2">
              {PREPARE_CATEGORIES.map(({ icon: Icon, title, intro, items, note }, i) => (
                <div key={title} className={`rounded-xl border border-rule bg-paper-raised p-6 ${i === PREPARE_CATEGORIES.length - 1 ? "sm:col-span-2" : ""}`}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                      <Icon size={16} />
                    </span>
                    <h3 className="text-base font-semibold text-ink">{title}</h3>
                  </div>
                  <p className="text-sm text-ink-soft">{intro}</p>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {items.map((it) => (
                      <Dot key={it}>{it}</Dot>
                    ))}
                  </ul>
                  {note && <p className="mt-4 text-xs leading-relaxed text-ink-faint">{note}</p>}
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER CHECKLIST */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <SectionIntro eyebrow="Final check" title="Seller pre-listing checklist.">
              <p>Before listing, make sure you can clearly answer yes to each of the following.</p>
            </SectionIntro>
            <ul className="flex flex-col gap-3">
              {CHECKLIST_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-lg border border-rule bg-paper-raised px-4 py-3.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-strong" />
                  <span className="text-sm text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </Inner>
        </Container>
      </section>

      {/* REALISTIC ASKING PRICE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <SectionIntro eyebrow="Pricing" title="Set an asking price you can support.">
              <p>
                An asking price should reflect the business&rsquo;s actual performance, assets, transferability and
                risk. An unrealistically high price may reduce buyer interest, while a price set without reviewing
                the business&rsquo;s value may result in the seller accepting less than the business could
                reasonably justify.
              </p>
              <p className="font-medium text-ink">Before setting your asking price, consider:</p>
            </SectionIntro>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {ASKING_PRICE_FACTORS.map((f) => (
                <Dot key={f}>{f}</Dot>
              ))}
            </ul>
            <InfoNote>Durqo&rsquo;s valuation tool provides an initial estimate, not a guaranteed sale price.</InfoNote>
          </Inner>
        </Container>
      </section>

      {/* COMPLETE SELLING PROCESS */}
      <section id="process" className="scroll-mt-16 border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Step by step" title="How to sell through Durqo from Bangladesh." />
            <div className="grid gap-5 sm:grid-cols-2">
              {SELLING_STEPS.map(({ n, icon: Icon, title, body, link }) => (
                <div key={n} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="mono grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand-strong">
                      {n}
                    </span>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-brand" />
                      <h3 className="text-base font-semibold text-ink">{title}</h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
                  {link && (
                    <a href={link.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline">
                      {link.label}
                      <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10">
              <TrackedCta href="/sell" cta="how_it_works_cta" size="lg">
                Start Your Listing
                <ArrowRight size={16} />
              </TrackedCta>
            </div>
          </Inner>
        </Container>
      </section>

      {/* LISTING REVIEW */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <SectionIntro eyebrow="Before you go live" title="What happens before your listing is published?">
              <p>
                After the seller submits a listing, Durqo reviews it according to its current listing requirements.
                The review may consider whether the information is complete, internally consistent, understandable
                and suitable for the marketplace.
              </p>
            </SectionIntro>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {LISTING_REVIEW_OUTCOMES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <Icon size={14} className="mt-0.5 shrink-0 text-brand-strong" />
                  {text}
                </li>
              ))}
            </ul>
            <Link href="/listing-review" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
              How Durqo reviews listings
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* BUYER COMMUNICATION AND DUE DILIGENCE */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Before the sale completes" title="Buyer communication and due diligence." />
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold text-ink">Answer buyer questions clearly</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Potential buyers may contact the seller to understand the business before purchasing. Keep answers
                  accurate, professional and consistent with the published listing. Buyers may ask:
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {BUYER_QUESTIONS.map((q) => (
                    <Dot key={q}>{q}</Dot>
                  ))}
                </ul>
                <WarningNote>
                  Do not send passwords, identity documents, financial-account credentials or sensitive customer data
                  through ordinary messages.
                </WarningNote>
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Be ready for buyer review</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Before completing a purchase, a buyer may review relevant financial, traffic, operational,
                  ownership and asset information. Provide only information that is accurate, relevant and lawful to
                  share. Where sensitive records are required:
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {DUE_DILIGENCE_ITEMS.map((it) => (
                    <Dot key={it}>{it}</Dot>
                  ))}
                </ul>
                <InfoNote>
                  Durqo&rsquo;s listing review is not a guarantee of the business&rsquo;s future performance and does
                  not replace the buyer&rsquo;s own evaluation.
                </InfoNote>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* PAYMENT STATUS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="A structured transaction" title="Know the payment status before transferring assets.">
              <p>
                Do not begin the formal asset handover simply because a buyer says payment has been made. The
                Transfer Room becomes available only after the required payment has been received and verified. For
                payments made through Stripe or SSLCommerz, funds are held by Durqo itself until you approve the
                transfer. Where Escrow.com is selected and available, it acts as an independent escrow provider, and
                its own transaction terms and verification requirements apply.
              </p>
            </SectionIntro>
            <WarningNote>You can check the payment status on your order&rsquo;s deal page before sharing any assets.</WarningNote>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {PAYMENT_STATUS_STEPS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-rule bg-paper-raised p-6">
              <h3 className="text-base font-semibold text-ink">What happens if the buyer reports a problem?</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                If the buyer reports that an agreed asset is missing, inaccessible or materially different, your
                payout remains on hold while the available transaction records and evidence are reviewed. You and the
                buyer may be asked to provide additional information. Not every dispute is decided in the
                seller&rsquo;s favor.
              </p>
              <Link href="/report-an-issue" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
                Learn about reporting an issue
                <ArrowRight size={14} />
              </Link>
            </div>
          </Inner>
        </Container>
      </section>

      {/* TRANSFER ROOM */}
      <section id="transfer-room" className="scroll-mt-16 border-b border-rule bg-ink py-14 text-white sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[55fr_45fr] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow onDark>Tracked asset handover</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Transfer the business through the Transfer Room.</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70">
                  The Transfer Room connects the asset handover to the order. It provides a clear record of what the
                  seller submits, what the buyer receives, and whether the transfer is approved or reported for
                  review.
                </p>
                <div className="mt-7 flex flex-col gap-5">
                  {TRANSFER_ROOM_STEPS.map(({ n, icon: Icon, title, body }) => (
                    <div key={n} className="flex items-start gap-3.5">
                      <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-bold text-white">
                        {n}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-white/70" />
                          <h3 className="text-sm font-semibold text-white">{title}</h3>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-white/70">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="mt-7 flex flex-col gap-2 border-t border-white/10 pt-6">
                  {TRANSFER_ROOM_DETAILS.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-xs leading-relaxed text-white/70">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-white/50" />
                      {d}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-white/10 px-3.5 py-3">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#F2C94C]" />
                  <p className="text-xs leading-relaxed text-white/70">
                    Do not transfer the business only through personal email, WhatsApp, Facebook Messenger or another
                    unrecorded channel. Keep the agreed asset handover and confirmation connected to the Durqo order.
                  </p>
                </div>
                <Link href="/transfer-room" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline">
                  Read the full Transfer Room guide
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="min-w-0 rounded-2xl bg-paper-raised p-6 text-ink shadow-lg sm:p-7">
                <p className="mono mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <Lock size={13} />
                  Transfer Room
                </p>
                <div className="flex flex-col gap-3">
                  {TRANSFER_ROOM_PREVIEW_ROWS.map(({ n, label, status, tone }) => (
                    <div key={n} className="flex items-center justify-between gap-3 rounded-lg border border-rule px-3.5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                          {n}
                        </span>
                        <span className="text-sm font-medium text-ink">{label}</span>
                      </div>
                      <span
                        className={`mono rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                          tone === "done" ? "bg-brand-soft text-brand-strong" : tone === "active" ? "bg-gold-soft text-[#92730F]" : "bg-paper-sunk text-ink-faint"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-faint">
                  Example transfer for illustration - every real order gets its own Transfer Room with live status.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER PAYOUT IN BANGLADESH */}
      <section id="payouts" className="scroll-mt-16 border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <SectionIntro eyebrow="Get paid in Bangladesh" title="Receiving sale proceeds in Bangladesh.">
              <p>
                A confirmed buyer payment does not immediately create a withdrawable seller balance - it moves
                through the Transfer Room, inspection and review before becoming eligible. The full journey from sale
                to funds in hand:
              </p>
            </SectionIntro>
            <ol className="grid gap-2.5 sm:grid-cols-2">
              {PAYOUT_JOURNEY.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <span className="mono mt-0.5 shrink-0 text-xs font-semibold text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYOUT_METHODS.map(({ icon: Icon, label, tint, cap }) => (
                <div key={label} className="rounded-xl border border-rule bg-paper-raised p-4">
                  <Icon size={18} className={tint} />
                  <p className="mt-2 text-sm font-semibold text-ink">{label}</p>
                  <p className="mt-0.5 text-[0.7rem] leading-snug text-ink-faint">{cap}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
              Sellers can also withdraw via PayPal or Wise. The seller&rsquo;s verified legal name or verified
              business name must match the payout account holder&rsquo;s name.
            </p>
            <Link href="/buy-and-sell-digital-businesses-in-bdt" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
              View BDT payment and payout details
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* SELLER IDENTITY VERIFICATION */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[880px]">
            <SectionIntro eyebrow="Before your first withdrawal" title="Seller KYC and payout-name verification.">
              <p>
                KYC identity verification is required before a seller&rsquo;s first withdrawal. This helps protect
                seller earnings, prevent unauthorized payouts, and confirm that funds are sent to the correct
                recipient. Durqo normally reviews submitted documents within 1-2 business days.
              </p>
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[{ icon: IdCard, label: "Passport" }, { icon: CreditCard, label: "National ID" }, { icon: Car, label: "Driving License" }, { icon: FileText, label: "Birth Certificate" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-rule bg-paper-raised p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              ))}
            </div>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {KYC_FACTS.map((f) => (
                <Dot key={f}>{f}</Dot>
              ))}
            </ul>
            <Link href="/payments" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
              Learn about payments and withdrawals
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* MARKETPLACE FEES */}
      <section id="fees" className="scroll-mt-16 border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
              <div className="max-w-[60ch]">
                <DashEyebrow>Clear pricing</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Pay a success fee only after a sale.</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                  There is no upfront charge to list your business, and no monthly subscription. Durqo deducts the
                  applicable seller success fee only after a completed sale.
                </p>
              </div>
              <div className="rounded-2xl border border-rule bg-paper-raised p-6 sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Seller success fee</p>
                <dl className="flex flex-col gap-3">
                  {SUCCESS_FEE_TIERS.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between gap-4 border-b border-rule pb-3 last:border-b-0 last:pb-0">
                      <dt className="text-sm text-ink-soft">{tier.label}</dt>
                      <dd className="mono text-lg font-bold text-brand-strong">{fmtRate(tier.rate)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-start gap-2">
                  <Info size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                  <p className="text-xs leading-relaxed text-ink-faint">
                    The applicable percentage applies to the complete final sale price. See{" "}
                    <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
                      Buy &amp; Sell in BDT
                    </Link>{" "}
                    for payout details.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <SectionIntro eyebrow="Frequently asked questions" title="Seller questions, answered." />
            <GroupedFaq groups={FAQ_GROUPS} />
          </Inner>
        </Container>
      </section>

      {/* RELATED RESOURCES */}
      <section className="border-b border-rule py-10">
        <Container>
          <Inner>
            <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Related seller resources</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {RELATED_RESOURCES.map(({ href, label }) => (
                <Link key={href} href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
                  {label}
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <Container>
          <Inner className="max-w-[700px] text-center">
            <DashEyebrow onDark center>
              Ready to sell?
            </DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Turn what you built into your next opportunity.</h2>
            <p className="mx-auto mt-3 max-w-[54ch] text-sm text-white/70">
              Prepare your business information, create your listing, and reach potential buyers through a structured
              marketplace built for digital-business transactions.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <TrackedCta href="/sell" cta="final_primary" size="lg">
                List Your Business
                <ArrowRight size={16} />
              </TrackedCta>
              <TrackedCta href="/valuation" cta="final_secondary" variant="on-dark" size="lg">
                Get a Free Valuation
              </TrackedCta>
            </div>
            <p className="mono mt-8 text-xs uppercase tracking-wide text-white/40">
              No upfront listing fee · Seller success fee applies only after a completed sale
            </p>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
