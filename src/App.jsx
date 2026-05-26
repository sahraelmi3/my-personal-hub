import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, Star, Play, ChevronRight, Sun, Sparkles, Activity, Droplets,
  ArrowLeft, Phone, Target, Coffee, Pill, Clock, Calendar as CalendarIcon,
  Pause, RotateCcw, Send, Heart, Moon, Edit2, Trash2, Plus, Wallet, Utensils,
  CalendarDays, FileText, Zap, ChevronDown, ChevronUp, X, Sparkle,
  Mic, MicOff, Headphones, PhoneIncoming, PhoneOutgoing, ArrowRight, Lightbulb,
  Check, Save, Wand2, Bell, BellOff, LogOut, User, Mail, Lock, UserPlus
} from "lucide-react";

// â”€â”€â”€ FIREBASE CONFIG (paste your config here once you set up Firebase) â”€â”€â”€â”€
// Get this from https://console.firebase.google.com â†’ Project Settings â†’ General â†’ Your apps
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCXivJYGoSdnOOJkqzXINowYRw_auSSijY",
  authDomain: "my-personal-hub-debb3.firebaseapp.com",
  projectId: "my-personal-hub-debb3",
  storageBucket: "my-personal-hub-debb3.firebasestorage.app",
  messagingSenderId: "681025832181",
  appId: "1:681025832181:web:945e8e3eadf9d679831bc"
};
const FIREBASE_ENABLED = true;

let firebaseAppPromise = null;
let firestorePromise = null;

const getCloudDocId = (fallbackUserId) => {
  try {
    const current = JSON.parse(localStorage.getItem("app_current_user") || "null");
    return (current?.email || fallbackUserId).toLowerCase().replace(/\//g, "_");
  } catch {
    return fallbackUserId;
  }
};

const getFirestoreDb = async () => {
  if (!FIREBASE_ENABLED) return null;
  if (!firebaseAppPromise) {
    firebaseAppPromise = import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js")
      .then(({ initializeApp, getApps }) => getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG));
  }
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      firebaseAppPromise,
      import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js")
    ]).then(([app, firestore]) => firestore.getFirestore(app));
  }
  return firestorePromise;
};

const saveCloudData = async (userId, key, data) => {
  try {
    const db = await getFirestoreDb();
    if (!db) return;
    const { doc, setDoc, serverTimestamp } = await import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await setDoc(doc(db, "users", getCloudDocId(userId)), { [key]: data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn("Firebase save skipped:", error.message);
  }
};

const loadCloudData = async (userId) => {
  try {
    const db = await getFirestoreDb();
    if (!db) return null;
    const { doc, getDoc } = await import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const snap = await getDoc(doc(db, "users", getCloudDocId(userId)));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn("Firebase load skipped:", error.message);
    return null;
  }
};

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
  const payload = JSON.stringify({ maxTokens, system: systemPrompt, messages });
  const endpoints = ["/api/ask-ai", "/.netlify/functions/ask-ai"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        lastError = new Error(`${endpoint} did not return JSON`);
        continue;
      }
      const data = await response.json();
      if (!response.ok) {
        lastError = new Error(data.error || "AI request failed");
        continue;
      }
      return data.reply || "Sorry, I couldn't respond right now!";
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("AI request failed");
}

// â”€â”€â”€ LOCAL STORAGE HELPERS (used until Firebase is connected) â”€â”€â”€â”€â”€â”€
const lsKey = (userId, key) => `app_${userId}_${key}`;
const saveLocal = (userId, key, data) => {
  try { localStorage.setItem(lsKey(userId, key), JSON.stringify(data)); } catch {}
  if (FIREBASE_ENABLED) saveCloudData(userId, key, data);
};
const loadLocal = (userId, key, fallback) => {
  try {
    const v = localStorage.getItem(lsKey(userId, key));
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

// â”€â”€â”€ AUTH STORAGE (works without Firebase using localStorage) â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
};

const sendNotification = (title, body, icon = "ðŸŒ¸") => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: undefined, badge: undefined, tag: "app-reminder" });
  } catch (e) { console.error("Notification error:", e); }
};

const BUDGET_AI = `You are the user's personal financial coach. Be warm, specific, concise (2-4 sentences). The budget uses "Need" for planned/required money and "Actual" for what was spent, received, paid, or saved. Reference actual numbers when shared. Always end with a question or actionable next step.`;
const WORK_AI = `You are the user's call center coach. They book home improvement appointments (windows, doors, bathrooms). Be warm, tactical, concise (2-4 sentences). Give specific phrasing for objections, confidence tips, booking techniques.`;
const HEALTH_AI = `You are the user's wellness coach. Be warm, specific (2-4 sentences). Suggest quick desk stretches, hydration, energy management, easy meals. Never give medical advice â€” refer to their doctor.`;
const NOTES_AI = `You are the user's note-taking assistant. Help organize thoughts, brainstorm, summarize. Warm and concise (2-4 sentences).`;
const MASTER_AI = `You are the user's main AI assistant with power to make changes in their app.
You can perform actions by including action blocks. The app will hide these blocks from the user and run them.
- add_note: {"title": "...", "emoji": "...", "color": "pink|mint|lavender|sky|cream|peach", "content": "..."}
- add_budget: {"category": "income|expense|bills|debt|saving", "name": "...", "planned": 0, "actual": 0} where planned means needed/expected/goal and actual means spent/received/paid/saved
- add_schedule: {"date": "15", "time": "8:00 AM", "event": "...", "type": "work|break|routine|finish"}
- add_calendar: {"date": "15", "title": "...", "type": "social|appointment|work"}
- log_call: {"result": "appointment|callback|no", "notes": "..."}
- add_water: {"amount": 1}
- add_appointment: {}
- set_reminder: {"time": "8:00 AM", "message": "..."}

Format:
\`\`\`action
{"type": "add_note", "data": {"title": "...", ...}}
\`\`\`
For appointments or dated events, include BOTH add_calendar and add_schedule with the same date. For multiple actions, include multiple action blocks. Do not use \`\`\`json for app actions. Keep the visible response 1-2 friendly sentences and never describe the hidden JSON.`;
const LISTENING_SYSTEM = `You are an AI sales coach listening live. Script flow: Intro â†’ Qualify â†’ Needs â†’ Commit â†’ Value of Visit â†’ Close â†’ Button-Up.
Respond ONLY in JSON: {"status": "on_track" | "off_track" | "objection" | "buying_signal", "stage": "intro|qualify|needs|transition|vov|close|buttonup|unknown", "tip": "ONE specific sentence to say next", "alert": "brief alert if needed"}
Keep tips under 20 words.`;
const SEGUE_SYSTEM = `Customer just said something unexpected. Give 2-3 short bring-back lines (each under 20 words) that 1) validate the customer 2) transition back to script. Be specific.`;

// â”€â”€â”€ DEFAULT DATA FOR NEW USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const defaultSchedule = [
  { id: 1, time: "8:00 AM", event: "Start your day âœ¨", type: "work" },
  { id: 2, time: "12:00 PM", event: "Lunch break", type: "break" },
  { id: 3, time: "5:00 PM", event: "Wrap up", type: "finish" },
];

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const timeToMinutes = (timeStr = "") => {
  const cleaned = String(timeStr).trim();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || "0", 10);
  const meridiem = match[3]?.toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return Number.MAX_SAFE_INTEGER;
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const sortScheduleItems = (items) =>
  [...items].sort((a, b) => {
    const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (timeDiff !== 0) return timeDiff;
    return String(a.event || "").localeCompare(String(b.event || ""));
  });

const moneyValue = (value) => parseFloat(value) || 0;
const formatMoney = (value) => `$${moneyValue(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const formatDateLabel = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = String(dateString).split("-").map(Number);
  if (!year || !month || !day) return dateString;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const dateSortValue = (dateString) => dateString ? new Date(`${dateString}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;

const defaultBudget = {
  income: [],
  expense: [],
  bills: [],
  debt: [],
  saving: [],
};

const defaultNotes = [
  { id: 1, title: "Welcome! ðŸŒ¸", emoji: "ðŸ’œ", color: palette.lavender, content: "This is your personal space. Tap to edit, pin important notes, and use the AI to brainstorm!", pinned: true, createdAt: new Date().toISOString() },
];

const defaultObjections = [
  { id: 1, q: "I need to think about it", a: "Totally fair! What's the main thing holding you back?" },
];

const defaultInboundScript = [
  { id: "intro", label: "Intro", color: palette.mint, textColor: palette.mintText, emoji: "ðŸ‘‹",
    lines: [
      { id: "l1", type: "say", text: "Hi! How can I help you today?" },
      { id: "l2", type: "customer", text: "I'm interested in learning more about your services." },
      { id: "l3", type: "say", text: "Great! My name is [Your Name], and you are?" },
    ]
  },
  { id: "needs", label: "Needs", color: palette.peach, textColor: palette.peachText, emoji: "ðŸ”",
    lines: [
      { id: "l4", type: "say", text: "Tell me a little about what you're looking for." },
    ]
  },
  { id: "close", label: "Close", color: palette.sky, textColor: palette.skyText, emoji: "ðŸ“…",
    lines: [
      { id: "l5", type: "say", text: "Let's schedule a time to chat in person. What works for you?" },
    ]
  },
];

const defaultOutboundScript = [
  { id: "placeholder", label: "Add Your Script", color: palette.lavender, textColor: palette.lavenderText, emoji: "ðŸ“ž",
    lines: [{ id: "ob1", type: "tip", text: "Tap the edit pencil to add your outbound script lines!" }] }
];

