import { useState, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";

let Haptics = null;
/* Capacitor haptics - only available in native iOS/Android builds */
try {
  const cap = window?.Capacitor;
  if (cap?.isNativePlatform?.()) {
    import("@capacitor/haptics").then(m => { Haptics = m?.Haptics ?? null; }).catch(()=>{});
  }
} catch(e) {}
const haptic = {
  light:   () => Haptics?.impact({ style: "LIGHT" }),
  medium:  () => Haptics?.impact({ style: "MEDIUM" }),
  success: () => Haptics?.notification({ type: "SUCCESS" }),
  warning: () => Haptics?.notification({ type: "WARNING" }),
  select:  () => Haptics?.selectionChanged(),
};

const YELLOW = "#7B85B8";
const YELLOW_DARK = "#5C6690";
const CREAM = "#F0F1F8";
const BLACK = "#2D2F5E";
const GRAY = "#888";
const WHITE = "#FFFFFF";
const GREEN = "#2ECC71";
const RED = "#E74C3C";

const T = {
  nl: {
    months: ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"],
    categories: ["Boodschappen","Eten & Drinken","Vrije tijd","Gezondheid","Uitstapjes","Vakantie","Kleding","Brandstof","Transport","Divers"],
    defaultCat: "Boodschappen",
    currency: v => "€" + Math.abs(v).toLocaleString("nl-NL", {minimumFractionDigits:2, maximumFractionDigits:2}),
    addBtn: "+ Voeg toe",
    toggle: { month: "Maand", year: "Jaar" },
    nav: { home: "Home", inkomsten: "Inkomsten", transacties: "Uitgaven", budget: "Budget" },
    greeting: name => `Hallo, ${name}! 👋`,
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
    greeting: name => `Hey, ${name}! 👋`,
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
  home: a => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#2D2F5E":"#BBBBBB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  inkomsten: a => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#2D2F5E":"#BBBBBB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  transacties: a => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#2D2F5E":"#BBBBBB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  budget: a => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#2D2F5E":"#BBBBBB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
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
        <img src="data:image/webp;base64,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" alt="karretje" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}/>
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
        <img src="data:image/webp;base64,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" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",opacity:0.55}}/>
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
          <button onClick={()=>{if(welcomeStep===0){setScreen("app");}else{setWelcomeStep(s=>s+1);}}}
            style={{background:"none",border:"none",fontFamily:"inherit",fontSize:13,color:"rgba(45,47,94,0.45)",cursor:"pointer",padding:"4px",textDecoration:"underline"}}>
            {lang==="nl"?"Overslaan":"Skip"}
          </button>
        </div>
      </div>
    );
  }

