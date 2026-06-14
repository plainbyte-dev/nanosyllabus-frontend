"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, BookOpen, GraduationCap, QrCode } from "lucide-react";
import { signIn } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = "login" | "register";
type Role = "teacher" | "student";
type FieldState = "idle" | "active" | "filled" | "error";

interface FormField {
  value: string;
  state: FieldState;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeField = (value = ""): FormField => ({ value, state: "idle" });

const updateField = (
  setter: React.Dispatch<React.SetStateAction<FormField>>,
  val: string
) => setter((f) => ({ ...f, value: val, state: val ? "filled" : "active", error: undefined }));

const focusField = (setter: React.Dispatch<React.SetStateAction<FormField>>) =>
  setter((f) => ({ ...f, state: "active" }));

const blurField = (
  setter: React.Dispatch<React.SetStateAction<FormField>>,
  val: string
) => setter((f) => ({ ...f, state: val ? "filled" : "idle" }));

const fieldBorder = (f: FormField): string =>
  f.state === "error" ? "1px solid #ef4444" : f.state === "active" ? "1px solid #0a0a0a" : "1px solid #e5e5e5";

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleToggle({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div
      style={{
        display: "flex",
        border: "1px solid #0a0a0a",
        borderRadius: "9999px",
        overflow: "hidden",
      }}
    >
      {(["teacher", "student"] as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          style={{
            flex: 1,
            height: "42px",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            backgroundColor: role === r ? "#0a0a0a" : "#ffffff",
            color: role === r ? "#ffffff" : "#0a0a0a",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          {r === "teacher" ? <BookOpen size={14} /> : <GraduationCap size={14} />}
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  );
}

interface InputFieldProps {
  type?: string;
  placeholder: string;
  field: FormField;
  onChange: (val: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  rightSlot?: React.ReactNode;
}

function InputField({ type = "text", placeholder, field, onChange, onFocus, onBlur, rightSlot }: InputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "48px",
          border: fieldBorder(field),
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          transition: "border-color 0.15s",
        }}
      >
        <input
          type={type}
          value={field.value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            outline: "none",
            padding: "0 14px",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            color: "#0a0a0a",
            backgroundColor: "transparent",
          }}
        />
        {rightSlot}
      </div>
      {field.state === "error" && field.error && (
        <span style={{ fontSize: "12px", color: "#ef4444", fontFamily: "Inter, sans-serif" }}>
          {field.error}
        </span>
      )}
    </div>
  );
}

interface SelectFieldProps {
  placeholder: string;
  options: string[];
  field: FormField;
  onChange: (val: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

function SelectField({ placeholder, options, field, onChange, onFocus, onBlur }: SelectFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: "48px",
          border: fieldBorder(field),
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          transition: "border-color 0.15s",
        }}
      >
        <select
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            outline: "none",
            padding: "0 36px 0 14px",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            color: field.value ? "#0a0a0a" : "#a3a3a3",
            backgroundColor: "transparent",
            appearance: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          <option value="" disabled hidden>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ color: "#0a0a0a" }}>{opt}</option>
          ))}
        </select>
        <span
          style={{
            position: "absolute",
            right: "12px",
            color: "#a3a3a3",
            pointerEvents: "none",
            fontSize: "11px",
          }}
        >
          ▼
        </span>
      </div>
      {field.state === "error" && field.error && (
        <span style={{ fontSize: "12px", color: "#ef4444", fontFamily: "Inter, sans-serif" }}>
          {field.error}
        </span>
      )}
    </div>
  );
}

