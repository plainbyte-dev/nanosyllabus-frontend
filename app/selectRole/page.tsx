"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, ArrowRight, Sparkles, LayoutDashboard, Users } from "lucide-react";
import { getSession } from "next-auth/react";
import { apiFetch } from "../lib/api";

type Role = "teacher" | "student";
type PageState = "loading" | "select" | "ready";

// ─── Role content shown after role is confirmed ───────────────────────────────

function TeacherDashboardPreview() {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div
        style={{
          width: "56px", height: "56px", backgroundColor: "#0a0a0a",
          borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: "20px",
        }}
      >
        <LayoutDashboard size={24} color="#ffffff" />
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif", marginBottom: "8px", lineHeight: "1.2" }}>
        Welcome back, Teacher
      </h1>
      <p style={{ fontSize: "14px", color: "#737373", fontFamily: "Inter, sans-serif", marginBottom: "32px", maxWidth: "320px", lineHeight: "1.6" }}>
        Your classroom is ready. Manage notebooks, view student activity, and grow your AI clone.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "360px", marginBottom: "24px" }}>
        {[
          { label: "Go to Dashboard", primary: true, href: "/dashboard" },
          { label: "Upload a Notebook", primary: false, href: "/notebooks/new" },
        ].map(({ label, primary, href }) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push(href)}
            style={{
              width: "100%", height: "48px",
              backgroundColor: primary ? "#0a0a0a" : "#ffffff",
              color: primary ? "#ffffff" : "#0a0a0a",
              border: primary ? "none" : "1px solid #0a0a0a",
              borderRadius: "8px", fontSize: "15px", fontWeight: 500,
              fontFamily: "Inter, sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {label}
            {primary && <ArrowRight size={15} />}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
        {["AI Clone", "PDF Upload", "Analytics", "Student Mgmt"].map((tag) => (
          <span key={tag} style={{ fontSize: "12px", fontFamily: "Inter, sans-serif", border: "1px solid #e5e5e5", borderRadius: "9999px", padding: "4px 12px", color: "#737373" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function StudentDashboardPreview() {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div
        style={{
          width: "56px", height: "56px", backgroundColor: "#0a0a0a",
          borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: "20px",
        }}
      >
        <Users size={24} color="#ffffff" />
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif", marginBottom: "8px", lineHeight: "1.2" }}>
        Welcome back, Student
      </h1>
      <p style={{ fontSize: "14px", color: "#737373", fontFamily: "Inter, sans-serif", marginBottom: "32px", maxWidth: "320px", lineHeight: "1.6" }}>
        Pick up where you left off. Chat with your teacher's AI, browse notebooks, and study smarter.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "360px", marginBottom: "24px" }}>
        {[
          { label: "Browse Teachers", primary: true, href: "/teachers" },
          { label: "Continue Studying", primary: false, href: "/study" },
        ].map(({ label, primary, href }) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push(href)}
            style={{
              width: "100%", height: "48px",
              backgroundColor: primary ? "#0a0a0a" : "#ffffff",
              color: primary ? "#ffffff" : "#0a0a0a",
              border: primary ? "none" : "1px solid #0a0a0a",
              borderRadius: "8px", fontSize: "15px", fontWeight: 500,
              fontFamily: "Inter, sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {label}
            {primary && <ArrowRight size={15} />}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
        {["AI Tutor", "Instant Answers", "24/7 Access", "Smart Study"].map((tag) => (
          <span key={tag} style={{ fontSize: "12px", fontFamily: "Inter, sans-serif", border: "1px solid #e5e5e5", borderRadius: "9999px", padding: "4px 12px", color: "#737373" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Role selection UI ────────────────────────────────────────────────────────

interface RoleCardProps {
  role: Role;
  selected: Role | null;
  onSelect: (r: Role) => void;
}

function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  const isSelected = selected === role;
  const isTeacher = role === "teacher";

  const title = isTeacher ? "I'm a Teacher" : "I'm a Student";
  const description = isTeacher
    ? "Create AI clones of yourself, upload notebooks, and let students learn from your teaching style 24/7."
    : "Chat with your teacher's AI clone, get instant answers from their notebooks, and study smarter.";
  const tags = isTeacher
    ? ["AI Clone", "PDF Upload", "Analytics", "Student Mgmt"]
    : ["AI Tutor", "Instant Answers", "24/7 Access", "Smart Study"];

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      style={{
        textAlign: "left",
        width: "100%",
        borderRadius: "12px",
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.2s",
        backgroundColor: isSelected ? "#0a0a0a" : "#ffffff",
        border: isSelected ? "1.5px solid #0a0a0a" : "1.5px solid #e5e5e5",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#0a0a0a"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#e5e5e5"; }}
    >
      {/* Icon */}
      <div
        style={{
          width: "44px", height: "44px", borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px",
          backgroundColor: isSelected ? "rgba(255,255,255,0.12)" : "#f5f5f5",
        }}
      >
        {isTeacher
          ? <BookOpen size={20} color={isSelected ? "#ffffff" : "#0a0a0a"} />
          : <GraduationCap size={20} color={isSelected ? "#ffffff" : "#0a0a0a"} />
        }
      </div>

      {/* Title + check */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
        <p style={{ fontSize: "16px", fontWeight: 600, color: isSelected ? "#ffffff" : "#0a0a0a", fontFamily: "Inter, sans-serif", margin: 0 }}>
          {title}
        </p>
        <div
          style={{
            width: "20px", height: "20px", minWidth: "20px", borderRadius: "50%",
            border: `1.5px solid ${isSelected ? "#ffffff" : "#d4d4d4"}`,
            backgroundColor: isSelected ? "#ffffff" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: "2px", transition: "all 0.15s",
          }}
        >
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: "13px", color: isSelected ? "rgba(255,255,255,0.65)" : "#737373", fontFamily: "Inter, sans-serif", lineHeight: "1.6", margin: "0 0 16px 0" }}>
        {description}
      </p>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "11px", fontFamily: "Inter, sans-serif", fontWeight: 500,
              borderRadius: "6px", padding: "3px 10px",
              backgroundColor: isSelected ? "rgba(255,255,255,0.1)" : "#f5f5f5",
              color: isSelected ? "rgba(255,255,255,0.7)" : "#737373",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function RoleSelectUI({ onRoleSet }: { onRoleSet: (role: Role) => void }) {
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const session = await getSession();
      const backendSession = await apiFetch<{ access_token: string; role: Role }>(
        "/auth/set-role",
        session?.backendAccessToken,
        { method: "POST", body: JSON.stringify({ role: selected }) }
      );
      localStorage.setItem("backendAccessToken", backendSession.access_token);
      localStorage.setItem("role", backendSession.role);
      onRoleSet(backendSession.role);
      router.push(selected === "teacher" ? "/dashboard" : "/teachers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "440px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: "12px" }}>
          One last step
        </p>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif", lineHeight: "1.2", marginBottom: "10px" }}>
          How will you use<br />ShikshaHub?
        </h1>
        <p style={{ fontSize: "14px", color: "#737373", fontFamily: "Inter, sans-serif", lineHeight: "1.6", margin: 0 }}>
          Choose your role — you can always switch later from settings.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        <RoleCard role="teacher" selected={selected} onSelect={setSelected} />
        <RoleCard role="student" selected={selected} onSelect={setSelected} />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || loading}
        style={{
          width: "100%", height: "48px",
          backgroundColor: !selected ? "#f5f5f5" : loading ? "#737373" : "#0a0a0a",
          color: !selected ? "#a3a3a3" : "#ffffff",
          border: "none", borderRadius: "8px",
          fontSize: "15px", fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: !selected || loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          transition: "background-color 0.15s",
          marginBottom: "16px",
        }}
      >
        {loading ? (
          <>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
            Setting up your space…
          </>
        ) : (
          <>
            <Sparkles size={15} />
            {selected ? `Continue as ${selected === "teacher" ? "Teacher" : "Student"}` : "Select a role to continue"}
            {selected && <ArrowRight size={15} />}
          </>
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: "12px", color: "#a3a3a3", fontFamily: "Inter, sans-serif", margin: 0 }}>
        Your role determines what features you&apos;ll see after sign in.
      </p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      {[200, 160, 48].map((w, i) => (
        <div
          key={i}
          style={{
            width: `${w}px`, height: i === 2 ? "48px" : "16px",
            borderRadius: i === 2 ? "8px" : "4px",
            backgroundColor: "#f5f5f5",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function SelectRolePage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [confirmedRole, setConfirmedRole] = useState<Role | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("role") as Role | null;
    if (stored === "teacher" || stored === "student") {
      setConfirmedRole(stored);
      setPageState("ready");
    } else {
      setPageState("select");
    }
  }, []);

  const handleRoleSet = (role: Role) => {
    setConfirmedRole(role);
    setPageState("ready");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {pageState === "loading" && <Skeleton />}

      {pageState === "select" && (
        <RoleSelectUI onRoleSet={handleRoleSet} />
      )}

      {pageState === "ready" && confirmedRole === "teacher" && (
        <TeacherDashboardPreview />
      )}

      {pageState === "ready" && confirmedRole === "student" && (
        <StudentDashboardPreview />
      )}
    </div>
  );
}