import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";

// --- Types ---
type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type Account = {
  id: string;
  name: string;
  balance: number;
};

type Transaction = {
  id: string;
  amount: number;
  categoryId: string;
  accountId: string;
  date: string;
  note: string;
};

type Screen = "income" | "expenses" | "accounts" | "reports" | "categories";

// --- Initial Data ---
const INIT_CATEGORIES: Category[] = [
  { id: "misc", name: "Разное", color: "#4CAF50", icon: "★" },
  { id: "ps4", name: "Ps4", color: "#FF9800", icon: "★" },
  { id: "xbox", name: "Xbox", color: "#CDDC39", icon: "★" },
  { id: "ps3", name: "Ps3", color: "#2196F3", icon: "★" },
  { id: "ninka", name: "Ninka", color: "#E91E63", icon: "★" },
  { id: "ps5", name: "PS5", color: "#9C27B0", icon: "★" },
];

const INIT_ACCOUNTS: Account[] = [
  { id: "main", name: "Основной", balance: 902009 },
  { id: "cash", name: "Наличные", balance: 50000 },
];

const today = new Date();
const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

const INIT_TRANSACTIONS: Transaction[] = [
  { id: "t1", amount: 1530, categoryId: "misc", accountId: "main", date: fmt(today), note: "" },
  { id: "t2", amount: 1080, categoryId: "misc", accountId: "main", date: fmt(today), note: "" },
  { id: "t3", amount: 3200, categoryId: "ps4", accountId: "main", date: fmt(today), note: "" },
  { id: "t4", amount: 8770, categoryId: "xbox", accountId: "main", date: fmt(today), note: "" },
  {
    id: "t5", amount: 204739, categoryId: "misc", accountId: "main",
    date: `15.03.2026`, note: ""
  },
  { id: "t6", amount: 150000, categoryId: "ps4", accountId: "main", date: `10.03.2026`, note: "" },
  { id: "t7", amount: 80000, categoryId: "xbox", accountId: "main", date: `05.03.2026`, note: "" },
  { id: "t8", amount: 35000, categoryId: "ps3", accountId: "main", date: `03.03.2026`, note: "" },
  { id: "t9", amount: 20000, categoryId: "ninka", accountId: "main", date: `02.03.2026`, note: "" },
  { id: "t10", amount: 13300, categoryId: "ps5", accountId: "main", date: `01.03.2026`, note: "" },
];

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_RU_SHORT = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

function formatMoney(n: number) {
  return n.toLocaleString("ru-RU") + " ₽";
}

function parseDate(s: string): Date {
  const [d, m, y] = s.split(".").map(Number);
  return new Date(y, m - 1, d);
}

