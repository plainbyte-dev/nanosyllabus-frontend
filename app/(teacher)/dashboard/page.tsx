"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { apiFetch } from "../../lib/api";
import {
  BookOpen, Plus, Star, MessageSquare, Pencil, Trash2, LogOut,
  Settings, LayoutDashboard, Users, TrendingUp, TrendingDown,
  Activity, BarChart2, CheckCircle, Bell, Lightbulb, HelpCircle,
  AlertCircle, ChevronRight, X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface ActivityItem {
  id: string;
  type: "enrollment" | "rating" | "comment" | "quiz_submission" | "published";
  studentName?: string;
  studentInitials?: string;
  notebookTitle: string;
  timestamp: string;
  meta?: string; // e.g. "★ 5.0" or "Score: 78%"
}

interface PendingReview {
  id: string;
  studentName: string;
  studentInitials: string;
  quizTitle: string;
  score: number;
  submittedAt: string;
}

interface StatTrend {
  label: string;
  value: string;
  delta: string;
  positive: boolean | null; // null = neutral
}

// ─── Mock helpers (replace with real API calls) ───────────────────────────
// In production, fetch these from your backend endpoints.

function getMockActivity(): ActivityItem[] {
  return [
    { id: "1", type: "enrollment", studentName: "Aisha Sharma", studentInitials: "AS", notebookTitle: "Physics Vol. 2", timestamp: "5 min ago" },
    { id: "2", type: "rating", studentName: "Rohan K.", studentInitials: "RK", notebookTitle: "Calculus Basics", timestamp: "18 min ago", meta: "★ 5.0" },
    { id: "3", type: "comment", studentName: "Priya L.", studentInitials: "PL", notebookTitle: "Organic Chemistry", timestamp: "1 hr ago" },
    { id: "4", type: "quiz_submission", studentName: "Musa O.", studentInitials: "MO", notebookTitle: "History 101", timestamp: "3 hrs ago", meta: "Score: 78%" },
    { id: "5", type: "published", notebookTitle: "Calculus Basics", timestamp: "Yesterday" },
  ];
}

function getMockPendingReviews(): PendingReview[] {
  return [
    { id: "1", studentName: "Musa O.", studentInitials: "MO", quizTitle: "History Ch.4 Quiz", score: 78, submittedAt: "3 hrs ago" },
    { id: "2", studentName: "Priya L.", studentInitials: "PL", quizTitle: "Chem Midterm", score: 91, submittedAt: "5 hrs ago" },
    { id: "3", studentName: "Jin Park", studentInitials: "JP", quizTitle: "Physics Wave Optics", score: 65, submittedAt: "Yesterday" },
  ];
}

// ─── Small utilities ──────────────────────────────────────────────────────

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

// Stable color pairs per initials (not random, so they don't flicker)
const AVATAR_COLORS: [string, string][] = [
  ["#E1F5EE", "#0F6E56"],
  ["#EEEDFE", "#3C3489"],
  ["#FAEEDA", "#633806"],
  ["#FCEBEB", "#791F1F"],
  ["#E6F1FB", "#0C447C"],
  ["#EAF3DE", "#27500A"],
];
function avatarColor(initials: string): [string, string] {
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({ label, value, delta, positive }: StatTrend) {
  return (
    <div className="rounded-xl p-4 bg-white border border-black/[0.07]">
      <p className="text-xs text-black/40 mb-1.5">{label}</p>
      <p className="text-2xl font-semibold text-black mb-2">{value}</p>
      {delta && (
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            positive === true
              ? "bg-green-50 text-green-700"
              : positive === false
              ? "bg-amber-50 text-amber-700"
              : "bg-black/5 text-black/40"
          }`}
        >
          {positive === true ? (
            <TrendingUp size={11} />
          ) : positive === false ? (
            <TrendingDown size={11} />
          ) : null}
          {delta}
        </span>
      )}
    </div>
  );
}

function ActivityBadge({ type, meta }: { type: ActivityItem["type"]; meta?: string }) {
  const cfg: Record<ActivityItem["type"], { label: string; cls: string }> = {
    enrollment:      { label: "New",       cls: "bg-blue-50 text-blue-700" },
    rating:          { label: meta ?? "Rated", cls: "bg-green-50 text-green-700" },
    comment:         { label: "Comment",   cls: "bg-black/5 text-black/50" },
    quiz_submission: { label: "Pending",   cls: "bg-amber-50 text-amber-700" },
    published:       { label: "Published", cls: "bg-green-50 text-green-700" },
  };
  const { label, cls } = cfg[type];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cls}`}>
      {label}
    </span>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl bg-white border border-black/[0.07] p-4">
      <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-1.5">
        <Activity size={14} className="text-black/40" /> Recent activity
      </h3>
      <div className="flex flex-col divide-y divide-black/[0.05]">
        {items.map((item) => {
          const initials = item.studentInitials ?? "—";
          const [bg, fg] = avatarColor(initials);
          return (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                style={{ background: bg, color: fg }}
              >
                {item.type === "published" ? (
                  <BookOpen size={14} style={{ color: fg }} />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black truncate">
                  {item.type === "enrollment" && `${item.studentName} enrolled`}
                  {item.type === "rating" && `${item.studentName} rated ${item.meta}`}
                  {item.type === "comment" && `${item.studentName} left a comment`}
                  {item.type === "quiz_submission" && `${item.studentName} submitted a quiz`}
                  {item.type === "published" && `${item.notebookTitle} published`}
                </p>
                <p className="text-[11px] text-black/35 truncate">
                  {item.type !== "published" && `${item.notebookTitle} · `}
                  {item.timestamp}
                </p>
              </div>
              <ActivityBadge type={item.type} meta={item.meta} />
            </div>
          );
        })}
      </div>
      <button className="mt-3 w-full text-xs text-black/40 hover:text-black/70 flex items-center justify-center gap-1 transition-colors">
        View all activity <ChevronRight size={12} />
      </button>
    </div>
  );
}

function TopNotebooks({ notebooks }: { notebooks: Notebook[] }) {
  const sorted = [...notebooks].sort((a, b) => b.views - a.views).slice(0, 5);
  const max = sorted[0]?.views || 1;
  const COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#EF9F27", "#378ADD"];

  return (
    <div className="rounded-xl bg-white border border-black/[0.07] p-4">
      <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-1.5">
        <BarChart2 size={14} className="text-black/40" /> Top notebooks this week
      </h3>
      {sorted.length === 0 ? (
        <p className="text-xs text-black/35 py-4 text-center">No notebooks yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((nb, i) => (
            <div key={nb.id}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-black truncate max-w-[60%]">{nb.title}</span>
                <span className="text-[11px] text-black/35">{nb.views.toLocaleString()} views</span>
              </div>
              <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(nb.views / max) * 100}%`, background: COLORS[i] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingReviews({ reviews }: { reviews: PendingReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <div className="rounded-xl bg-white border border-black/[0.07] p-4">
      <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-1.5">
        <HelpCircle size={14} className="text-black/40" /> Pending quiz reviews
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
          {reviews.length} waiting
        </span>
      </h3>
      <div className="flex flex-col divide-y divide-black/[0.05]">
        {reviews.map((r) => {
          const [bg, fg] = avatarColor(r.studentInitials);
          return (
            <div key={r.id} className="flex items-center gap-3 py-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                style={{ background: bg, color: fg }}
              >
                {r.studentInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black truncate">{r.studentName} — {r.quizTitle}</p>
                <p className="text-[11px] text-black/35">{r.submittedAt}</p>
              </div>
              <span
                className={`text-[11px] font-semibold flex-shrink-0 ${
                  r.score >= 80 ? "text-green-600" : r.score >= 60 ? "text-amber-600" : "text-red-500"
                }`}
              >
                {r.score}%
              </span>
              <Link
                href={`/reviews/${r.id}`}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-black/10 text-black/50 hover:bg-black/5 transition-colors flex-shrink-0"
              >
                Review
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBanner({ count, onDismiss }: { count: number; onDismiss: () => void }) {
  if (count === 0) return null;
  return (
    <div className="rounded-xl bg-white border border-black/[0.07] px-4 py-3 flex items-center gap-3 flex-wrap">
      <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black">
          {count} student{count > 1 ? "s" : ""} awaiting feedback
        </p>
        <p className="text-xs text-black/40">Pending quiz submissions from the last 48 hours</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black/10 text-black/50 hover:bg-black/5 transition-colors"
        >
          <Bell size={12} /> Remind later
        </button>
        <Link
          href="/reviews"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-black text-white font-medium hover:bg-black/80 transition-colors"
        >
          <CheckCircle size={12} /> Review now
        </Link>
      </div>
      <button onClick={onDismiss} className="text-black/20 hover:text-black/40 transition-colors flex-shrink-0" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

function TipBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-3">
      <Lightbulb size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-800 mb-0.5">Add a quiz to boost engagement</p>
        <p className="text-xs text-blue-600">Notebooks with at least one quiz get 2× more student completions on average.</p>
      </div>
      <Link
        href="/notebooks/new?quiz=true"
        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        Add quiz
      </Link>
      <button onClick={onDismiss} className="text-blue-300 hover:text-blue-500 transition-colors flex-shrink-0" aria-label="Dismiss tip">
        <X size={14} />
      </button>
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
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${notebook.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      // Replace with your real delete call:
      // await apiFetch(`/notebooks/${notebook.id}/`, token, { method: "DELETE" });
      onDelete(notebook.id);
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-black/[0.07] bg-white hover:bg-black/[0.015] transition-colors">
      <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
        <BookOpen size={15} className="text-black/40" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-black truncate max-w-[200px]">{notebook.title}</p>
          <span className="text-xs px-2 py-0.5 rounded-md bg-black/5 text-black/45 border border-black/[0.07] flex-shrink-0">
            {notebook.subject}
          </span>
          {!notebook.published && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-black/5 text-black/30 flex-shrink-0">Draft</span>
          )}
          {notebook.free && notebook.published && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-black text-white flex-shrink-0">Free</span>
          )}
        </div>
        <p className="text-xs text-black/35">{notebook.docCount} docs · Updated {notebook.lastUpdated}</p>
      </div>

      <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
        <div className="text-center">
          <p className="text-sm font-semibold text-black">{notebook.studentCount.toLocaleString()}</p>
          <p className="text-[11px] text-black/30">students</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-black">{notebook.views.toLocaleString()}</p>
          <p className="text-[11px] text-black/30">views</p>
        </div>
        <div className="flex items-center gap-1">
          <Star size={11} fill="black" className="text-black" />
          <p className="text-sm font-semibold text-black">{notebook.rating > 0 ? notebook.rating : "—"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/notebooks/${notebook.id}/upload`}
          className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black/10 text-black/45 hover:bg-black/5 transition-colors"
        >
          <Plus size={12} /> Add docs
        </Link>
        <Link
          href={`/notebooks/${notebook.id}/edit`}
          className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-black/35 hover:bg-black/5 transition-colors"
          aria-label="Edit notebook"
        >
          <Pencil size={13} />
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-black/35 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40"
          aria-label="Delete notebook"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Error banner ────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-3">
      <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
      <p className="flex-1 text-xs text-red-700">{message}</p>
      <button onClick={onDismiss} className="text-red-300 hover:text-red-500 transition-colors" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    if (status !== "authenticated") return;
    let mounted = true;
    setLoading(true);
    setError(null);

    async function loadAll() {
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

        // Replace these with real API calls when ready:
        setActivity(getMockActivity());
        setPendingReviews(getMockPendingReviews());
      } catch (err) {
        if (mounted) setError("Failed to load your notebooks. Please refresh the page.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [status, session]);

  const filtered = notebooks.filter((n) =>
    filter === "all" ? true : filter === "published" ? n.published : !n.published
  );

  const totalStudents = notebooks.reduce((s, n) => s + n.studentCount, 0);
  const totalViews = notebooks.reduce((s, n) => s + n.views, 0);
  const avgRating = notebooks.length
    ? (notebooks.reduce((s, n) => s + n.rating, 0) / notebooks.length).toFixed(1)
    : "—";

  const stats: StatTrend[] = [
    { label: "Total notebooks", value: String(notebooks.length),           delta: "+2 this month",      positive: true },
    { label: "Total students",  value: totalStudents.toLocaleString(),      delta: "+48 this week",      positive: true },
    { label: "Total views",     value: totalViews.toLocaleString(),         delta: "-3% vs last month",  positive: false },
    { label: "Avg rating",      value: avgRating,                           delta: "Top 5% of teachers", positive: null },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F6]">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-black/[0.07] px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
            <BookOpen size={13} color="white" />
          </div>
          <span className="font-semibold text-sm text-black">TeacherOS</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 bg-black/[0.02]">
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <span className="hidden sm:block text-xs text-black/55 max-w-[120px] truncate">
              {user?.name ?? user?.email ?? "—"}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs text-black/45 hover:bg-black/5 transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-4 sm:px-6 py-8 pb-24 sm:pb-12 max-w-6xl mx-auto">

        {/* Greeting */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-black/30 mb-1">Teacher Dashboard</p>
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

        {/* Error */}
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Action banner */}
        {!bannerDismissed && pendingReviews.length > 0 && (
          <div className="mb-6">
            <ActionBanner count={pendingReviews.length} onDismiss={() => setBannerDismissed(true)} />
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Tip banner */}
        {!tipDismissed && notebooks.length > 0 && (
          <div className="mb-8">
            <TipBanner onDismiss={() => setTipDismissed(true)} />
          </div>
        )}

        {/* Two-column layout for activity + top notebooks */}
        {!loading && notebooks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <ActivityFeed items={activity} />
            <div className="flex flex-col gap-4">
              <TopNotebooks notebooks={notebooks} />
              <PendingReviews reviews={pendingReviews} />
            </div>
          </div>
        )}

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
                    filter === f ? "bg-black text-white" : "bg-black/5 text-black/45 hover:bg-black/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[68px] rounded-xl bg-white border border-black/[0.07] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((nb) => (
                <NotebookRow
                  key={nb.id}
                  notebook={nb}
                  onDelete={(id) => setNotebooks((prev) => prev.filter((n) => n.id !== id))}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-black/10 bg-white">
                  <p className="text-3xl mb-3">📚</p>
                  <p className="font-bold text-base text-black mb-1">No notebooks yet</p>
                  <p className="text-sm text-black/40 mb-4">Create your first notebook to get started</p>
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

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.07] flex items-center justify-around px-2 py-2 z-20">
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
              active ? "text-black" : "text-black/30 hover:text-black/55"
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