function Divider({ label = "or" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e5e5" }} />
      <span style={{ fontSize: "13px", color: "#a3a3a3", fontFamily: "Inter, sans-serif" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e5e5" }} />
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [role, setRole] = useState<Role>("teacher");
  const [email, setEmail] = useState<FormField>(makeField());
  const [password, setPassword] = useState<FormField>(makeField());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/selectRole" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      setEmail((f) => ({ ...f, state: "error", error: "Please enter a valid email" }));
      hasError = true;
    }
    if (!password.value || password.value.length < 6) {
      setPassword((f) => ({ ...f, state: "error", error: "Password must be at least 6 characters" }));
      hasError = true;
    }
    if (!hasError) {
      setLoading(true);
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif", marginBottom: "6px", lineHeight: "1.2" }}>
          Welcome back
        </h1>
        <p style={{ fontSize: "14px", color: "#737373", fontFamily: "Inter, sans-serif", margin: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#0a0a0a", fontWeight: 500, textDecoration: "underline" }}>
            Create one free
          </Link>
        </p>
      </div>

      {/* Role toggle */}
      <div style={{ marginBottom: "20px" }}>
        <RoleToggle role={role} onChange={setRole} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <InputField
          type="email"
          placeholder={role === "teacher" ? "professor@university.edu" : "student@university.edu"}
          field={email}
          onChange={(v) => updateField(setEmail, v)}
          onFocus={() => focusField(setEmail)}
          onBlur={() => blurField(setEmail, email.value)}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <InputField
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            field={password}
            onChange={(v) => updateField(setPassword, v)}
            onFocus={() => focusField(setPassword)}
            onBlur={() => blurField(setPassword, password.value)}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 14px", display: "flex", alignItems: "center", color: "#a3a3a3" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href="/forgot-password" style={{ fontSize: "13px", color: "#737373", textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="checkbox" id="remember" style={{ accentColor: "#0a0a0a", width: "14px", height: "14px" }} />
          <label htmlFor="remember" style={{ fontSize: "13px", color: "#737373", fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
            Keep me signed in for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: loading ? "#737373" : "#0a0a0a",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "4px",
            transition: "background-color 0.15s",
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Signing in…
            </>
          ) : (
            `Sign in as ${role === "teacher" ? "Teacher" : "Student"}`
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{ margin: "20px 0" }}>
        <Divider label="or continue with" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        style={{
          width: "100%",
          height: "48px",
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          border: "1px solid #0a0a0a",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "16px",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
      >
        <span style={{ fontWeight: 700, fontSize: "16px" }}>G</span>
        Continue with Google
      </button>

      <div style={{ marginBottom: "16px" }}>
        <Divider />
      </div>

      {/* QR */}
      <button
        type="button"
        style={{
          width: "100%",
          height: "48px",
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          border: "1px solid #0a0a0a",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "28px",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
      >
        <QrCode size={16} />
        Scan a QR code to access resource
      </button>

      {/* Student note */}
      {role === "student" && (
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#737373", fontFamily: "Inter, sans-serif", margin: 0, lineHeight: "1.5" }}>
            Your teacher will share a link or profile code to access their notebooks.{" "}
            <a href="#" style={{ color: "#0a0a0a", fontWeight: 500 }}>Learn how to find your teacher →</a>
          </p>
        </div>
      )}

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: "13px", color: "#737373", fontFamily: "Inter, sans-serif", margin: 0 }}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: "none", border: "none", color: "#0a0a0a", fontWeight: 500, fontSize: "13px", fontFamily: "Inter, sans-serif", cursor: "pointer", textDecoration: "underline", padding: 0 }}
        >
          Request access
        </button>
      </p>
    </div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [role, setRole] = useState<Role>("student");
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fullName, setFullName] = useState<FormField>(makeField());
  const [email, setEmail] = useState<FormField>(makeField());
  const [grade, setGrade] = useState<FormField>(makeField());
  const [subject, setSubject] = useState<FormField>(makeField());
  const [password, setPassword] = useState<FormField>(makeField());
  const [confirm, setConfirm] = useState<FormField>(makeField());

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setGrade(makeField());
    setSubject(makeField());
  };

  const handleSubmit = () => {
    let hasError = false;

    if (!fullName.value.trim()) {
      setFullName((f) => ({ ...f, state: "error", error: "Full name is required" }));
      hasError = true;
    }
    if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      setEmail((f) => ({ ...f, state: "error", error: "Please enter a valid email" }));
      hasError = true;
    }
    if (role === "student" && !grade.value) {
      setGrade((f) => ({ ...f, state: "error", error: "Please select your grade" }));
      hasError = true;
    }
    if (role === "teacher" && !subject.value) {
      setSubject((f) => ({ ...f, state: "error", error: "Please select your subject" }));
      hasError = true;
    }
    if (!password.value || password.value.length < 6) {
      setPassword((f) => ({ ...f, state: "error", error: "Password must be at least 6 characters" }));
      hasError = true;
    }
    if (confirm.value !== password.value) {
      setConfirm((f) => ({ ...f, state: "error", error: "Passwords do not match" }));
      hasError = true;
    }
    if (!agreed) hasError = true;

    if (!hasError) setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", paddingTop: "32px" }}>
        <div style={{ width: "48px", height: "48px", backgroundColor: "#0a0a0a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 13 4 10" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif", marginBottom: "8px" }}>Account created!</h2>
          <p style={{ fontSize: "14px", color: "#737373", fontFamily: "Inter, sans-serif", maxWidth: "320px", margin: "0 auto" }}>
            Check your email for next steps or wait for teacher approval.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitch}
          style={{ height: "48px", padding: "0 32px", backgroundColor: "#ffffff", color: "#0a0a0a", border: "1px solid #0a0a0a", borderRadius: "8px", fontSize: "14px", fontWeight: 500, fontFamily: "Inter, sans-serif", cursor: "pointer", marginTop: "8px" }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const gradeOptions = ["Grade 11", "Grade 12"];
  const subjectOptions = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "Nepali", "Computer Science", "Accountancy", "Economics"];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif", marginBottom: "6px", lineHeight: "1.2" }}>
          Create your account
        </h1>
        <p style={{ fontSize: "14px", color: "#737373", fontFamily: "Inter, sans-serif", margin: 0 }}>
          Join ShikshaHub and start learning
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <RoleToggle role={role} onChange={handleRoleChange} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        <InputField
          placeholder="Full name"
          field={fullName}
          onChange={(v) => updateField(setFullName, v)}
          onFocus={() => focusField(setFullName)}
          onBlur={() => blurField(setFullName, fullName.value)}
        />
        <InputField
          type="email"
          placeholder="Email address"
          field={email}
          onChange={(v) => updateField(setEmail, v)}
          onFocus={() => focusField(setEmail)}
          onBlur={() => blurField(setEmail, email.value)}
        />

        {role === "student" ? (
          <SelectField
            placeholder="Grade"
            options={gradeOptions}
            field={grade}
            onChange={(v) => updateField(setGrade, v)}
            onFocus={() => focusField(setGrade)}
            onBlur={() => blurField(setGrade, grade.value)}
          />
        ) : (
          <SelectField
            placeholder="Subject specialty"
            options={subjectOptions}
            field={subject}
            onChange={(v) => updateField(setSubject, v)}
            onFocus={() => focusField(setSubject)}
            onBlur={() => blurField(setSubject, subject.value)}
          />
        )}

        <InputField
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          field={password}
          onChange={(v) => updateField(setPassword, v)}
          onFocus={() => focusField(setPassword)}
          onBlur={() => blurField(setPassword, password.value)}
          rightSlot={
            <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 14px", display: "flex", alignItems: "center", color: "#a3a3a3" }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <InputField
          type={showConfirm ? "text" : "password"}
          placeholder="Confirm password"
          field={confirm}
          onChange={(v) => updateField(setConfirm, v)}
          onFocus={() => focusField(setConfirm)}
          onBlur={() => blurField(setConfirm, confirm.value)}
          rightSlot={
            <button type="button" onClick={() => setShowConfirm((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 14px", display: "flex", alignItems: "center", color: "#a3a3a3" }}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </div>

      {/* Checkbox */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setAgreed((v) => !v)}
          style={{
            width: "16px",
            height: "16px",
            minWidth: "16px",
            border: `1.5px solid ${agreed ? "#0a0a0a" : "#a3a3a3"}`,
            borderRadius: "3px",
            backgroundColor: agreed ? "#0a0a0a" : "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "1px",
          }}
        >
          {agreed && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 13 4 10" />
            </svg>
          )}
        </button>
        <span style={{ fontSize: "13px", color: "#737373", fontFamily: "Inter, sans-serif", lineHeight: "1.4" }}>
          I agree to the terms of use and privacy policy.
        </span>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        style={{
          width: "100%",
          height: "48px",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          marginBottom: "16px",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Create account
      </button>

      {/* Student notice */}
      {role === "student" && (
        <div style={{ backgroundColor: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "24px" }}>
          <span style={{ fontSize: "16px", minWidth: "16px", marginTop: "1px", color: "#737373" }}>ℹ</span>
          <p style={{ fontSize: "13px", color: "#737373", fontFamily: "Inter, sans-serif", margin: 0, lineHeight: "1.5" }}>
            Student accounts need teacher approval. You&apos;ll receive an email once a teacher grants you access.
          </p>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: "13px", color: "#737373", fontFamily: "Inter, sans-serif", margin: role === "teacher" ? "8px 0 0" : "0" }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: "none", border: "none", color: "#0a0a0a", fontWeight: 500, fontSize: "13px", fontFamily: "Inter, sans-serif", cursor: "pointer", textDecoration: "underline", padding: 0 }}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
  const features = [
    "Access Physics, Chemistry, Maths & more",
    "Get resources via QR code or email invite",
    "Grade 11 & 12 · Nepal NEB curriculum",
  ];
  const pills = ["Physics", "Chemistry", "Mathematics", "Biology", "Nepali"];

  return (
    <div style={{ backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: "32px", left: "32px" }}>
        <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "20px", fontFamily: "Inter, sans-serif" }}>ShikshaHub</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px" }}>
        <div style={{ maxWidth: "420px" }}>
          <h1 style={{ color: "#ffffff", fontSize: "40px", fontWeight: 700, fontFamily: "Inter, sans-serif", lineHeight: "1.15", marginBottom: "32px" }}>
            The best NEB teachers.<br />Right in your pocket.
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
            {features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "20px", height: "20px", minWidth: "20px", border: "1.5px solid #ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 13 4 10" />
                  </svg>
                </div>
                <span style={{ color: "#ffffff", fontSize: "15px", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {pills.map((pill) => (
              <span key={pill} style={{ color: "#ffffff", fontSize: "12px", fontFamily: "Inter, sans-serif", border: "1px solid #ffffff", borderRadius: "9999px", padding: "4px 12px" }}>
                {pill}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "#a3a3a3", fontFamily: "Inter, sans-serif", margin: 0 }}>Trusted by students across Nepal.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page Toggle ──────────────────────────────────────────────────────────────

function PageToggle({ page, onSwitch }: { page: Page; onSwitch: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "24px" }}>
      {(["login", "register"] as Page[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => p !== page && onSwitch()}
          style={{
            background: "none",
            border: "none",
            fontSize: "13px",
            fontFamily: "Inter, sans-serif",
            fontWeight: page === p ? 700 : 400,
            color: page === p ? "#0a0a0a" : "#a3a3a3",
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: page === p ? "2px solid #0a0a0a" : "2px solid transparent",
            transition: "color 0.15s",
          }}
        >
          {p === "login" ? "Sign in" : "Register"}
        </button>
      ))}
    </div>
  );
}

// ─── Mobile Layout ────────────────────────────────────────────────────────────

function MobileLayout({ page, onSwitch }: { page: Page; onSwitch: () => void }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}>
      <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter, sans-serif" }}>ShikshaHub</span>
        </div>
        <PageToggle page={page} onSwitch={onSwitch} />
      </div>
      <div style={{ padding: "32px 24px 48px" }}>
        {page === "login" ? <LoginForm onSwitch={onSwitch} /> : <RegisterForm onSwitch={onSwitch} />}
      </div>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [page, setPage] = useState<Page>("login");
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  const toggle = () => setPage((p) => (p === "login" ? "register" : "login"));

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Preview switcher — remove in production
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 100, display: "flex", gap: "4px", backgroundColor: "#0a0a0a", borderRadius: "9999px", padding: "4px" }}>
        {["Desktop", "Mobile"].map((label) => {
          const active = label === "Mobile" ? isMobilePreview : !isMobilePreview;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setIsMobilePreview(label === "Mobile")}
              style={{
                padding: "6px 14px", borderRadius: "9999px", border: "none",
                backgroundColor: active ? "#ffffff" : "transparent",
                color: active ? "#0a0a0a" : "#a3a3a3",
                fontSize: "12px", fontWeight: 500, fontFamily: "Inter, sans-serif", cursor: "pointer",
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div> */}

      {isMobilePreview ? (
        <div style={{ minHeight: "100vh", backgroundColor: "#e5e5e5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 0" }}>
          <div style={{ width: "390px", boxShadow: "0 0 0 1px #d4d4d4, 0 20px 60px rgba(0,0,0,0.15)", borderRadius: "12px", overflow: "hidden" }}>
            <MobileLayout page={page} onSwitch={toggle} />
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
          <LeftPanel />
          <div style={{ backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", minHeight: "100vh", overflowY: "auto" }}>
            <div style={{ width: "100%", maxWidth: "400px" }}>
              <PageToggle page={page} onSwitch={toggle} />
              {page === "login" ? <LoginForm onSwitch={toggle} /> : <RegisterForm onSwitch={toggle} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}