"use client"
import { useState } from "react";
import {
  QrCode,
  Unlock,
  BookOpen,
  Check,
  Download,
  Copy,
  Menu,
  X,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  BookText,
  Languages,
  Monitor,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import {redirect} from "next/navigation"
/* ─── constants ─── */
const NAV_LINKS = ["Home", "Subjects", "Teachers", "How it works"];

const STATS = [
  { value: "500+", label: "Resources" },
  { value: "120+", label: "Teachers" },
  { value: "Grade 11 & 12", label: "NEB Curriculum" },
];

const STEPS = [
  {
    num: "01",
    Icon: QrCode,
    title: "Scan or search",
    body: "Find a teacher's profile or scan their QR code to access shared resources instantly.",
  },
  {
    num: "02",
    Icon: Unlock,
    title: "Request access",
    body: "Send a request to the teacher. They approve it and you receive an email invite with direct access.",
  },
  {
    num: "03",
    Icon: BookOpen,
    title: "Start learning",
    body: "Browse notebooks, download PDFs, watch videos — all organised by subject and grade.",
  },
];

const SUBJECTS = [
  { name: "Physics", Icon: Atom },
  { name: "Chemistry", Icon: FlaskConical },
  { name: "Biology", Icon: Dna },
  { name: "Mathematics", Icon: Calculator },
  { name: "English", Icon: BookText },
  { name: "Nepali", Icon: Languages },
  { name: "Computer Science", Icon: Monitor },
  { name: "Accountancy", Icon: BarChart2 },
  { name: "Economics", Icon: TrendingUp },
];

const TEACHERS = [
  { initials: "RB", name: "Rajesh Bhandari", subjects: ["Physics", "Grade 12"], stats: "24 resources · 180 students" },
  { initials: "SP", name: "Sunita Poudel", subjects: ["Chemistry", "Grade 11"], stats: "18 resources · 140 students" },
  { initials: "MK", name: "Manoj Karki", subjects: ["Mathematics", "Grade 11", "Grade 12"], stats: "31 resources · 210 students" },
];

const SUBJECT_PILLS = ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"];

/* ─── App ─── */
export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <SubjectsSection />
      <TeacherProfiles />
      <QRSection />
      <CTASection />
      <Footer />
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white flex items-center justify-between px-8 h-16"
      style={{ borderBottom: "1px solid #E5E5E5" }}
    >
      <span className="text-black font-bold text-lg tracking-tight">ShikshaHub</span>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((l) => (
          <a key={l} href="#" className="text-sm text-black hover:opacity-60 transition-opacity">{l}</a>
        ))}
      </nav>

      <div className="hidden md:flex items-center gap-3">
        <button
          className="px-4 py-2 text-sm font-medium text-black rounded-lg transition-opacity hover:opacity-70"
          style={{ border: "1px solid #0A0A0A" }}
          onClick={() => {
            redirect('/login')
          }}
        >
          Sign in
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:opacity-80 transition-opacity">
          Get access
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-black"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="absolute top-16 left-0 right-0 bg-white flex flex-col px-8 py-6 gap-5 md:hidden"
          style={{ borderBottom: "1px solid #E5E5E5" }}
        >
          {NAV_LINKS.map((l) => (
            <a key={l} href="#" className="text-sm text-black font-medium">{l}</a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <button className="py-2.5 text-sm font-medium text-black rounded-lg" style={{ border: "1px solid #0A0A0A" }}>
              Sign in
            </button>
            <button className="py-2.5 text-sm font-medium text-white bg-black rounded-lg">
              Get access
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section
      className="w-full flex flex-col items-center justify-center text-center px-6 pt-32 pb-24"
      style={{ backgroundColor: "#0A0A0A", minHeight: "90vh" }}
    >
      {/* Eyebrow */}
      <span
        className="inline-block text-white rounded-full px-4 py-1 mb-8 text-xs font-medium tracking-wide"
        style={{ border: "1px solid rgba(255,255,255,0.35)", fontSize: "13px" }}
      >
        Made for Nepal NEB Grade 11 &amp; 12
      </span>

      {/* Headline */}
      <h1
        className="text-white font-bold leading-tight mb-6 max-w-3xl"
        style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 700 }}
      >
        Learn smarter. Access resources from the best teachers in Nepal.
      </h1>

      {/* Subtext */}
      <p
        className="mb-10 leading-relaxed"
        style={{ color: "#A3A3A3", fontSize: "18px", maxWidth: "560px" }}
      >
        Teachers share notes, PDFs, and videos for Physics, Chemistry, Maths, and more. Students get access by QR code or email invite.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
        <button
          className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:opacity-85 transition-opacity"
        >
          Get started as student
        </button>
        <button
          className="px-6 py-3 text-sm font-semibold text-white rounded-lg hover:opacity-75 transition-opacity"
          style={{ border: "1px solid rgba(255,255,255,0.5)" }}
        >
          Join as teacher
        </button>
      </div>

      {/* Subject pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUBJECT_PILLS.map((s) => (
          <span
            key={s}
            className="px-4 py-1.5 text-white text-xs font-medium rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.25)", fontSize: "13px" }}
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─── Stats bar ─── */
function StatsBar() {
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ borderTop: "1px solid #E5E5E5", borderBottom: "1px solid #E5E5E5", height: "80px", backgroundColor: "#fff" }}
    >
      <div className="flex items-center w-full max-w-3xl">
        {STATS.map((s, i) => (
          <div key={s.value} className="flex-1 flex flex-col items-center justify-center">
            <span className="text-black font-medium" style={{ fontSize: "20px" }}>{s.value}</span>
            <span style={{ color: "#737373", fontSize: "13px" }}>{s.label}</span>
            {i < STATS.length - 1 && (
              <span
                className="absolute"
                style={{ display: "none" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── How it works ─── */
function HowItWorks() {
  return (
    <section className="w-full bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-widest text-black mb-3">How it works</p>
        <h2 className="text-3xl font-bold text-black mb-12" style={{ fontSize: "36px" }}>
          Three steps to access any resource
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ num, Icon, title, body }) => (
            <div
              key={num}
              className="rounded-2xl p-8"
              style={{ border: "1px solid #E5E5E5" }}
            >
              <span className="block font-bold mb-6" style={{ fontSize: "48px", color: "#D4D4D4", lineHeight: 1 }}>
                {num}
              </span>
              <Icon size={28} strokeWidth={1.5} className="text-black mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#737373" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Subjects ─── */
function SubjectsSection() {
  return (
    <section className="w-full py-20 px-6" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontSize: "36px" }}>
          Every NEB subject, covered
        </h2>
        <p className="mb-12" style={{ color: "#A3A3A3", fontSize: "16px" }}>
          All subjects from the NEB curriculum in one place.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SUBJECTS.map(({ name, Icon }) => (
            <SubjectCard key={name} name={name} Icon={Icon} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SubjectCard({ name, Icon }: { name: string; Icon: React.ElementType }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-xl p-6 cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: hovered ? "#fff" : "#0A0A0A",
        border: hovered ? "1px solid #0A0A0A" : "1px solid #404040",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={24} strokeWidth={1.5} style={{ color: hovered ? "#0A0A0A" : "#fff" }} className="mb-3" />
      <p className="font-bold text-base mb-1" style={{ color: hovered ? "#0A0A0A" : "#fff" }}>{name}</p>
      <p className="text-xs" style={{ color: hovered ? "#737373" : "#737373" }}>Grade 11 · Grade 12</p>
    </div>
  );
}

/* ─── Teacher profiles ─── */
function TeacherProfiles() {
  return (
    <section className="w-full bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-black mb-12" style={{ fontSize: "36px" }}>
          Learn from real teachers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEACHERS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ border: "1px solid #E5E5E5" }}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: "#0A0A0A" }}
              >
                {t.initials}
              </div>

              <div>
                <p className="font-bold text-black text-lg">{t.name}</p>
                <p className="text-xs mt-1" style={{ color: "#737373" }}>{t.stats}</p>
              </div>

              {/* Subject pills */}
              <div className="flex flex-wrap gap-2">
                {t.subjects.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 text-xs font-medium text-black rounded-full"
                    style={{ border: "1px solid #0A0A0A" }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <button
                className="w-full py-2.5 text-sm font-medium text-black rounded-lg mt-auto hover:bg-black hover:text-white transition-colors duration-150"
                style={{ border: "1px solid #0A0A0A" }}
              >
                View notebooks
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── QR section ─── */
function QRSection() {
  return (
    <section className="w-full py-20 px-6" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
        {/* Left */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug" style={{ fontSize: "36px" }}>
            Share resources with a single scan
          </h2>
          <p className="mb-8 leading-relaxed" style={{ color: "#A3A3A3", fontSize: "16px" }}>
            Teachers generate a QR code for any resource. Students scan it with any camera — no app needed.
          </p>
          <div className="flex flex-col gap-4">
            {[
              "Set expiry dates on QR links",
              "Control access: public, class-only, or email list",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#fff" }}
                >
                  <Check size={12} strokeWidth={3} color="#0A0A0A" />
                </span>
                <span className="text-sm text-white">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — QR mockup */}
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-4 shrink-0"
          style={{ backgroundColor: "#fff", border: "1px solid #E5E5E5", width: "280px" }}
        >
          {/* QR placeholder */}
          <div
            className="flex items-center justify-center"
            style={{ width: "200px", height: "200px", border: "1px solid #0A0A0A" }}
          >
            <QrCode size={120} strokeWidth={1} color="#0A0A0A" />
          </div>

          <p className="text-sm font-bold text-black text-center">
            Class 12 Physics – Wave Optics
          </p>

          <span
            className="px-3 py-1 text-xs font-medium text-black rounded-full"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            Scan to access
          </span>

          <div className="flex gap-2 w-full">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-black rounded-lg hover:opacity-70 transition-opacity"
              style={{ border: "1px solid #E5E5E5" }}
            >
              <Download size={13} />
              Download
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-black rounded-lg hover:opacity-70 transition-opacity"
              style={{ border: "1px solid #E5E5E5" }}
            >
              <Copy size={13} />
              Copy link
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  return (
    <section className="w-full bg-white py-20 px-6 text-center">
      <div className="max-w-xl mx-auto">
        <h2 className="font-bold text-black mb-4" style={{ fontSize: "40px" }}>
          Ready to start learning?
        </h2>
        <p className="mb-10 text-base" style={{ color: "#737373" }}>
          Join thousands of students and teachers already using ShikshaHub across Nepal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button
            className="px-8 text-sm font-semibold text-white bg-black rounded-lg hover:opacity-80 transition-opacity"
            style={{ height: "48px" }}
          >
            Join as student
          </button>
          <button
            className="px-8 text-sm font-semibold text-black rounded-lg hover:bg-black hover:text-white transition-colors duration-150"
            style={{ height: "48px", border: "1px solid #0A0A0A" }}
          >
            Join as teacher
          </button>
        </div>
        <p className="text-sm" style={{ color: "#737373" }}>
          Already have access?{" "}
          <a href="#" className="underline hover:opacity-70 transition-opacity">Sign in</a>
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="w-full px-8 pt-12 pb-6" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-8" style={{ borderBottom: "1px solid #262626" }}>
          {/* Left */}
          <div>
            <p className="text-white font-bold text-lg mb-2">ShikshaHub</p>
            <p className="text-sm" style={{ color: "#737373" }}>Nepal&apos;s NEB learning platform</p>
          </div>

          {/* Center */}
          <div className="flex flex-col gap-3">
            {[...NAV_LINKS, "Sign in"].map((l) => (
              <a key={l} href="#" className="text-white text-sm hover:opacity-60 transition-opacity w-fit">{l}</a>
            ))}
          </div>

          {/* Right */}
          <div>
            <p className="text-sm leading-relaxed" style={{ color: "#A3A3A3" }}>
              Built for NEB Grade 11 &amp; 12 students across Nepal.
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#737373" }}>
          © 2025 ShikshaHub · Nepal
        </p>
      </div>
    </footer>
  );
}