export default function App() {
  // â”€â”€â”€ AUTH STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [user, setUser] = useState(null); // {id, email, displayName}
  const [authView, setAuthView] = useState("login"); // 'login' | 'signup'
  const [authForm, setAuthForm] = useState({ email: "", password: "", displayName: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Check for existing session on load
  useEffect(() => {
    const existing = getCurrentUser();
    if (existing) setUser(existing);
  }, []);

  const handleSignup = () => {
    setAuthError("");
    const { email, password, displayName } = authForm;
    if (!email || !password || !displayName) { setAuthError("Fill all fields!"); return; }
    if (password.length < 4) { setAuthError("Password must be at least 4 characters"); return; }
    setAuthLoading(true);
    const users = getStoredUsers();
    if (users[email]) { setAuthError("Account exists. Try logging in!"); setAuthLoading(false); return; }
    const newUser = { id: email.toLowerCase(), email, displayName, password }; // password stored locally for local fallback
    users[email] = newUser;
    saveStoredUsers(users);
    const sessionUser = { id: newUser.id, email, displayName };
    setCurrentUser(sessionUser);
    setUser(sessionUser);
    setAuthLoading(false);
  };

  const handleLogin = () => {
    setAuthError("");
    const { email, password } = authForm;
    if (!email || !password) { setAuthError("Fill all fields!"); return; }
    setAuthLoading(true);
    const users = getStoredUsers();
    const found = users[email];
    if (!found || found.password !== password) { setAuthError("Wrong email or password"); setAuthLoading(false); return; }
    const sessionUser = { id: found.id, email: found.email, displayName: found.displayName };
    setCurrentUser(sessionUser);
    setUser(sessionUser);
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    setUserDataReady(false);
    setAuthForm({ email: "", password: "", displayName: "" });
    setAuthView("login");
  };

  // â”€â”€â”€ APP STATE (only populated when logged in) â”€â”€â”€â”€â”€
  const [activeTab, setActiveTab] = useState("timeline");
  const [userDataReady, setUserDataReady] = useState(false);
  const [stars, setStars] = useState(0);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentRoutineType, setCurrentRoutineType] = useState("morning");
  const [appointments, setAppointments] = useState(0);
  const [showMasterAI, setShowMasterAI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [medsList, setMedsList] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [selectedPlanDate, setSelectedPlanDate] = useState(new Date().getDate());
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [newScheduleItem, setNewScheduleItem] = useState({ time: "", event: "", type: "work" });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [newCalEvent, setNewCalEvent] = useState({ date: "", title: "", type: "social" });
  const [budget, setBudget] = useState(defaultBudget);
  const [newBudgetItems, setNewBudgetItems] = useState({
    income: { category: "", planned: "", actual: "", dueDate: "" },
    expense: { category: "", planned: "", actual: "", dueDate: "" },
    bills: { category: "", planned: "", actual: "", dueDate: "", paid: false },
    debt: { category: "", planned: "", actual: "", dueDate: "", paid: false },
    saving: { category: "", planned: "", actual: "", dueDate: "" },
  });
  const [editingBudgetItem, setEditingBudgetItem] = useState(null);
  const [budgetEditValues, setBudgetEditValues] = useState({ category: "", planned: "", actual: "", dueDate: "" });
  const [savingContributions, setSavingContributions] = useState({});
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteEmoji, setNewNoteEmoji] = useState("âœ¨");
  const [newNoteColor, setNewNoteColor] = useState(palette.lavender);
  const [showNewNote, setShowNewNote] = useState(false);
  const [scriptType, setScriptType] = useState("inbound");
  const [activeScriptSection, setActiveScriptSection] = useState("intro");
  const [callStreak, setCallStreak] = useState(0);
  const [callLog, setCallLog] = useState([]);
  const [newCallResult, setNewCallResult] = useState("appointment");
  const [newCallNotes, setNewCallNotes] = useState("");
  const [showCallLog, setShowCallLog] = useState(false);
  const [scriptEditMode, setScriptEditMode] = useState(false);
  const [objections, setObjections] = useState([]);
  const [editingObjection, setEditingObjection] = useState(null);
  const [objectionEditValues, setObjectionEditValues] = useState({ q: "", a: "" });
  const [showNewObjection, setShowNewObjection] = useState(false);
  const [newObjection, setNewObjection] = useState({ q: "", a: "" });
  const [objectionMode, setObjectionMode] = useState(false);
  const [selectedObjection, setSelectedObjection] = useState(null);
  const [inboundScript, setInboundScript] = useState(defaultInboundScript);
  const [outboundScript, setOutboundScript] = useState(defaultOutboundScript);
  const [editingLine, setEditingLine] = useState(null);
  const [lineEditValues, setLineEditValues] = useState({});

  // â”€â”€â”€ NOTIFICATIONS STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [notifPermission, setNotifPermission] = useState("default");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [reminders, setReminders] = useState([]); // {id, time: "8:00 AM", message, daily: true}
  const [newReminder, setNewReminder] = useState({ time: "", message: "" });
  const lastNotifCheckRef = useRef(new Date());

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === "granted") {
      setNotifEnabled(true);
      sendNotification("ðŸŒ¸ Notifications enabled!", "You'll get reminders for your routines and events!");
    }
  };

  // Check reminders every minute
  useEffect(() => {
    if (!notifEnabled || notifPermission !== "granted") return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const lastCheck = lastNotifCheckRef.current;
      const lastTimeStr = lastCheck.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      if (currentTimeStr !== lastTimeStr) {
        // Check custom reminders
        reminders.forEach(r => {
          if (r.time === currentTimeStr) {
            sendNotification("ðŸŒ¸ Reminder", r.message);
          }
        });
        // Check schedule items (notify 5 min before)
        scheduleItems.forEach(item => {
          const eventTime = parseTimeString(item.time);
          if (eventTime) {
            const minutesUntil = (eventTime - now) / 60000;
            if (minutesUntil > 4.5 && minutesUntil < 5.5) {
              sendNotification(`â° Coming up in 5 min`, item.event);
            }
          }
        });
        // Daily summary at 8 AM
        if (currentTimeStr === "8:00 AM" && lastTimeStr !== "8:00 AM") {
          const todayEvents = scheduleItems.length;
          const upcomingCal = calendarEvents.filter(e => parseInt(e.date) >= now.getDate()).slice(0, 3);
          let body = `${todayEvents} things scheduled today.`;
          if (upcomingCal.length > 0) body += ` Upcoming: ${upcomingCal.map(e => e.title).join(", ")}`;
          sendNotification("ðŸŒ… Good morning!", body);
        }
        lastNotifCheckRef.current = now;
      }
    }, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [notifEnabled, notifPermission, reminders, scheduleItems, calendarEvents]);

  const parseTimeString = (timeStr) => {
    const minutesFromStart = timeToMinutes(timeStr);
    if (minutesFromStart === Number.MAX_SAFE_INTEGER) return null;
    const d = new Date();
    const hours = Math.floor(minutesFromStart / 60);
    const minutes = minutesFromStart % 60;
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // â”€â”€â”€ VOICE / SEGUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [liveCoaching, setLiveCoaching] = useState([]);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef("");
  const lastAnalysisRef = useRef(0);
  const [segueQuery, setSegueQuery] = useState("");
  const [segueResults, setSegueResults] = useState([]);
  const [segueLoading, setSegueLoading] = useState(false);

  // â”€â”€â”€ AI CHATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sectionAIChats, setSectionAIChats] = useState({
    budget: [{ role: "assistant", content: "Hi! ðŸ’° I'm your budget coach. Ask me about saving, debt, or budget tweaks!" }],
    work: [{ role: "assistant", content: "Hey! ðŸ“ž I'm your work coach. Ask me about scripts, objections, or call confidence!" }],
    health: [{ role: "assistant", content: "Hi! ðŸŒ¿ I'm your wellness coach. Ask me about stretches, hydration, or quick energy boosts!" }],
    notes: [{ role: "assistant", content: "Hey! ðŸ“ I'm your notes assistant. Brainstorm or organize ideas!" }],
  });
  const [sectionAIInputs, setSectionAIInputs] = useState({ budget: "", work: "", health: "", notes: "" });
  const [sectionAILoading, setSectionAILoading] = useState({ budget: false, work: false, health: false, notes: false });
  const [openSectionAI, setOpenSectionAI] = useState(null);
  const [masterChat, setMasterChat] = useState([]);
  const [masterInput, setMasterInput] = useState("");
  const [masterLoading, setMasterLoading] = useState(false);
  const [recentAction, setRecentAction] = useState(null);

  const masterEndRef = useRef(null);
  const sectionEndRefs = { budget: useRef(null), work: useRef(null), health: useRef(null), notes: useRef(null) };
  const coachingEndRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState("work");
  const [routineTimeLeft, setRoutineTimeLeft] = useState(0);
  const [routineTimerActive, setRoutineTimerActive] = useState(false);

  const morningRoutine = [
    { id: 1, title: "Bathroom & Brush", time: "5 mins", timeInSeconds: 300, color: palette.sky, icon: <Droplets className="w-8 h-8" style={{color: palette.skyText}}/>, detail: "Start fresh!" },
    { id: 2, title: "Skincare & Massage", time: "5 mins", timeInSeconds: 300, color: palette.pink, icon: <Sparkles className="w-8 h-8" style={{color: palette.pinkText}}/>, detail: "Gentle upward sweeps." },
    { id: 3, title: "Neck & Wrist Stretches", time: "2 mins", timeInSeconds: 120, color: palette.lavender, icon: <Activity className="w-8 h-8" style={{color: palette.lavenderText}}/>, detail: "Gentle stretches!" },
    { id: 4, title: "Seated Spinal Twists", time: "3 mins", timeInSeconds: 180, color: palette.peach, icon: <Activity className="w-8 h-8" style={{color: palette.peachText}}/>, detail: "Wake muscles up." },
    { id: 5, title: "Water & Desk Prep", time: "2 mins", timeInSeconds: 120, color: palette.mint, icon: <Coffee className="w-8 h-8" style={{color: palette.mintText}}/>, detail: "Drink water." },
  ];
  const nightRoutine = [
    { id: 101, title: "Screen Curfew", time: "5 mins", timeInSeconds: 300, color: palette.lavender, icon: <Moon className="w-8 h-8" style={{color: palette.lavenderText}}/>, detail: "Put devices away." },
    { id: 102, title: "Skincare", time: "5 mins", timeInSeconds: 300, color: palette.pink, icon: <Droplets className="w-8 h-8" style={{color: palette.pinkText}}/>, detail: "Wash face." },
    { id: 103, title: "Prep for Tomorrow", time: "5 mins", timeInSeconds: 300, color: palette.sky, icon: <CalendarIcon className="w-8 h-8" style={{color: palette.skyText}}/>, detail: "Set out clothes." },
  ];

  const currentScript = scriptType === "inbound" ? inboundScript : outboundScript;
  const setCurrentScript = scriptType === "inbound" ? setInboundScript : setOutboundScript;

  // â”€â”€â”€ LOAD USER DATA on login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const today = getLocalDateKey();

    const applyUserData = (data) => {
      setScheduleItems(sortScheduleItems(data.schedule ?? defaultSchedule));
      setCalendarEvents(data.calendar ?? []);
      setBudget(data.budget ?? defaultBudget);
      setNotes(data.notes ?? defaultNotes);
      setObjections(data.objections ?? defaultObjections);
      setInboundScript(data.inboundScript ?? defaultInboundScript);
      setOutboundScript(data.outboundScript ?? defaultOutboundScript);
      setMedsList(data.meds ?? []);
      setStars(data.stars ?? 0);
      setAppointments(data.appointments ?? 0);
      setCallStreak(data.callStreak ?? 0);
      setCallLog(data.callLog ?? []);
      setWaterGlasses(data.water ?? 0);
      setReminders(data.reminders ?? []);
      setNotifEnabled(data.notifEnabled ?? false);
      setCompletedTasks(data.routineDate === today ? (data.completedTasks ?? []) : []);
    };

    const loadUserData = async () => {
      setUserDataReady(false);
      const localData = {
        schedule: loadLocal(user.id, "schedule", defaultSchedule),
        calendar: loadLocal(user.id, "calendar", []),
        budget: loadLocal(user.id, "budget", defaultBudget),
        notes: loadLocal(user.id, "notes", defaultNotes),
        objections: loadLocal(user.id, "objections", defaultObjections),
        inboundScript: loadLocal(user.id, "inboundScript", defaultInboundScript),
        outboundScript: loadLocal(user.id, "outboundScript", defaultOutboundScript),
        meds: loadLocal(user.id, "meds", []),
        stars: loadLocal(user.id, "stars", 0),
        appointments: loadLocal(user.id, "appointments", 0),
        callStreak: loadLocal(user.id, "callStreak", 0),
        callLog: loadLocal(user.id, "callLog", []),
        water: loadLocal(user.id, "water", 0),
        reminders: loadLocal(user.id, "reminders", []),
        notifEnabled: loadLocal(user.id, "notifEnabled", false),
        routineDate: loadLocal(user.id, "routineDate", today),
        completedTasks: loadLocal(user.id, "completedTasks", []),
      };
      applyUserData(localData);

      const cloudData = await loadCloudData(user.id);
      if (!cancelled && cloudData) applyUserData({ ...localData, ...cloudData });
      if (!cancelled) {
        setUserDataReady(true);
        setMasterChat([{ role: "assistant", content: `Hey ${user.displayName}! ðŸŒ¸ I'm your main AI â€” I can make changes in your app! Try:\n\nâ€¢ "Add a note about my goals"\nâ€¢ "Log a water glass"\nâ€¢ "Add $50 expense for coffee"\nâ€¢ "Set reminder at 3pm to stretch"\n\nOr just chat! ðŸ’•` }]);
      }
    };

    loadUserData();
    return () => { cancelled = true; };
  }, [user]);

  // â”€â”€â”€ SAVE on changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "schedule", scheduleItems); }, [scheduleItems, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "calendar", calendarEvents); }, [calendarEvents, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "budget", budget); }, [budget, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "notes", notes); }, [notes, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "objections", objections); }, [objections, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "inboundScript", inboundScript); }, [inboundScript, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "outboundScript", outboundScript); }, [outboundScript, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "meds", medsList); }, [medsList, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "stars", stars); }, [stars, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "appointments", appointments); }, [appointments, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "callStreak", callStreak); }, [callStreak, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "callLog", callLog); }, [callLog, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "water", waterGlasses); }, [waterGlasses, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "reminders", reminders); }, [reminders, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "notifEnabled", notifEnabled); }, [notifEnabled, user, userDataReady]);
  useEffect(() => { if (user && userDataReady) saveLocal(user.id, "completedTasks", completedTasks); }, [completedTasks, user, userDataReady]);

  useEffect(() => {
    if (!user || !userDataReady) return;
    const today = getLocalDateKey(currentTime);
    const savedRoutineDate = loadLocal(user.id, "routineDate", today);
    if (savedRoutineDate !== today) {
      setCompletedTasks([]);
      setActiveTaskIndex(0);
      saveLocal(user.id, "routineDate", today);
      saveLocal(user.id, "completedTasks", []);
    }
  }, [currentTime, user, userDataReady]);

  // â”€â”€â”€ VOICE SETUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceSupported(false); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text + " ";
        else interim += text;
      }
      setInterimTranscript(interim);
      if (final) { setTranscript(p => p + final); transcriptBufferRef.current += final; }
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setVoiceSupported(false);
    };
    recognition.onend = () => { if (isListening) { try { recognition.start(); } catch {} } };
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, []);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(async () => {
      const now = Date.now();
      if (transcriptBufferRef.current.length < 30 || now - lastAnalysisRef.current < 7000) return;
      const snippet = transcriptBufferRef.current;
      transcriptBufferRef.current = "";
      lastAnalysisRef.current = now;
      setCoachingLoading(true);
      try {
        const reply = await askClaude(
          [{ role: "user", content: `Latest call snippet: "${snippet.trim()}"\n\nRespond ONLY with the JSON.` }],
          LISTENING_SYSTEM, 400
        );
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setLiveCoaching(prev => [...prev, { id: Date.now(), ...parsed, time: new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"}), snippet: snippet.trim().slice(0, 80) }]);
        }
      } catch (e) { console.error(e); }
      setCoachingLoading(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [isListening]);

  const toggleListening = async () => {
    if (!recognitionRef.current) return;
    if (isListening) { try { recognitionRef.current.stop(); } catch {}; setIsListening(false); }
    else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true); setTranscript(""); transcriptBufferRef.current = "";
        setLiveCoaching([{ id: Date.now(), status: "on_track", stage: "intro", tip: "I'm listening! ðŸŽ¤ Start your call naturally.", time: new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"}) }]);
      } catch (err) { setVoiceSupported(false); }
    }
  };

  const askForSegue = async () => {
    if (!segueQuery.trim() || segueLoading) return;
    setSegueLoading(true);
    try {
      const stage = inboundScript.find(s => s.id === activeScriptSection);
      const reply = await askClaude(
        [{ role: "user", content: `Current script stage: ${stage?.label || "unknown"}.\nCustomer said: "${segueQuery}"\n\nGive 3 bring-back lines.` }],
        SEGUE_SYSTEM, 500
      );
      setSegueResults(prev => [{ id: Date.now(), question: segueQuery, answer: reply, time: new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"}) }, ...prev].slice(0, 5));
      setSegueQuery("");
    } catch (e) {
      setSegueResults(prev => [{ id: Date.now(), question: segueQuery, answer: "Oops, couldn't connect!", time: "" }, ...prev]);
    }
    setSegueLoading(false);
  };

  // â”€â”€â”€ EFFECTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    let interval = null;
    if (pomoActive && pomoTime > 0) interval = setInterval(() => setPomoTime(t => t - 1), 1000);
    else if (pomoTime === 0) {
      setPomoActive(false);
      if (pomoMode === "work") { setPomoMode("break"); setPomoTime(5 * 60); sendNotification("â° Break time!", "Great focus session! Take 5."); }
      else { setPomoMode("work"); setPomoTime(25 * 60); sendNotification("ðŸŽ¯ Back to focus!", "Time to get back to it."); }
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime, pomoMode]);

  useEffect(() => {
    const arr = currentRoutineType === "morning" ? morningRoutine : nightRoutine;
    if (arr[activeTaskIndex]) { setRoutineTimeLeft(arr[activeTaskIndex].timeInSeconds); setRoutineTimerActive(false); }
  }, [activeTaskIndex, currentRoutineType]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval = null;
    if (routineTimerActive && routineTimeLeft > 0) interval = setInterval(() => setRoutineTimeLeft(t => t - 1), 1000);
    else if (routineTimeLeft === 0) setRoutineTimerActive(false);
    return () => clearInterval(interval);
  }, [routineTimerActive, routineTimeLeft]);

  useEffect(() => { if (masterEndRef.current) masterEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [masterChat, showMasterAI]);
  useEffect(() => { if (coachingEndRef.current) coachingEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [liveCoaching]);
  useEffect(() => {
    if (openSectionAI && sectionEndRefs[openSectionAI]?.current) sectionEndRefs[openSectionAI].current.scrollIntoView({ behavior: "smooth" });
  }, [sectionAIChats, openSectionAI]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const rewardStars = (n) => setStars(p => p + n);
  const togglePomodoro = () => setPomoActive(!pomoActive);
  const resetPomodoro = () => { setPomoActive(false); setPomoTime(pomoMode === "work" ? 25 * 60 : 5 * 60); };
  const switchPomodoroMode = (mode) => { setPomoActive(false); setPomoMode(mode); setPomoTime(mode === "work" ? 25 * 60 : 5 * 60); };
  const startRoutine = (type) => {
    const arr = type === "morning" ? morningRoutine : nightRoutine;
    const firstIncomplete = arr.findIndex(task => !completedTasks.includes(task.id));
    setCurrentRoutineType(type);
    setActiveTaskIndex(firstIncomplete === -1 ? 0 : firstIncomplete);
    setActiveTab("routine");
  };
  const completeTask = (taskId) => {
    const arr = currentRoutineType === "morning" ? morningRoutine : nightRoutine;
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
      rewardStars(10);
    }
    if (activeTaskIndex < arr.length - 1) setActiveTaskIndex(activeTaskIndex + 1);
    else { setActiveTab("timeline"); }
  };

  const handleSectionAISubmit = async (section) => {
    const input = sectionAIInputs[section];
    if (!input?.trim() || sectionAILoading[section]) return;
    const userMsg = { role: "user", content: input };
    const updatedChat = [...sectionAIChats[section], userMsg];
    setSectionAIChats(p => ({ ...p, [section]: updatedChat }));
    setSectionAIInputs(p => ({ ...p, [section]: "" }));
    setSectionAILoading(p => ({ ...p, [section]: true }));
    const systemMap = { budget: BUDGET_AI, work: WORK_AI, health: HEALTH_AI, notes: NOTES_AI };
    let context = "";
    if (section === "budget") {
      const totals = ["income","expense","bills","debt","saving"].reduce((acc, k) => {
        acc[k] = {
          needed: budget[k].reduce((s, i) => s + (moneyValue(i.planned) || moneyValue(i.actual)), 0),
          actual: budget[k].reduce((s, i) => s + moneyValue(i.actual), 0),
        };
        return acc;
      }, {});
      const savingsSummary = budget.saving.map(goal => `${goal.category}: saved $${moneyValue(goal.actual)} of $${moneyValue(goal.planned)}${goal.dueDate ? ` by ${goal.dueDate}` : ""}`).join("; ") || "No savings goals yet.";
      const dueSummary = ["bills", "debt", "expense"].flatMap(k => budget[k].map(item => `${item.category}: need $${moneyValue(item.planned)}${item.dueDate ? ` due ${item.dueDate}` : ""}`)).join("; ") || "No due dates yet.";
      context = `\n\nCurrent budget uses Need for planned money and Actual for what happened. Income expected $${totals.income.needed}, received $${totals.income.actual}. Needs: expenses $${totals.expense.needed}, bills $${totals.bills.needed}, debt $${totals.debt.needed}, savings goal $${totals.saving.needed}. Actuals: expenses $${totals.expense.actual}, bills $${totals.bills.actual}, debt $${totals.debt.actual}, saved $${totals.saving.actual}. Savings goals: ${savingsSummary}. Due items: ${dueSummary}.`;
    } else if (section === "work") {
      context = `\n\nToday: ${appointments} appointments, ${callLog.length} calls, streak: ${callStreak}.`;
    } else if (section === "health") {
      context = `\n\nToday: ${waterGlasses} glasses water, ${medsList.length} meds tracked.`;
    }
    try {
      const reply = await askClaude(updatedChat, systemMap[section] + context, 600);
      setSectionAIChats(p => ({ ...p, [section]: [...updatedChat, { role: "assistant", content: reply }] }));
    } catch (e) {
      setSectionAIChats(p => ({ ...p, [section]: [...updatedChat, { role: "assistant", content: "I could not reach the AI service yet. The built-in test coach should work without a key, so check that netlify/functions/ask-ai.js was uploaded and redeployed." }] }));
    }
    setSectionAILoading(p => ({ ...p, [section]: false }));
  };

  const handleMasterAISubmit = async () => {
    if (!masterInput.trim() || masterLoading) return;
    const userMsg = { role: "user", content: masterInput };
    const updatedChat = [...masterChat, userMsg];
    setMasterChat(updatedChat);
    setMasterInput("");
    setMasterLoading(true);
    try {
      const reply = await askClaude(updatedChat, MASTER_AI, 1000);
      const { cleanReply, actions } = parseAIActionResponse(reply);
      setMasterChat([...updatedChat, { role: "assistant", content: cleanReply || "Done â€” I updated that for you." }]);
      actions.forEach(action => executeAction(action));
    } catch (e) {
      setMasterChat([...updatedChat, { role: "assistant", content: "I could not reach the AI service yet. The built-in test coach should work without a key, so check that netlify/functions/ask-ai.js was uploaded and redeployed." }]);
    }
    setMasterLoading(false);
  };

  const parseAIActionResponse = (reply) => {
    const actions = [];
    let cleanReply = reply || "";
    const blockRegex = /```(?:action|json)\s*([\s\S]*?)```/gi;
    let match;
    while ((match = blockRegex.exec(reply || "")) !== null) {
      const parsedActions = parseActionPayload(match[1]);
      actions.push(...parsedActions);
    }
    cleanReply = cleanReply.replace(blockRegex, "").trim();
    return { cleanReply, actions };
  };

  const parseActionPayload = (payload) => {
    try {
      const parsed = JSON.parse(payload.trim());
      if (Array.isArray(parsed)) return parsed.filter(isValidAction);
      if (isValidAction(parsed)) return [parsed];
      return [];
    } catch (error) {
      console.error("Action parse error:", error);
      return [];
    }
  };

  const isValidAction = (action) => action && typeof action.type === "string" && action.data && typeof action.data === "object";

  const executeAction = (action) => {
    const colorMap = { pink: palette.pink, mint: palette.mint, lavender: palette.lavender, sky: palette.sky, cream: palette.cream, peach: palette.peach };
    let actionMsg = "";
    switch (action.type) {
      case "add_note": {
        const newNote = { id: Date.now(), title: action.data.title || "New Note", emoji: action.data.emoji || "âœ¨", color: colorMap[action.data.color] || palette.lavender, content: action.data.content || "", pinned: false, createdAt: new Date().toISOString() };
        setNotes(p => [newNote, ...p]);
        actionMsg = `ðŸ“ Added note "${newNote.title}"`;
        break;
      }
      case "add_budget": {
        const cat = action.data.category;
        if (budget[cat]) {
          setBudget(p => ({ ...p, [cat]: [...p[cat], { id: Date.now(), category: action.data.name, planned: parseFloat(action.data.planned) || 0, actual: parseFloat(action.data.actual) || 0, dueDate: action.data.dueDate || "", paid: false }] }));
          actionMsg = `ðŸ’° Added "${action.data.name}" to ${cat}`;
        }
        break;
      }
      case "add_schedule":
        setScheduleItems(p => sortScheduleItems([...p, { id: Date.now(), date: String(action.data.date || "").replace(/\D/g, "") || undefined, time: action.data.time, event: action.data.event, type: action.data.type || "work" }]));
        actionMsg = `ðŸ“… Added "${action.data.event}" at ${action.data.time}`;
        break;
      case "add_calendar": {
        let color = palette.mint;
        if (action.data.type === "social") color = palette.lavender;
        if (action.data.type === "appointment") color = palette.pink;
        const date = String(action.data.date || "").replace(/\D/g, "");
        setCalendarEvents(p => [...p, { id: Date.now(), date, title: action.data.title, type: action.data.type, color }]);
        actionMsg = `ðŸ—“ï¸ Added "${action.data.title}" on May ${action.data.date}`;
        break;
      }
      case "log_call": {
        const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        setCallLog(p => [{ id: Date.now(), time: now, result: action.data.result, notes: action.data.notes || "" }, ...p]);
        if (action.data.result === "appointment") { setAppointments(a => a + 1); setCallStreak(s => s + 1); }
        else setCallStreak(0);
        actionMsg = `ðŸ“ž Logged ${action.data.result}`;
        break;
      }
      case "add_water":
        setWaterGlasses(w => w + (action.data.amount || 1));
        actionMsg = `ðŸ’§ +${action.data.amount || 1} water`;
        break;
      case "add_appointment":
        setAppointments(a => a + 1);
        setCallStreak(s => s + 1);
        actionMsg = `ðŸ“… +1 appointment!`;
        break;
      case "set_reminder":
        setReminders(p => [...p, { id: Date.now(), time: action.data.time, message: action.data.message, daily: true }]);
        actionMsg = `ðŸ”” Reminder set for ${action.data.time}`;
        break;
    }
    if (actionMsg) {
      rewardStars(5);
      setRecentAction(actionMsg);
      setTimeout(() => setRecentAction(null), 4000);
    }
  };

  const logCall = () => {
    const now = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setCallLog([{ id: Date.now(), time: now, result: newCallResult, notes: newCallNotes }, ...callLog]);
    if (newCallResult === "appointment") { setAppointments(a => a + 1); rewardStars(10); setCallStreak(s => s + 1); }
    else setCallStreak(0);
    setNewCallNotes("");
  };

  const sumBudget = (key, field) => budget[key].reduce((a, i) => a + (parseFloat(i[field]) || 0), 0);
  const toggleBudgetPaid = (key, id) => setBudget(p => ({ ...p, [key]: p[key].map(item => item.id === id ? { ...item, paid: !item.paid } : item) }));
  const emptyBudgetItem = (key) => ({ category: "", planned: "", actual: "", dueDate: "", paid: key === "bills" || key === "debt" ? false : undefined });
  const addBudgetItem = (key) => {
    const ni = newBudgetItems[key];
    if (ni.category) {
      setBudget(p => ({ ...p, [key]: [...p[key], { ...ni, id: Date.now() }] }));
      setNewBudgetItems(p => ({ ...p, [key]: emptyBudgetItem(key) }));
      rewardStars(2);
    }
  };
  const deleteBudgetItem = (key, id) => setBudget(p => ({ ...p, [key]: p[key].filter(item => item.id !== id) }));
  const startEditBudgetItem = (key, item) => { setEditingBudgetItem({ key, id: item.id }); setBudgetEditValues({ category: item.category, planned: item.planned, actual: item.actual, dueDate: item.dueDate || "" }); };
  const saveEditBudgetItem = () => {
    if (!editingBudgetItem) return;
    const { key, id } = editingBudgetItem;
    setBudget(p => ({ ...p, [key]: p[key].map(item => item.id === id ? { ...item, category: budgetEditValues.category, planned: parseFloat(budgetEditValues.planned) || 0, actual: parseFloat(budgetEditValues.actual) || 0, dueDate: budgetEditValues.dueDate || "" } : item) }));
    setEditingBudgetItem(null);
  };
  const addSavingContribution = (id) => {
    const amount = moneyValue(savingContributions[id]);
    if (amount <= 0) return;
    setBudget(p => ({ ...p, saving: p.saving.map(item => item.id === id ? { ...item, actual: moneyValue(item.actual) + amount } : item) }));
    setSavingContributions(p => ({ ...p, [id]: "" }));
    rewardStars(2);
  };

  const createNote = () => {
    if (!newNoteTitle.trim()) return;
    const note = { id: Date.now(), title: newNoteTitle, emoji: newNoteEmoji, color: newNoteColor, content: "", pinned: false, createdAt: new Date().toISOString() };
    setNotes([note, ...notes]);
    setEditingNote(note);
    setNewNoteTitle("");
    setShowNewNote(false);
    rewardStars(3);
  };
  const saveNote = (id, content) => setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
  const deleteNote = (id) => { setNotes(notes.filter(n => n.id !== id)); setEditingNote(null); };
  const togglePin = (id) => setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const deleteCalendarEvent = (id) => setCalendarEvents(p => p.filter(e => e.id !== id));
  const deleteCallLogEntry = (id) => setCallLog(p => p.filter(c => c.id !== id));
  const deleteObjection = (id) => setObjections(p => p.filter(o => o.id !== id));
  const startEditObjection = (obj) => { setEditingObjection(obj.id); setObjectionEditValues({ q: obj.q, a: obj.a }); };
  const saveEditObjection = () => { setObjections(p => p.map(o => o.id === editingObjection ? { ...o, q: objectionEditValues.q, a: objectionEditValues.a } : o)); setEditingObjection(null); };
  const addObjection = () => {
    if (!newObjection.q.trim() || !newObjection.a.trim()) return;
    setObjections(p => [...p, { id: Date.now(), ...newObjection }]);
    setNewObjection({ q: "", a: "" });
    setShowNewObjection(false);
    rewardStars(3);
  };

  const startEditLine = (sectionId, line) => { setEditingLine({ sectionId, lineId: line.id }); setLineEditValues({ ...line }); };
  const saveEditLine = () => {
    if (!editingLine) return;
    setCurrentScript(prev => prev.map(sec => sec.id !== editingLine.sectionId ? sec : { ...sec, lines: sec.lines.map(l => l.id === editingLine.lineId ? { ...l, ...lineEditValues } : l) }));
    setEditingLine(null);
  };
  const deleteLine = (sectionId, lineId) => setCurrentScript(prev => prev.map(sec => sec.id !== sectionId ? sec : { ...sec, lines: sec.lines.filter(l => l.id !== lineId) }));
  const addLine = (sectionId, type = "say") => {
    const newLine = { id: `l${Date.now()}`, type, text: "" };
    if (type === "branch") { newLine.customerSays = ""; newLine.response = ""; delete newLine.text; }
    setCurrentScript(prev => prev.map(sec => sec.id !== sectionId ? sec : { ...sec, lines: [...sec.lines, newLine] }));
    startEditLine(sectionId, newLine);
  };

  const addReminder = () => {
    if (!newReminder.time || !newReminder.message) return;
    setReminders(p => [...p, { id: Date.now(), ...newReminder, daily: true }]);
    setNewReminder({ time: "", message: "" });
  };
  const deleteReminder = (id) => setReminders(p => p.filter(r => r.id !== id));

  const noteColors = [palette.pink, palette.mint, palette.lavender, palette.sky, palette.cream, palette.peach];

  const Blobs = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-50 blur-3xl" style={{background: palette.pink}}></div>
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl" style={{background: palette.lavender}}></div>
      <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full opacity-40 blur-3xl" style={{background: palette.mint}}></div>
      <div className="absolute top-2/3 right-1/4 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{background: palette.sky}}></div>
    </div>
  );

  const PieChart = ({ data, size = 180 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="flex items-center justify-center" style={{width: size, height: size}}><div className="w-full h-full rounded-full border-[16px] opacity-30" style={{borderColor: palette.lavender}}></div></div>;
    const radius = size / 2 - 4, cx = size / 2, cy = size / 2;
    let cumulativeAngle = -Math.PI / 2;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs><filter id="pieshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/></filter></defs>
        {data.map((slice, idx) => {
          const angle = (slice.value / total) * Math.PI * 2;
          const startAngle = cumulativeAngle, endAngle = cumulativeAngle + angle;
          cumulativeAngle = endAngle;
          const x1 = cx + radius * Math.cos(startAngle), y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle), y2 = cy + radius * Math.sin(endAngle);
          const largeArc = angle > Math.PI ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return <path key={idx} d={path} fill={slice.color} stroke="white" strokeWidth="3" filter="url(#pieshadow)" style={{transition: "all 0.5s"}}/>;
        })}
        <circle cx={cx} cy={cy} r={radius * 0.5} fill="white" opacity="0.95"/>
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill={palette.lavenderText} fontWeight="700">TOTAL</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fill={palette.lavenderText} fontWeight="800" style={{fontFamily: "'Fraunces', serif"}}>${total}</text>
      </svg>
    );
  };

  // â”€â”€â”€ AUTH SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative" style={{background: `linear-gradient(135deg, ${palette.pink}, ${palette.lavender}, ${palette.sky})`, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
        <Blobs/>
        <div className="w-full max-w-sm rounded-[2rem] p-7 shadow-2xl backdrop-blur-xl border-2 border-white relative overflow-hidden" style={{background: "rgba(255,255,255,0.85)"}}>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-40 blur-2xl" style={{background: palette.pink}}></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-40 blur-2xl" style={{background: palette.lavender}}></div>

          <div className="relative">
            <div className="text-center mb-7">
              <div className="text-5xl mb-2">ðŸŒ¸</div>
              <h1 className="text-3xl font-extrabold mb-1" style={{background: `linear-gradient(135deg, ${palette.pinkText}, ${palette.lavenderText})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Fraunces', serif"}}>{authView === "login" ? "Welcome back!" : "Create account"}</h1>
              <p className="text-sm" style={{color: palette.lavenderText}}>{authView === "login" ? "Log in to your personal space" : "Your own little corner of the internet"}</p>
            </div>

            <div className="space-y-3">
              {authView === "signup" && (
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{color: palette.lavenderText, opacity: 0.5}}/>
                  <input type="text" placeholder="Your name" value={authForm.displayName} onChange={e => setAuthForm({...authForm, displayName: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2" style={{background: "white", border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
                </div>
              )}
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{color: palette.lavenderText, opacity: 0.5}}/>
                <input type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{color: palette.lavenderText, opacity: 0.5}}/>
                <input type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} onKeyDown={e => e.key === "Enter" && (authView === "login" ? handleLogin() : handleSignup())} className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
              </div>

              {authError && <div className="text-xs font-medium px-3 py-2 rounded-xl" style={{background: palette.pink, color: palette.pinkText}}>âš ï¸ {authError}</div>}

              <button onClick={authView === "login" ? handleLogin : handleSignup} disabled={authLoading} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-md hover:scale-[1.02] disabled:opacity-50 transition-all" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
                {authLoading ? "..." : authView === "login" ? "Log In âœ¨" : "Create Account ðŸŒ¸"}
              </button>

              <div className="text-center pt-3">
                <button onClick={() => { setAuthView(authView === "login" ? "signup" : "login"); setAuthError(""); }} className="text-xs font-bold hover:underline" style={{color: palette.lavenderText}}>
                  {authView === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>

              {!FIREBASE_ENABLED && (
                <div className="text-center pt-4 mt-4 border-t" style={{borderColor: palette.lavender}}>
                  <p className="text-[10px] opacity-60" style={{color: palette.lavenderText}}>ðŸ“± Demo mode: data saves on this device. Add Firebase config in code for cross-device sync.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ MAIN APP (when logged in) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const renderSectionAI = ({ section, color, textColor, emoji, name }) => {
    const isOpen = openSectionAI === section;
    return (
      <div className="rounded-3xl shadow-md border-2 border-white overflow-hidden backdrop-blur-md" style={{background: `linear-gradient(135deg, ${color}80, white)`}}>
        <button onClick={() => setOpenSectionAI(isOpen ? null : section)} className="w-full p-4 flex items-center justify-between hover:bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shadow-sm" style={{background: "white"}}>{emoji}</div>
            <div className="text-left">
              <div className="text-sm font-bold flex items-center gap-1.5" style={{color: textColor, fontFamily: "'Fraunces', serif"}}>{name} <Sparkle className="w-3 h-3"/></div>
              <div className="text-xs opacity-60" style={{color: textColor}}>Ask anything {section}-related</div>
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" style={{color: textColor}}/> : <ChevronDown className="w-4 h-4" style={{color: textColor}}/>}
        </button>
        {isOpen && (
          <div className="border-t" style={{borderColor: color}}>
            <div className="max-h-64 overflow-y-auto p-3 space-y-2.5">
              {sectionAIChats[section].map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm" style={msg.role === "user" ? {background: textColor, color: "white", borderTopRightRadius: "4px"} : {background: "white", color: "#5C5470", borderTopLeftRadius: "4px", border: `1px solid ${color}`}}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sectionAILoading[section] && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-3 py-2 shadow-sm border" style={{borderColor: color}}>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{background: textColor, animationDelay: "0ms"}}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{background: textColor, animationDelay: "150ms"}}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{background: textColor, animationDelay: "300ms"}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={sectionEndRefs[section]}/>
            </div>
            <div className="p-3 flex gap-2 border-t" style={{background: "rgba(255,255,255,0.6)", borderColor: color}}>
              <input type="text" value={sectionAIInputs[section]} onChange={e => setSectionAIInputs(p => ({...p, [section]: e.target.value}))} onKeyDown={e => e.key === "Enter" && handleSectionAISubmit(section)} placeholder={`Ask your ${section} coach...`} className="flex-grow rounded-xl px-3 py-2 text-xs focus:outline-none" style={{background: "white", border: `1.5px solid ${color}`, color: "#5C5470"}}/>
              <button onClick={() => handleSectionAISubmit(section)} disabled={sectionAILoading[section]} className="text-white p-2 rounded-xl shadow-sm disabled:opacity-50" style={{background: textColor}}>
                <Send className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // â”€â”€â”€ SETTINGS MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderSettings = () => (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
      <div className="w-full sm:max-w-md max-h-[88vh] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-2" style={{background: `linear-gradient(180deg, ${palette.bg}, ${palette.bgWarm})`, borderColor: palette.lavenderDeep}}>
        <div className="p-4 border-b flex justify-between items-center" style={{background: `linear-gradient(135deg, ${palette.lavender}90, ${palette.pink}70)`, borderColor: palette.lavender}}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md" style={{background: "white"}}>
              <User className="w-5 h-5" style={{color: palette.lavenderText}}/>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>{user.displayName}</h3>
              <p className="text-xs opacity-70" style={{color: palette.lavenderText}}>{user.email}</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-white/40" style={{color: palette.lavenderText}}><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {/* Notifications */}
          <div className="rounded-3xl p-4 border-2 border-white shadow-sm" style={{background: `linear-gradient(135deg, ${palette.cream}60, white)`}}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{color: palette.creamText}}/>
                <h4 className="font-bold text-sm" style={{color: palette.creamText, fontFamily: "'Fraunces', serif"}}>Notifications</h4>
              </div>
              {notifPermission === "granted" ? (
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background: palette.mint, color: palette.mintText}}>âœ“ Enabled</span>
              ) : notifPermission === "denied" ? (
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background: palette.pink, color: palette.pinkText}}>Blocked</span>
              ) : (
                <button onClick={enableNotifications} className="text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-sm" style={{background: palette.creamText}}>Enable</button>
              )}
            </div>
            {notifPermission === "denied" && <p className="text-xs opacity-70 mb-2" style={{color: palette.creamText}}>Notifications blocked. Enable them in your browser settings.</p>}
            {notifPermission === "granted" && (
              <>
                <p className="text-xs opacity-70 mb-3" style={{color: palette.creamText}}>You'll get reminders for routines, schedule events (5 min before), and a morning summary at 8am.</p>

                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{color: palette.creamText}}>Custom Reminders</div>
                {reminders.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {reminders.map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/70">
                        <span className="text-xs font-bold" style={{color: palette.creamText}}>{r.time}</span>
                        <span className="text-xs flex-grow truncate" style={{color: "#5C5470"}}>{r.message}</span>
                        <button onClick={() => deleteReminder(r.id)} className="p-1 rounded-full hover:bg-pink-50" style={{color: palette.pinkText}}><Trash2 className="w-3 h-3"/></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" placeholder="8:00 AM" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} className="w-20 text-xs p-2 rounded-lg focus:outline-none" style={{background: "white", border: `1px solid ${palette.cream}`}}/>
                  <input type="text" placeholder="Take meds" value={newReminder.message} onChange={e => setNewReminder({...newReminder, message: e.target.value})} className="flex-grow text-xs p-2 rounded-lg focus:outline-none" style={{background: "white", border: `1px solid ${palette.cream}`}}/>
                  <button onClick={addReminder} className="text-xs px-3 rounded-lg font-bold text-white" style={{background: palette.creamText}}>+</button>
                </div>
                <p className="text-[10px] opacity-50 mt-2" style={{color: palette.creamText}}>ðŸ’¡ Format: "8:00 AM" or "3:30 PM"</p>
              </>
            )}
          </div>

          {/* Test notification */}
          {notifPermission === "granted" && (
            <button onClick={() => sendNotification("ðŸŒ¸ Test reminder", "This is what your reminders will look like!")} className="w-full py-2.5 rounded-2xl text-xs font-bold border-2" style={{background: "white", color: palette.lavenderText, borderColor: palette.lavender}}>
              Send test notification ðŸ””
            </button>
          )}

          {/* iPhone tip */}
          <div className="rounded-2xl p-3 text-xs" style={{background: palette.sky, color: palette.skyText}}>
            <p className="font-bold mb-1">ðŸ“± On iPhone:</p>
            <p className="opacity-90">Add to Home Screen (Safari Share â†’ Add to Home Screen) so notifications work even when the app isn't open!</p>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm" style={{background: palette.pink, color: palette.pinkText}}>
            <LogOut className="w-4 h-4"/>Log Out
          </button>
        </div>
      </div>
    </div>
  );

  // â”€â”€â”€ MASTER AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderMasterAI = () => (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
      <div className="w-full sm:max-w-md h-[88vh] sm:h-[640px] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-2" style={{background: `linear-gradient(180deg, ${palette.bg}, ${palette.bgWarm})`, borderColor: palette.lavenderDeep}}>
        <div className="p-4 border-b flex justify-between items-center shrink-0" style={{background: `linear-gradient(135deg, ${palette.lavender}90, ${palette.pink}70, ${palette.mint}60)`, borderColor: palette.lavender}}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md" style={{background: `linear-gradient(135deg, ${palette.lavenderDeep}, ${palette.pinkDeep})`}}>
              <Wand2 className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>Main AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{background: palette.mintDeep}}></div>
                <p className="text-xs font-medium" style={{color: palette.lavenderText}}>Can make changes in your app âœ¨</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowMasterAI(false)} className="text-stone-500 hover:bg-white/40 p-2 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        {recentAction && (
          <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{background: palette.mint, borderColor: palette.mintDeep}}>
            <CheckCircle2 className="w-4 h-4" style={{color: palette.mintText}}/>
            <span className="text-xs font-bold" style={{color: palette.mintText}}>Done! {recentAction}</span>
          </div>
        )}

        <div className="flex gap-2 px-4 py-3 border-b shrink-0 overflow-x-auto" style={{borderColor: palette.lavender, scrollbarWidth: "none"}}>
          {["Add a water glass", "Log an appointment", "Add note about today", "Set reminder at 3pm to stretch"].map(q => (
            <button key={q} onClick={() => setMasterInput(q)} className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:scale-105 shrink-0" style={{background: palette.lavender, color: palette.lavenderText}}>{q}</button>
          ))}
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {masterChat.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center mr-2 shrink-0 mt-0.5 shadow-sm" style={{background: `linear-gradient(135deg, ${palette.lavenderDeep}, ${palette.pinkDeep})`}}>
                  <Wand2 className="w-4 h-4 text-white"/>
                </div>
              )}
              <div className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap" style={msg.role === "user" ? {background: `linear-gradient(135deg, ${palette.pinkDeep}, ${palette.lavenderDeep})`, color: "white", borderTopRightRadius: "4px"} : {background: "white", color: "#5C5470", borderTopLeftRadius: "4px", border: `1px solid ${palette.lavender}`}}>
                {msg.content}
              </div>
            </div>
          ))}
          {masterLoading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center mr-2 shrink-0 mt-0.5 shadow-sm" style={{background: `linear-gradient(135deg, ${palette.lavenderDeep}, ${palette.pinkDeep})`}}>
                <Wand2 className="w-4 h-4 text-white"/>
              </div>
              <div className="px-4 py-3 rounded-2xl shadow-sm" style={{background: "white", borderTopLeftRadius: "4px", border: `1px solid ${palette.lavender}`}}>
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{background: palette.pinkDeep, animationDelay: "0ms"}}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{background: palette.lavenderDeep, animationDelay: "150ms"}}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{background: palette.mintDeep, animationDelay: "300ms"}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={masterEndRef}/>
        </div>
        <div className="p-4 border-t flex gap-2 shrink-0" style={{background: "rgba(255,255,255,0.6)", borderColor: palette.lavender}}>
          <input type="text" value={masterInput} onChange={e => setMasterInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleMasterAISubmit()} placeholder="Tell me to do something..." className="flex-grow rounded-2xl px-4 py-2.5 text-sm focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
          <button onClick={handleMasterAISubmit} disabled={masterLoading} className="text-white p-3 rounded-2xl hover:opacity-90 disabled:opacity-50 shadow-md" style={{background: `linear-gradient(135deg, ${palette.lavenderDeep}, ${palette.pinkDeep})`}}>
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => {
    const morningProgress = Math.round((completedTasks.filter(id => id < 100).length / morningRoutine.length) * 100) || 0;
    const nightProgress = Math.round((completedTasks.filter(id => id > 100).length / nightRoutine.length) * 100) || 0;
    const selectedDateObj = new Date(currentTime.getFullYear(), currentTime.getMonth(), selectedPlanDate);
    const selectedDateLabel = selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const selectedDateString = String(selectedPlanDate);
    const scheduleForSelectedDay = scheduleItems.filter(item => !item.date || String(parseInt(item.date)) === selectedDateString);
    const calendarForSelectedDay = calendarEvents
      .filter(ev => String(parseInt(ev.date)) === selectedDateString)
      .filter(ev => !scheduleForSelectedDay.some(item => String(item.event || "").toLowerCase() === String(ev.title || "").toLowerCase()));
    const sortedScheduleItems = sortScheduleItems([
      ...scheduleForSelectedDay,
      ...calendarForSelectedDay.map(ev => ({ id: `cal-${ev.id}`, date: ev.date, time: "All day", event: ev.title, type: ev.type || "routine", fromCalendar: true })),
    ]);
    const dotColor = (type) => {
      if (type === "break") return palette.cream;
      if (type === "routine") return palette.peach;
      if (type === "finish") return palette.lavender;
      return palette.mint;
    };
    return (
      <div className="animate-in fade-in duration-500 space-y-5">
        <div className="rounded-[1.75rem] p-6 shadow-lg border-2" style={{background: `linear-gradient(135deg, ${palette.cream}80, ${palette.peach}60, ${palette.pink}50)`, borderColor: "rgba(255,255,255,0.7)"}}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{background: "white"}}><Sun className="w-5 h-5" style={{color: palette.peachText}}/></div>
              <h2 className="text-lg font-bold" style={{color: palette.peachText, fontFamily: "'Fraunces', serif"}}>Morning Warmup</h2>
            </div>
            <span className="text-sm font-extrabold px-2.5 py-1 rounded-full bg-white/70" style={{color: palette.peachText}}>{morningProgress}%</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-3 mb-4 shadow-inner overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-700" style={{width: `${morningProgress}%`, background: `linear-gradient(90deg, ${palette.peachDeep}, ${palette.pinkDeep})`}}></div>
          </div>
          <button onClick={() => startRoutine("morning")} className="w-full text-white font-bold py-3.5 rounded-2xl flex items-center justify-center shadow-md active:scale-95 text-sm" style={{background: `linear-gradient(135deg, ${palette.peachText}, ${palette.pinkText})`}}>
            <Play className="w-4 h-4 mr-2 fill-white"/>Start Morning Routine
          </button>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold flex items-center" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}><Clock className="w-4 h-4 mr-2"/>{selectedDateLabel} Plan</h3>
          <div className="flex gap-2">
            <button onClick={() => setSelectedPlanDate(currentTime.getDate())} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background: palette.sky, color: palette.skyText}}>Today</button>
            <button onClick={() => setIsEditingSchedule(!isEditingSchedule)} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-full" style={{background: palette.lavender, color: palette.lavenderText}}>
              <Edit2 className="w-3 h-3"/>{isEditingSchedule ? "Done" : "Edit"}
            </button>
          </div>
        </div>
        <div className="rounded-[1.75rem] p-5 shadow-md backdrop-blur-md border-2" style={{background: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.9)"}}>
          {sortedScheduleItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">ðŸ“…</div>
              <p className="text-sm font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>No events yet</p>
              <p className="text-xs opacity-60 mt-1" style={{color: palette.lavenderText}}>Tap Edit to add your daily schedule</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedScheduleItems.map((item, index) => (
                <div key={item.id} className="flex relative items-center">
                  {index !== sortedScheduleItems.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px]" style={{background: `linear-gradient(180deg, ${palette.lavender}, transparent)`}}></div>}
                  <div className="w-6 h-6 rounded-full border-4 border-white shadow-md flex-shrink-0 z-10" style={{background: dotColor(item.type)}}></div>
                  <div className="ml-4 flex-grow">
                    <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color: palette.lavenderText}}>{item.time}</div>
                    <div className={`text-sm font-medium ${item.type === "break" ? "px-3 py-1.5 rounded-xl inline-block" : ""}`} style={item.type === "break" ? {background: palette.cream, color: palette.creamText, fontWeight: 700} : {color: "#5C5470"}}>{item.event}</div>
                  </div>
                    {isEditingSchedule && !item.fromCalendar && <button onClick={() => setScheduleItems(scheduleItems.filter(i => i.id !== item.id))} className="p-2 ml-2 rounded-full hover:bg-pink-50" style={{color: palette.pinkText}}><Trash2 className="w-4 h-4"/></button>}
                </div>
              ))}
            </div>
          )}
          {isEditingSchedule && (
            <div className="mt-5 pt-4 border-t flex flex-col gap-2" style={{borderColor: palette.lavender}}>
              <div className="flex gap-2">
                <input type="text" placeholder="Time (e.g. 8:00 AM)" value={newScheduleItem.time} onChange={e => setNewScheduleItem({...newScheduleItem, time: e.target.value})} className="flex-1 text-sm p-2.5 rounded-xl focus:outline-none" style={{background: palette.bg, border: `1.5px solid ${palette.lavender}`}}/>
                <select value={newScheduleItem.type} onChange={e => setNewScheduleItem({...newScheduleItem, type: e.target.value})} className="text-sm p-2.5 rounded-xl focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.lavender}`}}>
                  <option value="work">Work</option><option value="break">Break</option><option value="routine">Routine</option><option value="finish">Finish</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Event description" value={newScheduleItem.event} onChange={e => setNewScheduleItem({...newScheduleItem, event: e.target.value})} className="flex-[3] text-sm p-2.5 rounded-xl focus:outline-none" style={{background: palette.bg, border: `1.5px solid ${palette.lavender}`}}/>
                <button onClick={() => { if (newScheduleItem.time && newScheduleItem.event) { setScheduleItems(sortScheduleItems([...scheduleItems, {...newScheduleItem, date: String(selectedPlanDate), id: Date.now()}])); setNewScheduleItem({time: "", event: "", type: "work"}); } }} className="flex-1 rounded-xl text-sm font-bold flex justify-center items-center shadow-sm" style={{background: palette.mintDeep, color: palette.mintText}}>
                  <Plus className="w-4 h-4 mr-1"/>Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] p-6 shadow-lg border-2" style={{background: `linear-gradient(135deg, ${palette.lavender}80, ${palette.sky}60, ${palette.pink}40)`, borderColor: "rgba(255,255,255,0.7)"}}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{background: "white"}}><Moon className="w-5 h-5" style={{color: palette.lavenderText}}/></div>
              <h2 className="text-lg font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>Night Wind Down</h2>
            </div>
            <span className="text-sm font-extrabold px-2.5 py-1 rounded-full bg-white/70" style={{color: palette.lavenderText}}>{nightProgress}%</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-3 mb-4 shadow-inner overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-700" style={{width: `${nightProgress}%`, background: `linear-gradient(90deg, ${palette.lavenderDeep}, ${palette.skyDeep})`}}></div>
          </div>
          <button onClick={() => startRoutine("night")} className="w-full text-white font-bold py-3.5 rounded-2xl flex items-center justify-center shadow-md active:scale-95 text-sm" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.skyText})`}}>
            <Play className="w-4 h-4 mr-2 fill-white"/>Start Night Routine
          </button>
        </div>
      </div>
    );
  };

  const renderLiveCoaching = () => {
    if (!voiceMode) return null;
    return (
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/95 backdrop-blur-xl shadow-2xl border-l-2 z-50 flex flex-col" style={{borderColor: palette.lavenderDeep}}>
        <div className="p-4 border-b shrink-0" style={{background: `linear-gradient(135deg, ${palette.lavender}, ${palette.pink}80)`, borderColor: palette.lavenderDeep}}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm relative" style={{background: "white"}}>
                <Headphones className="w-5 h-5" style={{color: palette.lavenderText}}/>
                {isListening && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse border-2 border-white" style={{background: palette.pinkDeep}}></div>}
              </div>
              <div>
                <h3 className="text-base font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>Live Call Coach</h3>
                <p className="text-xs font-medium" style={{color: palette.lavenderText}}>{isListening ? "ðŸ”´ Listening..." : "Ready to listen"}</p>
              </div>
            </div>
            <button onClick={() => setVoiceMode(false)} className="p-2 rounded-full hover:bg-white/40" style={{color: palette.lavenderText}}><X className="w-5 h-5"/></button>
          </div>
          {!voiceSupported && <div className="text-xs p-3 rounded-xl mb-2 bg-white/80" style={{color: palette.pinkText}}>âš ï¸ Works best in Safari on iPhone with mic permissions allowed!</div>}
          <button onClick={toggleListening} disabled={!voiceSupported} className="w-full py-3 rounded-2xl font-bold text-white shadow-md flex items-center justify-center gap-2 disabled:opacity-50" style={{background: isListening ? `linear-gradient(135deg, ${palette.pinkDeep}, ${palette.peachDeep})` : `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
            {isListening ? <><MicOff className="w-4 h-4"/>Stop Listening</> : <><Mic className="w-4 h-4"/>Start Listening</>}
          </button>
          {isListening && (
            <div className="mt-3 p-2.5 rounded-xl bg-white/70 text-xs italic" style={{color: palette.lavenderText, minHeight: "32px"}}>
              <span className="font-bold not-italic">Hearing: </span>{(transcript.slice(-100) + interimTranscript) || "Speak naturally..."}
            </div>
          )}
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {liveCoaching.length === 0 && !isListening && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">ðŸŽ§</div>
              <p className="text-sm font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>Ready when you are!</p>
              <p className="text-xs mt-2 opacity-70" style={{color: palette.lavenderText}}>Tap "Start Listening" and I'll guide you through every call.</p>
            </div>
          )}
          {liveCoaching.map(tip => {
            const statusConfig = {
              on_track: { color: palette.mint, tc: palette.mintText, icon: "âœ…", label: "On Track" },
              off_track: { color: palette.peach, tc: palette.peachText, icon: "âš ï¸", label: "Off Track" },
              objection: { color: palette.pink, tc: palette.pinkText, icon: "ðŸ›¡ï¸", label: "Objection" },
              buying_signal: { color: palette.cream, tc: palette.creamText, icon: "ðŸ’Ž", label: "Buying Signal" },
            };
            const cfg = statusConfig[tip.status] || statusConfig.on_track;
            return (
              <div key={tip.id} className="rounded-2xl p-3.5 shadow-sm border-2" style={{background: `${cfg.color}40`, borderColor: cfg.color}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{color: cfg.tc}}><span className="text-sm">{cfg.icon}</span>{cfg.label}{tip.stage && <span className="opacity-60 text-[10px] uppercase tracking-wider">Â· {tip.stage}</span>}</span>
                  <span className="text-[10px] opacity-50" style={{color: cfg.tc}}>{tip.time}</span>
                </div>
                {tip.alert && <div className="text-xs italic mb-2 px-2 py-1 rounded-lg bg-white/60" style={{color: cfg.tc}}>âš¡ {tip.alert}</div>}
                <div className="bg-white/80 rounded-xl p-2.5">
                  <div className="flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{color: cfg.tc}}/>
                    <p className="text-xs font-medium leading-relaxed" style={{color: "#5C5470"}}>{tip.tip}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={coachingEndRef}/>
        </div>
      </div>
    );
  };

  const renderWork = () => {
    const activeSection = currentScript.find(s => s.id === activeScriptSection) || currentScript[0];
    if (!activeSection) {
      // No sections yet, show empty state
      return (
        <div className="animate-in fade-in duration-500 space-y-5">
          <div className="rounded-3xl p-8 border-2 border-white shadow-md text-center" style={{background: "rgba(255,255,255,0.7)"}}>
            <div className="text-5xl mb-3">ðŸ“ž</div>
            <p className="text-sm font-bold mb-2" style={{color: palette.mintText, fontFamily: "'Fraunces', serif"}}>Add your script!</p>
            <p className="text-xs opacity-60" style={{color: palette.mintText}}>Tap below to start building your call script.</p>
            <button onClick={() => {
              setCurrentScript([{ id: "intro", label: "Intro", color: palette.mint, textColor: palette.mintText, emoji: "ðŸ‘‹", lines: [] }]);
              setActiveScriptSection("intro");
            }} className="mt-4 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md" style={{background: `linear-gradient(135deg, ${palette.mintText}, ${palette.skyText})`}}>
              + Start Building
            </button>
          </div>
        </div>
      );
    }
    const currentIdx = currentScript.findIndex(s => s.id === activeScriptSection);
    const nextSection = currentScript[currentIdx + 1];
    const prevSection = currentScript[currentIdx - 1];

    const renderEditableLine = (line, sectionId) => {
      const isEditing = editingLine?.lineId === line.id;
      if (isEditing) {
        if (line.type === "branch") {
          return (
            <div className="ml-4 rounded-2xl border-2 p-3 space-y-2" style={{borderColor: palette.lavenderDeep, background: "white"}}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{color: palette.lavenderText}}>IF CUSTOMER SAYS:</div>
              <textarea value={lineEditValues.customerSays || ""} onChange={e => setLineEditValues({...lineEditValues, customerSays: e.target.value})} className="w-full text-xs p-2 rounded-lg resize-none" rows="2" style={{border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{color: palette.mintText}}>YOU SAY:</div>
              <textarea value={lineEditValues.response || ""} onChange={e => setLineEditValues({...lineEditValues, response: e.target.value})} className="w-full text-xs p-2 rounded-lg resize-none" rows="2" style={{border: `1.5px solid ${palette.mint}`, color: "#5C5470"}}/>
              <div className="flex gap-2">
                <button onClick={saveEditLine} className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{background: palette.mintDeep, color: palette.mintText}}><Check className="w-3.5 h-3.5 inline mr-1"/>Save</button>
                <button onClick={() => setEditingLine(null)} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-stone-500">Cancel</button>
              </div>
            </div>
          );
        }
        return (
          <div className="rounded-2xl border-2 p-3 space-y-2" style={{borderColor: palette.lavenderDeep, background: "white"}}>
            <select value={lineEditValues.type} onChange={e => setLineEditValues({...lineEditValues, type: e.target.value})} className="w-full text-xs p-2 rounded-lg" style={{border: `1.5px solid ${palette.lavender}`}}>
              <option value="say">YOU SAY</option><option value="customer">CUSTOMER</option><option value="header">HEADER</option><option value="tip">TIP</option>
            </select>
            <textarea value={lineEditValues.text || ""} onChange={e => setLineEditValues({...lineEditValues, text: e.target.value})} className="w-full text-xs p-2 rounded-lg resize-none" rows="3" style={{border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
            <div className="flex gap-2">
              <button onClick={saveEditLine} className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{background: palette.mintDeep, color: palette.mintText}}><Check className="w-3.5 h-3.5 inline mr-1"/>Save</button>
              <button onClick={() => setEditingLine(null)} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-stone-500">Cancel</button>
            </div>
          </div>
        );
      }
      const EditButtons = () => scriptEditMode && (
        <div className="flex gap-1 ml-auto shrink-0">
          <button onClick={() => startEditLine(sectionId, line)} className="p-1.5 rounded-lg hover:bg-white/60" style={{color: palette.lavenderText}}><Edit2 className="w-3 h-3"/></button>
          <button onClick={() => deleteLine(sectionId, line.id)} className="p-1.5 rounded-lg hover:bg-white/60" style={{color: palette.pinkText}}><Trash2 className="w-3 h-3"/></button>
        </div>
      );
      if (line.type === "header") return (
        <div className="text-xs font-extrabold uppercase tracking-widest pt-3 mt-1 flex items-center gap-2">
          <span style={{background: `linear-gradient(90deg, ${activeSection.color}, transparent)`, padding: "5px 12px", borderRadius: "10px", color: activeSection.textColor}}>{line.text}</span>
          <EditButtons/>
        </div>
      );
      if (line.type === "tip") return (
        <div className="flex gap-2 items-start p-3 rounded-2xl border-2" style={{background: palette.cream, borderColor: palette.creamDeep}}>
          <span className="text-base shrink-0">ðŸ’›</span>
          <p className="text-xs font-medium leading-relaxed flex-grow" style={{color: palette.creamText}}>{line.text}</p>
          <EditButtons/>
        </div>
      );
      if (line.type === "customer") return (
        <div className="ml-8 flex gap-2.5 items-start p-3 rounded-2xl border-2" style={{background: palette.sky, borderColor: palette.skyDeep}}>
          <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5 bg-white" style={{color: palette.skyText}}>CUSTOMER</span>
          <p className="text-xs italic leading-relaxed flex-grow" style={{color: palette.skyText}}>"{line.text}"</p>
          <EditButtons/>
        </div>
      );
      if (line.type === "branch") return (
        <div className="ml-4 rounded-2xl border-2 overflow-hidden" style={{borderColor: palette.lavenderDeep, background: palette.lavender}}>
          <div className="px-3 py-2 flex items-center gap-2" style={{background: palette.lavenderDeep}}>
            <ArrowRight className="w-3.5 h-3.5 text-white"/>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white flex-grow">IF CUSTOMER SAYS:</span>
            {scriptEditMode && (
              <div className="flex gap-1">
                <button onClick={() => startEditLine(sectionId, line)} className="p-1 rounded hover:bg-white/30 text-white"><Edit2 className="w-3 h-3"/></button>
                <button onClick={() => deleteLine(sectionId, line.id)} className="p-1 rounded hover:bg-white/30 text-white"><Trash2 className="w-3 h-3"/></button>
              </div>
            )}
          </div>
          <div className="px-3 py-2.5 italic text-xs" style={{color: palette.lavenderText, background: `${palette.lavender}50`}}>"{line.customerSays}"</div>
          <div className="px-3 py-2.5 flex gap-2 items-start" style={{background: "white"}}>
            <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{background: palette.mintDeep, color: palette.mintText}}>YOU SAY</span>
            <p className="text-xs font-medium leading-relaxed" style={{color: "#5C5470"}}>{line.response}</p>
          </div>
        </div>
      );
      return (
        <div className="flex gap-2.5 items-start p-3 rounded-2xl" style={{background: palette.mint, border: `2px solid ${palette.mintDeep}`}}>
          <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5 bg-white" style={{color: palette.mintText}}>YOU SAY</span>
          <p className="text-xs leading-relaxed font-medium flex-grow" style={{color: palette.mintText}}>{line.text}</p>
          <EditButtons/>
        </div>
      );
    };

    return (
      <div className="animate-in fade-in duration-500 space-y-5">
        <div className="rounded-3xl p-5 shadow-lg border-2 relative overflow-hidden" style={{background: `linear-gradient(135deg, ${palette.lavender}, ${palette.pink}80, ${palette.peach}60)`, borderColor: "rgba(255,255,255,0.8)"}}>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{background: "white"}}><Headphones className="w-7 h-7" style={{color: palette.lavenderText}}/></div>
            <div className="flex-grow">
              <h3 className="text-base font-bold" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>Live Call Coach ðŸŽ§</h3>
              <p className="text-xs mt-0.5" style={{color: palette.lavenderText}}>iPhone will listen + nudge you live</p>
            </div>
            <button onClick={() => setVoiceMode(true)} className="text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-md hover:scale-105 shrink-0" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
              <span className="flex items-center gap-1.5"><Mic className="w-4 h-4"/>Open</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {value: appointments, label: "APPTS", sub: "today", color: palette.mint, tc: palette.mintText},
            {value: callStreak, label: "STREAK", sub: callStreak >= 3 ? "ðŸ”¥" : "keep going", color: palette.lavender, tc: palette.lavenderText},
            {value: callLog.length, label: "CALLS", sub: "today", color: palette.pink, tc: palette.pinkText},
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-4 text-center shadow-md border-2 border-white" style={{background: `linear-gradient(135deg, ${stat.color}90, ${stat.color}50)`}}>
              <div className="text-3xl font-extrabold" style={{color: stat.tc, fontFamily: "'Fraunces', serif"}}>{stat.value}</div>
              <div className="text-[10px] font-bold tracking-wider mt-1" style={{color: stat.tc, opacity: 0.7}}>{stat.label}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{color: stat.tc}}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {renderSectionAI({ section: "work", color: palette.mint, textColor: palette.mintText, emoji: "ðŸ“ž", name: "Work AI Coach" })}

        <div className="flex gap-2 p-1.5 rounded-2xl shadow-inner" style={{background: "rgba(255,255,255,0.6)"}}>
          <button onClick={() => { setScriptType("inbound"); setActiveScriptSection(inboundScript[0]?.id || "intro"); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={scriptType === "inbound" ? {background: palette.mint, color: palette.mintText, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"} : {color: "#9CA3AF"}}>
            <PhoneIncoming className="w-3.5 h-3.5"/>Inbound
          </button>
          <button onClick={() => { setScriptType("outbound"); setActiveScriptSection(outboundScript[0]?.id || "placeholder"); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={scriptType === "outbound" ? {background: palette.peach, color: palette.peachText, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"} : {color: "#9CA3AF"}}>
            <PhoneOutgoing className="w-3.5 h-3.5"/>Outbound
          </button>
        </div>

        <div className="rounded-3xl shadow-md border-2 border-white overflow-hidden backdrop-blur-md" style={{background: "rgba(255,255,255,0.85)"}}>
          <div className="flex gap-1.5 px-3 pt-3 pb-2 overflow-x-auto border-b items-center" style={{scrollbarWidth: "none", borderColor: palette.lavender}}>
            {currentScript.map((s, idx) => (
              <button key={s.id} onClick={() => setActiveScriptSection(s.id)} className="whitespace-nowrap text-xs font-bold px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5" style={activeScriptSection === s.id ? {background: s.color, color: s.textColor, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transform: "scale(1.05)"} : {background: "white", color: "#9CA3AF", border: `1px solid ${palette.lavender}`}}>
                <span className="opacity-60 text-[10px]">{idx + 1}</span><span>{s.emoji}</span><span>{s.label}</span>
              </button>
            ))}
            <button onClick={() => setScriptEditMode(!scriptEditMode)} className="ml-auto p-2 rounded-lg shrink-0" style={{background: scriptEditMode ? palette.pink : palette.lavender, color: scriptEditMode ? palette.pinkText : palette.lavenderText}}>
              {scriptEditMode ? <Check className="w-3.5 h-3.5"/> : <Edit2 className="w-3.5 h-3.5"/>}
            </button>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm" style={{background: activeSection.color}}>{activeSection.emoji}</div>
              <div>
                <h4 className="font-bold text-lg" style={{color: activeSection.textColor, fontFamily: "'Fraunces', serif"}}>{activeSection.label}</h4>
                <p className="text-xs opacity-60" style={{color: activeSection.textColor}}>{currentIdx + 1} of {currentScript.length}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {activeSection.lines.length === 0 && !scriptEditMode && (
                <p className="text-xs text-center py-4 opacity-50" style={{color: activeSection.textColor}}>No lines yet. Tap the pencil to add some!</p>
              )}
              {activeSection.lines.map(line => <div key={line.id}>{renderEditableLine(line, activeSection.id)}</div>)}
              {scriptEditMode && (
                <div className="flex gap-2 pt-2 flex-wrap">
                  <button onClick={() => addLine(activeSection.id, "say")} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{background: palette.mint, color: palette.mintText}}>+ Say</button>
                  <button onClick={() => addLine(activeSection.id, "customer")} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{background: palette.sky, color: palette.skyText}}>+ Customer</button>
                  <button onClick={() => addLine(activeSection.id, "branch")} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{background: palette.lavender, color: palette.lavenderText}}>+ Branch</button>
                  <button onClick={() => addLine(activeSection.id, "tip")} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{background: palette.cream, color: palette.creamText}}>+ Tip</button>
                </div>
              )}
            </div>
            {currentScript.length > 1 && (
              <div className="flex gap-2 mt-5 pt-4 border-t" style={{borderColor: palette.lavender}}>
                <button onClick={() => prevSection && setActiveScriptSection(prevSection.id)} disabled={!prevSection} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-30 flex items-center justify-center gap-1.5" style={{background: "white", color: palette.lavenderText, border: `1.5px solid ${palette.lavender}`}}>
                  <ArrowLeft className="w-3.5 h-3.5"/>{prevSection ? prevSection.label : "Start"}
                </button>
                <button onClick={() => nextSection && setActiveScriptSection(nextSection.id)} disabled={!nextSection} className="flex-[2] py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-30 flex items-center justify-center gap-1.5 shadow-md" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
                  Next: {nextSection ? nextSection.label : "Done!"}<ArrowRight className="w-3.5 h-3.5"/>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl shadow-md border-2 border-white overflow-hidden" style={{background: `linear-gradient(135deg, ${palette.lavender}, ${palette.pink}70)`}}>
          <div className="p-4 border-b" style={{borderColor: "rgba(255,255,255,0.5)"}}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}><Sparkle className="w-4 h-4"/>Off-Script? Get a Segue</h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="e.g. 'My neighbor used your competitor...'" value={segueQuery} onChange={e => setSegueQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && askForSegue()} className="flex-grow text-sm p-2.5 rounded-xl focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.lavenderDeep}`, color: "#5C5470"}}/>
              <button onClick={askForSegue} disabled={segueLoading || !segueQuery.trim()} className="text-white px-4 rounded-xl text-sm font-bold shadow-md disabled:opacity-50" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
                {segueLoading ? "..." : <Sparkle className="w-4 h-4"/>}
              </button>
            </div>
            {segueResults.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {segueResults.map(r => (
                  <div key={r.id} className="rounded-2xl bg-white p-3 shadow-sm border" style={{borderColor: palette.lavender}}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2" style={{color: palette.skyText}}>
                      <span>ðŸ“¢ CUSTOMER SAID</span><span className="opacity-50">{r.time}</span>
                      <button onClick={() => setSegueResults(p => p.filter(x => x.id !== r.id))} className="ml-auto p-1 rounded-full" style={{color: palette.pinkText}}><X className="w-3 h-3"/></button>
                    </div>
                    <p className="text-xs italic mb-2.5 pl-2 border-l-2" style={{color: palette.skyText, borderColor: palette.sky}}>"{r.question}"</p>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{color: palette.mintText}}>ðŸ’š YOU SAY</div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{color: "#5C5470"}}>{r.answer}</p>
                    <button onClick={() => {
                      const note = { id: Date.now(), title: `Segue: ${r.question.slice(0, 30)}`, emoji: "ðŸ’¬", color: palette.lavender, content: `Customer said: "${r.question}"\n\nYou say:\n${r.answer}`, pinned: false, createdAt: new Date().toISOString() };
                      setNotes(p => [note, ...p]);
                      rewardStars(2);
                    }} className="mt-2 text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-full" style={{background: palette.mint, color: palette.mintText}}>
                      <Save className="w-3 h-3"/>Save to Notes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl shadow-md border-2 border-white overflow-hidden backdrop-blur-md" style={{background: "rgba(255,255,255,0.7)"}}>
          <div className="p-4 border-b" style={{borderColor: palette.pink}}>
            <h3 className="text-sm font-bold flex items-center mb-3" style={{color: palette.pinkText, fontFamily: "'Fraunces', serif"}}><Phone className="w-4 h-4 mr-2"/>Log a Call</h3>
            <div className="flex gap-2 mb-3">
              {[
                {v: "appointment", label: "ðŸ“… Appt", c: palette.mint, tc: palette.mintText},
                {v: "callback", label: "ðŸ“ž Callback", c: palette.cream, tc: palette.creamText},
                {v: "no", label: "âŒ No", c: palette.pink, tc: palette.pinkText},
              ].map(opt => (
                <button key={opt.v} onClick={() => setNewCallResult(opt.v)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${newCallResult === opt.v ? "shadow-md scale-105" : "opacity-50"}`} style={{background: opt.c, color: opt.tc}}>{opt.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Notes (optional)..." value={newCallNotes} onChange={e => setNewCallNotes(e.target.value)} className="flex-grow text-sm p-2.5 rounded-xl focus:outline-none" style={{background: palette.bg, border: `1.5px solid ${palette.pink}`}}/>
              <button onClick={logCall} className="text-white px-5 rounded-xl text-sm font-bold shadow-md" style={{background: `linear-gradient(135deg, ${palette.pinkText}, ${palette.lavenderText})`}}>Log</button>
            </div>
          </div>
          {callLog.length > 0 && (
            <>
              <button onClick={() => setShowCallLog(!showCallLog)} className="w-full p-3 text-xs font-bold flex items-center justify-center gap-1" style={{color: palette.pinkText}}>
                {showCallLog ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                {showCallLog ? "Hide" : "Show"} Call Log ({callLog.length})
              </button>
              {showCallLog && (
                <div className="border-t divide-y max-h-48 overflow-y-auto" style={{borderColor: palette.pink}}>
                  {callLog.map(call => (
                    <div key={call.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-lg">{call.result === "appointment" ? "ðŸ“…" : call.result === "callback" ? "ðŸ“ž" : "âŒ"}</span>
                      <div className="flex-grow min-w-0">
                        <div className="text-xs font-bold truncate" style={{color: palette.pinkText}}>{call.notes || "No notes"}</div>
                        <div className="text-xs opacity-50" style={{color: palette.pinkText}}>{call.time}</div>
                      </div>
                      <button onClick={() => deleteCallLogEntry(call.id)} className="p-1.5 rounded-full" style={{color: palette.pinkText}}><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-3xl p-5 shadow-md border-2 text-center" style={{background: `linear-gradient(135deg, ${palette.lavender}70, ${palette.pink}50, ${palette.cream}60)`, borderColor: "rgba(255,255,255,0.7)"}}>
          <h3 className="font-bold mb-3 flex items-center justify-center text-sm" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}><Clock className="w-4 h-4 mr-2"/>Focus Timer</h3>
          <div className="flex justify-center space-x-2 mb-4">
            <button onClick={() => switchPomodoroMode("work")} className="px-4 py-1.5 rounded-full text-xs font-bold" style={pomoMode === "work" ? {background: palette.mintDeep, color: palette.mintText, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"} : {background: "white", color: "#9CA3AF"}}>25m Focus</button>
            <button onClick={() => switchPomodoroMode("break")} className="px-4 py-1.5 rounded-full text-xs font-bold" style={pomoMode === "break" ? {background: palette.peachDeep, color: palette.peachText, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"} : {background: "white", color: "#9CA3AF"}}>5m Break</button>
          </div>
          <div className="text-6xl font-extrabold mb-5 font-mono tabular-nums" style={{color: palette.lavenderText, letterSpacing: "-0.04em"}}>{formatTime(pomoTime)}</div>
          <div className="flex justify-center space-x-3">
            <button onClick={togglePomodoro} className="flex items-center px-7 py-2.5 rounded-2xl font-bold text-white shadow-md text-sm" style={{background: pomoActive ? `linear-gradient(135deg, ${palette.creamText}, ${palette.peachText})` : `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
              {pomoActive ? <><Pause className="w-4 h-4 mr-2"/>Pause</> : <><Play className="w-4 h-4 mr-2 fill-white"/>Start</>}
            </button>
            <button onClick={resetPomodoro} className="p-2.5 rounded-2xl shadow-sm" style={{background: "white", color: palette.lavenderText}}><RotateCcw className="w-4 h-4"/></button>
          </div>
        </div>

        <div className="rounded-3xl shadow-md border-2 border-white overflow-hidden backdrop-blur-md" style={{background: "rgba(255,255,255,0.7)"}}>
          <button onClick={() => setObjectionMode(!objectionMode)} className="w-full p-4 flex items-center justify-between hover:bg-white/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{background: `linear-gradient(135deg, ${palette.peach}, ${palette.pink})`}}><Zap className="w-4 h-4" style={{color: palette.peachText}}/></div>
              <div className="text-left">
                <div className="text-sm font-bold" style={{color: palette.peachText, fontFamily: "'Fraunces', serif"}}>Objection Handles</div>
                <div className="text-xs opacity-60" style={{color: palette.peachText}}>Quick comebacks Â· editable</div>
              </div>
            </div>
            {objectionMode ? <ChevronUp className="w-4 h-4" style={{color: palette.peachText}}/> : <ChevronDown className="w-4 h-4" style={{color: palette.peachText}}/>}
          </button>
          {objectionMode && (
            <div className="border-t p-4 space-y-2.5" style={{borderColor: palette.peach}}>
              {objections.map((obj) => {
                const isEditing = editingObjection === obj.id;
                if (isEditing) {
                  return (
                    <div key={obj.id} className="rounded-2xl p-3 border-2 space-y-2" style={{background: "white", borderColor: palette.peachDeep}}>
                      <input type="text" value={objectionEditValues.q} onChange={e => setObjectionEditValues({...objectionEditValues, q: e.target.value})} className="w-full text-xs p-2 rounded-lg" style={{border: `1.5px solid ${palette.peach}`}}/>
                      <textarea value={objectionEditValues.a} onChange={e => setObjectionEditValues({...objectionEditValues, a: e.target.value})} className="w-full text-xs p-2 rounded-lg resize-none" rows="3" style={{border: `1.5px solid ${palette.peach}`}}/>
                      <div className="flex gap-2">
                        <button onClick={saveEditObjection} className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{background: palette.peachDeep, color: palette.peachText}}><Check className="w-3 h-3 inline mr-1"/>Save</button>
                        <button onClick={() => setEditingObjection(null)} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-stone-500">Cancel</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={obj.id} className="rounded-2xl p-3.5" style={{background: selectedObjection === obj.id ? palette.peach : palette.bgWarm, border: `1.5px solid ${palette.peach}`}}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedObjection(selectedObjection === obj.id ? null : obj.id)}>
                      <p className="text-xs font-bold italic flex-grow" style={{color: palette.peachText}}>"{obj.q}"</p>
                      <div className="flex gap-1 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); startEditObjection(obj); }} className="p-1.5 rounded-lg" style={{color: palette.peachText}}><Edit2 className="w-3 h-3"/></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteObjection(obj.id); }} className="p-1.5 rounded-lg" style={{color: palette.pinkText}}><Trash2 className="w-3 h-3"/></button>
                        {selectedObjection === obj.id ? <ChevronUp className="w-3.5 h-3.5 mt-1" style={{color: palette.peachText}}/> : <ChevronDown className="w-3.5 h-3.5 mt-1" style={{color: palette.peachText}}/>}
                      </div>
                    </div>
                    {selectedObjection === obj.id && (
                      <div className="mt-2.5 pt-2.5 border-t" style={{borderColor: "rgba(196,105,52,0.3)"}}>
                        <p className="text-xs leading-relaxed font-medium" style={{color: palette.peachText}}>{obj.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {showNewObjection ? (
                <div className="rounded-2xl p-3 border-2 space-y-2" style={{background: "white", borderColor: palette.peachDeep}}>
                  <input type="text" placeholder='Customer objection' value={newObjection.q} onChange={e => setNewObjection({...newObjection, q: e.target.value})} className="w-full text-xs p-2 rounded-lg" style={{border: `1.5px solid ${palette.peach}`}}/>
                  <textarea placeholder="Your response..." value={newObjection.a} onChange={e => setNewObjection({...newObjection, a: e.target.value})} className="w-full text-xs p-2 rounded-lg resize-none" rows="3" style={{border: `1.5px solid ${palette.peach}`}}/>
                  <div className="flex gap-2">
                    <button onClick={addObjection} className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{background: palette.peachDeep, color: palette.peachText}}>Add</button>
                    <button onClick={() => { setShowNewObjection(false); setNewObjection({q: "", a: ""}); }} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-stone-500">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewObjection(true)} className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{background: palette.peach, color: palette.peachText, border: `1.5px dashed ${palette.peachDeep}`}}>
                  <Plus className="w-3.5 h-3.5"/>Add New Objection
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNotes = () => {
    if (editingNote) {
      const note = notes.find(n => n.id === editingNote.id);
      return (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setEditingNote(null)} className="flex items-center text-sm font-bold gap-1.5 px-3 py-2 rounded-full bg-white/70 shadow-sm" style={{color: palette.lavenderText}}><ArrowLeft className="w-4 h-4"/>Back</button>
            <div className="flex gap-2">
              <button onClick={() => togglePin(note.id)} className="p-2.5 rounded-2xl shadow-sm" style={note.pinned ? {background: palette.cream, color: palette.creamText} : {background: "white", color: "#9CA3AF"}}><Star className="w-4 h-4" fill={note.pinned ? "currentColor" : "none"}/></button>
              <button onClick={() => deleteNote(note.id)} className="p-2.5 rounded-2xl shadow-sm" style={{background: palette.pink, color: palette.pinkText}}><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="rounded-3xl shadow-lg border-2 border-white overflow-hidden" style={{background: `linear-gradient(180deg, ${note.color}60, white)`}}>
            <div className="p-5" style={{background: note.color}}>
              <div className="flex items-center gap-3"><span className="text-2xl">{note.emoji}</span><h2 className="text-xl font-bold" style={{color: "#5C5470", fontFamily: "'Fraunces', serif"}}>{note.title}</h2></div>
            </div>
            <textarea className="w-full p-5 text-sm leading-relaxed focus:outline-none resize-none min-h-[400px]" style={{color: "#5C5470", background: "transparent"}} placeholder="Start typing..." value={note.content} onChange={e => saveNote(note.id, e.target.value)}/>
          </div>
        </div>
      );
    }
    const pinned = notes.filter(n => n.pinned);
    const unpinned = notes.filter(n => !n.pinned);
    return (
      <div className="animate-in fade-in duration-500 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}><FileText className="w-4 h-4 mr-2"/>My Notes</h3>
          <button onClick={() => setShowNewNote(!showNewNote)} className="text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
            <Plus className="w-3.5 h-3.5"/>New
          </button>
        </div>
        {renderSectionAI({ section: "notes", color: palette.lavender, textColor: palette.lavenderText, emoji: "ðŸ“", name: "Notes AI" })}
        {showNewNote && (
          <div className="rounded-3xl p-5 shadow-md border-2" style={{background: `linear-gradient(135deg, ${palette.lavender}40, white)`, borderColor: palette.lavender}}>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="âœ¨" value={newNoteEmoji} onChange={e => setNewNoteEmoji(e.target.value)} className="w-14 text-center text-lg rounded-xl px-2 py-2.5 focus:outline-none" style={{background: palette.bg, border: `1.5px solid ${palette.lavender}`}}/>
              <input type="text" placeholder="Note title..." value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && createNote()} className="flex-grow text-sm font-bold rounded-xl px-3 py-2.5 focus:outline-none" style={{background: palette.bg, border: `1.5px solid ${palette.lavender}`, color: "#5C5470"}}/>
            </div>
            <div className="flex gap-2 items-center mb-4">
              <span className="text-xs font-bold mr-1" style={{color: palette.lavenderText}}>Color:</span>
              {noteColors.map(c => <button key={c} onClick={() => setNewNoteColor(c)} className="w-8 h-8 rounded-full shadow-sm" style={{background: c, border: newNoteColor === c ? `3px solid ${palette.lavenderText}` : "3px solid white"}}/>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewNote(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/70" style={{color: "#9CA3AF"}}>Cancel</button>
              <button onClick={createNote} className="flex-[2] py-2.5 rounded-xl text-xs font-bold text-white shadow-md" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>Create âœ¨</button>
            </div>
          </div>
        )}
        {notes.length === 0 && !showNewNote && (
          <div className="rounded-3xl p-8 border-2 border-white shadow-md text-center" style={{background: "rgba(255,255,255,0.7)"}}>
            <div className="text-5xl mb-3">ðŸ“</div>
            <p className="text-sm font-bold mb-2" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>No notes yet</p>
            <p className="text-xs opacity-60" style={{color: palette.lavenderText}}>Tap "New" to create your first one!</p>
          </div>
        )}
        {pinned.length > 0 && (
          <>
            <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 fill-current" style={{color: palette.creamText}}/><span className="text-xs font-bold uppercase tracking-wider" style={{color: palette.creamText}}>Pinned</span></div>
            <div className="grid grid-cols-2 gap-3">
              {pinned.map(note => (
                <button key={note.id} onClick={() => setEditingNote(note)} className="text-left rounded-3xl p-4 shadow-md border-2 border-white hover:scale-[1.03] transition-all relative overflow-hidden min-h-[140px]" style={{background: `linear-gradient(135deg, ${note.color}, ${note.color}80)`}}>
                  <div className="flex items-center gap-1.5 mb-2"><span className="text-lg">{note.emoji}</span><h4 className="font-bold text-sm truncate" style={{color: "#5C5470", fontFamily: "'Fraunces', serif"}}>{note.title}</h4></div>
                  <p className="text-xs line-clamp-4 whitespace-pre-line opacity-80" style={{color: "#5C5470"}}>{note.content || <span className="italic opacity-60">Empty...</span>}</p>
                </button>
              ))}
            </div>
          </>
        )}
        {unpinned.length > 0 && (
          <div className="space-y-3">
            {unpinned.map(note => (
              <button key={note.id} onClick={() => setEditingNote(note)} className="w-full text-left rounded-3xl p-4 shadow-sm border-2" style={{background: "rgba(255,255,255,0.7)", borderColor: note.color}}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{note.emoji}</span>
                  <h4 className="font-bold text-sm" style={{color: "#5C5470", fontFamily: "'Fraunces', serif"}}>{note.title}</h4>
                </div>
                <p className="text-xs line-clamp-2 whitespace-pre-line opacity-70" style={{color: "#5C5470"}}>{note.content || "Empty..."}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    const monthName = currentTime.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDay = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0).getDate();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    return (
      <div className="animate-in fade-in duration-500 space-y-5">
        <h3 className="text-base font-bold flex items-center" style={{color: palette.skyText, fontFamily: "'Fraunces', serif"}}><CalendarDays className="w-4 h-4 mr-2"/>{monthName}</h3>
        <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: "rgba(255,255,255,0.7)"}}>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <div key={d} className="text-[10px] uppercase font-bold tracking-wider opacity-60" style={{color: palette.lavenderText}}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[...blanks, ...days].map((day, idx) => {
              if (!day) return <div key={`b-${idx}`} className="h-14"></div>;
              const dayEvents = calendarEvents.filter(ev => parseInt(ev.date) === day);
              const isToday = day === currentTime.getDate();
              const isSelected = day === selectedPlanDate;
              return (
                <button key={`d-${day}`} onClick={() => { setSelectedPlanDate(day); setActiveTab("timeline"); }} className="h-14 rounded-2xl flex flex-col items-center justify-start py-1.5 border-2" style={isSelected ? {background: `linear-gradient(135deg, ${palette.peach}, ${palette.pink})`, borderColor: palette.peachDeep} : isToday ? {background: `linear-gradient(135deg, ${palette.sky}, ${palette.lavender})`, borderColor: palette.skyDeep} : dayEvents.length > 0 ? {background: dayEvents[0].color, borderColor: "white", opacity: 0.7} : {background: "white", borderColor: "rgba(255,255,255,0.5)"}}>
                  <span className="text-xs font-bold" style={{color: isSelected ? palette.peachText : isToday ? palette.skyText : "#5C5470"}}>{day}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">{dayEvents.map(ev => <div key={ev.id} className="w-1.5 h-1.5 rounded-full bg-white"></div>)}</div>
                </button>
              );
            })}
          </div>
        </div>
        {calendarEvents.length > 0 && (
          <div className="space-y-2">
            {calendarEvents.map(ev => (
              <div key={ev.id} onClick={() => { setSelectedPlanDate(parseInt(ev.date)); setActiveTab("timeline"); }} className="rounded-2xl p-3 flex items-center gap-3 shadow-sm border-2 border-white cursor-pointer" style={{background: `${ev.color}80`}}>
                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-sm" style={{background: "white"}}>
                  <span className="text-sm font-bold" style={{color: "#5C5470"}}>{ev.date}</span>
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-bold" style={{color: "#5C5470", fontFamily: "'Fraunces', serif"}}>{ev.title}</div>
                  <div className="text-xs opacity-60 capitalize" style={{color: "#5C5470"}}>{ev.type}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteCalendarEvent(ev.id); }} className="p-2 rounded-full" style={{color: palette.pinkText}}><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: `linear-gradient(135deg, ${palette.sky}80, ${palette.mint}60)`}}>
          <h4 className="font-bold mb-3 flex items-center text-sm" style={{color: palette.skyText, fontFamily: "'Fraunces', serif"}}><Plus className="w-4 h-4 mr-1.5"/>Add Event</h4>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="number" placeholder="Day" value={newCalEvent.date} onChange={e => setNewCalEvent({...newCalEvent, date: e.target.value})} className="w-20 text-sm p-2.5 rounded-xl focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.sky}`}}/>
              <select value={newCalEvent.type} onChange={e => setNewCalEvent({...newCalEvent, type: e.target.value})} className="flex-1 text-sm p-2.5 rounded-xl focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.sky}`}}>
                <option value="social">Social ðŸ’œ</option><option value="appointment">Appt ðŸ©·</option><option value="work">Work ðŸŒ¿</option>
              </select>
            </div>
            <input type="text" placeholder="Event title..." value={newCalEvent.title} onChange={e => setNewCalEvent({...newCalEvent, title: e.target.value})} className="w-full text-sm p-2.5 rounded-xl focus:outline-none" style={{background: "white", border: `1.5px solid ${palette.sky}`}}/>
            <button onClick={() => {
              if (newCalEvent.date && newCalEvent.title) {
                let color = palette.mint;
                if (newCalEvent.type === "social") color = palette.lavender;
                if (newCalEvent.type === "appointment") color = palette.pink;
                setCalendarEvents([...calendarEvents, {...newCalEvent, id: Date.now(), color}]);
                setSelectedPlanDate(parseInt(newCalEvent.date));
                setNewCalEvent({date: "", title: "", type: "social"});
                rewardStars(3);
              }
            }} className="w-full text-white font-bold py-3 rounded-xl text-sm shadow-md" style={{background: `linear-gradient(135deg, ${palette.skyText}, ${palette.mintText})`}}>Save âœ¨</button>
          </div>
        </div>
      </div>
    );
  };

  const renderHealth = () => (
    <div className="animate-in fade-in duration-500 space-y-5">
      <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: "rgba(255,255,255,0.7)"}}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center text-sm" style={{color: palette.pinkText, fontFamily: "'Fraunces', serif"}}><Pill className="w-4 h-4 mr-2"/>Medications</h3>
          <button onClick={() => setMedsList(p => [...p, { id: Date.now(), name: "New med", taken: false, time: "Morning" }])} className="text-xs font-bold px-3 py-1 rounded-full" style={{background: palette.pink, color: palette.pinkText}}>+ Add</button>
        </div>
        {medsList.length === 0 ? (
          <p className="text-center py-4 text-xs opacity-60" style={{color: palette.pinkText}}>No meds tracked. Tap Add!</p>
        ) : (
          <div className="space-y-3">
            {medsList.map(med => (
              <div key={med.id} className="flex justify-between items-center p-4 rounded-2xl border-2" style={{background: med.taken ? `${palette.pink}40` : palette.bg, borderColor: palette.pink}}>
                <div className="flex-grow">
                  <input value={med.name} onChange={e => setMedsList(medsList.map(m => m.id === med.id ? {...m, name: e.target.value} : m))} className={`font-bold text-sm bg-transparent w-full focus:outline-none ${med.taken ? "line-through opacity-50" : ""}`} style={{color: palette.pinkText}}/>
                  <input value={med.time} onChange={e => setMedsList(medsList.map(m => m.id === med.id ? {...m, time: e.target.value} : m))} className="text-xs mt-0.5 opacity-60 bg-transparent w-full focus:outline-none" style={{color: palette.pinkText}}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { if (!med.taken) rewardStars(5); setMedsList(medsList.map(m => m.id === med.id ? {...m, taken: !m.taken} : m)); }} className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={med.taken ? {background: `linear-gradient(135deg, ${palette.pinkText}, ${palette.lavenderText})`, color: "white"} : {background: "white", color: palette.pinkText}}>
                    {med.taken ? <Heart className="w-5 h-5 fill-white"/> : <CheckCircle2 className="w-5 h-5"/>}
                  </button>
                  <button onClick={() => setMedsList(medsList.filter(m => m.id !== med.id))} className="w-10 h-10 rounded-full flex items-center justify-center" style={{color: palette.pinkText}}><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: `linear-gradient(135deg, ${palette.sky}80, ${palette.mint}60)`}}>
        <h3 className="font-bold flex items-center mb-4 text-sm" style={{color: palette.skyText, fontFamily: "'Fraunces', serif"}}><Droplets className="w-4 h-4 mr-2"/>Water Intake</h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl font-extrabold" style={{color: palette.skyText, fontFamily: "'Fraunces', serif"}}>{waterGlasses} <span className="text-base font-medium opacity-60">glasses</span></span>
          <div className="flex gap-2">
            <button onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))} className="w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-sm" style={{background: "white", color: palette.skyText}}>âˆ’</button>
            <button onClick={() => { setWaterGlasses(waterGlasses + 1); rewardStars(2); }} className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md" style={{background: `linear-gradient(135deg, ${palette.skyText}, ${palette.mintText})`}}>+</button>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({length: 8}, (_, i) => <div key={i} className="flex-1 h-3 rounded-full shadow-inner" style={{background: i < waterGlasses ? `linear-gradient(90deg, ${palette.skyDeep}, ${palette.mintDeep})` : "rgba(255,255,255,0.6)"}}></div>)}
        </div>
      </div>
      {renderSectionAI({ section: "health", color: palette.pink, textColor: palette.pinkText, emoji: "ðŸŒ¿", name: "Wellness AI" })}
    </div>
  );

  const renderBudget = () => {
    const sumNeeded = (key) => budget[key].reduce((sum, item) => sum + (moneyValue(item.planned) || moneyValue(item.actual)), 0);
    const totals = {
      incomeNeeded: sumNeeded("income"),
      incomeActual: sumBudget("income", "actual"),
      expenseNeeded: sumNeeded("expense"),
      expenseActual: sumBudget("expense", "actual"),
      billsNeeded: sumNeeded("bills"),
      billsActual: sumBudget("bills", "actual"),
      debtNeeded: sumNeeded("debt"),
      debtActual: sumBudget("debt", "actual"),
      savingNeeded: sumNeeded("saving"),
      savingActual: sumBudget("saving", "actual"),
    };
    const incomeAvailable = totals.incomeActual || totals.incomeNeeded;
    const paycheckRows = [...budget.income].sort((a, b) => dateSortValue(a.dueDate) - dateSortValue(b.dueDate));
    const latestPaycheck = [...paycheckRows].reverse().find(i => moneyValue(i.actual) || moneyValue(i.planned));
    const paycheckAmount = latestPaycheck ? (moneyValue(latestPaycheck.actual) || moneyValue(latestPaycheck.planned)) : incomeAvailable;
    const savingsGoals = [...budget.saving].sort((a, b) => dateSortValue(a.dueDate) - dateSortValue(b.dueDate));
    const pieData = [
      { label: "Expenses Needed", value: totals.expenseNeeded, color: palette.peachDeep, tc: palette.peachText },
      { label: "Bills Needed", value: totals.billsNeeded, color: palette.lavenderDeep, tc: palette.lavenderText },
      { label: "Debt Needed", value: totals.debtNeeded, color: palette.pinkDeep, tc: palette.pinkText },
      { label: "Savings Goal", value: totals.savingNeeded, color: palette.skyDeep, tc: palette.skyText },
    ].filter(d => d.value > 0);
    const actualPieData = [
      { label: "Expenses Spent", value: totals.expenseActual, color: palette.peachDeep, tc: palette.peachText },
      { label: "Bills Paid", value: totals.billsActual, color: palette.lavenderDeep, tc: palette.lavenderText },
      { label: "Debt Paid", value: totals.debtActual, color: palette.pinkDeep, tc: palette.pinkText },
      { label: "Saved", value: totals.savingActual, color: palette.skyDeep, tc: palette.skyText },
    ].filter(d => d.value > 0);
    const savingsPieData = savingsGoals.map((goal, idx) => ({
      label: goal.category,
      value: moneyValue(goal.actual),
      color: [palette.skyDeep, palette.mintDeep, palette.lavenderDeep, palette.pinkDeep, palette.peachDeep][idx % 5],
      tc: [palette.skyText, palette.mintText, palette.lavenderText, palette.pinkText, palette.peachText][idx % 5],
    })).filter(d => d.value > 0);
    const totalNeeded = totals.expenseNeeded + totals.billsNeeded + totals.debtNeeded + totals.savingNeeded;
    const totalActualOut = totals.expenseActual + totals.billsActual + totals.debtActual + totals.savingActual;
    const remaining = incomeAvailable - totalNeeded;
    const actualLeft = incomeAvailable - totalActualOut;
    const tableConfigs = [
      {title: "Biweekly Paycheck Income", key: "income", color: palette.mint, tc: palette.mintText, showPaid: false},
      {title: "Savings Goals", key: "saving", color: palette.sky, tc: palette.skyText, showPaid: false},
      {title: "Expenses", key: "expense", color: palette.peach, tc: palette.peachText, showPaid: false},
      {title: "Bills", key: "bills", color: palette.lavender, tc: palette.lavenderText, showPaid: true},
      {title: "Debt", key: "debt", color: palette.pink, tc: palette.pinkText, showPaid: true},
    ];
    const getBudgetLabels = (key) => {
      if (key === "income") return { name: "PAYCHECK", date: "PAY DATE", planned: "EXPECTED", actual: "RECEIVED" };
      if (key === "saving") return { name: "GOAL", date: "SAVE BY", planned: "TARGET", actual: "SAVED" };
      return { name: "CATEGORY", date: "DUE", planned: "NEEDED", actual: "SPENT" };
    };

    const renderTable = ({title, key, color, tc, showPaid}) => {
      const labels = getBudgetLabels(key);
      const rows = [...budget[key]].sort((a, b) => dateSortValue(a.dueDate) - dateSortValue(b.dueDate));
      return (
      <div className="rounded-3xl shadow-md border-2 border-white overflow-hidden">
        <div className="p-3 border-b text-center" style={{background: color, borderColor: color}}>
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{color: tc, fontFamily: "'Fraunces', serif"}}>{title}</h4>
        </div>
        <div className="bg-white/80 overflow-x-auto">
          <table className="w-full min-w-[660px] text-left text-xs">
            <thead style={{background: `${color}30`}}>
              <tr style={{color: tc}}>
                <th className="p-2 pl-3 font-bold tracking-wider">{labels.name}</th>
                <th className="p-2 font-bold">{labels.date}</th>
                <th className="p-2 font-bold">{labels.planned}</th>
                <th className="p-2 font-bold">{labels.actual}</th>
                {showPaid && <th className="p-2 font-bold text-center">PAID</th>}
                <th className="p-2 font-bold text-center w-16">EDIT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(item => {
                const isEditing = editingBudgetItem?.key === key && editingBudgetItem?.id === item.id;
                if (isEditing) {
                  return (
                    <tr key={item.id} className="border-t" style={{borderColor: `${color}50`, background: `${color}30`}}>
                      <td className="p-1.5 pl-2"><input type="text" value={budgetEditValues.category} onChange={e => setBudgetEditValues({...budgetEditValues, category: e.target.value})} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1.5px solid ${tc}`}}/></td>
                      <td className="p-1.5"><input type="date" value={budgetEditValues.dueDate || ""} onChange={e => setBudgetEditValues({...budgetEditValues, dueDate: e.target.value})} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1.5px solid ${tc}`}}/></td>
                      <td className="p-1.5"><input type="number" value={budgetEditValues.planned} onChange={e => setBudgetEditValues({...budgetEditValues, planned: e.target.value})} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1.5px solid ${tc}`}}/></td>
                      <td className="p-1.5"><input type="number" value={budgetEditValues.actual} onChange={e => setBudgetEditValues({...budgetEditValues, actual: e.target.value})} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1.5px solid ${tc}`}}/></td>
                      {showPaid && <td></td>}
                      <td className="p-1.5"><div className="flex gap-1 justify-center"><button onClick={saveEditBudgetItem} className="p-1 rounded-md" style={{background: palette.mintDeep, color: palette.mintText}}><Check className="w-3.5 h-3.5"/></button><button onClick={() => setEditingBudgetItem(null)} className="p-1 rounded-md bg-stone-200"><X className="w-3.5 h-3.5"/></button></div></td>
                    </tr>
                  );
                }
                return (
                  <tr key={item.id} className="border-t" style={{borderColor: `${color}50`}}>
                    <td className="p-2 pl-3 font-bold uppercase truncate max-w-[150px]" style={{color: tc}}>{item.category}</td>
                    <td className="p-2 font-bold" style={{color: tc}}>{formatDateLabel(item.dueDate) || "-"}</td>
                    <td className="p-2 opacity-70" style={{color: tc}}>{formatMoney(item.planned)}</td>
                    <td className="p-2 opacity-70" style={{color: tc}}>{formatMoney(item.actual)}</td>
                    {showPaid && <td className="p-2"><div className="flex justify-center"><button onClick={() => toggleBudgetPaid(key, item.id)} className="w-5 h-5 rounded-md flex items-center justify-center" style={{background: item.paid ? tc : `${color}80`, color: "white"}}>{item.paid && <CheckCircle2 className="w-4 h-4"/>}</button></div></td>}
                    <td className="p-2"><div className="flex gap-1 justify-center"><button onClick={() => startEditBudgetItem(key, item)} className="p-1 rounded-md" style={{color: tc}}><Edit2 className="w-3 h-3"/></button><button onClick={() => deleteBudgetItem(key, item.id)} className="p-1 rounded-md" style={{color: palette.pinkText}}><Trash2 className="w-3 h-3"/></button></div></td>
                  </tr>
                );
              })}
              <tr style={{background: `${color}20`}}>
                <td className="p-1.5 pl-2"><input type="text" placeholder={key === "saving" ? "Trip, car..." : key === "income" ? "Paycheck..." : "Add..."} value={newBudgetItems[key].category} onChange={e => setNewBudgetItems(p => ({...p, [key]: {...p[key], category: e.target.value}}))} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1px solid ${color}`}}/></td>
                <td className="p-1.5"><input type="date" value={newBudgetItems[key].dueDate || ""} onChange={e => setNewBudgetItems(p => ({...p, [key]: {...p[key], dueDate: e.target.value}}))} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1px solid ${color}`}}/></td>
                <td className="p-1.5"><input type="number" placeholder={labels.planned === "NEEDED" ? "Need $" : labels.planned === "TARGET" ? "Target $" : "Expected $"} value={newBudgetItems[key].planned} onChange={e => setNewBudgetItems(p => ({...p, [key]: {...p[key], planned: e.target.value}}))} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1px solid ${color}`}}/></td>
                <td className="p-1.5"><input type="number" placeholder={labels.actual === "SPENT" ? "Spent $" : labels.actual === "SAVED" ? "Saved $" : "Received $"} value={newBudgetItems[key].actual} onChange={e => setNewBudgetItems(p => ({...p, [key]: {...p[key], actual: e.target.value}}))} className="w-full p-1.5 text-xs rounded-md" style={{background: "white", border: `1px solid ${color}`}}/></td>
                {showPaid && <td></td>}
                <td className="p-1.5 text-center"><button onClick={() => addBudgetItem(key)} className="w-full p-1.5 rounded-md font-bold text-white text-xs" style={{background: tc}}>+</button></td>
              </tr>
              {budget[key].length > 0 && (
                <tr style={{background: `${color}50`}}>
                  <td className="p-2 pl-3 font-extrabold" style={{color: tc, fontFamily: "'Fraunces', serif"}}>TOTAL</td>
                  <td></td>
                  <td className="p-2 font-extrabold" style={{color: tc}}>{formatMoney(sumNeeded(key))}</td>
                  <td className="p-2 font-extrabold" style={{color: tc}}>{formatMoney(sumBudget(key, "actual"))}</td>
                  {showPaid && <td></td>}
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
    };

    const renderMiniChart = (title, subtitle, data, total) => (
      <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: "rgba(255,255,255,0.85)"}}>
        <h3 className="text-sm font-bold mb-1" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}>{title}</h3>
        <p className="text-xs mb-4 opacity-60" style={{color: palette.lavenderText}}>{subtitle}</p>
        {total === 0 ? (
          <div className="text-center py-7"><div className="text-3xl mb-2">âœ¨</div><p className="text-xs font-medium" style={{color: palette.lavenderText}}>Add amounts to see this chart.</p></div>
        ) : (
          <div className="flex items-center gap-5 flex-col sm:flex-row">
            <div className="shrink-0"><PieChart data={data} size={150}/></div>
            <div className="flex-grow space-y-2 w-full">
              {data.map((d, idx) => {
                const pct = Math.round((d.value / total) * 100);
                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-md shrink-0 shadow-sm" style={{background: d.color}}></div>
                    <div className="flex-grow flex justify-between items-center gap-3">
                      <span className="text-xs font-bold truncate" style={{color: d.tc}}>{d.label}</span>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0" style={{background: d.color, color: "white"}}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="animate-in fade-in duration-500 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-3xl p-4 border-2 border-white shadow-md" style={{background: `linear-gradient(135deg, ${palette.mint}90, ${palette.sky}60)`}}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{color: palette.mintText, opacity: 0.7}}>PAYCHECK IN</div>
            <div className="text-3xl font-extrabold" style={{color: palette.mintText, fontFamily: "'Fraunces', serif"}}>{formatMoney(paycheckAmount)}</div>
            <div className="text-[10px] font-bold opacity-60 truncate" style={{color: palette.mintText}}>{latestPaycheck?.dueDate ? `Pay date ${formatDateLabel(latestPaycheck.dueDate)}` : "Add biweekly income"}</div>
          </div>
          <div className="rounded-3xl p-4 border-2 border-white shadow-md" style={{background: remaining >= 0 ? `linear-gradient(135deg, ${palette.lavender}90, ${palette.sky}60)` : `linear-gradient(135deg, ${palette.pink}90, ${palette.peach}60)`}}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{color: remaining >= 0 ? palette.lavenderText : palette.pinkText, opacity: 0.7}}>{remaining >= 0 ? "LEFT AFTER PLAN" : "OVER PLAN"}</div>
            <div className="text-3xl font-extrabold" style={{color: remaining >= 0 ? palette.lavenderText : palette.pinkText, fontFamily: "'Fraunces', serif"}}>{formatMoney(Math.abs(remaining))}</div>
          </div>
          <div className="rounded-3xl p-4 border-2 border-white shadow-md" style={{background: `linear-gradient(135deg, ${palette.peach}90, ${palette.cream}70)`}}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{color: palette.peachText, opacity: 0.7}}>ACTUAL USED</div>
            <div className="text-3xl font-extrabold" style={{color: palette.peachText, fontFamily: "'Fraunces', serif"}}>{formatMoney(totalActualOut)}</div>
          </div>
          <div className="rounded-3xl p-4 border-2 border-white shadow-md" style={{background: actualLeft >= 0 ? `linear-gradient(135deg, ${palette.sky}90, ${palette.mint}60)` : `linear-gradient(135deg, ${palette.pink}90, ${palette.peach}60)`}}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{color: actualLeft >= 0 ? palette.skyText : palette.pinkText, opacity: 0.7}}>ACTUAL LEFT</div>
            <div className="text-3xl font-extrabold" style={{color: actualLeft >= 0 ? palette.skyText : palette.pinkText, fontFamily: "'Fraunces', serif"}}>{formatMoney(Math.abs(actualLeft))}</div>
          </div>
        </div>
        <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: "rgba(255,255,255,0.85)"}}>
          <h3 className="text-sm font-bold flex items-center mb-4" style={{color: palette.lavenderText, fontFamily: "'Fraunces', serif"}}><span className="mr-2">ðŸ¥§</span>Where Your Money Goes</h3>
          {totalNeeded === 0 ? (
            <div className="text-center py-8"><div className="text-4xl mb-2">âœ¨</div><p className="text-xs font-medium" style={{color: palette.lavenderText}}>Add needed amounts to see your breakdown!</p></div>
          ) : (
            <div className="flex items-center gap-5 flex-col sm:flex-row">
              <div className="shrink-0"><PieChart data={pieData} size={180}/></div>
              <div className="flex-grow space-y-2 w-full">
                {pieData.map((d, idx) => {
                  const pct = Math.round((d.value / totalNeeded) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-md shrink-0 shadow-sm" style={{background: d.color}}></div>
                      <div className="flex-grow flex justify-between items-center">
                        <span className="text-xs font-bold" style={{color: d.tc}}>{d.label}</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full" style={{background: d.color, color: "white"}}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderMiniChart("Actual Money Used", "What you actually spent, paid, or saved.", actualPieData, totalActualOut)}
          {renderMiniChart("Savings Progress", "How your saved money is split across goals.", savingsPieData, totals.savingActual)}
        </div>
        <div className="rounded-3xl p-5 shadow-md border-2 border-white" style={{background: `linear-gradient(135deg, ${palette.sky}55, white)`}}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold" style={{color: palette.skyText, fontFamily: "'Fraunces', serif"}}>Savings Goals</h3>
              <p className="text-xs opacity-65" style={{color: palette.skyText}}>Separate trip, car, emergency, and other goals that still connect to your paycheck.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{color: palette.skyText}}>Saved</div>
              <div className="text-lg font-extrabold" style={{color: palette.skyText, fontFamily: "'Fraunces', serif"}}>{formatMoney(totals.savingActual)}</div>
            </div>
          </div>
          {savingsGoals.length === 0 ? (
            <p className="text-xs py-4 text-center opacity-60" style={{color: palette.skyText}}>Add goals like Trip, New Car, Emergency Fund, or Christmas.</p>
          ) : (
            <div className="space-y-3">
              {savingsGoals.map(goal => {
                const target = moneyValue(goal.planned);
                const saved = moneyValue(goal.actual);
                const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
                return (
                  <div key={goal.id} className="rounded-2xl p-3 bg-white/80 border" style={{borderColor: palette.sky}}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate" style={{color: palette.skyText}}>{goal.category}</div>
                        <div className="text-[10px] opacity-60" style={{color: palette.skyText}}>{goal.dueDate ? `Save by ${formatDateLabel(goal.dueDate)}` : "No save-by date"}</div>
                      </div>
                      <div className="text-xs font-bold shrink-0" style={{color: palette.skyText}}>{formatMoney(saved)} / {formatMoney(target)}</div>
                    </div>
                    <div className="h-2.5 rounded-full bg-white shadow-inner overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all" style={{width: `${pct}%`, background: `linear-gradient(90deg, ${palette.skyDeep}, ${palette.mintDeep})`}}></div>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Add saved $" value={savingContributions[goal.id] || ""} onChange={e => setSavingContributions(p => ({ ...p, [goal.id]: e.target.value }))} className="flex-grow text-xs p-2 rounded-lg focus:outline-none" style={{background: "white", border: `1px solid ${palette.sky}`}}/>
                      <button onClick={() => addSavingContribution(goal.id)} className="px-3 rounded-lg text-xs font-bold text-white" style={{background: palette.skyText}}>Add</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {renderSectionAI({ section: "budget", color: palette.cream, textColor: palette.creamText, emoji: "ðŸ’°", name: "Budget AI Coach" })}
        <div className="space-y-4">{tableConfigs.map(cfg => <div key={cfg.key}>{renderTable(cfg)}</div>)}</div>
      </div>
    );
  };

  const renderRoutine = () => {
    const arr = currentRoutineType === "morning" ? morningRoutine : nightRoutine;
    const task = arr[activeTaskIndex];
    const isLast = activeTaskIndex === arr.length - 1;
    const bgGradient = currentRoutineType === "morning" ? `linear-gradient(180deg, ${palette.cream}, ${palette.peach}, ${palette.pink})` : `linear-gradient(180deg, ${palette.lavender}, ${palette.sky}, ${palette.pink})`;
    return (
      <div className="min-h-screen flex flex-col p-6 absolute inset-0 z-50" style={{background: bgGradient}}>
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setActiveTab("timeline")} className="p-2.5 rounded-full shadow-md bg-white/80" style={{color: palette.lavenderText}}><ArrowLeft className="w-5 h-5"/></button>
          <div className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-md bg-white/80" style={{color: palette.lavenderText}}>Step {activeTaskIndex + 1} of {arr.length}</div>
          <div className="w-10"/>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-full shadow-2xl flex items-center justify-center mb-6 border-4 border-white" style={{background: task.color}}>{task.icon}</div>
          <h2 className="text-3xl font-bold mb-3" style={{color: "#5C5470", fontFamily: "'Fraunces', serif"}}>{task.title}</h2>
          <div className="p-5 rounded-3xl shadow-md max-w-sm mb-6 border-2 border-white" style={{background: "rgba(255,255,255,0.7)"}}><p className="text-sm" style={{color: "#5C5470"}}>{task.detail}</p></div>
          <div className="p-5 rounded-3xl flex flex-col items-center mb-6 min-w-[200px] shadow-md border-2 border-white" style={{background: "rgba(255,255,255,0.8)"}}>
            <div className="text-4xl font-mono font-bold mb-3" style={{color: palette.lavenderText}}>{formatTime(routineTimeLeft)}</div>
            <button onClick={() => setRoutineTimerActive(!routineTimerActive)} className="w-full py-2.5 rounded-2xl font-bold flex items-center justify-center shadow-sm text-sm text-white" style={{background: routineTimerActive ? `linear-gradient(135deg, ${palette.creamText}, ${palette.peachText})` : `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
              {routineTimerActive ? <><Pause className="w-4 h-4 mr-2"/>Pause</> : <><Play className="w-4 h-4 mr-2 fill-white"/>Start Timer</>}
            </button>
          </div>
        </div>
        <button onClick={() => completeTask(task.id)} className="w-full text-white font-bold text-lg py-5 rounded-3xl flex items-center justify-center shadow-xl mb-6" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText}, ${palette.peachText})`}}>
          {isLast ? "Finish ðŸŽ‰" : "Done! Next"}<ChevronRight className="w-5 h-5 ml-2"/>
        </button>
      </div>
    );
  };

  if (activeTab === "routine") return renderRoutine();

  const tabs = [
    { id: "timeline", icon: <Clock className="w-3.5 h-3.5"/>, label: "Timeline", color: palette.peach, tc: palette.peachText },
    { id: "calendar", icon: <CalendarIcon className="w-3.5 h-3.5"/>, label: "Calendar", color: palette.sky, tc: palette.skyText },
    { id: "work", icon: <Phone className="w-3.5 h-3.5"/>, label: "Work", color: palette.mint, tc: palette.mintText },
    { id: "notes", icon: <FileText className="w-3.5 h-3.5"/>, label: "Notes", color: palette.lavender, tc: palette.lavenderText },
    { id: "health", icon: <Heart className="w-3.5 h-3.5"/>, label: "Health", color: palette.pink, tc: palette.pinkText },
    { id: "budget", icon: <Wallet className="w-3.5 h-3.5"/>, label: "Budget", color: palette.cream, tc: palette.creamText },
  ];

  return (
    <div className="min-h-screen pb-24 relative" style={{background: `linear-gradient(180deg, ${palette.bg}, ${palette.bgWarm})`, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .animate-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Blobs/>

      <header className="px-5 pt-7 pb-3 shadow-sm sticky top-0 z-40 backdrop-blur-xl border-b" style={{background: "rgba(255,249,245,0.85)", borderColor: "rgba(255,255,255,0.5)"}}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{background: `linear-gradient(135deg, ${palette.pinkText}, ${palette.lavenderText}, ${palette.skyText})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Fraunces', serif"}}>Hi, {user.displayName} ðŸŒ¸</h1>
            <p className="font-bold text-xs mt-0.5 flex items-center" style={{color: palette.lavenderText}}>
              <Clock className="w-3 h-3 mr-1"/>{currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} Â· {currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center px-3 py-2 rounded-full shadow-sm border-2 border-white" style={{background: `linear-gradient(135deg, ${palette.cream}, ${palette.peach})`}}>
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" style={{color: palette.creamText}}/>
              <span className="font-extrabold text-xs" style={{color: palette.creamText}}>{stars}</span>
            </div>
            <button onClick={() => setShowMasterAI(true)} className="p-2.5 rounded-full text-white shadow-md hover:scale-110 relative border-2 border-white" style={{background: `linear-gradient(135deg, ${palette.lavenderText}, ${palette.pinkText})`}}>
              <Wand2 className="w-4 h-4"/>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse" style={{background: palette.mintDeep}}></div>
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-full shadow-md hover:scale-110 border-2 border-white" style={{background: "white", color: palette.lavenderText}}>
              <User className="w-4 h-4"/>
            </button>
          </div>
        </div>
        <div className="flex space-x-1.5 p-1.5 rounded-2xl overflow-x-auto shadow-inner" style={{background: "rgba(255,255,255,0.6)", scrollbarWidth: "none"}}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center justify-center gap-1 whitespace-nowrap py-2 px-3.5 text-xs font-bold rounded-xl focus:outline-none" style={activeTab === tab.id ? {background: tab.color, color: tab.tc, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"} : {color: "#9CA3AF", background: "transparent"}}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-5 relative">
        {activeTab === "timeline" && renderTimeline()}
        {activeTab === "calendar" && renderCalendar()}
        {activeTab === "work" && renderWork()}
        {activeTab === "notes" && renderNotes()}
        {activeTab === "health" && renderHealth()}
        {activeTab === "budget" && renderBudget()}
      </main>

      {showMasterAI && renderMasterAI()}
      {showSettings && renderSettings()}
      {renderLiveCoaching()}
    </div>
  );
}

