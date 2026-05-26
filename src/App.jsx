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
