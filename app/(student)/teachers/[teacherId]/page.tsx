"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { apiFetch } from "../../../lib/api";
import {
  ArrowLeft, BookOpen, MessageSquare, ChevronRight,
  FileText, GraduationCap, Lock,
} from "lucide-react";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface Teacher {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
  notebook_count: number;
}

interface Notebook {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: Difficulty;
  is_free: boolean;
  doc_count: number;
  updated_at: string;
}

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string }> = {
  Beginner:     { bg: "#f0fdf4", text: "#16a34a" },
  Intermediate: { bg: "#fef3c7", text: "#d97706" },
  Advanced:     { bg: "#fee2e2", text: "#dc2626" },
};

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "T";
}

const AVATAR_COLORS = ["#d97706", "#059669", "#7c3aed", "#dc2626", "#0891b2", "#db2777"];
function avatarColor(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function NotebookCard({ notebook, teacherId }: { notebook: Notebook; teacherId: string }) {
  const diff = DIFFICULTY_COLORS[notebook.difficulty] ?? DIFFICULTY_COLORS.Beginner;

  return (
    <Link href={`/teachers/${teacherId}/chat?notebook=${notebook.id}`} className="block group">
      <div
        className="relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 cursor-pointer h-full"
        style={{
          background: notebook.is_free ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
          border: "1.5px solid rgba(10,10,15,0.1)",
        }}
      >
        {notebook.is_free ? (
          <div
            className="absolute top-4 right-4 px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{ background: "#d97706", color: "#fff" }}
          >
            Free
          </div>
        ) : (
          <div
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(10,10,15,0.06)" }}
          >
            <Lock size={13} style={{ color: "rgba(10,10,15,0.35)" }} />
          </div>
        )}

        <div className="flex items-start gap-3 mb-3 pr-12">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(10,10,15,0.06)" }}
          >
            <FileText size={16} style={{ color: "rgba(10,10,15,0.5)" }} />
          </div>
          <div>
            <p className="font-bold text-sm leading-snug" style={{ color: "#0a0a0f" }}>
              {notebook.title}
            </p>
            <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "rgba(10,10,15,0.5)" }}>
              {notebook.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: diff.bg, color: diff.text }}
          >
            {notebook.difficulty}
          </span>
          {notebook.subject && (
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: "rgba(10,10,15,0.06)", color: "rgba(10,10,15,0.5)" }}
            >
              {notebook.subject}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-4 pt-3"
          style={{ borderTop: "1px solid rgba(10,10,15,0.07)" }}
        >
          <div className="flex items-center gap-1">
            <BookOpen size={12} style={{ color: "rgba(10,10,15,0.35)" }} />
            <span className="text-xs" style={{ color: "rgba(10,10,15,0.45)" }}>
              {notebook.doc_count} chapters
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs" style={{ color: "rgba(10,10,15,0.35)" }}>
              {new Date(notebook.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div
          className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: "#d97706" }}
        >
          {notebook.is_free ? "Open notebook" : "Unlock notebook"}
          <ChevronRight size={13} />
        </div>
      </div>
    </Link>
  );
}

export default function TeacherProfilePage() {
  const params = useParams<{ teacherId: string }>();
  const teacherId = params.teacherId;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string>("All");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const session = await getSession();
        const token = session?.backendAccessToken;

        const [teacherData, notebooksData] = await Promise.all([
          apiFetch<Teacher>(`/student/teachers/${teacherId}`, token),
          apiFetch<Notebook[]>(`/student/teachers/${teacherId}/notebooks`, token),
        ]);

        if (!mounted) return;
        setTeacher(teacherData);
        setNotebooks(notebooksData);
      } catch (error) {
        console.error("Failed to load teacher profile", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [teacherId]);

  const subjects = Array.from(new Set(notebooks.map((n) => n.subject)));
  const filtered = activeSubject === "All" ? notebooks : notebooks.filter((n) => n.subject === activeSubject);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <p className="text-sm" style={{ color: "rgba(10,10,15,0.4)" }}>Loading…</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <p className="text-sm" style={{ color: "rgba(10,10,15,0.5)" }}>Teacher not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f5f0e8" }}>
      <div
        className="sticky top-0 z-20 px-6 py-4"
        style={{ background: "rgba(245,240,232,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(10,10,15,0.08)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/teachers"
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: "rgba(10,10,15,0.6)" }}
          >
            <ArrowLeft size={16} />
            All Teachers
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap size={18} style={{ color: "#d97706" }} />
            <span className="font-bold text-sm" style={{ color: "#0a0a0f" }}>TeacherOS</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Profile header */}
        <div
          className="rounded-3xl p-8 mb-8"
          style={{ background: "rgba(255,255,255,0.75)", border: "1.5px solid rgba(10,10,15,0.1)" }}
        >
          <div className="flex items-start gap-6">
            {teacher.picture ? (
              <img src={teacher.picture} alt={teacher.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{ background: avatarColor(teacher.id), color: "#fff" }}
              >
                {getInitials(teacher.name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-bold text-2xl mb-1" style={{ color: "#0a0a0f" }}>
                    {teacher.name}
                  </h1>
                  <p className="text-sm" style={{ color: "rgba(10,10,15,0.45)" }}>
                    {teacher.email}
                  </p>
                </div>
                <Link
                  href={`/teachers/${teacherId}/chat`}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 flex-shrink-0"
                  style={{ background: "#0a0a0f", color: "#f5f0e8" }}
                >
                  <MessageSquare size={15} />
                  Chat with AI
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} style={{ color: "rgba(10,10,15,0.4)" }} />
                  <span className="text-sm" style={{ color: "rgba(10,10,15,0.6)" }}>
                    {notebooks.length} notebooks
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notebooks */}
        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-bold text-xl" style={{ color: "#0a0a0f" }}>Notebooks</h2>
            {subjects.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveSubject("All")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: activeSubject === "All" ? "#0a0a0f" : "rgba(10,10,15,0.07)",
                    color: activeSubject === "All" ? "#f5f0e8" : "rgba(10,10,15,0.55)",
                  }}
                >
                  All ({notebooks.length})
                </button>
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSubject(s)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      background: activeSubject === s ? "#0a0a0f" : "rgba(10,10,15,0.07)",
                      color: activeSubject === s ? "#f5f0e8" : "rgba(10,10,15,0.55)",
                    }}
                  >
                    {s} ({notebooks.filter((n) => n.subject === s).length})
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((nb) => (
                <NotebookCard key={nb.id} notebook={nb} teacherId={teacherId} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📚</p>
              <p className="font-bold text-lg mb-2" style={{ color: "#0a0a0f" }}>No notebooks yet</p>
              <p className="text-sm" style={{ color: "rgba(10,10,15,0.45)" }}>
                This teacher hasn't published any notebooks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}