// ============================
// MAIN APP
// ============================
export default function Index() {
  const [screen, setScreen] = useState<Screen>("income");
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INIT_TRANSACTIONS);
  const [categories, setCategories] = useState<Category[]>(INIT_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>(INIT_ACCOUNTS);

  // Income screen state
  const [inputVal, setInputVal] = useState("0");
  const [selectedCategory, setSelectedCategory] = useState<string>("misc");
  const [selectedAccount, setSelectedAccount] = useState<string>("main");
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [pendingVal, setPendingVal] = useState<number | null>(null);

  // Filter state
  const [filterMonth, setFilterMonth] = useState<number>(today.getMonth());
  const [filterYear, setFilterYear] = useState<number>(today.getFullYear());
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");

  // Reports state
  const [reportPeriod, setReportPeriod] = useState<"day" | "month" | "year">("month");
  const [reportMonth, setReportMonth] = useState<number>(today.getMonth());
  const [reportYear, setReportYear] = useState<number>(today.getFullYear());

  // Theme
  const [isDark, setIsDark] = useState(false);

  // Edit transaction
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Category management
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#4CAF50");

  // Account management
  const [showAccModal, setShowAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("0");

  // ---- Calculator logic ----
  const handleCalc = (key: string) => {
    if (key === "←") {
      setInputVal(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
      return;
    }
    if (["+", "-", "×", "÷"].includes(key)) {
      const num = parseFloat(inputVal) || 0;
      if (pendingOp && pendingVal !== null) {
        const res = calc(pendingVal, num, pendingOp);
        setInputVal(String(res));
        setPendingVal(res);
      } else {
        setPendingVal(num);
      }
      setPendingOp(key);
      setInputVal("0");
      return;
    }
    if (key === ".") {
      if (!inputVal.includes(".")) setInputVal(prev => prev + ".");
      return;
    }
    setInputVal(prev => {
      if (prev === "0") return key;
      if (prev.length >= 12) return prev;
      return prev + key;
    });
  };

  function calc(a: number, b: number, op: string) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "×") return a * b;
    if (op === "÷") return b !== 0 ? Math.round((a / b) * 100) / 100 : 0;
    return b;
  }

  const handleAddIncome = () => {
    let amount = parseFloat(inputVal) || 0;
    if (pendingOp && pendingVal !== null) {
      amount = calc(pendingVal, amount, pendingOp);
    }
    if (amount <= 0) return;
    const newT: Transaction = {
      id: "t" + Date.now(),
      amount,
      categoryId: selectedCategory,
      accountId: selectedAccount,
      date: fmt(today),
      note: "",
    };
    setTransactions(prev => [newT, ...prev]);
    setAccounts(prev => prev.map(a => a.id === selectedAccount ? { ...a, balance: a.balance + amount } : a));
    setInputVal("0");
    setPendingOp(null);
    setPendingVal(null);
  };

  // ---- Filtered transactions ----
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = parseDate(t.date);
      const monthMatch = filterCategory === "all" || t.categoryId === filterCategory
        ? true : false;
      const accMatch = filterAccount === "all" || t.accountId === filterAccount;
      const catMatch = filterCategory === "all" || t.categoryId === filterCategory;
      const mMatch = d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      return mMatch && accMatch && catMatch;
    });
  }, [transactions, filterMonth, filterYear, filterCategory, filterAccount]);

  const monthTotal = useMemo(() =>
    filteredTransactions.reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const todayStr = fmt(today);
  const todayTotal = useMemo(() =>
    transactions.filter(t => t.date === todayStr).reduce((s, t) => s + t.amount, 0),
    [transactions, todayStr]
  );

  // ---- Report data ----
  const reportTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = parseDate(t.date);
      if (reportPeriod === "day") return t.date === fmt(today);
      if (reportPeriod === "month") return d.getMonth() === reportMonth && d.getFullYear() === reportYear;
      if (reportPeriod === "year") return d.getFullYear() === reportYear;
      return true;
    });
  }, [transactions, reportPeriod, reportMonth, reportYear]);

  const reportTotal = useMemo(() =>
    reportTransactions.reduce((s, t) => s + t.amount, 0),
    [reportTransactions]
  );

  const reportByCat = useMemo(() => {
    const map: Record<string, number> = {};
    reportTransactions.forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, sum]) => ({ id, sum, cat: categories.find(c => c.id === id) }))
      .sort((a, b) => b.sum - a.sum);
  }, [reportTransactions, categories]);

  // ---- Pie chart ----
  const pieSlices = useMemo(() => {
    if (reportTotal === 0) return [];
    let angle = -90;
    return reportByCat.map(({ id, sum, cat }) => {
      const pct = sum / reportTotal;
      const deg = pct * 360;
      const start = angle;
      angle += deg;
      return { id, sum, cat, pct, start, deg };
    });
  }, [reportByCat, reportTotal]);

  function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const s = polarToXY(cx, cy, r, startAngle);
    const e = polarToXY(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M${cx},${cy} L${s.x},${s.y} A${r},${r},0,${large},1,${e.x},${e.y} Z`;
  }

  // Nav items
  const navItems: { id: Screen; label: string; icon: string }[] = [
    { id: "expenses", label: "Расходы", icon: "TrendingDown" },
    { id: "income", label: "Доходы", icon: "TrendingUp" },
    { id: "accounts", label: "Счета", icon: "Wallet" },
    { id: "categories", label: "Категории", icon: "Tag" },
    { id: "reports", label: "Отчёты", icon: "BarChart2" },
  ];

  const prevMonth = () => {
    if (filterMonth === 0) { setFilterMonth(11); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (filterMonth === 11) { setFilterMonth(0); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  };

  const prevReportMonth = () => {
    if (reportMonth === 0) { setReportMonth(11); setReportYear(y => y - 1); }
    else setReportMonth(m => m - 1);
  };
  const nextReportMonth = () => {
    if (reportMonth === 11) { setReportMonth(0); setReportYear(y => y + 1); }
    else setReportMonth(m => m + 1);
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditAmount(String(t.amount));
    setEditCategoryId(t.categoryId);
    setEditDate(t.date);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const newAmount = parseFloat(editAmount) || 0;
    setTransactions(prev => prev.map(t => {
      if (t.id !== editingId) return t;
      const diff = newAmount - t.amount;
      setAccounts(accs => accs.map(a => a.id === t.accountId ? { ...a, balance: a.balance + diff } : a));
      return { ...t, amount: newAmount, categoryId: editCategoryId, date: editDate };
    }));
    setEditingId(null);
  };

  const deleteTransaction = (id: string) => {
    const t = transactions.find(x => x.id === id);
    if (t) setAccounts(prev => prev.map(a => a.id === t.accountId ? { ...a, balance: a.balance - t.amount } : a));
    setTransactions(prev => prev.filter(x => x.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className={`app-root${isDark ? " dark" : ""}`}>
      {/* Sidebar overlay */}
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}>
          <div className="sidebar" onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sidebar-logo">Деньги ОК</div>
              <div className="sidebar-version">v1.2.0</div>
            </div>
            {navItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${screen === item.id ? "sidebar-item--active" : ""}`}
                onClick={() => { setScreen(item.id); setMenuOpen(false); }}
              >
                <span className="sidebar-item-icon">
                  <Icon name={item.icon} size={22} />
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <button className="header-btn" onClick={() => setMenuOpen(true)}>
          <Icon name="Menu" size={24} />
        </button>
        <h1 className="header-title">
          {navItems.find(n => n.id === screen)?.label || "Доходы"}
        </h1>
        <button className="header-btn" onClick={() => setIsDark(d => !d)} title={isDark ? "Светлая тема" : "Тёмная тема"}>
          <Icon name={isDark ? "Sun" : "Moon"} size={22} />
        </button>
      </header>

      {/* ========== INCOME SCREEN ========== */}
      {screen === "income" && (
        <div className="screen">
          {/* Month bar */}
          <div className="month-bar">
            <button className="month-arrow" onClick={prevMonth}>
              <Icon name="ChevronLeft" size={18} />
            </button>
            <div className="month-info">
              <div className="month-name">{MONTHS_RU[filterMonth]} {filterYear}</div>
              <div className="month-total">{formatMoney(monthTotal)}</div>
            </div>
            <button className="month-arrow" onClick={nextMonth}>
              <Icon name="ChevronRight" size={18} />
            </button>
          </div>

          {/* Calculator */}
          <div className="calc-section">
            <div className="calc-display">
              {pendingOp && <span className="calc-op">{pendingOp} {pendingVal?.toLocaleString()}</span>}
              <span className="calc-value">{parseFloat(inputVal).toLocaleString("ru-RU")}</span>
            </div>
            <div className="calc-grid">
              {[["+","1","2","3"],["-","4","5","6"],["×","7","8","9"],["÷",".","0","←"]].map((row, ri) =>
                row.map((key, ki) => (
                  <button
                    key={`${ri}-${ki}`}
                    className={`calc-btn ${["+","-","×","÷"].includes(key) ? "calc-btn--op" : key === "←" ? "calc-btn--back" : ""}`}
                    onClick={() => handleCalc(key)}
                  >
                    {key}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="cats-section">
            <div className="cats-grid">
              <button
                className={`cat-item ${selectedCategory === "all" ? "cat-item--active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                <div className="cat-icon cat-icon--list" style={{ background: "#7B68EE" }}>
                  <Icon name="List" size={28} color="white" />
                </div>
                <span className="cat-name">Все статьи</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-item ${selectedCategory === cat.id ? "cat-item--active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="cat-star" style={{ color: cat.color }}>★</div>
                  <span className="cat-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add income button */}
          <div className="add-btn-row">
            <div className="today-earned">Заработано сегодня: {formatMoney(todayTotal)}</div>
            <button
              className="add-income-btn"
              onClick={handleAddIncome}
              disabled={parseFloat(inputVal) === 0 && !pendingVal}
            >
              <Icon name="Plus" size={18} /> Добавить доход
            </button>
          </div>

          {/* Transactions list */}
          <div className="transactions-list">
            {filteredTransactions.length === 0 && (
              <div className="empty-state">Нет записей за этот период</div>
            )}
            {filteredTransactions.map(t => {
              const cat = categories.find(c => c.id === t.categoryId);
              return (
                <div key={t.id} className="transaction-item">
                  <div className="t-star" style={{ color: cat?.color || "#ccc" }}>★</div>
                  <div className="t-info">
                    <div className="t-cat">{cat?.name || "—"}</div>
                    <div className="t-month">{MONTHS_RU[filterMonth]} {filterYear}</div>
                  </div>
                  <div className="t-right">
                    <div className="t-amount">{formatMoney(t.amount)}</div>
                    <div className="t-date">{t.date}</div>
                  </div>
                  <div className="t-actions">
                    <button className="t-btn t-btn--edit" onClick={() => openEdit(t)}>
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button className="t-btn t-btn--delete" onClick={() => setDeleteConfirmId(t.id)}>
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== EXPENSES SCREEN ========== */}
      {screen === "expenses" && (
        <div className="screen">
          <div className="month-bar">
            <button className="month-arrow" onClick={prevMonth}><Icon name="ChevronLeft" size={18} /></button>
            <div className="month-info">
              <div className="month-name">{MONTHS_RU[filterMonth]} {filterYear}</div>
              <div className="month-total" style={{ color: "#e53935" }}>0 ₽</div>
            </div>
            <button className="month-arrow" onClick={nextMonth}><Icon name="ChevronRight" size={18} /></button>
          </div>
          <div className="empty-state-big">
            <Icon name="TrendingDown" size={48} color="#ccc" />
            <p>Расходы пока не добавлены</p>
          </div>
        </div>
      )}

      {/* ========== ACCOUNTS SCREEN ========== */}
      {screen === "accounts" && (
        <div className="screen">
          <div className="section-title">Мои счета</div>
          {accounts.map(acc => (
            <div key={acc.id} className="account-card">
              <div className="acc-icon"><Icon name="Wallet" size={28} color="#1565C0" /></div>
              <div className="acc-info">
                <div className="acc-name">{acc.name}</div>
                <div className="acc-balance">{formatMoney(acc.balance)}</div>
              </div>
              <Icon name="ChevronRight" size={20} color="#aaa" />
            </div>
          ))}
          <div className="total-all-card">
            <span className="total-label">Все счета</span>
            <span className="total-val">{formatMoney(accounts.reduce((s, a) => s + a.balance, 0))}</span>
          </div>
          <button className="add-btn-secondary" onClick={() => setShowAccModal(true)}>
            <Icon name="Plus" size={16} /> Добавить счёт
          </button>

          {showAccModal && (
            <div className="modal-overlay" onClick={() => setShowAccModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Новый счёт</div>
                <input className="modal-input" placeholder="Название" value={newAccName} onChange={e => setNewAccName(e.target.value)} />
                <input className="modal-input" placeholder="Начальный баланс" type="number" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} />
                <div className="modal-btns">
                  <button className="modal-cancel" onClick={() => setShowAccModal(false)}>Отмена</button>
                  <button className="modal-ok" onClick={() => {
                    if (!newAccName.trim()) return;
                    setAccounts(prev => [...prev, { id: "acc" + Date.now(), name: newAccName, balance: parseFloat(newAccBalance) || 0 }]);
                    setNewAccName(""); setNewAccBalance("0"); setShowAccModal(false);
                  }}>Добавить</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== CATEGORIES SCREEN ========== */}
      {screen === "categories" && (
        <div className="screen">
          <div className="section-title">Категории доходов</div>
          <div className="cats-list">
            {categories.map(cat => (
              <div key={cat.id} className="cat-row">
                <div className="cat-star-lg" style={{ color: cat.color }}>★</div>
                <div className="cat-row-name">{cat.name}</div>
                <button className="cat-delete" onClick={() => setCategories(prev => prev.filter(c => c.id !== cat.id))}>
                  <Icon name="Trash2" size={16} color="#e53935" />
                </button>
              </div>
            ))}
          </div>
          <button className="add-btn-secondary" onClick={() => setShowCatModal(true)}>
            <Icon name="Plus" size={16} /> Добавить категорию
          </button>

          {showCatModal && (
            <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Новая категория</div>
                <input className="modal-input" placeholder="Название категории" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                <label className="color-label">Цвет:
                  <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="color-input" />
                </label>
                <div className="modal-btns">
                  <button className="modal-cancel" onClick={() => setShowCatModal(false)}>Отмена</button>
                  <button className="modal-ok" onClick={() => {
                    if (!newCatName.trim()) return;
                    setCategories(prev => [...prev, { id: "cat" + Date.now(), name: newCatName, color: newCatColor, icon: "★" }]);
                    setNewCatName(""); setShowCatModal(false);
                  }}>Добавить</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== REPORTS SCREEN ========== */}
      {screen === "reports" && (
        <div className="screen">
          {/* Period tabs */}
          <div className="report-tabs">
            {(["day","month","year"] as const).map(p => (
              <button key={p} className={`report-tab ${reportPeriod === p ? "report-tab--active" : ""}`} onClick={() => setReportPeriod(p)}>
                {p === "day" ? "День" : p === "month" ? "Месяц" : "Год"}
              </button>
            ))}
          </div>

          {/* Period selector */}
          {reportPeriod === "month" && (
            <div className="report-period-row">
              <button className="month-arrow" onClick={prevReportMonth}><Icon name="ChevronLeft" size={18} /></button>
              <span className="report-period-label">{MONTHS_RU_SHORT[reportMonth]} {reportYear}</span>
              <button className="month-arrow" onClick={nextReportMonth}><Icon name="ChevronRight" size={18} /></button>
            </div>
          )}
          {reportPeriod === "year" && (
            <div className="report-period-row">
              <button className="month-arrow" onClick={() => setReportYear(y => y - 1)}><Icon name="ChevronLeft" size={18} /></button>
              <span className="report-period-label">{reportYear}</span>
              <button className="month-arrow" onClick={() => setReportYear(y => y + 1)}><Icon name="ChevronRight" size={18} /></button>
            </div>
          )}
          {reportPeriod === "day" && (
            <div className="report-period-row">
              <span className="report-period-label">{fmt(today)}</span>
            </div>
          )}

          {/* Account selector */}
          <div className="report-acc-row">
            <span className="report-acc-label">Все счета</span>
            <span className="report-acc-total">{formatMoney(accounts.reduce((s,a) => s+a.balance, 0))}</span>
            <Icon name="ChevronRight" size={16} color="#888" />
          </div>

          {/* Total */}
          <div className="report-total">
            Всего доходов: <span>{formatMoney(reportTotal)}</span>
          </div>

          {/* Pie chart */}
          {reportTotal > 0 && (
            <div className="pie-container">
              <svg viewBox="0 0 200 200" width="200" height="200">
                {pieSlices.map(slice => (
                  <path
                    key={slice.id}
                    d={slicePath(100, 100, 90, slice.start, slice.start + slice.deg)}
                    fill={slice.cat?.color || "#ccc"}
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
                {pieSlices.map(slice => {
                  const mid = slice.start + slice.deg / 2;
                  const pos = polarToXY(100, 100, 65, mid);
                  if (slice.pct < 0.07) return null;
                  return (
                    <text key={slice.id} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white" fontWeight="bold">
                      {slice.cat?.name}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}
          {reportTotal === 0 && (
            <div className="empty-state-big">
              <Icon name="PieChart" size={48} color="#ccc" />
              <p>Нет данных за этот период</p>
            </div>
          )}

          {/* Category bars */}
          <div className="report-bars">
            {reportByCat.map(({ id, sum, cat }) => {
              const pct = Math.round((sum / reportTotal) * 100);
              return (
                <div key={id} className="report-bar-row">
                  <div className="report-bar-bg">
                    <div className="report-bar-fill" style={{ width: `${pct}%`, background: cat?.color || "#ccc" }} />
                  </div>
                  <div className="report-bar-info">
                    <span className="report-bar-pct">{pct}%</span>
                    <span className="report-bar-cat-star" style={{ color: cat?.color }}>★</span>
                    <span className="report-bar-cat-name">{cat?.name}</span>
                    <span className="report-bar-sum">{formatMoney(sum)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button key={item.id} className={`bottom-nav-btn ${screen === item.id ? "bottom-nav-btn--active" : ""}`} onClick={() => setScreen(item.id)}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ===== EDIT MODAL ===== */}
      {editingId && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Редактировать доход</div>
            <label className="modal-field-label">Сумма</label>
            <input
              className="modal-input"
              type="number"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              autoFocus
            />
            <label className="modal-field-label">Категория</label>
            <select
              className="modal-input"
              value={editCategoryId}
              onChange={e => setEditCategoryId(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="modal-field-label">Дата</label>
            <input
              className="modal-input"
              type="text"
              placeholder="ДД.ММ.ГГГГ"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
            />
            <div className="modal-btns">
              <button className="modal-cancel" onClick={() => setEditingId(null)}>Отмена</button>
              <button className="modal-ok" onClick={saveEdit}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ color: "#e53935" }}>Удалить доход?</div>
            <p className="modal-desc">
              {(() => {
                const t = transactions.find(x => x.id === deleteConfirmId);
                const cat = categories.find(c => c.id === t?.categoryId);
                return `${cat?.name || "—"} — ${formatMoney(t?.amount || 0)} от ${t?.date}`;
              })()}
            </p>
            <div className="modal-btns">
              <button className="modal-cancel" onClick={() => setDeleteConfirmId(null)}>Отмена</button>
              <button className="modal-ok modal-ok--danger" onClick={() => deleteTransaction(deleteConfirmId)}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}