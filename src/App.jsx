import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, Star, Play, ChevronRight, Sun, Sparkles, Activity, Droplets,
  ArrowLeft, Phone, Target, Coffee, Pill, Clock, Calendar as CalendarIcon,
  Pause, RotateCcw, Send, Heart, Moon, Edit2, Trash2, Plus, Wallet, Utensils,
  CalendarDays, FileText, Zap, ChevronDown, ChevronUp, X, Sparkle,
  Mic, MicOff, Headphones, PhoneIncoming, PhoneOutgoing, ArrowRight, Lightbulb,
  Check, Save, Wand2, Bell, BellOff, LogOut, User, Mail, Lock, UserPlus
} from "lucide-react";

// ─── FIREBASE CONFIG (paste your config here once you set up Firebase) ────
// Get this from https://console.firebase.google.com → Project Settings → General → Your apps
const FIREBASE_CONFIG = {
  // apiKey: "your-api-key-here",
  // authDomain: "your-app.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-app.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "1:123:web:abc"
};
const FIREBASE_ENABLED = false; // ← Change to true once you've pasted your config above

const palette = {
  pink: "#FFD6E8", pinkDeep: "#FFA5C9", pinkText: "#B8527A",
  mint: "#C8F0DC", mintDeep: "#9FE3C0", mintText: "#4A8C6E",
  lavender: "#E0D4FF", lavenderDeep: "#C5B3F5", lavenderText: "#7558C0",
  sky: "#C8E4FF", skyDeep: "#A0CFFF", skyText: "#3D7AB8",
  cream: "#FFF4D6", creamDeep: "#FFE3A8", creamText: "#A8852E",
  peach: "#FFD8C2", peachDeep: "#FFB894", peachText: "#C46934",
  bg: "#FFF9F5", bgWarm: "#FDF2EE",
};

async function askClaude(messages, systemPrompt, maxTokens = 1000) {
  const response = await fetch("/.netlify/functions/ask-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maxTokens,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "AI request failed");
  }
  return data.reply || "Sorry, I couldn't respond right now!";
}

// ─── LOCAL STORAGE HELPERS (used until Firebase is connected) ──────
const lsKey = (userId, key) => `app_${userId}_${key}`;
const saveLocal = (userId, key, data) => {
  try { localStorage.setItem(lsKey(userId, key), JSON.stringify(data)); } catch {}
};
const loadLocal = (userId, key, fallback) => {
  try {
    const v = localStorage.getItem(lsKey(userId, key));
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

// ─── AUTH STORAGE (works without Firebase using localStorage) ───────
const getStoredUsers = () => {
  try { return JSON.parse(localStorage.getItem("app_users") || "{}"); } catch { return {}; }
};
const saveStoredUsers = (users) => localStorage.setItem("app_users", JSON.stringify(users));
const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem("app_current_user") || "null"); } catch { return null; }
};
const setCurrentUser = (user) => {
  if (user) localStorage.setItem("app_current_user", JSON.stringify(user));
  else localStorage.removeItem("app_current_user");
};

// ─── NOTIFICATIONS ────────────────────────────────────────────
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
};

const sendNotification = (title, body, icon = "🌸") => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: undefined, badge: undefined, tag: "app-reminder" });
  } catch (e) { console.error("Notification error:", e); }
};

const BUDGET_AI = `You are the user's personal financial coach. Be warm, specific, concise (2-4 sentences). The budget uses "Need" for planned/required money and "Actual" for what was spent, received, paid, or saved. Reference actual numbers when shared. Always end with a question or actionable next step.`;
const WORK_AI = `You are the user's call center coach. They book home improvement appointments (windows, doors, bathrooms). Be warm, tactical, concise (2-4 sentences). Give specific phrasing for objections, confidence tips, booking techniques.`;
const HEALTH_AI = `You are the user's wellness coach. Be warm, specific (2-4 sentences). Suggest quick desk stretches, hydration, energy management, easy meals. Never give medical advice — refer to their doctor.`;
const NOTES_AI = `You are the user's note-taking assistant. Help organize thoughts, brainstorm, summarize. Warm and concise (2-4 sentences).`;
const MASTER_AI = `You are the user's main AI assistant with power to make changes in their app.
You can perform actions by including a JSON block:
- add_note: {"title": "...", "emoji": "...", "color": "pink|mint|lavender|sky|cream|peach", "content": "..."}
- add_budget: {"category": "income|expense|bills|debt|saving", "name": "...", "planned": 0, "actual": 0} where planned means needed/expected/goal and actual means spent/received/paid/saved
- add_schedule: {"time": "8:00 AM", "event": "...", "type": "work|break|routine|finish"}
- add_calendar: {"date": "15", "title": "...", "type": "social|appointment|work"}
