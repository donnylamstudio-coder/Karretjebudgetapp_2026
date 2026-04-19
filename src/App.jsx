import { useState, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";

// ─── Persistent storage ───────────────────────────────────────
// Works on iPhone/Android (via Capacitor Preferences) AND in browser preview (via localStorage).
let Preferences = null;
try {
  if (window?.Capacitor?.isNativePlatform?.()) {
    // Split string so Vite/Rollup doesn't try to resolve this at build time
    const modName = "@capacitor/" + "preferences";
    import(/* @vite-ignore */ modName).then(m => { Preferences = m?.Preferences ?? null; }).catch(()=>{});
  }
} catch(e) {}
const store = {
  get: async (key) => {
    try {
      if (Preferences) {
        const { value } = await Preferences.get({ key });
        return value ? JSON.parse(value) : null;
      }
      const v = localStorage.getItem("karretje." + key);
      return v ? JSON.parse(v) : null;
    } catch(e) { return null; }
  },
  set: async (key, value) => {
    try {
      const v = JSON.stringify(value);
      if (Preferences) await Preferences.set({ key, value: v });
      else localStorage.setItem("karretje." + key, v);
    } catch(e) {}
  },
  clear: async () => {
    try {
      if (Preferences) { await Preferences.clear(); return; }
      Object.keys(localStorage).filter(k => k.startsWith("karretje.")).forEach(k => localStorage.removeItem(k));
    } catch(e) {}
  }
};

let Haptics = null;
/* Capacitor haptics - only available in native iOS/Android builds */
try {
  const cap = window?.Capacitor;
  if (cap?.isNativePlatform?.()) {
    // Split string so Vite/Rollup doesn't try to resolve this at build time
    const modName = "@capacitor/" + "haptics";
    import(/* @vite-ignore */ modName).then(m => { Haptics = m?.Haptics ?? null; }).catch(()=>{});
  }
} catch(e) {}
const haptic = {
  light:   () => Haptics?.impact({ style: "LIGHT" }),
  medium:  () => Haptics?.impact({ style: "MEDIUM" }),
  success: () => Haptics?.notification({ type: "SUCCESS" }),
  warning: () => Haptics?.notification({ type: "WARNING" }),
  select:  () => Haptics?.selectionChanged(),
};

// ─── Theme system ───────────────────────────────────────
const LIGHT_THEME = {
  YELLOW: "#7B85B8", YELLOW_DARK: "#5C6690", CREAM: "#F0F1F8",
  BLACK: "#2D2F5E", GRAY: "#888", WHITE: "#FFFFFF",
  GREEN: "#2ECC71", RED: "#E74C3C",
  APP_BG: "#D4C5E8",
  CARD_BG: "rgba(255,255,255,0.55)",
  CARD_BORDER: "rgba(255,255,255,0.7)",
  INPUT_BG: "#F7F7F7",
  INPUT_BORDER: "#EBEBEB",
  DIVIDER: "#F3F3F3",
};
const DARK_THEME = {
  YELLOW: "#9DA8DD", YELLOW_DARK: "#7B85B8", CREAM: "#2A2D4A",
  BLACK: "#F0F1F8", GRAY: "#9D9DB0", WHITE: "#2D2F5E",
  GREEN: "#4EE07C", RED: "#FF6B6B",
  APP_BG: "#1A1B2E",
  CARD_BG: "rgba(60,62,110,0.55)",
  CARD_BORDER: "rgba(123,133,184,0.25)",
  INPUT_BG: "#252842",
  INPUT_BORDER: "#3C3F65",
  DIVIDER: "rgba(255,255,255,0.08)",
};
// Module-level constants (used outside the component) — LIGHT theme defaults.
const YELLOW = LIGHT_THEME.YELLOW;
const YELLOW_DARK = LIGHT_THEME.YELLOW_DARK;
const CREAM = LIGHT_THEME.CREAM;
const BLACK = LIGHT_THEME.BLACK;
const GRAY = LIGHT_THEME.GRAY;
const WHITE = LIGHT_THEME.WHITE;
const GREEN = LIGHT_THEME.GREEN;
const RED = LIGHT_THEME.RED;

const T = {
  nl: {
    months: ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"],
    categories: ["Boodschappen","Eten & Drinken","Vrije tijd","Gezondheid","Uitstapjes","Vakantie","Kleding","Brandstof","Transport","Divers"],
    defaultCat: "Boodschappen",
    currency: v => "€" + Math.abs(v).toLocaleString("nl-NL", {minimumFractionDigits:2, maximumFractionDigits:2}),
    addBtn: "+ Voeg toe",
    toggle: { month: "Maand", year: "Jaar" },
    nav: { home: "Home", inkomsten: "Inkomsten", transacties: "Uitgaven", budget: "Budget" },
    greeting: name => `Hallo, ${name}!`,
    balance: { thisMonth: "Saldo deze maand", yearBalance: "Jaarsaldo", income: "Inkomsten", expenses: "Uitgaven" },
    home: {
      spending: "Uitgaven", perCategory: "Per categorie", recent: "Recent",
      seeAll: "Alles →", noExpenses: "Geen uitgaven", noExpensesYear: "Geen uitgaven dit jaar",
      yearOverview: "Jaaroverzicht", balancePerMonth: "Saldo per maand",
    },
    income: {
      title: "Inkomsten", addBtn: "+ Toevoegen", totalMonth: "Totaal", yearIncome: "Jaarinkomsten",
      avgPerMonth: "Gemiddeld", perMonth: "per maand", sourcesTitle: "Eenmalige inkomsten",
      noIncome: "Geen eenmalige inkomsten.", addSource: "+ Bron toevoegen", perMonthYear: "Per maand",
      noData: "—", fixedTitle: "Vaste inkomsten", fixedSub: "Telt automatisch elke maand mee",
      fixedAdd: "+ Vaste bron toevoegen", fixedNone: "Geen vaste inkomsten ingesteld.",
      fixedBadge: "Vast", fixedModal: "Vaste inkomensbron", fixedNameLbl: "Naam",
      fixedNamePh: "Typ of kies hieronder…", fixedAmtLbl: "Bedrag (€)", fixedSaveBtn: "Opslaan",
      fixedQuickLabel: "Snelkeuze",
    },
    fixedIncomeQuickPicks: [
      {label:"Salaris", ik:"wallet"},
      {label:"Salaris partner", ik:"wallet"},
      {label:"Freelance", ik:"laptop"},
      {label:"Huurinkomsten", ik:"home2"},
      {label:"Pensioen", ik:"star"},
      {label:"Uitkering", ik:"shield"},
      {label:"Alimentatie", ik:"refresh"},
      {label:"Bijbaan", ik:"briefcase"},
    ],
    transactions: {
      title: "Transacties", fullYear: "Heel", items: "transacties",
      noTransactions: "Geen transacties.", fixedTitle: "Vaste uitgaven",
      fixedSub: "Telt automatisch elke maand mee", fixedAdd: "+ Vaste uitgave toevoegen",
      fixedNone: "Geen vaste uitgaven ingesteld.", fixedBadge: "Vast",
      fixedModal: "Vaste uitgave", fixedNameLbl: "Omschrijving",
      fixedNamePh: "bijv. Huur, Elektriciteit…", fixedAmtLbl: "Bedrag (€)",
      fixedCatLbl: "Categorie", fixedSaveBtn: "Opslaan", fixedTotal: "Vaste lasten totaal",
    },
    budget: {
      title: "Budget", perMonth: "/mnd", perYear: "/jaar",
      spentVsBudget: "Uitgegeven vs Budget", spent: "Uitgegeven:", tooMuch: "te veel",
      left: "over", resetBtn: "Reset naar standaard", addCat: "+ Categorie toevoegen",
      addCatTitle: "Nieuwe categorie", addCatNameLbl: "Naam", addCatNamePh: "bijv. Vakantie, Sport…",
      addCatColor: "Kleur", addCatIcon: "Icoon", addCatSave: "Toevoegen",
      deleteCat: "Wil je deze categorie verwijderen?",
    },
    txModal: {
      title: "Transactie toevoegen", expense: "Uitgave", income: "Inkomst",
      desc: "Omschrijving", descPh: "Typ of kies hieronder…",
      quickLabel: "Snelkeuze", amount: "Bedrag (€)", date: "Datum", category: "Categorie",
      addBtn: "Toevoegen",
    },
    quickPicks: [
      {label:"Boodschappen", ik:"cart", cat:"Boodschappen"},
      {label:"Diner", ik:"utensils", cat:"Eten & Drinken"},
      {label:"Lunch", ik:"utensils", cat:"Eten & Drinken"},
      {label:"Koffie", ik:"coffee", cat:"Eten & Drinken"},
      {label:"Online shoppen", ik:"package", cat:"Kleding"},
      {label:"Kleding", ik:"shirt", cat:"Kleding"},
      {label:"Uitstapje", ik:"star", cat:"Uitstapjes"},
      {label:"Netflix", ik:"play", cat:"Vrije tijd"},
      {label:"Spotify", ik:"music", cat:"Vrije tijd"},
      {label:"Benzine", ik:"fuel", cat:"Brandstof"},
      {label:"OV", ik:"train", cat:"Brandstof"},
      {label:"Apotheek", ik:"pill", cat:"Gezondheid"},
      {label:"Vakantie", ik:"home2", cat:"Vakantie"},
    ],
    incomeModal: {
      title: "Inkomen toevoegen", sourceFor: "Bron voor", source: "Bron",
      sourcePh: "Typ of kies hieronder…", amount: "Bedrag (€)", amountPh: "0,00",
      saveBtn: "Opslaan", quickLabel: "Snelkeuze",
    },
    incomeQuickPicks: [
      {label:"Salaris", ik:"wallet"},
      {label:"Freelance", ik:"laptop"},
      {label:"Bonus", ik:"star"},
      {label:"Huur inkomst", ik:"home2"},
      {label:"Dividend", ik:"trending"},
      {label:"Bijbaan", ik:"briefcase"},
      {label:"Verkoop", ik:"tag"},
      {label:"Terugbetaling", ik:"refresh"},
    ],
  },
  en: {
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    categories: ["Groceries","Food & Drinks","Leisure","Health","Outings","Holiday","Clothing","Fuel","Transport","Miscellaneous"],
    defaultCat: "Groceries",
    currency: v => "€" + Math.abs(v).toLocaleString("nl-NL", {minimumFractionDigits:2, maximumFractionDigits:2}),
    addBtn: "+ Add",
    toggle: { month: "Month", year: "Year" },
    nav: { home: "Home", inkomsten: "Income", transacties: "Expenses", budget: "Budget" },
    greeting: name => `Hey, ${name}!`,
    balance: { thisMonth: "Balance this month", yearBalance: "Year balance", income: "Income", expenses: "Expenses" },
    home: {
      spending: "Spending", perCategory: "By category", recent: "Recent",
      seeAll: "See all →", noExpenses: "No expenses", noExpensesYear: "No expenses this year",
      yearOverview: "Year overview", balancePerMonth: "Balance per month",
    },
    income: {
      title: "Income", addBtn: "+ Add", totalMonth: "Total", yearIncome: "Yearly income",
      avgPerMonth: "Average", perMonth: "per month", sourcesTitle: "One-time income",
      noIncome: "No one-time income.", addSource: "+ Add source", perMonthYear: "Per month",
      noData: "—", fixedTitle: "Fixed income", fixedSub: "Counts automatically every month",
      fixedAdd: "+ Add fixed source", fixedNone: "No fixed income set.",
      fixedBadge: "Fixed", fixedModal: "Fixed income source", fixedNameLbl: "Name",
      fixedNamePh: "Type or choose below…", fixedAmtLbl: "Amount (€)", fixedSaveBtn: "Save",
      fixedQuickLabel: "Quick pick",
    },
    fixedIncomeQuickPicks: [
      {label:"Salary", ik:"wallet"},
      {label:"Partner salary", ik:"wallet"},
      {label:"Freelance", ik:"laptop"},
      {label:"Rental income", ik:"home2"},
      {label:"Pension", ik:"star"},
      {label:"Benefits", ik:"shield"},
      {label:"Alimony", ik:"refresh"},
      {label:"Side job", ik:"briefcase"},
    ],
    transactions: {
      title: "Transactions", fullYear: "Full", items: "transactions",
      noTransactions: "No transactions.", fixedTitle: "Fixed expenses",
      fixedSub: "Counts automatically every month", fixedAdd: "+ Add fixed expense",
      fixedNone: "No fixed expenses set.", fixedBadge: "Fixed",
      fixedModal: "Fixed expense", fixedNameLbl: "Description",
      fixedNamePh: "e.g. Rent, Electricity…", fixedAmtLbl: "Amount (€)",
      fixedCatLbl: "Category", fixedSaveBtn: "Save", fixedTotal: "Fixed costs total",
    },
    budget: {
      title: "Budget", perMonth: "/mo", perYear: "/year",
      spentVsBudget: "Spent vs Budget", spent: "Spent:", tooMuch: "over budget",
      left: "remaining", resetBtn: "Reset to defaults", addCat: "+ Add category",
      addCatTitle: "New category", addCatNameLbl: "Name", addCatNamePh: "e.g. Holiday, Sport…",
      addCatColor: "Color", addCatIcon: "Icon", addCatSave: "Add",
      deleteCat: "Delete this category?",
    },
    txModal: {
      title: "Add Transaction", expense: "Expense", income: "Income",
      desc: "Description", descPh: "Type or choose below…",
      quickLabel: "Quick pick", amount: "Amount (€)", date: "Date", category: "Category",
      addBtn: "Add",
    },
    quickPicks: [
      {label:"Groceries", ik:"cart", cat:"Groceries"},
      {label:"Dinner", ik:"utensils", cat:"Food & Drinks"},
      {label:"Lunch", ik:"utensils", cat:"Food & Drinks"},
      {label:"Coffee", ik:"coffee", cat:"Food & Drinks"},
      {label:"Online shop", ik:"package", cat:"Clothing"},
      {label:"Clothing", ik:"shirt", cat:"Clothing"},
      {label:"Day trip", ik:"star", cat:"Outings"},
      {label:"Netflix", ik:"play", cat:"Leisure"},
      {label:"Spotify", ik:"music", cat:"Leisure"},
      {label:"Fuel", ik:"fuel", cat:"Fuel"},
      {label:"Public transport", ik:"train", cat:"Fuel"},
      {label:"Pharmacy", ik:"pill", cat:"Health"},
      {label:"Holiday", ik:"home2", cat:"Holiday"},
    ],
    incomeModal: {
      title: "Add Income", sourceFor: "Source for", source: "Source",
      sourcePh: "Type or choose below…", amount: "Amount (€)", amountPh: "0.00",
      saveBtn: "Save", quickLabel: "Quick pick",
    },
    incomeQuickPicks: [
      {label:"Salary", ik:"wallet"},
      {label:"Freelance", ik:"laptop"},
      {label:"Bonus", ik:"star"},
      {label:"Rental income", ik:"home2"},
      {label:"Dividend", ik:"trending"},
      {label:"Side job", ik:"briefcase"},
      {label:"Sale", ik:"tag"},
      {label:"Refund", ik:"refresh"},
    ],
  },
};

const LABEL_TRANSLATIONS = {
  nl_to_en: {
    "Boodschappen":"Groceries","Eten & Drinken":"Food & Drinks","Transport":"Transport","Divers":"Miscellaneous","Vrije tijd":"Leisure",
    "Gezondheid":"Health","Uitstapjes":"Outings","Vakantie":"Holiday","Sparen":"Savings",
    "Kleding":"Clothing","Brandstof":"Fuel","Diner":"Dinner","Lunch":"Lunch",
    "Koffie":"Coffee","Online shoppen":"Online shop","Huur/Hypotheek":"Rent/Mortgage",
    "Elektriciteit":"Electricity","Water":"Water","Verzekering":"Insurance",
    "Autoverzekering":"Car insurance","Fitness":"Gym/Fitness","Kinderopvang":"Childcare",
    "Telefoon":"Phone","Internet":"Internet","Netflix":"Netflix","Spotify":"Spotify",
    "Benzine":"Fuel","OV":"Public transport","Apotheek":"Pharmacy",
    "Salaris":"Salary","Freelance":"Freelance","Bonus":"Bonus",
    "Huur inkomst":"Rental income","Dividend":"Dividend","Bijbaan":"Side job",
    "Verkoop":"Sale","Terugbetaling":"Refund","Salaris partner":"Partner salary",
    "Huurinkomsten":"Rental income","Pensioen":"Pension","Uitkering":"Benefits",
    "Alimentatie":"Alimony","Uitstapje":"Day trip",
  },
  en_to_nl: {},
};
Object.entries(LABEL_TRANSLATIONS.nl_to_en).forEach(([nl, en]) => {
  LABEL_TRANSLATIONS.en_to_nl[en] = nl;
});
const translateLabel = (label, fromLang, toLang) => {
  if (fromLang === toLang) return label;
  const map = fromLang === "nl" ? LABEL_TRANSLATIONS.nl_to_en : LABEL_TRANSLATIONS.en_to_nl;
  return map[label] || label;
};

const chipIcon = () => null;
const NAV_ICONS = {
  home: (a, d) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?(d?"#F0F1F8":"#2D2F5E"):(d?"#9D9DB0":"#6B6B7A")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  inkomsten: (a, d) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?(d?"#F0F1F8":"#2D2F5E"):(d?"#9D9DB0":"#6B6B7A")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  transacties: (a, d) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?(d?"#F0F1F8":"#2D2F5E"):(d?"#9D9DB0":"#6B6B7A")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  budget: (a, d) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?(d?"#F0F1F8":"#2D2F5E"):(d?"#9D9DB0":"#6B6B7A")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
};
const mk = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

const DEFAULT_BUDGETS_NL = {
  "Boodschappen":0,"Eten & Drinken":0,"Vrije tijd":0,"Gezondheid":0,
  "Uitstapjes":0,"Vakantie":0,"Sparen":0,"Kleding":0,"Brandstof":0,"Transport":0,"Divers":0
};
const DEFAULT_BUDGETS_EN = {
  "Groceries":0,"Food & Drinks":0,"Leisure":0,"Health":0,
  "Outings":0,"Holiday":0,"Savings":0,"Clothing":0,"Fuel":0,"Transport":0,"Miscellaneous":0
};

const CAT_META = [
  { iconKey:"groceries", color:"#43A047" },
  { iconKey:"food",      color:"#E87040" },
  { iconKey:"leisure",   color:"#9B59B6" },
  { iconKey:"health",    color:"#4CAF7D" },
  { iconKey:"star",      color:"#F9A825" },
  { iconKey:"home2",     color:"#2AACBF" },
  { iconKey:"trending",  color:"#27AE60" },
  { iconKey:"shirt",     color:"#D45A8A" },
  { iconKey:"fuel",      color:"#4A90D9" },
  { iconKey:"car",   color:"#5C7CFA" },
  { iconKey:"other", color:"#8D6E63" },
];

const ic = (d, col="#1A1A1A", s=18) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const ICONS = {
  groceries: col => ic("M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0", col),
  food:      col => ic("M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3", col),
  leisure:   col => ic("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", col),
  health:    col => ic("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", col),
  star:      col => ic("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", col),
  home2:     col => ic("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10", col),
  trending:  col => ic("M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6", col),
  shirt:     col => ic("M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z", col),
  fuel:      col => ic("M3 22V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14 M14 10h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4 M3 22h18 M6 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", col),
  other:     col => ic("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", col),
};

const CatDot = ({ cat, size = 36 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: Math.round(size * 0.3),
    background: `${cat.color}18`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    {ICONS[cat.iconKey] && ICONS[cat.iconKey](cat.color)}
  </div>
);

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [themePref, setThemePref] = useState("auto");
  const [systemDark, setSystemDark] = useState(() => {
    try { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; } catch(e) { return false; }
  });
  const isDark = themePref === "auto" ? systemDark : themePref === "dark";
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  // Per-render theme-aware color names — shadow the module-level ones.
  // eslint-disable-next-line no-unused-vars
  const BLACK = theme.BLACK, WHITE = theme.WHITE, GRAY = theme.GRAY, CREAM = theme.CREAM,
        YELLOW = theme.YELLOW, YELLOW_DARK = theme.YELLOW_DARK, GREEN = theme.GREEN, RED = theme.RED;
  const [lang, setLang] = useState("nl");
  const [screen, setScreen] = useState("onboard");
  const [data, setData] = useState({ transactions: {}, incomeSources: {} });
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [danceStep, setDanceStep] = useState(0);
  const [viewMode, setViewMode] = useState("month");
  const [tab, setTab] = useState("home");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  
  const [budgets, setBudgets] = useState({ default: {} });
  const [customCats, setCustomCats] = useState([]);
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [catOrder, setCatOrder] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txModalMode, setTxModalMode] = useState("both");
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editIncomeName, setEditIncomeName] = useState("");
  const [editingBudget, setEditingBudget] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadCat, setNumpadCat] = useState(null);
  const [numpadVal, setNumpadVal] = useState("0");
  const [txForm, setTxForm] = useState({ desc: "", amount: "", category: "Boodschappen", date: "2026-04-01", type: "expense" });
  const [incomeForm, setIncomeForm] = useState({ source: "", amount: "" });
  const [fixedIncome, setFixedIncome] = useState([]);
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [fixedForm, setFixedForm] = useState({ source: "", amount: "" });
  const [editingFixed, setEditingFixed] = useState(null);
  const [editFixedVal, setEditFixedVal] = useState("");
  const [editFixedName, setEditFixedName] = useState("");
  const fixedRef = useRef(null);
  const fixedExpRef = useRef(null);
  const editRef = useRef(null);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [showFixedExpModal, setShowFixedExpModal] = useState(false);
  const [fixedExpForm, setFixedExpForm] = useState({ desc: "", amount: "", category: "Brandstof" });
  const [editingFixedExp, setEditingFixedExp] = useState(null);
  const [editFixedExpVal, setEditFixedExpVal] = useState("");
  const [editFixedExpName, setEditFixedExpName] = useState("");
  const [editingTx, setEditingTx] = useState(null);
  const [editTxDesc, setEditTxDesc] = useState("");
  const [editTxAmount, setEditTxAmount] = useState("");
  const txEditRef = useRef(null);
  const [catForm, setCatForm] = useState({ name: "", color: "#F9C22E", iconKey: "other" });
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [setupIncome, setSetupIncome] = useState("");
  const [setupIncomeLabel, setSetupIncomeLabel] = useState("");
  const [setupIncomes, setSetupIncomes] = useState([]);
  const [setupExpenses, setSetupExpenses] = useState([]);
  const [setupExpDesc, setSetupExpDesc] = useState("");
  const [setupExpAmt, setSetupExpAmt] = useState("");
  const [setupBudgets, setSetupBudgets] = useState({});

  const t = T[lang];
  const fmt = t.currency;

  const getMonthBudgets = (y, m) => {
    const key = mk(y, m);
    return budgets[key] || budgets["default"] || {};
  };
  const setMonthBudget = (catName, val) => {
    const key = mk(year, month);
    setBudgets(b => ({
      ...b,
      [key]: { ...(b[key] || b["default"] || {}), [catName]: val }
    }));
  };
  const copyBudgetToAllMonths = () => {
    const key = mk(year, month);
    const current = budgets[key] || budgets["default"] || {};
    setBudgets({ default: current });
  };

  useEffect(() => {
    if (screen !== "welcome") return;
    setWelcomeStep(0);
    const iv = setInterval(() => setDanceStep(s => (s + 1) % 8), 180);
    return () => clearInterval(iv);
  }, [screen]);

  // Load saved state on mount
  useEffect(() => {
    (async () => {
      const keys = ['lang','userName','data','budgets','customCats','hiddenCats','catOrder','fixedIncome','fixedExpenses','onboarded','themePref'];
      const loaded = {};
      for (const k of keys) {
        const v = await store.get(k);
        if (v !== null) loaded[k] = v;
      }
      if (loaded.lang) setLang(loaded.lang);
      if (loaded.userName) setUserName(loaded.userName);
      if (loaded.data) setData(loaded.data);
      if (loaded.budgets) setBudgets(loaded.budgets);
      if (loaded.customCats) setCustomCats(loaded.customCats);
      if (loaded.hiddenCats) setHiddenCats(new Set(loaded.hiddenCats));
      if (loaded.catOrder) setCatOrder(loaded.catOrder);
      if (loaded.fixedIncome) setFixedIncome(loaded.fixedIncome);
      if (loaded.fixedExpenses) setFixedExpenses(loaded.fixedExpenses);
      if (loaded.themePref) setThemePref(loaded.themePref);
      if (loaded.onboarded && loaded.userName) setScreen("app");
      setHydrated(true);
    })();
  }, []);

  // Auto-save when state changes (only after initial load)
  useEffect(() => { if (hydrated) store.set('lang', lang); }, [lang, hydrated]);
  useEffect(() => { if (hydrated) store.set('userName', userName); }, [userName, hydrated]);
  useEffect(() => { if (hydrated) store.set('data', data); }, [data, hydrated]);
  useEffect(() => { if (hydrated) store.set('budgets', budgets); }, [budgets, hydrated]);
  useEffect(() => { if (hydrated) store.set('customCats', customCats); }, [customCats, hydrated]);
  useEffect(() => { if (hydrated) store.set('hiddenCats', [...hiddenCats]); }, [hiddenCats, hydrated]);
  useEffect(() => { if (hydrated) store.set('catOrder', catOrder); }, [catOrder, hydrated]);
  useEffect(() => { if (hydrated) store.set('fixedIncome', fixedIncome); }, [fixedIncome, hydrated]);
  useEffect(() => { if (hydrated) store.set('fixedExpenses', fixedExpenses); }, [fixedExpenses, hydrated]);
  useEffect(() => { if (hydrated) store.set('themePref', themePref); }, [themePref, hydrated]);
  
  // System theme listener
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = e => setSystemDark(e.matches);
      if (mq.addEventListener) mq.addEventListener("change", listener);
      else mq.addListener(listener);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", listener);
        else mq.removeListener(listener);
      };
    } catch(e) {}
  }, []);

  useEffect(() => {
    if ((editingBudget || editingIncome) && editRef.current) editRef.current.focus();
  }, [editingBudget, editingIncome]);

  useEffect(() => {
    if (editingTx && txEditRef.current) txEditRef.current.focus();
  }, [editingTx]);

  const switchLang = newLang => {
    const fromCats = T[lang].categories;
    const toCats = T[newLang].categories;
    const newBudgets = {};
    fromCats.forEach((name, i) => { newBudgets[toCats[i]] = budgets[name] ?? 0; });
    customCats.forEach(cc => { newBudgets[cc.name] = budgets[cc.name] ?? 0; });
    setBudgets(newBudgets);
    const catIdx = fromCats.indexOf(txForm.category);
    setTxForm(f => ({ ...f, category: catIdx >= 0 ? toCats[catIdx] : toCats[0] }));
    setFixedExpenses(prev => prev.map(e => {
      const i = fromCats.indexOf(e.category);
      return { ...e, category: i >= 0 ? toCats[i] : e.category, desc: translateLabel(e.desc, lang, newLang) };
    }));
    setFixedExpForm(f => {
      const i = fromCats.indexOf(f.category);
      return { ...f, category: i >= 0 ? toCats[i] : toCats[0] };
    });
    setFixedIncome(prev => prev.map(i => ({ ...i, source: translateLabel(i.source, lang, newLang) })));
    setData(d => {
      const updated = {};
      Object.keys(d.transactions).forEach(key => {
        updated[key] = d.transactions[key].map(tx => {
          const i = fromCats.indexOf(tx.category);
          return { ...tx, category: i >= 0 ? toCats[i] : tx.category, desc: translateLabel(tx.desc, lang, newLang) };
        });
      });
      return { ...d, transactions: updated };
    });
    setHiddenCats(prev => {
      const next = new Set();
      prev.forEach(name => {
        const i = fromCats.indexOf(name);
        if (i >= 0) next.add(toCats[i]); else next.add(name);
      });
      return next;
    });
    setLang(newLang);
  };

  const FALLBACK_COLORS = ['#9B59B6', '#3498DB', '#E67E22', '#1ABC9C', '#E74C3C', '#2ECC71', '#F39C12', '#D35400', '#8E44AD', '#16A085'];
  const CATEGORIES = [
    ...t.categories.map((name, i) => ({
      name,
      ...(CAT_META[i] || { iconKey: "other", color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] })
    })).filter(cat => !hiddenCats.has(cat.name)),
    ...customCats.map((cat, i) => ({
      ...cat,
      color: cat.color || FALLBACK_COLORS[(t.categories.length + i) % FALLBACK_COLORS.length],
      iconKey: cat.iconKey || "other",
    })),
  ];
  const DEFAULT_BUDGETS = lang === "nl" ? DEFAULT_BUDGETS_NL : DEFAULT_BUDGETS_EN;
  const monthKey = mk(year, month);

  const fixedIncomeTotal = fixedIncome.reduce((s, i) => s + i.amount, 0);
  const fixedExpTotal = fixedExpenses.reduce((s, e) => s + e.amount, 0);

  const monthData = useMemo(() => {
    const txs = data.transactions[mk(year, month)] || [];
    const inc = data.incomeSources[mk(year, month)] || [];
    const income = inc.reduce((s, i) => s + i.amount, 0) + fixedIncomeTotal;
    const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) + fixedExpTotal;
    return { income, expenses, balance: income - expenses };
  }, [data, year, month, fixedIncomeTotal, fixedExpTotal]);

  const txListMonth = useMemo(() => {
    return (data.transactions[monthKey] || []).filter(t => t.type === "expense");
  }, [data, monthKey]);

  const incListMonth = useMemo(() => {
    return data.incomeSources[monthKey] || [];
  }, [data, monthKey]);

  const yearMonthData = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const key = mk(year, m);
      const txs = data.transactions[key] || [];
      const inc = data.incomeSources[key] || [];
      const income = inc.reduce((s, i) => s + i.amount, 0) + fixedIncomeTotal;
      const exp = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) + fixedExpTotal;
      return { month: m, name: t.months[m], income, exp, balance: income - exp };
    });
  }, [data, year, fixedIncomeTotal, fixedExpTotal, lang]);

  const yearIncome = yearMonthData.reduce((s, d) => s + d.income, 0);
  const yearExpenses = yearMonthData.reduce((s, d) => s + d.exp, 0);

  const byCategoryMonth = useMemo(() => CATEGORIES.map(cat => ({
    ...cat,
    spent: txListMonth.filter(tx => tx.category === cat.name).reduce((s, tx) => s + tx.amount, 0)
          + fixedExpenses.filter(fe => fe.category === cat.name).reduce((s, fe) => s + fe.amount, 0),
    budget: (getMonthBudgets(year, month)[cat.name]) || 0,
  })), [txListMonth, budgets, lang, customCats, hiddenCats, fixedExpenses, year, month]);

  const yearByCategory = useMemo(() => CATEGORIES.map(cat => {
    let spent = 0;
    for (let m = 0; m < 12; m++) {
      const key = mk(year, m);
      spent += (data.transactions[key] || []).filter(tx => tx.category === cat.name).reduce((s, tx) => s + tx.amount, 0);
    }
    // Add fixed expenses * 12 months
    spent += fixedExpenses.filter(fe => fe.category === cat.name).reduce((s, fe) => s + fe.amount, 0) * 12;
    let yearBudget = 0;
    for (let m = 0; m < 12; m++) {
      yearBudget += getMonthBudgets(year, m)[cat.name] || 0;
    }
    return { ...cat, spent, budget: yearBudget };
  }), [data, year, budgets, lang, customCats, hiddenCats, fixedExpenses]);

  const monthBudgets = getMonthBudgets(year, month);
  const totalBudget = Object.values(monthBudgets).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const totalBudgetWithFixed = totalBudget + fixedExpTotal;
  const curExpenses = viewMode === "month" ? monthData.expenses : yearExpenses;
  const curIncome = viewMode === "month" ? monthData.income : yearIncome;
  const curBalance = viewMode === "month" ? monthData.balance : yearIncome - yearExpenses;
  const fixedExpTotal_month = fixedExpenses.reduce((s, fe) => s + fe.amount, 0);
  const fixedExpTotal_year = fixedExpTotal_month * 12;
  const fixedExpColor = "#7B85B8";

  const pieData = (() => {
    // Variable spending per category (without fixed expenses)
    const varData = (viewMode === "month" ? byCategoryMonth : yearByCategory)
      .map(cat => ({
        ...cat,
        value: viewMode === "month"
          ? txListMonth.filter(tx => tx.category === cat.name).reduce((s, tx) => s + tx.amount, 0)
          : (() => { let s = 0; for(let m=0;m<12;m++){const k=mk(year,m);s+=(data.transactions[k]||[]).filter(tx=>tx.category===cat.name).reduce((a,tx)=>a+tx.amount,0);} return s; })()
      }))
      .filter(c => c.value > 0)
      .map(c => ({ name: c.name, value: c.value, color: c.color, isFixed: false }));

    // Add fixed expenses as one separate entry
    const fixedTotal = viewMode === "month" ? fixedExpTotal_month : fixedExpTotal_year;
    if (fixedTotal > 0) {
      varData.push({
        name: lang === "nl" ? "Vaste lasten" : "Fixed costs",
        value: fixedTotal,
        color: fixedExpColor,
        isFixed: true,
      });
    }
    return varData;
  })();
  const periodLabel = viewMode === "month" ? `${t.months[month]} ${year}` : `${year}`;
  const prevPeriod = () => { if (viewMode === "month") { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); } else setYear(y => y - 1); };
  const nextPeriod = () => { if (viewMode === "month") { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); } else setYear(y => y + 1); };

  const allYearTx = useMemo(() => {
    const all = [];
    for (let m = 0; m < 12; m++) {
      const key = mk(year, m);
      (data.transactions[key] || []).filter(t => t.type === "expense").forEach(tx => all.push(tx));
    }
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data, year]);

  const addTx = () => {
    if (!txForm.desc || !txForm.amount) return;
    const tx = { ...txForm, id: Date.now(), amount: parseFloat(txForm.amount) };
    setData(d => ({ ...d, transactions: { ...d.transactions, [monthKey]: [...(d.transactions[monthKey] || []), tx] } }));
    setTxForm({ desc: "", amount: "", category: t.defaultCat, date: monthKey + "-01", type: "expense" });
    setShowTxModal(false);
    haptic.success();
  };

  const addIncome = () => {
    if (!incomeForm.source || !incomeForm.amount) return;
    const item = { id: "i" + Date.now(), source: incomeForm.source, amount: parseFloat(incomeForm.amount) };
    setData(d => ({ ...d, incomeSources: { ...d.incomeSources, [monthKey]: [...(d.incomeSources[monthKey] || []), item] } }));
    setIncomeForm({ source: "", amount: "" });
    setShowIncomeModal(false);
    haptic.success();
  };

  const deleteIncome = id => setData(d => ({ ...d, incomeSources: { ...d.incomeSources, [monthKey]: (d.incomeSources[monthKey] || []).filter(i => i.id !== id) } }));

  const startEditIncome = item => { setEditingIncome(item.id); setEditVal(String(item.amount)); setEditIncomeName(item.source); };
  const saveEditIncome = id => {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val > 0) setData(d => ({ ...d, incomeSources: { ...d.incomeSources, [monthKey]: (d.incomeSources[monthKey] || []).map(i => i.id === id ? { ...i, amount: val, source: editIncomeName || i.source } : i) } }));
    setEditingIncome(null);
  };

  const startEditBudget = (name, val) => { setEditingBudget(name); setEditVal(String(val)); };
  const saveEditBudget = name => {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) { setMonthBudget(name, Math.round(val)); haptic.light(); }
    setEditingBudget(null);
  };

  const startEditTx = tx => { setEditingTx(tx.id); setEditTxDesc(tx.desc); setEditTxAmount(String(tx.amount)); };
  const saveEditTx = id => {
    const val = parseFloat(editTxAmount);
    if (!isNaN(val) && val > 0 && editTxDesc.trim()) {
      setData(d => {
        const updated = {};
        Object.keys(d.transactions).forEach(key => { updated[key] = d.transactions[key].map(tx => tx.id === id ? { ...tx, desc: editTxDesc.trim(), amount: val } : tx); });
        return { ...d, transactions: updated };
      });
    }
    setEditingTx(null);
  };
  const deleteTx = id => {
    haptic.medium();
    setData(d => {
      const updated = {};
      Object.keys(d.transactions).forEach(key => { updated[key] = d.transactions[key].filter(tx => tx.id !== id); });
      return { ...d, transactions: updated };
    });
  };

  const resetAllData = async () => {
    haptic.warning();
    try {
      if (Preferences) await Preferences.clear();
      try {
        Object.keys(localStorage).filter(k => k.startsWith("karretje.")).forEach(k => localStorage.removeItem(k));
      } catch(e) {}
    } catch(e) {
      console.error("Reset error:", e);
    }
    window.location.reload();
  };

  const addCustomCat = () => {
    if (!catForm.name.trim()) return;
    const newCat = { id: "cc" + Date.now(), name: catForm.name.trim(), color: catForm.color, iconKey: catForm.iconKey };
    setCustomCats(prev => [...prev, newCat]);
    setBudgets(b => ({ ...b, [catForm.name.trim()]: 0 }));
    setCatForm({ name: "", color: "#F9C22E", iconKey: "other" });
    setShowCatModal(false);
  };

  const deleteAnyCategory = cat => {
    haptic.warning();
    if (cat.id) { setCustomCats(prev => prev.filter(c => c.id !== cat.id)); }
    else { setHiddenCats(prev => new Set([...prev, cat.name])); }
    setBudgets(b => { const nb = { ...b }; delete nb[cat.name]; return nb; });
  };

  const addFixed = () => {
    if (!fixedForm.source || !fixedForm.amount) return;
    setFixedIncome(f => [...f, { id: "f" + Date.now(), source: fixedForm.source, amount: parseFloat(fixedForm.amount) }]);
    setFixedForm({ source: "", amount: "" });
    setShowFixedModal(false);
    haptic.success();
  };
  const deleteFixed = id => setFixedIncome(f => f.filter(i => i.id !== id));
  const addSetupIncome = () => {
    if (!setupIncomeLabel || !setupIncome || parseFloat(setupIncome) <= 0) return;
    setSetupIncomes(p => [...p, { id: "si"+Date.now(), source: setupIncomeLabel, amount: parseFloat(setupIncome) }]);
    setSetupIncomeLabel(""); setSetupIncome("");
  };
  const addSetupExpense = () => {
    if (!setupExpDesc || !setupExpAmt) return;
    setSetupExpenses(p => [...p, { id: "se"+Date.now(), desc: setupExpDesc, amount: parseFloat(setupExpAmt), category: lang==="nl" ? "Divers" : "Miscellaneous" }]);
    setSetupExpDesc(""); setSetupExpAmt("");
  };
  const finishSetup = () => {
    if (setupIncomes.length > 0) setFixedIncome(p => [...p, ...setupIncomes]);
    else if (setupIncome && parseFloat(setupIncome) > 0) {
      const lbl = setupIncomeLabel || (lang==="nl" ? "Salaris" : "Salary");
      setFixedIncome(p => [...p, { id: "si"+Date.now(), source: lbl, amount: parseFloat(setupIncome) }]);
    }
    if (setupExpenses.length > 0) setFixedExpenses(p => [...p, ...setupExpenses]);
    if (Object.keys(setupBudgets).length > 0) setBudgets(b => ({ ...b, default: { ...(b.default||{}), ...setupBudgets } }));
    store.set("onboarded", true);
    setScreen("app");
  };
  const startEditFixed = item => { setEditingFixed(item.id); setEditFixedVal(String(item.amount)); setEditFixedName(item.source); };
  const saveEditFixed = id => {
    const val = parseFloat(editFixedVal);
    if (!isNaN(val) && val > 0) setFixedIncome(f => f.map(i => i.id === id ? { ...i, amount: val, source: editFixedName || i.source } : i));
    setEditingFixed(null);
  };

  const addFixedExp = () => {
    if (!fixedExpForm.desc || !fixedExpForm.amount) return;
    setFixedExpenses(f => [...f, { id: "fe" + Date.now(), desc: fixedExpForm.desc, amount: parseFloat(fixedExpForm.amount), category: fixedExpForm.category }]);
    setFixedExpForm({ desc: "", amount: "", category: t.categories[0] });
    setShowFixedExpModal(false);
    haptic.success();
  };
  const deleteFixedExp = id => setFixedExpenses(f => f.filter(e => e.id !== id));
  const startEditFixedExp = item => { setEditingFixedExp(item.id); setEditFixedExpVal(String(item.amount)); setEditFixedExpName(item.desc); };
  const saveEditFixedExp = id => {
    const val = parseFloat(editFixedExpVal);
    if (!isNaN(val) && val > 0) setFixedExpenses(f => f.map(e => e.id === id ? { ...e, amount: val, desc: editFixedExpName || e.desc } : e));
    setEditingFixedExp(null);
  };

  const navTabs = [
    { id: "home", label: t.nav.home },
    { id: "inkomsten", label: t.nav.inkomsten },
    { id: "transacties", label: t.nav.transacties },
    { id: "budget", label: t.nav.budget },
  ];

  if (screen === "onboard") {
    return (
      <div style={{height:"100dvh",fontFamily:"DM Sans",position:"relative",overflow:"hidden"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, #3A3D6B 0%, #5C6690 35%, #8A95C4 70%, #BCC3DD 100%)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(239,215,213,0.15) 0%,rgba(45,47,94,0.78) 100%)"}}/>
        <div style={{position:"absolute",top:52,left:0,right:0,textAlign:"center",zIndex:2}}>
          <p style={{fontSize:42,fontWeight:800,color:"#FFF",letterSpacing:"-1px"}}>karretje</p>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 28px 44px",zIndex:2}}>
          <p style={{fontSize:22,fontWeight:800,color:"#FFF",textAlign:"center",marginBottom:20}}>
            {lang==="nl" ? "Slim uitgeven, meer overhouden." : "Spend smart, save more."}
          </p>
          <input type="text" placeholder={lang==="nl"?"Jouw naam...":"Your name..."} value={nameInput}
            onChange={e=>setNameInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&nameInput.trim()&&(setUserName(nameInput.trim()),setScreen("welcome"))}
            style={{width:"100%",background:"rgba(255,255,255,0.2)",border:"2px solid rgba(255,255,255,0.45)",borderRadius:50,padding:"14px 22px",fontFamily:"inherit",fontSize:15,fontWeight:600,outline:"none",textAlign:"center",marginBottom:10,color:"#FFF"}}
            autoFocus
          />
          <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"center"}}>
            {["nl","en"].map(l=>(
              <button key={l} onClick={()=>switchLang(l)}
                style={{padding:"5px 14px",border:"none",borderRadius:50,fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",background:lang===l?"#FFF":"rgba(255,255,255,0.2)",color:lang===l?"#2D2F5E":"rgba(255,255,255,0.7)"}}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={()=>{if(nameInput.trim()){setUserName(nameInput.trim());setScreen("welcome");haptic.success();}}}
            style={{width:"100%",background:nameInput.trim()?"#FFF":"rgba(255,255,255,0.2)",color:nameInput.trim()?"#2D2F5E":"rgba(255,255,255,0.45)",border:"none",borderRadius:50,padding:"16px",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:nameInput.trim()?"pointer":"default"}}>
            {lang==="nl" ? "Doorgaan" : "Continue"}
          </button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:14,color:"rgba(255,255,255,0.75)",fontSize:11,fontWeight:500}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>{lang==="nl" ? "Alle data wordt lokaal op je toestel opgeslagen" : "All data is stored locally on your device"}</span>
          </div>
        </div>
      </div>
    );
  }
  if (screen === "welcome") {
    const incomeChips = lang==="nl"
      ? ["Salaris","Freelance","Uitkering","Pensioen","Huur inkomsten"]
      : ["Salary","Freelance","Benefits","Pension","Rental income"];
    const expChips = lang==="nl"
      ? ["Huur/Hypotheek","Elektriciteit","Water","Verzekering","Autoverzekering","Telefoon","Internet","Netflix","Spotify","Kinderopvang"]
      : ["Rent/Mortgage","Electricity","Water","Insurance","Car insurance","Phone","Internet","Netflix","Spotify","Childcare"];

    const stepData = [
      {title:lang==="nl"?`Hallo, ${userName}!`:`Hello, ${userName}!`,sub:lang==="nl"?"Laten we je app instellen in 3 korte stappen.":"Let's set up your app in 3 quick steps."},
      {title:lang==="nl"?"Wat verdien je?":"What do you earn?",sub:lang==="nl"?"Vul je maandelijkse inkomsten in.":"Enter your monthly income."},
      {title:lang==="nl"?"Vaste uitgaven":"Fixed expenses",sub:lang==="nl"?"Voeg je maandelijkse vaste kosten toe.":"Add your monthly fixed costs."},
      {title:lang==="nl"?"Budgetten instellen":"Set budgets",sub:lang==="nl"?"Hoeveel wil je per categorie uitgeven?":"How much do you want to spend per category?"},
    ];
    const totalExp = setupExpenses.reduce((s,e)=>s+e.amount,0);
    return (
      <div style={{height:"100dvh",fontFamily:"DM Sans",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",background:"#EFD7D5"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}input,select{width:100%;background:rgba(255,255,255,0.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,0.7);border-radius:14px;padding:13px 16px;font-family:inherit;font-size:14px;outline:none;color:#2D2F5E;}input::placeholder{color:rgba(45,47,94,0.4);}input:focus{border-color:#7B85B8;background:rgba(255,255,255,0.75);}`}</style>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, #5C6690 0%, #8A95C4 45%, #BCC3DD 80%, #D4C5E8 100%)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(239,215,213,0.1) 0%,rgba(239,215,213,0.55) 45%,rgba(239,215,213,0.82) 100%)"}}/>
        <div style={{position:"relative",zIndex:2,display:"flex",justifyContent:"center",alignItems:"center",gap:8,paddingTop:52,marginBottom:8}}>
          {welcomeStep>0 && (
            <button onClick={()=>setWelcomeStep(s=>s-1)} style={{position:"absolute",left:24,background:"rgba(45,47,94,0.1)",border:"none",borderRadius:50,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2F5E" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:i===welcomeStep?24:8,height:8,borderRadius:4,background:i===welcomeStep?"#2D2F5E":"rgba(45,47,94,0.2)",transition:"all 0.3s"}}/>
          ))}
        </div>
        <div style={{position:"relative",zIndex:2,flex:1,display:"flex",flexDirection:"column",padding:"12px 24px 0",overflowY:"auto",justifyContent:"space-between"}}>
          <div style={{textAlign:"center",marginBottom:20,background:"rgba(255,255,255,0.35)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderRadius:24,padding:"20px 24px",border:"1px solid rgba(255,255,255,0.6)"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
              <div style={{display:"flex",background:"rgba(45,47,94,0.1)",borderRadius:50,padding:3,gap:2}}>
                {["nl","en"].map(l=>(
                  <button key={l} onClick={()=>switchLang(l)}
                    style={{padding:"5px 16px",border:"none",borderRadius:50,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",background:lang===l?"#2D2F5E":"transparent",color:lang===l?"#FFF":"rgba(45,47,94,0.5)",transition:"all 0.2s"}}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <p style={{fontSize:26,fontWeight:800,color:"#2D2F5E",marginBottom:4}}>{(stepData[welcomeStep]||stepData[0]).title}</p>
            <p style={{fontSize:14,color:"rgba(45,47,94,0.6)",fontWeight:500}}>{(stepData[welcomeStep]||stepData[0]).sub}</p>
          </div>
          {welcomeStep===0 && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              { [
                {
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                  t: lang==="nl" ? "Inkomsten bijhouden" : "Track income",
                  color: "#E8F8EF"
                },
                {
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7B85B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="7 10 12 5 17 10"/></svg>,
                  t: lang==="nl" ? "Budget per categorie" : "Budget by category",
                  color: "#EEF0FA"
                },
                {
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E87040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
                  t: lang==="nl" ? "Vaste lasten automatisch" : "Recurring expenses auto-added",
                  color: "#FEF0EA"
                },
              ].map((f,i) => (
                <div key={i} style={{background:"rgba(255,255,255,0.4)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:16,border:"1px solid rgba(255,255,255,0.65)",boxShadow:"0 4px 16px rgba(45,47,94,0.08)"}}>
                  <div style={{width:48,height:48,borderRadius:12,background:f.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {f.icon}
                  </div>
                  <p style={{fontSize:15,fontWeight:700,color:"#2D2F5E"}}>{f.t}</p>
                </div>
              )) }
            </div>
          )}
          {welcomeStep===1 && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {incomeChips.map(chip=>(
                  <button key={chip} onClick={()=>setSetupIncomeLabel(chip)}
                    style={{padding:"6px 14px",border:"none",borderRadius:50,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",background:setupIncomeLabel===chip?"#2D2F5E":"rgba(255,255,255,0.5)",color:setupIncomeLabel===chip?"#FFF":"#2D2F5E",border:"1px solid rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
                    {chip}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input type="text" placeholder={lang==="nl"?"Omschrijving (bijv. Salaris)":"Description (e.g. Salary)"} value={setupIncomeLabel} onChange={e=>setSetupIncomeLabel(e.target.value)} style={{flex:2,width:"auto"}}/>
                <input type="number" placeholder="euro" value={setupIncome} onChange={e=>setSetupIncome(e.target.value)} style={{flex:1,width:"auto"}}/>
              </div>
              <button onClick={addSetupIncome}
                style={{background:"#2D2F5E",color:"#FFF",border:"none",borderRadius:50,padding:"11px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {lang==="nl"?"Toevoegen":"Add"}
              </button>
              {setupIncomes.length>0 && (
                <div style={{background:"rgba(255,255,255,0.45)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderRadius:14,padding:"10px 14px",border:"1px solid rgba(255,255,255,0.65)"}}>
                  {setupIncomes.map((inc,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<setupIncomes.length-1?"1px solid #F0F0F0":"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:8,background:"#E8F8EF",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <span style={{fontSize:13,fontWeight:600,color:"#2D2F5E"}}>{inc.source}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:13,fontWeight:700,color:"#27AE60"}}>+{inc.amount.toFixed(2)}/mnd</span>
                        <button onClick={()=>setSetupIncomes(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#CCC",lineHeight:1}}>x</button>
                      </div>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:8,borderTop:"2px solid #E8E8EE"}}>
                    <span style={{fontSize:11,fontWeight:700,color:"rgba(45,47,94,0.4)",textTransform:"uppercase",letterSpacing:".04em"}}>Totaal</span>
                    <span style={{fontSize:14,fontWeight:800,color:"#27AE60"}}>+{setupIncomes.reduce((s,i)=>s+i.amount,0).toFixed(2)}/mnd</span>
                  </div>
                </div>
              )}
            </div>
          )}
                    {welcomeStep===3 && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(lang==="nl"
                ? ["Boodschappen","Eten & Drinken","Vrije tijd","Gezondheid","Uitstapjes","Vakantie","Kleding","Brandstof","Transport","Divers"]
                : ["Groceries","Food & Drinks","Leisure","Health","Outings","Holiday","Clothing","Fuel","Transport","Miscellaneous"]
              ).map(cat => (
                <div key={cat} style={{background:"rgba(255,255,255,0.45)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid rgba(255,255,255,0.65)"}}>
                  <span style={{fontSize:14,fontWeight:600,color:"#2D2F5E",flex:1}}>{cat}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,color:"rgba(45,47,94,0.5)"}}>€</span>
                    <input type="number" placeholder="0"
                      value={setupBudgets[cat] || ""}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setSetupBudgets(b => ({ ...b, [cat]: isNaN(val) ? 0 : val }));
                      }}
                      style={{width:80,textAlign:"right",background:"rgba(255,255,255,0.6)",border:"1.5px solid rgba(255,255,255,0.8)",borderRadius:10,padding:"6px 10px",fontFamily:"inherit",fontSize:14,fontWeight:700,color:"#2D2F5E",outline:"none"}}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {welcomeStep===2 && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {expChips.map(chip=>(
                  <button key={chip} onClick={()=>setSetupExpDesc(chip)}
                    style={{padding:"5px 12px",border:"none",borderRadius:50,fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer",background:setupExpDesc===chip?"#2D2F5E":"rgba(255,255,255,0.5)",color:setupExpDesc===chip?"#FFF":"#2D2F5E",border:"1px solid rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
                    {chip}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input type="text" placeholder={lang==="nl"?"Omschrijving":"Description"} value={setupExpDesc} onChange={e=>setSetupExpDesc(e.target.value)} style={{flex:2,width:"auto"}}/>
                <input type="number" placeholder="euro" value={setupExpAmt} onChange={e=>setSetupExpAmt(e.target.value)} style={{flex:1,width:"auto"}}/>
              </div>
              <button onClick={addSetupExpense} style={{background:"#2D2F5E",color:"#FFF",border:"none",borderRadius:50,padding:"11px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {lang==="nl"?"+ Toevoegen":"+ Add"}
              </button>
              {setupExpenses.length>0 && (
                <div style={{background:"rgba(255,255,255,0.7)",borderRadius:14,padding:"10px 14px"}}>
                  {setupExpenses.map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<setupExpenses.length-1?"1px solid #F0F0F0":"none"}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#2D2F5E"}}>{e.desc}</span>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:13,fontWeight:700,color:"#7B85B8"}}>{e.amount.toFixed(2)}</span>
                        <button onClick={()=>setSetupExpenses(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#999"}}>x</button>
                      </div>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:8,borderTop:"2px solid #E8E8EE"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"rgba(45,47,94,0.5)",textTransform:"uppercase"}}>Totaal</span>
                    <span style={{fontSize:14,fontWeight:800,color:"#2D2F5E"}}>{totalExp.toFixed(2)}/mnd</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{position:"relative",zIndex:2,padding:"12px 24px",paddingBottom:"max(24px,env(safe-area-inset-bottom))",display:"flex",flexDirection:"column",gap:8,background:"rgba(239,215,213,0.6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.5)"}}>
          <button onClick={()=>{if(welcomeStep<3){setWelcomeStep(s=>Math.min(s+1,3));}else{finishSetup();}}}
            style={{width:"100%",background:"#2D2F5E",color:"#FFF",border:"none",borderRadius:50,padding:"16px",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}>
            {welcomeStep===0?(lang==="nl"?"Begin":"Get started"):welcomeStep===3?(lang==="nl"?"Klaar, start de app!":"Done, start the app!"):(lang==="nl"?"Volgende":"Next")}
          </button>
          <button onClick={()=>{if(welcomeStep===0){store.set("onboarded",true);setScreen("app");}else{setWelcomeStep(s=>s+1);}}}
            style={{background:"none",border:"none",fontFamily:"inherit",fontSize:13,color:"rgba(45,47,94,0.45)",cursor:"pointer",padding:"4px",textDecoration:"underline"}}>
            {lang==="nl"?"Overslaan":"Skip"}
          </button>
        </div>
      </div>
    );
  }

return ( <div
style={{height:"100dvh",background:theme.APP_BG,fontFamily:"DM Sans",color:BLACK,display:"flex",flexDirection:"column",overflow:"hidden",transition:"background 0.3s"}}> 
<style>{` @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;overflow:hidden;}
.card{background:${theme.CARD_BG};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:20px;padding:16px;box-shadow:0 4px 20px ${isDark?'rgba(0,0,0,0.3)':'rgba(45,47,94,0.1)'};border:1px solid ${theme.CARD_BORDER};transition:background 0.3s, border-color 0.3s;}
.pill{border:none;border-radius:50px;padding:10px 22px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .18s;}
.pill-dark{background:${BLACK};color:${WHITE};}
.pill-dark:hover{background:#333;}
.pill-yellow{background:#BCC3DD;color:#1A1A1A;}
.pill-yellow:hover{background:#A8B0CF;}
.pill-outline{background:transparent;color:${BLACK};border:1.5px solid #DDD;}
.pill-outline:hover{border-color:${YELLOW};}
.pill-sm{padding:6px 14px;font-size:11px;}
.tab-btn{background:none;border:none;font-family:inherit;font-size:10px;font-weight:600;color:#AAA;cursor:pointer;padding:6px 10px;border-radius:50px;text-transform:uppercase;letter-spacing:.05em;transition:all .18s;}
.tab-btn.active{background:#5C6690;color:${WHITE};}
input,select{background:${theme.INPUT_BG};border:1.5px solid ${theme.INPUT_BORDER};color:${BLACK};border-radius:12px;padding:11px 14px;font-family:inherit;font-size:13px;width:100%;outline:none;transition:all .2s;}
input:focus,select:focus{border-color:${YELLOW};background:${WHITE};}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.38);display:flex;align-items:flex-end;justify-content:center;z-index:200;}
.sheet{background:${theme.WHITE};border-radius:28px 28px 0 0;padding:28px 24px max(36px, calc(20px + env(safe-area-inset-bottom)));width:100%;max-width:500px;max-height:90dvh;overflow-y:auto;}
.tx-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid ${theme.DIVIDER};}
.tx-row:last-child{border-bottom:none;} /* cat-dot handled by CatDot component */ .track{height:10px;background:#F0F0F0;border-radius:3px;overflow:hidden;margin-top:8px;}
.fill{height:100%;border-radius:3px;transition:width .4s;}
.icon-btn{background:none;border:none;cursor:pointer;padding:4px 7px;border-radius:8px;font-size:13px;color:${GRAY};transition:all .15s;}
.icon-btn:hover{background:#F0F0F0;}
.inline-input{background:${YELLOW}22;border:2px solid ${YELLOW};color:${BLACK};border-radius:10px;padding:5px 10px;font-family:inherit;font-size:14px;font-weight:700;width:100px;outline:none;text-align:right;}
.save-btn{background:${BLACK};color:${WHITE};border:none;border-radius:8px;padding:6px 12px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;margin-left:6px;flex-shrink:0;}
.nav-arrow{background:rgba(92,102,144,0.2);border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;color:${BLACK};flex-shrink:0;transition:background .15s;}
.nav-arrow:hover{background:rgba(92,102,144,0.35);}
.income-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #F5F5F5;}
.income-row:last-child{border-bottom:none;}
.view-toggle{display:flex;background:rgba(92,102,144,0.2);border-radius:50px;padding:3px;gap:2px;}
.vt-btn{border:none;border-radius:50px;padding:5px 14px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;transition:all .18s;text-transform:uppercase;letter-spacing:.05em;}
.vt-btn.active{background:#5C6690;color:${WHITE};}
.vt-btn.inactive{background:transparent;color:rgba(0,0,0,.5);}
.month-chip{background:rgba(255,255,255,.15);border-radius:10px;padding:8px 4px;text-align:center;cursor:pointer;transition:all .18s;}
.month-chip:hover{background:rgba(255,255,255,.25);}
.month-chip.active{background:${WHITE};box-shadow:0 2px 8px rgba(0,0,0,.1);}
.lang-toggle{display:flex;background:rgba(92,102,144,0.2);border-radius:50px;padding:2px;gap:1px;}
.lt-btn{border:none;border-radius:50px;padding:4px 10px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;transition:all .18s;letter-spacing:.03em;}
.lt-btn.active{background:rgba(255,255,255,0.9);color:#3A4070;}
.lt-btn.inactive{background:transparent;color:rgba(0,0,0,.45);}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#DDD;border-radius:2px;} `}
</style>
<div style={{flexShrink:0,display:showNumpad?"none":"block"}}>
<div style={{background:"#BCC3DD",padding:"10px 16px 16px",borderRadius:"0 0 28px 28px"}}>
<div style={{textAlign:"center",marginBottom:6}}>
  <p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:800,color:BLACK,letterSpacing:"-0.5px",lineHeight:1}}>karretje</p>
</div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}> <div style={{display:"flex",gap:6,alignItems:"center"}}> <div className="lang-toggle"> <button className={`lt-btn ${lang==="nl"?"active":"inactive"}`} onClick={()=>switchLang("nl")}>NL</button>
<button className={`lt-btn ${lang==="en"?"active":"inactive"}`} onClick={()=>switchLang("en")}>EN</button>
</div>
<button onClick={()=>{haptic.select();setShowSettings(true);}} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,marginLeft:4}}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BLACK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
</button>
<div className="view-toggle"> <button className={`vt-btn ${viewMode==="month"?"active":"inactive"}`} onClick={()=>setViewMode("month")}>{t.toggle.month}</button>
<button className={`vt-btn ${viewMode==="year" ?"active":"inactive"}`} onClick={()=>setViewMode("year")}>{t.toggle.year}</button>
</div> </div>
{viewMode==="month" && <button onClick={()=>{setTxModalMode("both");setShowTxModal(true);}} className="pill pill-dark" style={{padding:"7px 16px",fontSize:12}}>{t.addBtn}</button>}
</div>
<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginBottom:6}}> <button className="nav-arrow" onClick={()=>{haptic.light();prevPeriod();}}>‹</button>
<h2 style={{fontFamily:"DM Sans",fontSize:22,fontWeight:800,textAlign:"center",minWidth:120}}>{periodLabel}</h2>
<button className="nav-arrow" onClick={()=>{haptic.light();nextPeriod();}}>›</button>
</div>
<div style={{background:BLACK,borderRadius:16,padding:"12px 16px",color:WHITE}}> <p style={{fontSize:11,color:"rgba(255,255,255,.65)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>
{viewMode==="month" ? t.balance.thisMonth : `${t.balance.yearBalance} ${year}`}
</p>
<p style={{fontFamily:"DM Sans",fontSize:28,fontWeight:800,lineHeight:1,marginBottom:10,color:curBalance>=0?"#2ECC71":"#FF6B6B"}}>
{fmt(curBalance)}
</p>
<div style={{display:"flex",gap:10}}>
{[{label:t.balance.income,val:curIncome,color:YELLOW},
{label:t.balance.expenses,val:curExpenses,color:"#FF8A65"}].map(s=>( <div key={s.label} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:10,padding:"8px 12px"}}> <p style={{fontSize:9,color:"rgba(255,255,255,.65)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{s.label}</p>
<p style={{fontSize:15,fontWeight:700,color:s.color}}>{fmt(s.val)}</p>
</div> ))}
</div>
</div>
{viewMode==="year" && ( <div style={{display:"flex",gap:5,marginTop:14,overflowX:"auto",paddingBottom:2}}>
{yearMonthData.map(d=>{
  const bal = d.balance;
  const hasData = d.exp > 0 || d.inc > 0;
  const shortAmt = hasData ? (bal >= 0 ? "+" : "") + (Math.abs(bal) >= 1000 ? (bal/1000).toFixed(1)+"k" : Math.round(bal)) : "-";
  return (
    <div key={d.month} onClick={()=>{setMonth(d.month);setViewMode("month");}} className={`month-chip ${d.month===month?"active":""}`} style={{minWidth:44,padding:"8px 6px"}}>
      <p style={{fontSize:11,fontWeight:700,color:d.month===month?BLACK:"rgba(0,0,0,.55)",marginBottom:4}}>{d.name}</p>
      <div style={{width:6,height:6,borderRadius:"50%",background:hasData?(bal>=0?"#2ECC71":"#FF6B6B"):"rgba(0,0,0,0.15)",margin:"0 auto 3px"}}/>
      <p style={{fontSize:9,fontWeight:700,color:hasData?(bal>=0?"#2ECC71":"#FF6B6B"):"rgba(0,0,0,0.3)",letterSpacing:"-0.3px"}}>{shortAmt}</p>
    </div>
  );
})}
</div> )}
</div>
<div style={{display:"flex",justifyContent:"center",gap:4,padding:"6px 16px 0",flexWrap:"nowrap"}}>
{navTabs.map(tb=>( <button key={tb.id} className={`tab-btn ${tab===tb.id?"active":""}`} onClick={()=>setTab(tb.id)}>{tb.label}</button> ))}
</div>
</div>
<div style={{flex:1,overflowY:"auto",padding:"16px 16px calc(85px + env(safe-area-inset-bottom))",WebkitOverflowScrolling:"touch"}}>
{tab==="home" && ( <div style={{display:"flex",flexDirection:"column",gap:16}}>
{viewMode==="month" ? ( <>

{(()=>{
  const totalBudget = Object.values(monthBudgets).reduce((s,v)=>s+(typeof v==="number"?v:0),0) + fixedExpTotal;
  const remaining = Math.max(totalBudget - curExpenses, 0);
  const overBudget = curExpenses > totalBudget && totalBudget > 0;
  const pct = totalBudget > 0 ? Math.min(curExpenses / totalBudget, 1) : 0;
  const ringPct = 1 - pct;
  const size = 200;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - ringPct);

  return (
    <div className="card" style={{padding:"20px 20px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <p style={{fontFamily:"DM Sans",fontSize:18,fontWeight:800,color:BLACK}}>
          {lang==="nl"?"Jouw voortgang":"Your Progress"}
        </p>
      </div>

      <div style={{display:"flex",justifyContent:"center",padding:"12px 0 18px"}}>
        <div style={{position:"relative",width:size,height:size}}>
          <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
            <defs>
              <linearGradient id="progressRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={YELLOW}/>
                <stop offset="100%" stopColor="#BCC3DD"/>
              </linearGradient>
            </defs>
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"} strokeWidth={stroke}/>
            {totalBudget > 0 && (
              <circle cx={size/2} cy={size/2} r={radius}
                fill="none"
                stroke={overBudget ? RED : "url(#progressRing)"}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{transition:"stroke-dashoffset 0.6s ease"}}
              />
            )}
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
            <p style={{fontSize:30,fontWeight:800,color:BLACK,lineHeight:1}}>{fmt(remaining)}</p>
            {totalBudget > 0 && (
              <p style={{fontSize:13,color:GRAY,fontWeight:500}}>
                {lang==="nl"?"van":"of"} {fmt(totalBudget)}
              </p>
            )}
            <p style={{fontSize:11,color:GRAY,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginTop:4}}>
              {totalBudget===0
                ? (lang==="nl"?"Stel budget in":"Set budget")
                : overBudget
                  ? (lang==="nl"?"Boven budget":"Over budget")
                  : (lang==="nl"?"Resterend budget":"Remaining Budget")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
})()}

<div style={{display:"flex",gap:10}}>
  <div className="card" style={{flex:1,padding:"14px 16px"}}>
    <p style={{fontSize:12,color:GRAY,fontWeight:600,marginBottom:4}}>
      {lang==="nl"?"Inkomsten":"Income"}
    </p>
    <p style={{fontSize:18,fontWeight:800,color:BLACK}}>{fmt(curIncome)}</p>
  </div>
  <div className="card" style={{flex:1,padding:"14px 16px"}}>
    <p style={{fontSize:12,color:GRAY,fontWeight:600,marginBottom:4}}>
      {lang==="nl"?"Uitgaven":"Expenses"}
    </p>
    <p style={{fontSize:18,fontWeight:800,color:BLACK}}>{fmt(curExpenses)}</p>
  </div>
</div>

{pieData.length > 0 && (
  <div className="card">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <p style={{fontFamily:"DM Sans",fontSize:18,fontWeight:800,color:BLACK}}>
        {t.home.spending}
      </p>
      <p style={{fontSize:11,color:GRAY}}>{t.months[month]}</p>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <ResponsiveContainer width="50%" height={140}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
            {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
          </Pie>
          <Tooltip contentStyle={{fontFamily:"DM Sans",fontSize:11,borderRadius:10,border:"none",boxShadow:"0 4px 14px rgba(0,0,0,.1)"}} formatter={v=>fmt(v)}/>
        </PieChart>
      </ResponsiveContainer>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
        {pieData.slice(0,5).map(c=>(
          <div key={c.name} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:c.isFixed?"2px":"50%",background:c.color,flexShrink:0}}/>
            <span style={{fontSize:11,flex:1,lineHeight:1.3,fontWeight:c.isFixed?700:400,color:BLACK}}>{c.name}</span>
            <span style={{fontSize:11,fontWeight:700,color:c.isFixed?c.color:BLACK}}>{fmt(c.value)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

<div className="card">
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
    <p style={{fontFamily:"DM Sans",fontSize:18,fontWeight:800,color:BLACK}}>{t.home.recent}</p>
    {txListMonth.length > 0 && (
      <button onClick={()=>setTab("transacties")}
        style={{background:"none",border:"none",color:YELLOW,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {t.home.seeAll}
      </button>
    )}
  </div>
  {[...txListMonth].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(tx=>{
    const cat = CATEGORIES.find(c=>c.name===tx.category) || CATEGORIES[CATEGORIES.length-1];
    return (
      <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${theme.DIVIDER}`}}>
        <CatDot cat={cat} size={36}/>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:14,fontWeight:600,color:BLACK,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tx.desc}</p>
          <p style={{fontSize:11,color:GRAY,marginTop:1}}>{tx.category}</p>
        </div>
        <p style={{fontSize:14,fontWeight:700,color:BLACK,flexShrink:0}}>
          −{fmt(tx.amount)}
        </p>
      </div>
    );
  })}
  {txListMonth.length===0 && (
    <p style={{fontSize:13,color:GRAY,padding:"12px 0",textAlign:"center"}}>{t.home.noTransactions}</p>
  )}
</div>
</> ) : ( <> <div className="card"> <p style={{fontFamily:"DM Sans",fontSize:17,fontWeight:700,marginBottom:2}}>{t.home.yearOverview}
{year}</p>
<p style={{fontSize:11,color:GRAY,marginBottom:14}}>{t.home.incomeVsExpenses}</p>
<ResponsiveContainer width="100%" height={180}> <LineChart data={yearMonthData}> <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
<XAxis dataKey="name" tick={{fill:"#AAA",fontSize:10}} axisLine={false} tickLine={false}/>
<YAxis tick={{fill:"#CCC",fontSize:9}} axisLine={false} tickLine={false} width={36} tickFormatter={v=>`€${v/1000}k`}/>
<Tooltip contentStyle={{fontFamily:"DM Sans",fontSize:11,borderRadius:10,border:"none",boxShadow:"0 4px 14px rgba(0,0,0,.1)"}} formatter={v=>fmt(v)}/>
<Line type="monotone" dataKey="inc" stroke={GREEN} strokeWidth={2.5} dot={{r:3,fill:GREEN}} name={t.balance.income}/>
<Line type="monotone" dataKey="exp" stroke="#FF8A65" strokeWidth={2.5} dot={{r:3,fill:"#FF8A65"}} name={t.balance.expenses}/>
</LineChart> </ResponsiveContainer>
<div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
{[{c:GREEN,l:t.balance.income},{c:"#FF8A65",l:t.balance.expenses}].map(x=>( <div key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:GRAY}}> <div style={{width:12,height:3,borderRadius:2,background:x.c}}/>{x.l}
</div> ))}
</div>
</div>
<div className="card">
  <p style={{fontFamily:"DM Sans",fontSize:17,fontWeight:700,marginBottom:2}}>{lang==="nl"?"Gespaard per maand":"Saved per month"}</p>
  <p style={{fontSize:11,color:GRAY,marginBottom:14}}>{lang==="nl"?"Groen = meer gespaard dan uitgegeven":"Green = more income than expenses"}</p>
  <ResponsiveContainer width="100%" height={140}>
    <BarChart data={yearMonthData} barSize={20}>
      <XAxis dataKey="name" tick={{fill:"#AAA",fontSize:10}} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:"#CCC",fontSize:9}} axisLine={false} tickLine={false} width={36} tickFormatter={v=>`€${v/1000}k`}/>
      <Tooltip contentStyle={{fontFamily:"DM Sans",fontSize:11,borderRadius:10,border:"none",boxShadow:"0 4px 14px rgba(0,0,0,.1)"}} formatter={v=>fmt(v)} labelFormatter={l=>l}/>
      <Bar dataKey="balance" radius={[5,5,0,0]}>
        {yearMonthData.map((d,i)=><Cell key={i} fill={d.balance>=0?GREEN:RED}/>)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
    {[{c:GREEN,l:lang==="nl"?"Gespaard":"Saved"},{c:RED,l:lang==="nl"?"Tekort":"Deficit"}].map(x=>(
      <div key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:GRAY}}>
        <div style={{width:12,height:3,borderRadius:2,background:x.c}}/>{x.l}
      </div>
    ))}
  </div>
  <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <span style={{fontSize:12,color:GRAY,fontWeight:600}}>{lang==="nl"?"Totaal gespaard dit jaar":"Total saved this year"}</span>
    <span style={{fontSize:16,fontWeight:800,color:(yearIncome-yearExpenses)>=0?GREEN:RED}}>
      {(yearIncome-yearExpenses)>=0?"+":""}{fmt(yearIncome-yearExpenses)}
    </span>
  </div>
</div>
<div className="card"> <p style={{fontFamily:"DM Sans",fontSize:17,fontWeight:700,marginBottom:14}}>{t.home.yearExpensesCat}</p>
{yearByCategory.filter(c=>c.spent>0).map(c=>{ const pct=Math.min(c.budget>0?(c.spent/c.budget)*100:100,100);
  const over=c.budget>0&&c.spent>c.budget; return ( <div key={c.name} style={{marginBottom:14}}> <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}> <span style={{fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}><CatDot cat={c} size={18}/>{c.name}</span>
<span style={{fontSize:11,color:over?RED:GRAY}}>{fmt(c.spent)}{c.budget>0?<span style={{color:"#CCC"}}> / {fmt(c.budget)}</span>:""}</span>
</div>
<div className="track"><div className="fill" style={{width:`${pct}%`,background:over?RED:c.color}}/></div>
</div> ); })}
{yearByCategory.every(c=>c.spent===0) && <p style={{fontSize:13,color:GRAY}}>{t.home.noExpensesYear}</p>}
</div>
</> )}
</div> )}
{tab==="inkomsten" && ( <div style={{display:"flex",flexDirection:"column",gap:14}}> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}> <p style={{fontFamily:"DM Sans",fontSize:22,fontWeight:700}}>{t.income.title}</p>
{viewMode==="month" && <button className="pill pill-yellow pill-sm" onClick={()=>setShowIncomeModal(true)}>{t.income.addBtn}</button>}
</div>
<div className="card" style={{background:BLACK,color:WHITE,padding:"18px 22px"}}> <p style={{fontSize:11,color:"rgba(255,255,255,.65)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>
{viewMode==="month" ? `${t.income.totalMonth} ${t.months[month]}` : `${t.income.yearIncome} ${year}`}
</p>
<p style={{fontFamily:"DM Sans",fontSize:30,fontWeight:700,color:YELLOW}}>{fmt(curIncome)}</p>
{viewMode==="year" && <p style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:4}}>{t.income.avgPerMonth}
{fmt(Math.round(yearIncome/12))}/{t.income.perMonth}</p>}
</div>
{viewMode==="month" ? ( <>
<div className="card" style={{border:`2px solid ${YELLOW}`}}> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}> <div> <p style={{fontFamily:"DM Sans",fontSize:16,fontWeight:700}}>{t.income.fixedTitle}</p>
<p style={{fontSize:11,color:GRAY,marginTop:1}}>{t.income.fixedSub}</p>
</div>
<div style={{textAlign:"right"}}> <p style={{fontSize:18,fontWeight:700,color:GREEN}}>{fmt(fixedIncomeTotal)}</p>
<p style={{fontSize:10,color:GRAY}}>{lang==="nl"?"per maand":"per month"}</p>
</div> </div>
<div style={{height:1,background:"#F0F0F0",margin:"12px 0"}}/>
{fixedIncome.length===0 && <p style={{fontSize:13,color:GRAY,padding:"4px 0 8px"}}>{t.income.fixedNone}</p>}
{fixedIncome.map(item=>{ const isEd=editingFixed===item.id; return ( <div key={item.id} className="income-row"> <div style={{width:38,height:38,borderRadius:12,background:YELLOW+"33",display:"flex",alignItems:"center",justifyContent:"center",color:YELLOW,flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></div>
<div style={{flex:1}}> <div style={{display:"flex",alignItems:"center",gap:6}}> <p style={{fontSize:14,fontWeight:600}}>{item.source}</p>
<span style={{background:YELLOW,color:BLACK,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,letterSpacing:".04em"}}>{t.income.fixedBadge.toUpperCase()}</span>
</div>
<p style={{fontSize:11,color:GRAY}}>{lang==="nl"?"Alle maanden":"Every month"}</p>
</div>
{isEd ? ( <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",minWidth:140}}> <input style={{background:"#F7F7F7",border:"1.5px solid "+YELLOW,borderRadius:8,padding:"5px 10px",fontFamily:"inherit",fontSize:13,fontWeight:600,width:"100%",outline:"none"}} type="text" value={editFixedName} onChange={e=>setEditFixedName(e.target.value)} placeholder={lang==="nl"?"Naam…":"Name…"}/>
<div style={{display:"flex",alignItems:"center",gap:4,width:"100%"}}> <span style={{fontSize:12,color:GRAY}}>€</span>
<input ref={fixedRef} className="inline-input" style={{flex:1}} type="number" value={editFixedVal} onChange={e=>setEditFixedVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEditFixed(item.id);if(e.key==="Escape")setEditingFixed(null);}}/>
<button className="save-btn" onClick={()=>saveEditFixed(item.id)}>✓</button>
</div> </div> ) : ( <div style={{display:"flex",alignItems:"center",gap:4}}> <p style={{fontSize:15,fontWeight:700,color:GREEN}}>{fmt(item.amount)}</p>
<button className="icon-btn" onClick={()=>startEditFixed(item)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
<button className="icon-btn" onClick={()=>deleteFixed(item.id)} style={{color:RED}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
</div> )}
</div> ); })}
<button className="pill pill-yellow" style={{width:"100%",marginTop:12,fontSize:12,padding:"10px"}} onClick={()=>setShowFixedModal(true)}>{t.income.fixedAdd}</button>
</div>
<div className="card"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}> <p style={{fontFamily:"DM Sans",fontSize:16,fontWeight:700}}>{t.income.sourcesTitle} — {t.months[month]}</p>
<button className="pill pill-outline pill-sm" onClick={()=>setShowIncomeModal(true)}>{t.income.addBtn}</button>
</div>
{incListMonth.length===0 && <p style={{fontSize:13,color:GRAY,padding:"4px 0"}}>{t.income.noIncome}</p>}
{incListMonth.map(item=>{ const isEd=editingIncome===item.id; return ( <div key={item.id} className="income-row"> <div style={{width:38,height:38,borderRadius:12,background:YELLOW+"22",display:"flex",alignItems:"center",justifyContent:"center",color:YELLOW,flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14.5 9a3.5 2.5 0 1 0 0 5 3.5 2.5 0 0 0 0-5z" transform="translate(-2.5 0)"/><path d="M9.5 9v6"/></svg></div>
<div style={{flex:1}}> <p style={{fontSize:14,fontWeight:600}}>{item.source}</p>
<p style={{fontSize:11,color:GRAY}}>{t.months[month]}
{year}</p>
</div>
{isEd ? ( <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",minWidth:140}}> <input ref={editRef} style={{background:"#F7F7F7",border:`1.5px solid ${YELLOW}`,borderRadius:8,padding:"5px 10px",fontFamily:"inherit",fontSize:13,fontWeight:600,width:"100%",outline:"none"}} type="text" value={editIncomeName} onChange={e=>setEditIncomeName(e.target.value)} placeholder={lang==="nl"?"Omschrijving…":"Description…"}/>
<div style={{display:"flex",alignItems:"center",gap:4,width:"100%"}}> <span style={{fontSize:12,color:GRAY}}>€</span>
<input className="inline-input" style={{flex:1}} type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEditIncome(item.id);if(e.key==="Escape")setEditingIncome(null);}}/>
<button className="save-btn" onClick={()=>saveEditIncome(item.id)}>✓</button>
</div> </div> ) : ( <div style={{display:"flex",alignItems:"center",gap:4}}> <p style={{fontSize:15,fontWeight:700,color:GREEN}}>{fmt(item.amount)}</p>
<button className="icon-btn" onClick={()=>startEditIncome(item)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
<button className="icon-btn" onClick={()=>deleteIncome(item.id)} style={{color:RED}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
</div> )}
</div> ); })}
</div>
</> ) : ( <div className="card"> <p style={{fontFamily:"DM Sans",fontSize:16,fontWeight:700,marginBottom:14}}>{t.income.perMonthYear} — {year}</p>
{yearMonthData.map(d=>( <div key={d.month} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #F5F5F5",cursor:"pointer"}} onClick={()=>{setMonth(d.month);setViewMode("month");}}> <div style={{width:36,height:36,borderRadius:10,background:YELLOW+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}> <span style={{fontSize:11,fontWeight:700,color:BLACK}}>{d.name}</span>
</div>
<div style={{flex:1}}> <div className="track" style={{marginTop:0}}> <div className="fill" style={{width:yearIncome>0?`${(d.inc/yearIncome)*100}%`:"0%",background:YELLOW}}/>
</div> </div>
<p style={{fontSize:14,fontWeight:700,color:d.inc>0?GREEN:GRAY,minWidth:70,textAlign:"right"}}>{d.inc>0?fmt(d.inc):"-"}</p>
</div> ))}
</div> )}
</div> )}
{tab==="transacties" && ( <div style={{display:"flex",flexDirection:"column",gap:14}}>
<div className="card" style={{border:`2px solid #FF8A65`}}> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}> <div> <p style={{fontFamily:"DM Sans",fontSize:16,fontWeight:700}}>{t.transactions.fixedTitle}</p>
<p style={{fontSize:11,color:GRAY,marginTop:1}}>{t.transactions.fixedSub}</p>
</div>
<div style={{textAlign:"right"}}> <p style={{fontSize:18,fontWeight:700,color:RED}}>{fmt(fixedExpTotal)}</p>
<p style={{fontSize:10,color:GRAY}}>{lang==="nl"?"per maand":"per month"}</p>
</div> </div>
<div style={{height:1,background:"#F0F0F0",margin:"12px 0"}}/>
{fixedExpenses.length===0 && <p style={{fontSize:13,color:GRAY,padding:"4px 0 8px"}}>{t.transactions.fixedNone}</p>}
{fixedExpenses.map(item=>{ const cat=CATEGORIES.find(c=>c.name===item.category)||CATEGORIES[6]; const isEd=editingFixedExp===item.id; return ( <div key={item.id} className="income-row"> <CatDot cat={cat} size={38}/>
<div style={{flex:1}}> <div style={{display:"flex",alignItems:"center",gap:6}}> <p style={{fontSize:14,fontWeight:600}}>{item.desc}</p>
<span style={{background:"#FF8A65",color:WHITE,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,letterSpacing:".04em"}}>{t.transactions.fixedBadge.toUpperCase()}</span>
</div>
<p style={{fontSize:11,color:GRAY}}>{item.category} · {lang==="nl"?"Alle maanden":"Every month"}</p>
</div>
{isEd ? ( <div style={{display:"flex",alignItems:"center"}}> <span style={{fontSize:13,color:GRAY,marginRight:2}}>€</span>
<input ref={fixedExpRef} className="inline-input" type="number" value={editFixedExpVal} onChange={e=>setEditFixedExpVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEditFixedExp(item.id);if(e.key==="Escape")setEditingFixedExp(null);}}/>
<button className="save-btn" onClick={()=>saveEditFixedExp(item.id)}>✓</button>
</div> ) : ( <div style={{display:"flex",alignItems:"center",gap:4}}> <p style={{fontSize:15,fontWeight:700,color:RED}}>{fmt(item.amount)}</p>
<button className="icon-btn" onClick={()=>startEditFixedExp(item)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
<button className="icon-btn" onClick={()=>deleteFixedExp(item.id)} style={{color:RED}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
</div> )}
</div> ); })}
<button className="pill pill-dark" style={{width:"100%",marginTop:12,fontSize:12,padding:"10px"}} onClick={()=>setShowFixedExpModal(true)}>{t.transactions.fixedAdd}</button>
</div>
<div className="card" style={{border:"2px solid rgba(45,47,94,0.12)"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
    <div>
      <p style={{fontFamily:"DM Sans",fontSize:16,fontWeight:700}}>{lang==="nl"?"Variabele uitgaven":"Variable expenses"}</p>
      <p style={{fontSize:11,color:GRAY,marginTop:1}}>{viewMode==="month" ? `${t.months[month]} ${year}` : `${t.transactions.fullYear} ${year}`}</p>
    </div>
    <div style={{textAlign:"right"}}>
      <p style={{fontSize:18,fontWeight:700,color:RED}}>{fmt((viewMode==="month"?txListMonth:allYearTx).filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx.amount,0))}</p>
      <p style={{fontSize:10,color:GRAY}}>{viewMode==="month"?(lang==="nl"?"deze maand":"this month"):(lang==="nl"?"dit jaar":"this year")}</p>
    </div>
  </div>
  <div style={{height:1,background:"#F0F0F0",margin:"10px 0 14px"}}/>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <p style={{fontFamily:"DM Sans",fontSize:16,fontWeight:600}}>{viewMode==="month" ? `${t.months[month]} ${year}` : `${t.transactions.fullYear} ${year}`}</p>
    <button className="pill pill-yellow pill-sm" onClick={()=>{setTxModalMode("expense");setTxForm(f=>({...f,type:"expense"}));setShowTxModal(true);}}>
      {t.addBtn}
    </button>
  </div>
{(viewMode==="month"?[...txListMonth].sort((a,b)=>new Date(b.date)-new Date(a.date)):allYearTx).map(tx=>( <TxRow key={tx.id} t={tx} fmt={fmt} cats={CATEGORIES} editingTx={editingTx} editTxDesc={editTxDesc} editTxAmount={editTxAmount} setEditTxDesc={setEditTxDesc} setEditTxAmount={setEditTxAmount} onEdit={startEditTx} onSave={saveEditTx} onDelete={deleteTx} txEditRef={txEditRef} BLACK={BLACK} RED={RED} GRAY={GRAY}/> ))}
{(viewMode==="month"?txListMonth:allYearTx).length===0 && ( <p style={{fontSize:13,color:GRAY,padding:"10px 0"}}>{t.transactions.noTransactions}</p> )}
</div>
</div> )}
{tab==="budget" && ( <div style={{display:"flex",flexDirection:"column",gap:12}}> <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}> <p style={{fontFamily:"DM Sans",fontSize:22,fontWeight:700}}>{t.budget.title}</p>
<p style={{fontSize:11,color:GRAY}}>{fmt(viewMode==="month"?totalBudgetWithFixed:(() => { let s=0; for(let m=0;m<12;m++) s+=Object.values(getMonthBudgets(year,m)).reduce((a,v)=>a+(typeof v==="number"?v:0),0); return s; })()+fixedExpTotal*12)}{viewMode==="month"?t.budget.perMonth:t.budget.perYear}</p>
</div>
<div className="card" style={{background:BLACK,color:WHITE,padding:"16px 20px"}}> <p style={{fontSize:11,color:"rgba(255,255,255,.65)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{t.budget.spentVsBudget}</p>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}> <p style={{fontFamily:"DM Sans",fontSize:24,fontWeight:700,color:curExpenses>(viewMode==="month"?totalBudgetWithFixed:totalBudgetWithFixed*12)?"#FF6B6B":YELLOW}}>
{fmt(curExpenses)}
<span style={{fontSize:13,color:"rgba(255,255,255,.65)",fontFamily:"DM Sans"}}>/ {fmt(viewMode==="month"?totalBudgetWithFixed:(() => { let s=0; for(let m=0;m<12;m++) s+=Object.values(getMonthBudgets(year,m)).reduce((a,v)=>a+(typeof v==="number"?v:0),0); return s; })()+fixedExpTotal*12)}</span>
</p>
<div style={{width:50,height:50,borderRadius:"50%",border:`3px solid ${YELLOW}`,display:"flex",alignItems:"center",justifyContent:"center"}}> <span style={{fontSize:11,fontWeight:700,color:YELLOW}}>{Math.round((curExpenses/((viewMode==="month"?totalBudget:totalBudget*12)||1))*100)}%</span>
</div> </div>
</div>
{(()=>{ const catList = viewMode==="month"?byCategoryMonth:yearByCategory;
  const orderedList = catOrder ? catOrder.map(name=>catList.find(x=>x.name===name)).filter(Boolean) : catList; return ( <SortableList items={orderedList} onReorder={next=>setCatOrder(next.map(x=>x.name))} renderItem={(c)=>{ const pct=Math.min(c.budget>0?(c.spent/c.budget)*100:0,100);
  const over=c.budget>0&&c.spent>c.budget;
  const isEd=editingBudget===c.name;
  const isCustom=customCats.some(cc=>cc.name===c.name);
  const catBudget = monthBudgets[c.name] || 0; return ( <div style={{position:"relative",borderRadius:20,overflow:"hidden"}}>
<div style={{position:"absolute",inset:0,background:RED,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:22}}> <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
<span style={{fontSize:10,color:WHITE,fontWeight:700}}>{lang==="nl"?"Verwijder":"Delete"}</span>
</div> </div>
<SwipeCard onSwipeLeft={()=>setConfirmDelete(c)} style={{padding:"15px 17px",background:WHITE,borderRadius:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",cursor:"grab",userSelect:"none",touchAction:"pan-y"}} > <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}> <div style={{display:"flex",alignItems:"center",gap:10}}> <CatDot cat={c} size={48}/>
<div> <div style={{display:"flex",alignItems:"center",gap:6}}> <p style={{fontSize:14,fontWeight:600}}>{c.name}</p>
{isCustom && <span style={{background:YELLOW,color:BLACK,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,letterSpacing:".04em"}}>{lang==="nl"?"EIGEN":"CUSTOM"}</span>}
</div>
<p style={{fontSize:11,color:GRAY}}>{t.budget.spent}
{fmt(c.spent)}</p>
</div> </div>
<div style={{display:"flex",alignItems:"center",gap:4}}>
<div style={{textAlign:"right"}}>
  <button onClick={e=>{e.stopPropagation();setNumpadCat(c);setNumpadVal(String(budgets[c.name]||0));setShowNumpad(true);}}
    style={{background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"right"}}>
    <p style={{fontSize:15,fontWeight:700,color:over?RED:BLACK}}>{fmt(c.budget)}</p>
    <p style={{fontSize:10,color:over?RED:GRAY}}>
      {c.budget>0?(over?`${fmt(c.spent-c.budget)} ${t.budget.tooMuch}`:`${fmt(c.budget-c.spent)} ${t.budget.left}`):`${lang==="nl"?"Tik om in te stellen":"Tap to set"}`}
    </p>
  </button>
</div>
</div>
</div>
<div className="track"><div className="fill" style={{width:`${pct}%`,background:over?RED:c.color}}/></div>
<div style={{display:"flex",justifyContent:"flex-end",marginTop:3}}> <span style={{fontSize:10,color:over?RED:GRAY,fontWeight:600}}>{c.budget>0?`${Math.round(pct)}%`:"—"}</span>
</div> </SwipeCard>
</div> ); }} /> ); })()}

{showNumpad && numpadCat && (
  <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:isDark?"rgba(0,0,0,0.6)":"rgba(45,47,94,0.5)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:99999}}
    onClick={()=>setShowNumpad(false)}>
    <div style={{background:theme.WHITE,borderRadius:"28px 28px 0 0",padding:"20px 24px max(28px,env(safe-area-inset-bottom))",width:"100%",maxWidth:480,maxHeight:"90dvh",overflowY:"auto",border:`1px solid ${theme.CARD_BORDER}`,boxShadow:"0 -10px 40px rgba(0,0,0,0.25)"}}
      onClick={e=>e.stopPropagation()}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <CatDot cat={numpadCat} size={40}/>
          <div>
            <p style={{fontSize:16,fontWeight:700,color:BLACK}}>{numpadCat.name}</p>
            <p style={{fontSize:11,color:GRAY}}>{lang==="nl"?"Budget instellen":"Set budget"}</p>
          </div>
        </div>
        <button onClick={()=>setShowNumpad(false)} style={{background:isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:BLACK,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Big amount input */}
      <div style={{background:isDark?"rgba(255,255,255,0.08)":"rgba(45,47,94,0.08)",borderRadius:20,padding:"22px 20px",textAlign:"center",marginBottom:18}}>
        <p style={{fontSize:11,color:GRAY,marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>{lang==="nl"?"Bedrag":"Amount"}</p>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:4}}>
          <span style={{fontSize:36,fontWeight:800,color:BLACK,letterSpacing:"-1.5px"}}>€</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            value={numpadVal==="0"?"":numpadVal}
            placeholder="0"
            onChange={e=>{
              const v = e.target.value.replace(/[^0-9]/g,"");
              setNumpadVal(v===""?"0":v.replace(/^0+/,"")||"0");
            }}
            style={{
              background:"transparent",
              border:"none",
              outline:"none",
              fontFamily:"inherit",
              fontSize:48,
              fontWeight:800,
              color:BLACK,
              letterSpacing:"-2px",
              lineHeight:1,
              width:"auto",
              minWidth:60,
              maxWidth:"70%",
              textAlign:"center",
              padding:0,
            }}
          />
        </div>
        {numpadCat.spent>0 && <p style={{fontSize:11,color:GRAY,marginTop:10}}>{lang==="nl"?"Uitgegeven":"Spent"}: {fmt(numpadCat.spent)}</p>}
      </div>

      {/* Quick amounts */}
      <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
        {[50,100,200,300,500,1000].map(v=>(
          <button key={v} onClick={()=>{haptic.select();setNumpadVal(String(v));}}
            style={{flex:"1 1 calc(33% - 8px)",padding:"12px 0",background:parseInt(numpadVal)===v?BLACK:(isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"),color:parseInt(numpadVal)===v?theme.WHITE:BLACK,border:"none",borderRadius:50,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
            €{v}
          </button>
        ))}
      </div>

      {/* Save button */}
      <button onClick={()=>{
        const val = parseInt(numpadVal)||0;
        setMonthBudget(numpadCat.name, val);
        setShowNumpad(false);
        haptic.success();
      }}
        style={{width:"100%",padding:"16px",background:BLACK,color:theme.WHITE,border:"none",borderRadius:50,fontFamily:"inherit",fontSize:16,fontWeight:700,cursor:"pointer"}}>
        {lang==="nl"?"Opslaan":"Save"} · €{(parseInt(numpadVal)||0).toLocaleString("nl-NL")}
      </button>
    </div>
  </div>
)}
{confirmDelete && ( <div style={{position:"fixed",inset:0,background:"rgba(45,47,94,0.25)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"20px"}} onClick={()=>setConfirmDelete(null)}> <div style={{background:"rgba(255,255,255,0.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.7)",borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:380}} onClick={e=>e.stopPropagation()}> <div style={{display:"flex",justifyContent:"center",marginBottom:16}}> <div style={{width:52,height:52,borderRadius:"50%",background:RED+"18",display:"flex",alignItems:"center",justifyContent:"center"}}> <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
</div> </div>
<p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:700,textAlign:"center",marginBottom:8}}>
{lang==="nl"?"Categorie verwijderen?":"Delete category?"}
</p>
<p style={{fontSize:13,color:GRAY,textAlign:"center",marginBottom:24}}> <strong style={{color:BLACK}}>{confirmDelete.name}</strong>
<br/>
{lang==="nl"?"Dit kan niet ongedaan worden gemaakt.":"This cannot be undone."}
</p>
<div style={{display:"flex",gap:10}}> <button className="pill pill-outline" style={{flex:1,padding:"13px"}} onClick={()=>setConfirmDelete(null)}>
{lang==="nl"?"Annuleren":"Cancel"}
</button>
<button style={{flex:1,padding:"13px",background:RED,color:WHITE,border:"none",borderRadius:50,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={()=>{ deleteAnyCategory(confirmDelete); setConfirmDelete(null); }}>
{lang==="nl"?"Verwijderen":"Delete"}
</button>
</div> </div>
</div> )}
<button className="pill pill-yellow" style={{width:"100%",fontSize:13,padding:"12px"}} onClick={()=>setShowCatModal(true)}>
{t.budget.addCat}
</button>
<button className="pill pill-outline" style={{alignSelf:"center",fontSize:12}} onClick={()=>{setBudgets(DEFAULT_BUDGETS);setEditingBudget(null);setHiddenCats(new Set());setCustomCats([]);}}>
{t.budget.resetBtn}
</button>
</div> )}
</div>
<div style={{position:"fixed",bottom:0,left:0,right:0,background:isDark?"rgba(30,32,60,0.85)":"rgba(255,255,255,0.7)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",paddingTop:8,paddingBottom:"max(16px, env(safe-area-inset-bottom))",borderTop:`1px solid ${theme.CARD_BORDER}`,display:showNumpad?"none":"flex",justifyContent:"space-around",zIndex:100}}>
{navTabs.map(item=>{ const active = tab===item.id; return ( <button key={item.id} onClick={()=>{haptic.select();setTab(item.id);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",padding:"0 12px"}}>
{NAV_ICONS[item.id](active, isDark)}
<span style={{fontSize:10,fontWeight:700,color:active?BLACK:(isDark?"#9D9DB0":"#6B6B7A"),textTransform:"uppercase",letterSpacing:".06em"}}>{item.label}</span>
{active && <div style={{width:16,height:2.5,background:YELLOW,borderRadius:2,marginTop:0}}/>}
</button> ); })}
</div>
{showTxModal && ( <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowTxModal(false)}> <div className="sheet"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}> <p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:700}}>{t.txModal.title}</p>
<button onClick={()=>setShowTxModal(false)} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
</div>
{txModalMode==="both" && ( <div style={{display:"flex",background:"#F3F3F3",borderRadius:14,padding:4,marginBottom:18}}>
{["expense","income"].map(type=>( <button key={type} onClick={()=>setTxForm(f=>({...f,type}))} style={{flex:1,padding:"9px 0",border:"none",borderRadius:11,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer", background:txForm.type===type?(type==="expense"?BLACK:YELLOW):"transparent", color:txForm.type===type?(type==="expense"?WHITE:BLACK):GRAY,transition:"all .18s"}}>
{type==="expense"?t.txModal.expense:t.txModal.income}
</button> ))}
</div> )}
<div style={{marginBottom:13}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.txModal.desc}</label>
<input type="text" placeholder={t.txModal.descPh} value={txForm.desc} onChange={e=>setTxForm(p=>({...p,desc:e.target.value}))}/>
{txForm.type==="expense" && ( <div style={{marginTop:10}}> <p style={{fontSize:10,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>{t.txModal.quickLabel}</p>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{t.quickPicks.map(q=>( <button key={q.label} onClick={()=>{haptic.select();setTxForm(p=>({...p, desc:q.label, category:q.cat}));}} style={{ background: txForm.desc===q.label ? BLACK : "#F3F3F3", color: txForm.desc===q.label ? WHITE : BLACK, border:"none", borderRadius:50, padding:"6px 12px", fontSize:12, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"all .15s", fontWeight:500, }}> <span>{q.icon}</span>{q.label}
</button> ))}
</div>
</div> )}
</div>
{[ {label:t.txModal.amount, key:"amount", type:"number", ph:t.txModal.amountPh}, 
{label:t.txModal.date, key:"date", type:"date"}, ].map(f=>( <div key={f.key} style={{marginBottom:13}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{f.label}</label>
<input type={f.type} placeholder={f.ph} value={txForm[f.key]} onChange={e=>setTxForm(p=>({...p,[f.key]:e.target.value}))}/>
</div> ))}
{txForm.type==="expense" && ( <div style={{marginBottom:20}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.txModal.category}</label>
<select value={txForm.category} onChange={e=>setTxForm(p=>({...p,category:e.target.value}))}>
{CATEGORIES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
</select>
</div> )}
<button className="pill pill-yellow" style={{width:"100%",padding:"14px",fontSize:14}} onClick={addTx}>{t.txModal.addBtn}</button>
</div> </div> )}
{showIncomeModal && ( <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowIncomeModal(false)}> <div className="sheet"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}> <p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:700}}>{t.incomeModal.title}</p>
<button onClick={()=>setShowIncomeModal(false)} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
</div>
<p style={{fontSize:12,color:GRAY,marginBottom:16}}>{t.incomeModal.sourceFor}
<strong>{t.months[month]}
{year}</strong></p>
<div style={{marginBottom:13}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.incomeModal.source}</label>
<input type="text" placeholder={t.incomeModal.sourcePh} value={incomeForm.source} onChange={e=>setIncomeForm(p=>({...p,source:e.target.value}))}/>
<div style={{marginTop:10}}> <p style={{fontSize:10,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>{t.incomeModal.quickLabel}</p>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{t.incomeQuickPicks.map(q=>( <button key={q.label} onClick={()=>{haptic.select();setIncomeForm(p=>({...p,source:q.label}));}} style={{ background: incomeForm.source===q.label ? BLACK : "#F3F3F3", color: incomeForm.source===q.label ? WHITE : BLACK, border:"none", borderRadius:50, padding:"6px 12px", fontSize:12, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s", fontWeight:500, }}>
{chipIcon(q.ik, incomeForm.source===q.label)}{q.label}
</button> ))}
</div>
</div> </div>
<div style={{marginBottom:20}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.incomeModal.amount}</label>
<input type="number" placeholder={t.incomeModal.amountPh} value={incomeForm.amount} onChange={e=>setIncomeForm(p=>({...p,amount:e.target.value}))}/>
</div>
<button className="pill pill-yellow" style={{width:"100%",padding:"14px",fontSize:14}} onClick={addIncome}>{t.incomeModal.saveBtn}</button>
</div> </div> )}
{showFixedExpModal && ( <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowFixedExpModal(false)}> <div className="sheet"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}> <div> <p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:700}}>{t.transactions.fixedModal}</p>
<p style={{fontSize:12,color:GRAY,marginTop:3}}>{t.transactions.fixedSub}</p>
</div>
<button onClick={()=>setShowFixedExpModal(false)} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
</div>
<div style={{marginBottom:16}}> <p style={{fontSize:10,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>{lang==="nl"?"Snelkeuze":"Quick pick"}</p>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{(lang==="nl" ? [ {label:"Huur/Hypotheek", ik:"home2", cat:"Wonen"}, 
{label:"Elektriciteit", ik:"bolt", cat:"Divers"}, 
{label:"Water", ik:"droplet", cat:"Divers"}, 
{label:"Verzekering", ik:"shield", cat:"Vaste lasten"}, 
{label:"Autoverzekering", ik:"car2", cat:"Transport"}, 
{label:"Pechverzekering", ik:"tool", cat:"Transport"}, 
{label:"Fitness", ik:"dumbbell", cat:"Gezondheid"}, 
{label:"Kinderopvang", ik:"baby", cat:"Overig"}, 
{label:"Telefoon", ik:"phone", cat:"Divers"}, 
{label:"Internet", ik:"wifi", cat:"Divers"}, 
{label:"Netflix", ik:"film", cat:"Vrije tijd"}, 
{label:"Spotify", ik:"music", cat:"Vrije tijd"}, ] : [ {label:"Rent/Mortgage", ik:"home2", cat:"Housing"}, 
{label:"Electricity", ik:"bolt", cat:"Utilities"}, 
{label:"Water", ik:"droplet", cat:"Utilities"}, 
{label:"Insurance", ik:"shield", cat:"Utilities"}, 
{label:"Car insurance", ik:"car2", cat:"Transport"}, 
{label:"Breakdown cover", ik:"tool", cat:"Transport"}, 
{label:"Gym/Fitness", ik:"dumbbell", cat:"Health"}, 
{label:"Childcare", ik:"baby", cat:"Other"}, 
{label:"Phone", ik:"phone", cat:"Utilities"}, 
{label:"Internet", ik:"wifi", cat:"Utilities"}, 
{label:"Netflix", ik:"film", cat:"Entertainment"}, 
{label:"Spotify", ik:"music", cat:"Entertainment"}, ]).map(q=>( <button key={q.label} onClick={()=>{haptic.select();setFixedExpForm(p=>({...p,desc:q.label,category:q.cat}));}} style={{ background: fixedExpForm.desc===q.label ? BLACK : "#F3F3F3", color: fixedExpForm.desc===q.label ? WHITE : BLACK, border:"none", borderRadius:50, padding:"6px 12px", fontSize:12, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s", fontWeight:500, }}>
{chipIcon(q.ik, fixedExpForm.desc===q.label)}{q.label}
</button> ))}
</div>
</div>
<div style={{height:1,background:"#F0F0F0",marginBottom:16}}/>
<div style={{marginBottom:13}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.transactions.fixedNameLbl}</label>
<input type="text" placeholder={t.transactions.fixedNamePh} value={fixedExpForm.desc} onChange={e=>setFixedExpForm(p=>({...p,desc:e.target.value}))}/>
</div>
<div style={{marginBottom:13}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.transactions.fixedAmtLbl}</label>
<input type="number" placeholder="0,00" value={fixedExpForm.amount} onChange={e=>setFixedExpForm(p=>({...p,amount:e.target.value}))}/>
</div>
<div style={{marginBottom:22}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.transactions.fixedCatLbl}</label>
<select value={fixedExpForm.category} onChange={e=>setFixedExpForm(p=>({...p,category:e.target.value}))}>
{CATEGORIES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
</select>
</div>
<div style={{background:"#FF8A6511",border:"1.5px solid #FF8A65",borderRadius:12,padding:"12px 14px",marginBottom:20,fontSize:12,color:BLACK}}> <span style={{display:"flex",alignItems:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,flexShrink:0,verticalAlign:"middle"}}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>{lang==="nl" ? "Dit bedrag wordt automatisch bij elke maand opgeteld." : "This amount is automatically added to every month."}</span>
</div>
<button className="pill pill-dark" style={{width:"100%",padding:"14px",fontSize:14}} onClick={addFixedExp}>{t.transactions.fixedSaveBtn}</button>
</div> </div> )}
{showCatModal && ( <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCatModal(false)}> <div className="sheet"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}> <p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:700}}>{t.budget.addCatTitle}</p>
<button onClick={()=>setShowCatModal(false)} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
</div>
<div style={{marginBottom:16}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6}}>{t.budget.addCatNameLbl}</label>
<input type="text" placeholder={t.budget.addCatNamePh} value={catForm.name} onChange={e=>setCatForm(p=>({...p,name:e.target.value}))}/>
</div>
<div style={{marginBottom:16}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:8}}>{t.budget.addCatColor}</label>
<div style={{display:"flex",flexWrap:"wrap",gap:8}}>
{["#F9C22E","#E87040","#4A90D9","#4CAF7D","#9B59B6","#D45A8A","#2AACBF","#E74C3C","#43A047","#FF7043","#00ACC1","#7B1FA2","#F06292","#8D6E63","#607D8B"].map(col=>( <button key={col} onClick={()=>setCatForm(p=>({...p,color:col}))} style={{width:30,height:30,borderRadius:"50%",background:col,border:catForm.color===col?`3px solid ${BLACK}`:"3px solid transparent",cursor:"pointer",transition:"all .15s"}}/> ))}
</div>
</div>
<div style={{marginBottom:22}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:8}}>{t.budget.addCatIcon}</label>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{Object.keys(ICONS).map(key=>( <button key={key} onClick={()=>setCatForm(p=>({...p,iconKey:key}))} style={{width:38,height:38,borderRadius:10, background:catForm.iconKey===key?BLACK:"#F3F3F3", border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center", color:catForm.iconKey===key?WHITE:BLACK,transition:"all .15s"}}>
{ICONS[key](catForm.iconKey===key?WHITE:catForm.color)}
</button> ))}
</div>
</div>
{catForm.name && ( <div style={{display:"flex",alignItems:"center",gap:10,background:"#F7F7F7",borderRadius:12,padding:"12px 14px",marginBottom:18}}> <CatDot cat={{iconKey:catForm.iconKey,color:catForm.color}}/>
<p style={{fontSize:14,fontWeight:600}}>{catForm.name}</p>
</div> )}
<button className="pill pill-yellow" style={{width:"100%",padding:"14px",fontSize:14}} onClick={addCustomCat}>{t.budget.addCatSave}</button>
</div> </div> )}

{showSettings && (
  <div className="overlay" onClick={e=>e.target===e.currentTarget&&(setShowSettings(false),setConfirmReset(false))}>
    <div className="sheet">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <p style={{fontFamily:"DM Sans",fontSize:22,fontWeight:800,color:BLACK}}>
          {lang==="nl"?"Instellingen":"Settings"}
        </p>
        <button onClick={()=>{setShowSettings(false);setConfirmReset(false);}} style={{background:theme.INPUT_BG,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,color:BLACK}}>×</button>
      </div>

      <div style={{marginBottom:28}}>
        <p style={{fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>
          {lang==="nl"?"Uiterlijk":"Appearance"}
        </p>
        <div style={{display:"flex",gap:8,background:theme.INPUT_BG,borderRadius:14,padding:4}}>
          {[
            {id:"light", nl:"Licht", en:"Light", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>},
            {id:"dark", nl:"Donker", en:"Dark", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>},
            {id:"auto", nl:"Auto", en:"Auto", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>},
          ].map(opt=>(
            <button key={opt.id} onClick={()=>{setThemePref(opt.id);haptic.select();}}
              style={{flex:1,padding:"12px 8px",border:"none",borderRadius:11,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",background:themePref===opt.id?theme.WHITE:"transparent",color:themePref===opt.id?BLACK:GRAY,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.18s",boxShadow:themePref===opt.id?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>
              {opt.icon}
              <span>{lang==="nl"?opt.nl:opt.en}</span>
            </button>
          ))}
        </div>
        {themePref==="auto" && (
          <p style={{fontSize:11,color:GRAY,marginTop:8,textAlign:"center"}}>
            {lang==="nl"?`Nu: ${systemDark?"donker":"licht"} (volgt systeem)`:`Now: ${systemDark?"dark":"light"} (follows system)`}
          </p>
        )}
      </div>

      <div style={{marginBottom:28}}>
        <p style={{fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>
          {lang==="nl"?"Taal":"Language"}
        </p>
        <div style={{display:"flex",gap:8,background:theme.INPUT_BG,borderRadius:14,padding:4}}>
          {[{id:"nl",label:"Nederlands"},{id:"en",label:"English"}].map(l=>(
            <button key={l.id} onClick={()=>{switchLang(l.id);haptic.select();}}
              style={{flex:1,padding:"12px 8px",border:"none",borderRadius:11,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",background:lang===l.id?theme.WHITE:"transparent",color:lang===l.id?BLACK:GRAY,transition:"all 0.18s",boxShadow:lang===l.id?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:24,padding:"14px 16px",background:theme.INPUT_BG,borderRadius:14,display:"flex",gap:12,alignItems:"flex-start"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div>
          <p style={{fontSize:13,fontWeight:700,color:BLACK,marginBottom:3}}>
            {lang==="nl"?"Jouw data blijft van jou":"Your data stays yours"}
          </p>
          <p style={{fontSize:12,color:GRAY,lineHeight:1.4}}>
            {lang==="nl"?"Alles wordt lokaal op je toestel opgeslagen. Er wordt niets naar servers verstuurd.":"Everything is stored locally on your device. Nothing is sent to any servers."}
          </p>
        </div>
      </div>

      <div>
        <p style={{fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>
          {lang==="nl"?"Gevarenzone":"Danger zone"}
        </p>
        {!confirmReset ? (
          <button onClick={()=>setConfirmReset(true)} style={{width:"100%",padding:"14px",background:"transparent",color:RED,border:`1.5px solid ${RED}`,borderRadius:14,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {lang==="nl"?"🗑 Alle data wissen":"🗑 Erase all data"}
          </button>
        ) : (
          <div style={{border:`1.5px solid ${RED}`,borderRadius:14,padding:16,background:"rgba(231,76,60,0.06)"}}>
            <p style={{fontSize:13,fontWeight:700,color:BLACK,marginBottom:6}}>
              {lang==="nl"?"Weet je het zeker?":"Are you sure?"}
            </p>
            <p style={{fontSize:12,color:GRAY,marginBottom:12,lineHeight:1.4}}>
              {lang==="nl"?"Alle transacties, budgetten en instellingen worden gewist. Dit kan niet ongedaan worden gemaakt.":"All transactions, budgets and settings will be erased. This cannot be undone."}
            </p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmReset(false)} style={{flex:1,padding:"12px",background:theme.INPUT_BG,color:BLACK,border:"none",borderRadius:12,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {lang==="nl"?"Annuleren":"Cancel"}
              </button>
              <button onClick={resetAllData} style={{flex:1,padding:"12px",background:RED,color:"#FFF",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {lang==="nl"?"Ja, wissen":"Yes, erase"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{showFixedModal && ( <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowFixedModal(false)}> <div className="sheet"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}> <div> <p style={{fontFamily:"DM Sans",fontSize:20,fontWeight:700}}>{t.income.fixedModal}</p>
<p style={{fontSize:12,color:GRAY,marginTop:3}}>{t.income.fixedSub}</p>
</div>
<button onClick={()=>setShowFixedModal(false)} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
</div>
<div style={{marginBottom:14}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.income.fixedNameLbl}</label>
<input type="text" placeholder={t.income.fixedNamePh} value={fixedForm.source} onChange={e=>setFixedForm(p=>({...p,source:e.target.value}))}/>
<div style={{marginTop:10}}> <p style={{fontSize:10,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>{t.income.fixedQuickLabel}</p>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{t.fixedIncomeQuickPicks.map(q=>( <button key={q.label} onClick={()=>{haptic.select();setFixedForm(p=>({...p,source:q.label}));}} style={{ background: fixedForm.source===q.label ? BLACK : "#F3F3F3", color: fixedForm.source===q.label ? WHITE : BLACK, border:"none", borderRadius:50, padding:"6px 12px", fontSize:12, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s", fontWeight:500, }}>
{chipIcon(q.ik, fixedForm.source===q.label)}{q.label}
</button> ))}
</div>
</div> </div>
<div style={{marginBottom:22}}> <label style={{fontSize:11,fontWeight:600,color:GRAY,textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5}}>{t.income.fixedAmtLbl}</label>
<input type="number" placeholder="0,00" value={fixedForm.amount} onChange={e=>setFixedForm(p=>({...p,amount:e.target.value}))}/>
</div>
<div style={{background:YELLOW+"22",border:`1.5px solid ${YELLOW}`,borderRadius:12,padding:"12px 14px",marginBottom:20,fontSize:12,color:BLACK}}> <span style={{display:"flex",alignItems:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,flexShrink:0,verticalAlign:"middle"}}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>{lang==="nl" ? "Dit bedrag wordt automatisch bij elke maand opgeteld." : "This amount is automatically added to every month."}</span>
</div>
<button className="pill pill-yellow" style={{width:"100%",padding:"14px",fontSize:14}} onClick={addFixed}>{t.income.fixedSaveBtn}</button>
</div> </div> )}
</div> );

}

function SortableList({ items, onReorder, renderItem, gap = 12 }) {
  const [order, setOrder] = useState(items.map(i => i.name));
  const [animIdx, setAnimIdx] = useState(null);
  const [animDir, setAnimDir] = useState(0);

  useEffect(() => {
    setOrder(prev => {
      const names = items.map(i => i.name);
      const kept = prev.filter(n => names.includes(n));
      const added = names.filter(n => !prev.includes(n));
      return [...kept, ...added];
    });
  }, [items.map(i => i.name).join(",")]);

  const list = order.map(name => items.find(i => i.name === name)).filter(Boolean);

  const move = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return;
    setAnimIdx(idx);
    setAnimDir(dir);
    setTimeout(() => {
      const next = [...order];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      setOrder(next);
      onReorder(next.map(n => items.find(i => i.name === n)).filter(Boolean));
      setAnimIdx(null);
      setAnimDir(0);
    }, 160);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {list.map((item, idx) => {
        const isMoving = animIdx === idx;
        const ty = isMoving ? animDir * -8 : 0;
        return (
          <div key={item.name} style={{
            transform: `translateY(${ty}px) scale(${isMoving ? 1.01 : 1})`,
            transition: isMoving ? "transform 0.16s cubic-bezier(.34,1.56,.64,1)" : "transform 0.18s ease",
            position: "relative",
          }}>
            {renderItem(item, idx)}
            {idx < list.length - 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 16, gap: 4, height: 16, alignItems: "center" }}>
                <button onClick={e => { e.stopPropagation(); move(idx + 1, -1); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", opacity: 0.4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button onClick={e => { e.stopPropagation(); move(idx, 1); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", opacity: 0.4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SwipeCard({ onSwipeLeft, children, style = {} }) {
  const startX = useRef(null);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const THRESHOLD = 55;

  const start = x => { startX.current = x; dragging.current = true; };
  const move = x => {
    if (!dragging.current || startX.current === null) return;
    const dx = startX.current - x;
    if (dx > 0) setOffset(Math.min(dx, 85));
    else setOffset(0);
  };
  const end = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (offset >= THRESHOLD) {
      setOffset(0);
      setTimeout(() => onSwipeLeft(), 200);
    } else {
      setOffset(0);
    }
    startX.current = null;
  };
  const cancel = () => {
    if (dragging.current) { dragging.current = false; setOffset(0); startX.current = null; }
  };

  return (
    <div style={{
      ...style,
      transform: `translateX(-${offset}px)`,
      transition: dragging.current ? "none" : "transform 0.22s ease",
    }}
      onTouchStart={e => start(e.touches[0].clientX)}
      onTouchMove={e => { e.stopPropagation(); move(e.touches[0].clientX); }}
      onTouchEnd={end}
      onTouchCancel={cancel}
      onMouseDown={e => { e.preventDefault(); start(e.clientX); }}
      onMouseMove={e => { if (dragging.current) move(e.clientX); }}
      onMouseUp={end}
      onMouseLeave={cancel}
    >
      {children}
    </div>
  );
}

function TxRow({ t, fmt, cats, editingTx, editTxDesc, editTxAmount, setEditTxDesc, setEditTxAmount, onEdit, onSave, onDelete, txEditRef }) {
  const cat = cats.find(c => c.name === t.category) || cats[cats.length - 1];
  const isEd = editingTx === t.id;

  if (isEd) {
    return (
      <div className="tx-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, paddingTop: 14, paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CatDot cat={cat} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <input ref={txEditRef}
              style={{ background: "#F7F7F7", border: "1.5px solid #F9C22E", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, width: "100%", outline: "none" }}
              type="text" value={editTxDesc} onChange={e => setEditTxDesc(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: GRAY }}>€</span>
              <input style={{ background: "#F7F7F7", border: "1.5px solid #F9C22E", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, flex: 1, outline: "none" }}
                type="number" value={editTxAmount} onChange={e => setEditTxAmount(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onSave(t.id); if (e.key === "Escape") onEdit(null); }} />
              <button onClick={() => onSave(t.id)}
                style={{ background: BLACK, color: WHITE, border: "none", borderRadius: 8, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓</button>
              <button onClick={() => onEdit(null)}
                style={{ background: "#F0F0F0", color: GRAY, border: "none", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tx-row">
      <CatDot cat={cat} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</p>
        <p style={{ fontSize: 11, color: "#AAA", marginTop: 1 }}>{t.date} · {t.category}</p>
      </div>
      {onEdit ? (
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? GREEN : BLACK, marginRight: 4 }}>
            {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
          </p>
          <button className="icon-btn" onClick={() => onEdit(t)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button className="icon-btn" onClick={() => onDelete(t.id)} style={{ color: RED }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? GREEN : BLACK, flexShrink: 0 }}>
          {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
        </p>
      )}
    </div>
  );
}