return ( <div
style={{height:"100dvh",background:"#D4C5E8",fontFamily:"DM Sans",color:BLACK,display:"flex",flexDirection:"column",overflow:"hidden"}}> 
<style>{` @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;overflow:hidden;}
.card{background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:20px;padding:16px;box-shadow:0 4px 20px rgba(45,47,94,0.1);border:1px solid rgba(255,255,255,0.7);}
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
input,select{background:#F7F7F7;border:1.5px solid #EBEBEB;color:${BLACK};border-radius:12px;padding:11px 14px;font-family:inherit;font-size:13px;width:100%;outline:none;transition:border-color .2s;}
input:focus,select:focus{border-color:${YELLOW};background:${WHITE};}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.38);display:flex;align-items:flex-end;justify-content:center;z-index:200;}
.sheet{background:${WHITE};border-radius:28px 28px 0 0;padding:28px 24px max(36px, calc(20px + env(safe-area-inset-bottom)));width:100%;max-width:500px;max-height:90dvh;overflow-y:auto;}
.tx-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #F3F3F3;}
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
<div style={{flexShrink:0}}>
<div style={{background:"#BCC3DD",padding:"10px 16px 16px",borderRadius:"0 0 28px 28px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}> <div style={{display:"flex",gap:6,alignItems:"center"}}> <div className="lang-toggle"> <button className={`lt-btn ${lang==="nl"?"active":"inactive"}`} onClick={()=>switchLang("nl")}>NL</button>
<button className={`lt-btn ${lang==="en"?"active":"inactive"}`} onClick={()=>switchLang("en")}>EN</button>
</div>
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
  const saved = curBalance;
  const savingsPct = curIncome > 0 ? Math.round((saved/curIncome)*100) : 0;
  const isPos = saved >= 0;
  return (
    <div className="card" style={{padding:"18px 20px"}}>
      <p style={{fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>
        {lang==="nl"?"Gespaard deze maand":"Saved this month"}
      </p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <p style={{fontSize:30,fontWeight:800,color:isPos?GREEN:RED,lineHeight:1}}>
          {isPos?"+":""}{fmt(saved)}
        </p>
        <div style={{background:isPos?"rgba(46,204,113,0.12)":"rgba(255,107,107,0.12)",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
          <p style={{fontSize:22,fontWeight:800,color:isPos?GREEN:RED,lineHeight:1}}>{savingsPct}%</p>
          <p style={{fontSize:9,color:GRAY,fontWeight:600,textTransform:"uppercase",marginTop:2}}>{lang==="nl"?"van inkomen":"of income"}</p>
        </div>
      </div>
      <div style={{height:8,background:"rgba(0,0,0,0.06)",borderRadius:4,overflow:"hidden",marginBottom:8}}>
        <div style={{height:"100%",width:`${Math.min(Math.abs(savingsPct),100)}%`,background:isPos?GREEN:RED,borderRadius:4,transition:"width 0.4s"}}/>
      </div>
      <p style={{fontSize:11,color:GRAY}}>
        {isPos
          ? (lang==="nl"?`${fmt(curIncome)} inkomen − ${fmt(curExpenses)} uitgaven`:`${fmt(curIncome)} income − ${fmt(curExpenses)} expenses`)
          : (lang==="nl"?"Je hebt meer uitgegeven dan ontvangen.":"You spent more than you earned.")}
      </p>
    </div>
  );
})()}
<div className="card"> <p style={{fontFamily:"DM Sans",fontSize:17,fontWeight:700,marginBottom:2}}>{t.home.spending} — {t.months[month]}</p>
<p style={{fontSize:11,color:GRAY,marginBottom:12}}>{t.home.perCategory}</p>
{pieData.length>0 ? ( <div style={{display:"flex",alignItems:"center",gap:8}}> <ResponsiveContainer width="52%" height={180}> <PieChart> <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
</Pie>
<Tooltip contentStyle={{fontFamily:"DM Sans",fontSize:11,borderRadius:10,border:"none",boxShadow:"0 4px 14px rgba(0,0,0,.1)"}} formatter={v=>fmt(v)}/>
</PieChart> </ResponsiveContainer>
<div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
{pieData.map(c=>( <div key={c.name} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}> 
  <div style={{width:8,height:8,borderRadius:c.isFixed?"2px":"50%",background:c.color,flexShrink:0}}/>
  <span style={{fontSize:11,flex:1,lineHeight:1.3,fontWeight:c.isFixed?700:400}}>{c.name}</span>
  <span style={{fontSize:11,fontWeight:700,color:c.isFixed?c.color:BLACK}}>{fmt(c.value)}</span>
</div> ))}
</div>
</div> ) : <p style={{fontSize:13,color:GRAY,padding:"14px 0",textAlign:"center"}}>{t.home.noExpenses}</p>}
</div>
<div className="card"> <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}> <p style={{fontFamily:"DM Sans",fontSize:17,fontWeight:700}}>{t.home.recent}</p>
<button className="pill pill-outline pill-sm" onClick={()=>setTab("transacties")}>{t.home.seeAll}</button>
</div>
{[...txListMonth].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(tx=><TxRow key={tx.id} t={tx} fmt={fmt} cats={CATEGORIES}/>)}
{txListMonth.length===0 && <p style={{fontSize:13,color:GRAY,padding:"8px 0"}}>{t.home.noTransactions}</p>}
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
  <div style={{position:"fixed",inset:0,background:"rgba(45,47,94,0.4)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}}
    onClick={()=>setShowNumpad(false)}>
    <div style={{background:"rgba(255,255,255,0.95)",borderRadius:"28px 28px 0 0",padding:"20px 20px max(28px,env(safe-area-inset-bottom))",width:"100%",maxWidth:480}}
      onClick={e=>e.stopPropagation()}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <CatDot cat={numpadCat} size={40}/>
          <div>
            <p style={{fontSize:16,fontWeight:700,color:BLACK}}>{numpadCat.name}</p>
            <p style={{fontSize:11,color:GRAY}}>{lang==="nl"?"Budget instellen":"Set budget"}</p>
          </div>
        </div>
        <button onClick={()=>setShowNumpad(false)} style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Display */}
      <div style={{background:numpadCat.color+"18",borderRadius:16,padding:"14px 20px",textAlign:"center",marginBottom:16}}>
        <p style={{fontSize:11,color:GRAY,marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>{lang==="nl"?"Bedrag":"Amount"}</p>
        <p style={{fontSize:44,fontWeight:800,color:BLACK,letterSpacing:"-2px",lineHeight:1}}>
          €{numpadVal==="0"?"0":parseInt(numpadVal).toLocaleString("nl-NL")}
        </p>
        {numpadCat.spent>0 && <p style={{fontSize:11,color:GRAY,marginTop:6}}>{lang==="nl"?"Uitgegeven":"Spent"}: {fmt(numpadCat.spent)}</p>}
      </div>

      {/* Quick amounts */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[100,200,300,500].map(v=>(
          <button key={v} onClick={()=>setNumpadVal(String(v))}
            style={{flex:1,padding:"10px 0",background:parseInt(numpadVal)===v?BLACK:"rgba(0,0,0,0.07)",color:parseInt(numpadVal)===v?WHITE:BLACK,border:"none",borderRadius:50,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
            €{v}
          </button>
        ))}
      </div>

      {/* Numpad */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {["1","2","3","4","5","6","7","8","9","000","0","⌫"].map(k=>(
          <button key={k} onClick={()=>{
            haptic.select();
            if(k==="⌫"){setNumpadVal(v=>v.length>1?v.slice(0,-1):"0");}
            else if(k==="000"){setNumpadVal(v=>v==="0"?"0":v+"000");}
            else{setNumpadVal(v=>{const n=v==="0"?k:v+k; return n.length>6?v:n;});}
          }}
            style={{
              padding:"18px 0",
              background:k==="⌫"?"rgba(0,0,0,0.07)":k==="000"?"rgba(0,0,0,0.05)":"rgba(0,0,0,0.05)",
              border:"none",borderRadius:14,
              fontFamily:"inherit",fontSize:k==="⌫"?20:22,fontWeight:k==="⌫"?400:600,
              color:BLACK,cursor:"pointer",
              transition:"background .1s",
            }}>
            {k}
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
        style={{width:"100%",padding:"16px",background:BLACK,color:WHITE,border:"none",borderRadius:50,fontFamily:"inherit",fontSize:16,fontWeight:700,cursor:"pointer"}}>
        {lang==="nl"?"Opslaan":"Save"} · €{parseInt(numpadVal)||0}
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
<div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",paddingTop:8,paddingBottom:"max(16px, env(safe-area-inset-bottom))",borderTop:"1px solid rgba(255,255,255,0.6)",display:"flex",justifyContent:"space-around",zIndex:100}}>
{navTabs.map(item=>{ const active = tab===item.id; return ( <button key={item.id} onClick={()=>{haptic.select();setTab(item.id);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",padding:"0 12px"}}>
{NAV_ICONS[item.id](active)}
<span style={{fontSize:9,fontWeight:700,color:active?BLACK:"#BBBBBB",textTransform:"uppercase",letterSpacing:".06em"}}>{item.label}</span>
{active && <div style={{width:16,height:2.5,background:"#7B85B8",borderRadius:2,marginTop:0}}/>}
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
