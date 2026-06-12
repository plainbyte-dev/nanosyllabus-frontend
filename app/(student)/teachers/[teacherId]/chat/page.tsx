"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { apiFetch } from "../../../../lib/api";
import {
  ArrowLeft, Send, BookOpen, Sparkles, ChevronDown,
  FileText, RotateCcw, Copy, ThumbsUp, ThumbsDown,
  Loader2, GraduationCap, Bot,
} from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

interface Notebook {
  id: string;
  title: string;
  subject: string;
  chapterCount: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    document_id: string;
    chapter_title: string;
    text: string;
    score: number;
  }>;
}

// ── subject styles (dynamic fallback for unknown subjects) ─────────────────
const SUBJECT_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  Mathematics:        { bg: "#fef3c7", text: "#d97706", accent: "#d97706" },
  Physics:            { bg: "#fee2e2", text: "#dc2626", accent: "#dc2626" },
  Chemistry:          { bg: "#fdf4ff", text: "#9333ea", accent: "#9333ea" },
  Biology:            { bg: "#f0fdf4", text: "#16a34a", accent: "#16a34a" },
  "Computer Science": { bg: "#eff6ff", text: "#2563eb", accent: "#2563eb" },
  Economics:          { bg: "#f0f9ff", text: "#0891b2", accent: "#0891b2" },
  History:            { bg: "#fdf2f8", text: "#db2777", accent: "#db2777" },
  Literature:         { bg: "#f5f3ff", text: "#7c3aed", accent: "#7c3aed" },
};

const DEFAULT_STYLE = { bg: "#f5f5f5", text: "#666666", accent: "#666666" };

function subjectStyle(subject: string) {
  return SUBJECT_STYLES[subject] ?? DEFAULT_STYLE;
}

