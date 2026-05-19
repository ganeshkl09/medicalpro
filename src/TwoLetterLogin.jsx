import React, { useState, useEffect } from "react";
import pharmacyBg from "/src/assets/pharmacy-bg.jpg"; 

export function LoginScreen({ onLogin, ownerCode }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("LoginScreen received ownerCode:", ownerCode);
  }, [ownerCode]);

  const handleLogin = () => {
    const entered = input.toUpperCase().trim();
    const expected = ownerCode?.toUpperCase().trim() || "AB";

    if (entered === expected) {
      setError("");
      onLogin();
    } else {
      setError("Invalid code");
      setInput("");
    }
  };

  return (
    <div style={{
      width: "85vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: `url(${pharmacyBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      margin: 0,
      padding: 0
    }}>
      {/* Dark overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        zIndex: 1
      }} />
      
      {/* Login Card */}
      <div style={{
        position: "relative",
        zIndex: 2,
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: "48px 40px",
        width: 380,
        maxWidth: "90%",
        textAlign: "center",
        boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        {/* Logo/Title */}
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#0EA5E9",
          marginBottom: 8,
          letterSpacing: "-0.5px"
        }}>
          MedStore Pro
        </div>
        
        <div style={{
          fontSize: 14,
          color: "#64748B",
          marginBottom: 32,
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: 16,
          display: "inline-block"
        }}>
          Pharmacy Management System
        </div>

        {/* Input Label */}
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#334155",
          marginBottom: 8,
          textAlign: "left"
        }}>
          Enter 2-letter code
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          placeholder="AB"
          maxLength={2}
          autoFocus
          style={{
            width: "100%",
            padding: "14px 16px",
            border: error ? "2px solid #DC2626" : "1px solid #CBD5E1",
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "8px",
            marginBottom: 12,
            outline: "none",
            boxSizing: "border-box",
            backgroundColor: "#F8FAFC",
            transition: "all 0.2s ease"
          }}
        />

        {/* Error Message */}
        {error && (
          <div style={{
            fontSize: 12,
            color: "#DC2626",
            marginBottom: 16,
            textAlign: "left"
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px 20px",
            backgroundColor: "#0EA5E9",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 15,
            marginTop: 8,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0284C7";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0EA5E9";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Login to Dashboard
          <span style={{ fontSize: 16 }}>→</span>
        </button>

        {/* Footer with Dhanvika Solutions */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #E2E8F0"
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 6
          }}>
            Dhanvika Solutions
          </div>
          <div style={{
            fontSize: 10,
            color: "#94A3B8"
          }}>
            Secure Access • 2-Factor Authentication
          </div>
        </div>
      </div>
    </div>
  );
}