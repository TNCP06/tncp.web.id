"use client";

import { useState } from "react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    website: "", // honeypot — stays empty for real users
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "", website: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {status === "success" ? (
        <div style={{ padding: "1.5rem 1rem", border: "1px dashed var(--line-strong)", borderRadius: "8px", textAlign: "center" }}>
          <div
            className="mono"
            style={{
              color: "var(--blue)",
              fontWeight: 700,
              fontSize: "0.8rem",
              marginBottom: "0.5rem",
            }}
          >
            [ ACKNOWLEDGED ]
          </div>
          <h4 className="name" style={{ fontSize: "1.1rem", margin: "0 0 0.5rem" }}>
            Message Sent Successfully
          </h4>
          <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", margin: 0, lineHeight: "1.5" }}>
            Thank you. Your request was logged, and I will get back to you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Honeypot: off-screen, not tabbable, hidden from screen readers. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={formData.website}
            onChange={handleChange}
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label htmlFor="name" className="mono" style={{ fontSize: "0.7rem", color: "var(--slate)" }}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={status === "sending"}
              style={{
                background: "var(--paper-input)",
                border: "2px solid var(--line)",
                borderRadius: "6px",
                padding: "0.65rem 0.85rem",
                color: "var(--ink)",
                fontSize: "0.88rem",
                width: "100%",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label htmlFor="email" className="mono" style={{ fontSize: "0.7rem", color: "var(--slate)" }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              disabled={status === "sending"}
              style={{
                background: "var(--paper-input)",
                border: "2px solid var(--line)",
                borderRadius: "6px",
                padding: "0.65rem 0.85rem",
                color: "var(--ink)",
                fontSize: "0.88rem",
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label htmlFor="message" className="mono" style={{ fontSize: "0.7rem", color: "var(--slate)" }}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              placeholder="How can I help you?..."
              disabled={status === "sending"}
              rows={4}
              style={{
                background: "var(--paper-input)",
                border: "2px solid var(--line)",
                borderRadius: "6px",
                padding: "0.65rem 0.85rem",
                color: "var(--ink)",
                fontSize: "0.88rem",
                resize: "vertical",
                width: "100%",
              }}
            />
          </div>

          {status === "error" && (
            <p className="mono" style={{ color: "#f7768e", fontSize: "0.7rem", margin: 0 }}>
              Error: All fields are required.
            </p>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={status === "sending"}
            style={{
              alignSelf: "flex-start",
              padding: "0.75rem 1.35rem",
              fontSize: "0.8rem",
              marginTop: "0.25rem",
            }}
          >
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
