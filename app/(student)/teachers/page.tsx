"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { Search, BookOpen, Users, SlidersHorizontal, X, GraduationCap } from "lucide-react";
import { apiFetch } from "../../lib/api";

interface Teacher {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
  notebook_count: number;
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "T";
}

const AVATAR_COLORS = ["#d97706", "#059669", "#7c3aed", "#dc2626", "#0891b2", "#db2777"];

function avatarColor(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  return (
    <Link href={`/teachers/${teacher.id}`} className="block group">
      <div
        className="relative rounded-2xl p-6 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1 cursor-pointer h-full"
        style={{
          background: "rgba(255,255,255,0.8)",
          border: "1.5px solid rgba(10,10,15,0.1)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          {teacher.picture ? (
            <img
              src={teacher.picture}
              alt={teacher.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: avatarColor(teacher.id), color: "#fff" }}
            >
              {getInitials(teacher.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight truncate" style={{ color: "#0a0a0f" }}>
              {teacher.name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(10,10,15,0.45)" }}>
              {teacher.email}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-4 pt-4"
          style={{ borderTop: "1px solid rgba(10,10,15,0.08)" }}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} style={{ color: "rgba(10,10,15,0.4)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(10,10,15,0.6)" }}>
              {teacher.notebook_count} notebooks
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StudentDiscoverPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "notebooks">("notebooks");

  useEffect(() => {
    let mounted = true;
    async function loadTeachers() {
      try {
        const session = await getSession();
        const data = await apiFetch<Teacher[]>("/student/teachers", session?.backendAccessToken);
        if (mounted) setTeachers(data);
      } catch (error) {
        console.error("Failed to load teachers", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadTeachers();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = teachers;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      sortBy === "notebooks" ? b.notebook_count - a.notebook_count : a.name.localeCompare(b.name)
    );
  }, [teachers, query, sortBy]);

  return (
    <div className="min-h-screen" style={{ background: "#f5f0e8" }}>
      <div
        className="sticky top-0 z-20 px-6 py-4"
        style={{ background: "rgba(245,240,232,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(10,10,15,0.08)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} style={{ color: "#d97706" }} />
            <span className="font-bold text-base" style={{ color: "#0a0a0f" }}>TeacherOS</span>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(10,10,15,0.06)", color: "rgba(10,10,15,0.5)" }}>
            Student Portal
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: "#d97706" }}>Discover</p>
          <h1 className="font-display text-4xl font-bold leading-tight mb-2" style={{ color: "#0a0a0f" }}>
            Find your <em style={{ color: "#d97706" }}>teacher.</em>
          </h1>
          <p className="text-sm" style={{ color: "rgba(10,10,15,0.5)" }}>
            {loading ? "Loading teachers…" : `Browse ${teachers.length} teacher${teachers.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-4"
          style={{ background: "#fff", border: "1.5px solid rgba(10,10,15,0.12)" }}
        >
          <Search size={18} style={{ color: "rgba(10,10,15,0.35)", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#0a0a0f" }}
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={15} style={{ color: "rgba(10,10,15,0.35)" }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs" style={{ color: "rgba(10,10,15,0.4)" }}>Sort:</span>
            {(["notebooks", "name"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                style={{
                  background: sortBy === opt ? "#0a0a0f" : "rgba(10,10,15,0.07)",
                  color: sortBy === opt ? "#f5f0e8" : "rgba(10,10,15,0.55)",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs mb-5" style={{ color: "rgba(10,10,15,0.4)" }}>
          {filtered.length} teacher{filtered.length !== 1 ? "s" : ""} found
        </p>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: "rgba(10,10,15,0.4)" }}>Loading…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => <TeacherCard key={t.id} teacher={t} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-lg mb-2" style={{ color: "#0a0a0f" }}>No teachers found</p>
            <p className="text-sm" style={{ color: "rgba(10,10,15,0.45)" }}>Try a different search</p>
          </div>
        )}
      </div>
    </div>
  );
}