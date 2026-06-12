"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { apiFetch } from "../../lib/api";
import {
  BookOpen, Plus, Users, Star, TrendingUp, MessageSquare,
  Pencil, Trash2, LogOut, Settings, LayoutDashboard,
} from "lucide-react";

type Subject =
  | "Mathematics" | "Physics" | "Chemistry" | "Biology"
  | "Computer Science" | "Economics" | "History" | "Literature";

interface Notebook {
  id: string;
  title: string;
  subject: Subject;
  description: string;
  docCount: number;
  studentCount: number;
  views: number;
  rating: number;
  lastUpdated: string;
  published: boolean;
  free: boolean;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-4 bg-white border border-black/8">
      <p className="text-xs text-black/40 mb-1.5">{label}</p>
      <p className="text-2xl font-semibold text-black">{value}</p>
    </div>
  );
}

function NotebookRow({
  notebook,
  onDelete,
}: {
  notebook: Notebook;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-black/8 bg-white hover:bg-black/[0.02] transition-colors">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
        <BookOpen size={16} className="text-black/50" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-black truncate max-w-[200px]">
            {notebook.title}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-md bg-black/6 text-black/50 border border-black/8 flex-shrink-0">
            {notebook.subject}
          </span>
          {!notebook.published && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-black/5 text-black/35 flex-shrink-0">
              Draft
            </span>
          )}
          {notebook.free && notebook.published && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-black text-white flex-shrink-0">
              Free
            </span>
          )}
        </div>
        <p className="text-xs text-black/40">
          {notebook.docCount} docs · Updated {notebook.lastUpdated}
        </p>
      </div>

      {/* Stats — hidden on xs */}
      <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
        <div className="text-center">
          <p className="text-sm font-semibold text-black">{notebook.studentCount}</p>
          <p className="text-xs text-black/35">students</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-black">{notebook.views.toLocaleString()}</p>
          <p className="text-xs text-black/35">views</p>
        </div>
        <div className="flex items-center gap-1">
          <Star size={12} fill="black" className="text-black" />
          <p className="text-sm font-semibold text-black">
            {notebook.rating > 0 ? notebook.rating : "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/notebooks/${notebook.id}/upload`}
          className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black/10 text-black/50 hover:bg-black/5 transition-colors"
        >
          <Plus size={12} /> Add docs
        </Link>
        <Link
          href={`/notebooks/${notebook.id}/edit`}
          className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-black/40 hover:bg-black/5 transition-colors"
          aria-label="Edit notebook"
        >
          <Pencil size={13} />
        </Link>
        <button
          onClick={() => onDelete(notebook.id)}
          className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-black/40 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
          aria-label="Delete notebook"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    if (status !== "authenticated") return;

    let mounted = true;
    setLoading(true);

    async function loadNotebooks() {
      try {
        const data = await apiFetch<
          Array<{
            id: string;
            title: string;
            subject: Subject;
            description: string;
            doc_count: number;
            student_count: number;
            views: number;
            rating: number;
            updated_at: string;
            published: boolean;
            is_free: boolean;
          }>
        >("/notebooks/", (session as any)?.backendAccessToken);

        if (!mounted) return;

        setNotebooks(
          data.map((n) => ({
            id: n.id,
            title: n.title,
            subject: n.subject,
            description: n.description,
            docCount: n.doc_count,
            studentCount: n.student_count,
            views: n.views,
            rating: n.rating,
            lastUpdated: new Date(n.updated_at).toLocaleDateString(),
            published: n.published,
            free: n.is_free,
          }))
        );
      } catch (err) {
        console.error("Failed to load notebooks", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNotebooks();
    return () => {
      mounted = false;
    };
  }, [status, session]);

  const filtered = notebooks.filter((n) =>
    filter === "all" ? true : filter === "published" ? n.published : !n.published
  );

  const totalStudents = notebooks.reduce((s, n) => s + n.studentCount, 0);
  const totalViews = notebooks.reduce((s, n) => s + n.views, 0);
  const avgRating = notebooks.length
    ? (notebooks.reduce((s, n) => s + n.rating, 0) / notebooks.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-black/8 px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
            <BookOpen size={13} color="white" />
          </div>
          <span className="font-semibold text-sm text-black">TeacherOS</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 bg-black/[0.02]">
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <span className="hidden sm:block text-xs text-black/60 max-w-[120px] truncate">
              {user?.name ?? user?.email ?? "—"}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs text-black/50 hover:bg-black/5 transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
    <main className="px-4 sm:px-6 py-8 pb-24 sm:pb-8">

        {/* Greeting + New notebook */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-black/35 mb-1">
              Teacher Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
            </h1>
          </div>
          <Link
            href="/notebooks/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/80 transition-colors"
          >
            <Plus size={15} /> New notebook
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <StatCard label="Total notebooks" value={String(notebooks.length)} />
          <StatCard label="Total students"  value={totalStudents.toLocaleString()} />
          <StatCard label="Total views"     value={totalViews.toLocaleString()} />
          <StatCard label="Avg rating"      value={avgRating} />
        </div>

        {/* Notebooks list */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-semibold text-black">Your notebooks</h2>
            <div className="flex items-center gap-2">
              {(["all", "published", "draft"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    filter === f
                      ? "bg-black text-white"
                      : "bg-black/5 text-black/50 hover:bg-black/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-sm text-black/35">Loading notebooks…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((nb) => (
                <NotebookRow
                  key={nb.id}
                  notebook={nb}
                  onDelete={(id) =>
                    setNotebooks((prev) => prev.filter((n) => n.id !== id))
                  }
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-black/10">
                  <p className="text-3xl mb-3">📚</p>
                  <p className="font-bold text-base text-black mb-1">No notebooks yet</p>
                  <p className="text-sm text-black/40 mb-4">
                    Create your first notebook to get started
                  </p>
                  <Link
                    href="/notebooks/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-black text-white hover:bg-black/80 transition-colors"
                  >
                    <Plus size={14} /> New notebook
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile bottom nav (visible only on sm and below) ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/8 flex items-center justify-around px-2 py-2 z-20">
        {[
          { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
          { icon: BookOpen,        label: "Notebooks", href: "/notebooks" },
          { icon: Users,           label: "Students",  href: "/students" },
          { icon: MessageSquare,   label: "Messages",  href: "/messages" },
          { icon: Settings,        label: "Settings",  href: "/settings" },
        ].map(({ icon: Icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              active ? "text-black" : "text-black/35 hover:text-black/60"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}