// ── message bubble ─────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  teacherName,
  accentColor,
}: {
  msg: Message;
  teacherName: string;
  accentColor: string;
}) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderContent = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("> "))
        return (
          <blockquote key={i} className="border-l-2 pl-3 my-2 italic"
            style={{ borderColor: accentColor, color: "rgba(10,10,15,0.6)" }}>
            {line.slice(2)}
          </blockquote>
        );
      if (line === "") return <div key={i} className="h-2" />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="leading-relaxed">
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
        </p>
      );
    });

  if (isUser)
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm"
          style={{ background: "#0a0a0f", color: "#f5f0e8" }}>
          {msg.content}
        </div>
      </div>
    );

  return (
    <div className="flex items-start gap-3 mb-6 group">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
        style={{ background: accentColor, color: "#fff" }}>
        AI
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(10,10,15,0.4)" }}>
          {teacherName}&apos;s AI Clone
        </p>
        <div className="rounded-2xl rounded-tl-sm px-5 py-4 text-sm leading-relaxed"
          style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(10,10,15,0.08)", color: "#0a0a0f" }}>
          {renderContent(msg.content)}
        </div>
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
            style={{ background: "rgba(10,10,15,0.06)", color: "rgba(10,10,15,0.45)" }}>
            <Copy size={11} /> {copied ? "Copied!" : "Copy"}
          </button>
          <button className="p-1.5 rounded-lg"
            style={{ background: "rgba(10,10,15,0.06)", color: "rgba(10,10,15,0.45)" }}>
            <ThumbsUp size={11} />
          </button>
          <button className="p-1.5 rounded-lg"
            style={{ background: "rgba(10,10,15,0.06)", color: "rgba(10,10,15,0.45)" }}>
            <ThumbsDown size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────
export default function NotebookChatPage() {
  const params = useParams<{ teacherId: string }>();
  const searchParams = useSearchParams();
  const teacherId = params.teacherId;
  const initialNotebookId = searchParams.get("notebook");

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [notebookOpen, setNotebookOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageIdRef = useRef(0);
  const nextId = () => `msg-${++messageIdRef.current}`;

  // ── load teacher + notebooks on mount ─────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const session = await getSession();
        const token = (session as any)?.backendAccessToken;

        const [teacherData, notebooksData] = await Promise.all([
          apiFetch<Teacher>(`/student/teachers/${teacherId}`, token),
          apiFetch<Array<{
            id: string;
            title: string;
            subject: string;
            doc_count: number;
          }>>(`/student/teachers/${teacherId}/notebooks`, token),
        ]);

        if (!mounted) return;

        const mapped: Notebook[] = notebooksData.map((n) => ({
          id: n.id,
          title: n.title,
          subject: n.subject,
          chapterCount: n.doc_count,
        }));

        setTeacher(teacherData);
        setNotebooks(mapped);

        const initial =
          mapped.find((n) => n.id === initialNotebookId) ?? mapped[0] ?? null;
        setActiveNotebook(initial);

        if (initial) {
          setMessages([welcomeMessage(teacherData.name, initial)]);
        }
      } catch (err) {
        console.error("Failed to load page data", err);
      } finally {
        if (mounted) setPageLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [teacherId, initialNotebookId]);

  // ── scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function welcomeMessage(teacherName: string, nb: Notebook): Message {
    return {
      id: nextId(),
      role: "assistant",
      content: `Hi! I'm ${teacherName}'s AI clone, trained on **${nb.title}**.\n\nAsk me anything from this notebook — definitions, solved problems, concept explanations, or practice questions.`,
      timestamp: new Date(),
    };
  }

  const handleSend = async (text?: string) => {
  const content = (text ?? input).trim();
  if (!content || loading || !activeNotebook) return;
  if (content.length < 3) return; // matches backend min_length
  setInput("");

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const session = await getSession();
      const response = await apiFetch<ChatResponse>(
  `/student/notebooks/${activeNotebook.id}/chat`,
  (session as any)?.backendAccessToken,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: content, top_k: 5 }),
  },
);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: response.answer, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error("Chat failed", err);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (!activeNotebook || !teacher) return;
    setMessages([welcomeMessage(teacher.name, activeNotebook)]);
  };

  const switchNotebook = (nb: Notebook) => {
    setActiveNotebook(nb);
    setNotebookOpen(false);
    setMessages([
      {
        id: nextId(),
        role: "assistant",
        content: `Switched to **${nb.title}**.\n\nI'm now drawing from ${nb.chapterCount} documents of ${teacher?.name ?? "the teacher"}'s notes on ${nb.subject}. What would you like to explore?`,
        timestamp: new Date(),
      },
    ]);
  };

  // ── loading state ──────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#f5f0e8" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(10,10,15,0.4)" }}>
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  const style = activeNotebook ? subjectStyle(activeNotebook.subject) : DEFAULT_STYLE;
  const teacherName = teacher?.name ?? "Teacher";

  return (
    <div className="flex flex-col h-screen" style={{ background: "#f5f0e8" }}>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center gap-3"
        style={{ background: "rgba(245,240,232,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(10,10,15,0.08)" }}>

        <Link href={`/teachers/${teacherId}`}
          className="flex items-center gap-1.5 text-xs font-medium hover:opacity-60 flex-shrink-0"
          style={{ color: "rgba(10,10,15,0.5)" }}>
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="w-px h-5 mx-1" style={{ background: "rgba(10,10,15,0.12)" }} />

        {/* Notebook switcher */}
        <div className="flex-1 relative">
          <button onClick={() => setNotebookOpen(!notebookOpen)}
            className="flex items-center gap-2.5 max-w-sm text-left">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: style.bg }}>
              <FileText size={13} style={{ color: style.text }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: "#0a0a0f", maxWidth: "220px" }}>
                {activeNotebook?.title ?? "Select a notebook"}
              </p>
              <p className="text-xs" style={{ color: "rgba(10,10,15,0.45)" }}>
                {activeNotebook ? `${activeNotebook.subject} · ${activeNotebook.chapterCount} docs` : "—"}
              </p>
            </div>
            <ChevronDown size={14} style={{
              color: "rgba(10,10,15,0.4)",
              transform: notebookOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              flexShrink: 0,
            }} />
          </button>

          {notebookOpen && notebooks.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl overflow-hidden z-30"
              style={{ background: "#fff", border: "1.5px solid rgba(10,10,15,0.1)", boxShadow: "0 8px 32px rgba(10,10,15,0.1)" }}>
              <div className="p-3">
                <p className="text-xs font-semibold px-2 py-1 mb-1" style={{ color: "rgba(10,10,15,0.4)" }}>
                  SWITCH NOTEBOOK
                </p>
                {notebooks.map((nb) => {
                  const s = subjectStyle(nb.subject);
                  const active = nb.id === activeNotebook?.id;
                  return (
                    <button key={nb.id} onClick={() => switchNotebook(nb)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                      style={{ background: active ? "#0a0a0f" : "transparent" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? "rgba(255,255,255,0.15)" : s.bg }}>
                        <BookOpen size={13} style={{ color: active ? "#fff" : s.text }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate"
                          style={{ color: active ? "#f5f0e8" : "#0a0a0f" }}>{nb.title}</p>
                        <p className="text-xs" style={{ color: active ? "rgba(245,240,232,0.5)" : "rgba(10,10,15,0.4)" }}>
                          {nb.subject} · {nb.chapterCount} docs
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleReset}
            className="p-2 rounded-lg"
            style={{ background: "rgba(10,10,15,0.07)", color: "rgba(10,10,15,0.5)" }}
            title="New conversation">
            <RotateCcw size={14} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: style.bg, color: style.text }}>
            <Sparkles size={11} /> AI Clone
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">

          {/* Context banner */}
          {activeNotebook && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-8"
              style={{ background: style.bg, border: `1px solid ${style.text}25` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: style.text }}>
                <Bot size={14} color="#fff" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: style.text }}>
                  {teacherName} · AI Clone
                </p>
                <p className="text-xs" style={{ color: `${style.text}99` }}>
                  Answering from &quot;{activeNotebook.title}&quot; ({activeNotebook.chapterCount} docs)
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} teacherName={teacherName} accentColor={style.accent} />
          ))}

          {loading && (
            <div className="flex items-start gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: style.accent, color: "#fff" }}>
                AI
              </div>
              <div className="rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(10,10,15,0.08)" }}>
                <Loader2 size={14} className="animate-spin" style={{ color: style.accent }} />
                <span className="text-sm" style={{ color: "rgba(10,10,15,0.45)" }}>Thinking…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3"
        style={{ borderTop: "1px solid rgba(10,10,15,0.07)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 rounded-2xl px-4 py-3"
            style={{ background: "#fff", border: "1.5px solid rgba(10,10,15,0.12)" }}>
            <GraduationCap size={16} className="mb-0.5 flex-shrink-0" style={{ color: "rgba(10,10,15,0.3)" }} />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={activeNotebook ? `Ask about ${activeNotebook.subject}…` : "Select a notebook to start…"}
              disabled={!activeNotebook}
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
              style={{ color: "#0a0a0f", maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || !activeNotebook}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: input.trim() ? "#0a0a0f" : "rgba(10,10,15,0.1)",
                color: input.trim() ? "#f5f0e8" : "rgba(10,10,15,0.4)",
              }}
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: "rgba(10,10,15,0.3)" }}>
            Answers are based on {teacherName}&apos;s notebooks ·{" "}
            <kbd className="font-mono">Enter</kbd> to send,{" "}
            <kbd className="font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}