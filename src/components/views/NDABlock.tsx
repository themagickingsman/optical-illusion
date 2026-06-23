"use client";

import React, { useState } from "react";

interface NDABlockProps {
  sessionId?: string;
}

export default function NDABlock({ sessionId = "session_default" }: NDABlockProps) {
  const [ndaLink, setNdaLink] = useState("");
  const [ndaStatus, setNdaStatus] = useState<"idle" | "submitting" | "success">("idle");

  return (
    <div className="glass-panel" style={{ flex: 1, padding: "50px 40px 50px 40px", background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(100px)", WebkitBackdropFilter: "blur(100px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
      <h2 style={{ fontSize: "50px", marginBottom: "20px", background: "linear-gradient(90deg, #fff, #0ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Partnership NDA</h2>
      <p style={{ color: "#0ff", fontSize: "22px", marginBottom: "30px", lineHeight: 1.6 }}>Before we discuss sensitive IP or game mechanics, please link your signed NDA document below.</p>
      
      <input
        type="text"
        value={ndaLink}
        onChange={(e) => setNdaLink(e.target.value)}
        placeholder="Paste NDA URL (Google Drive, DocuSign, etc)"
        style={{ marginTop: "auto", width: "100%", padding: "22px", fontSize: "22px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", marginBottom: "25px", outline: "none" }}
      />
      
      <button
        onClick={async () => {
          if (ndaLink) {
            setNdaStatus("submitting");
            try {
              await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'nda',
                  payload: {
                    sessionId,
                    link: ndaLink,
                    timestamp: new Date().toISOString()
                  }
                })
              });
              setNdaStatus("success");
            } catch(e) {
              setNdaStatus("idle");
            }
          }
        }}
        disabled={!ndaLink || ndaStatus !== "idle"}
        style={{
          background: ndaStatus === "success" ? "#4ade80" : "rgba(255,255,255,0.1)",
          color: ndaStatus === "success" ? "#000" : "#fff",
          padding: "24px",
          fontSize: "22px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: ndaLink && ndaStatus === "idle" ? "pointer" : "not-allowed",
          fontWeight: "bold",
          transition: "all 0.3s"
        }}
      >
        {ndaStatus === "idle" ? "Submit NDA" : ndaStatus === "submitting" ? "Verifying..." : "NDA Verified!"}
      </button>
    </div>
  );
}
