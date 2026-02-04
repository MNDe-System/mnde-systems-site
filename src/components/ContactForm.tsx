"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    role: "",
    email: "",
    environment: "Kubernetes",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    const subject = encodeURIComponent("MNDe inquiry");
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEnvironment: ${formData.environment}\nMessage: ${formData.message}`
    );

    return (
      <div className="p-8 border border-[#3FA870] bg-[#0B0D0F]">
        <h3 className="text-xl font-semibold text-[#3FA870] mb-4">Message sent</h3>
        <p className="text-[#B8BDC4] mb-6">
          Your inquiry has been received.
        </p>
        <a
          href={`mailto:MNDeproject@proton.me?subject=${subject}&body=${body}`}
          className="inline-block border border-[#262A30] hover:border-[#6F7680] px-6 py-3 text-sm font-semibold"
        >
          Send via email fallback
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-[#6F7680] mb-2">
            Name
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-transparent border border-[#262A30] p-3 text-[#F2F2F2]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-[#6F7680] mb-2">
            Company
          </label>
          <input
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full bg-transparent border border-[#262A30] p-3 text-[#F2F2F2]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-[#6F7680] mb-2">
            Role
          </label>
          <input
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-transparent border border-[#262A30] p-3 text-[#F2F2F2]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-[#6F7680] mb-2">
            Email
          </label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-transparent border border-[#262A30] p-3 text-[#F2F2F2]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-[#6F7680] mb-2">
          Environment
        </label>
        <select
          value={formData.environment}
          onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
          className="w-full bg-transparent border border-[#262A30] p-3 text-[#F2F2F2]"
        >
          <option>Kubernetes</option>
          <option>Slurm</option>
          <option>CI and release</option>
          <option>Robotics</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-[#6F7680] mb-2">
          Message
        </label>
        <textarea
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-transparent border border-[#262A30] p-3 text-[#F2F2F2]"
        />
      </div>

      {status === "error" && (
        <p className="text-[#D14B4B] text-sm">
          Error sending message. Retry or use email fallback.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full border border-[#262A30] hover:border-[#6F7680] py-4 text-sm font-bold uppercase tracking-wider"
      >
        {status === "sending" ? "Sending" : "Open contact"}
      </button>
    </form>
  );
}
