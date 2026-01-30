import { useState, useEffect} from "react";
import axios from "axios";
import { 
  Wine, Utensils, Activity, HeartPulse, 
  Camera, ChevronRight, ArrowLeft, Loader2
} from "lucide-react";

// В реальном приложении лучше вынести в .env
const API_URL = "https://tgwine.onrender.com";

// --- Types ---
interface Drink { name: string; type: string; country: string; notes: string[] }
interface Dish { name: string; desc?: string }
interface WineRec { name: string; type: string; why: string }
interface Workout { level: string; duration: string; exercises: any[]; tips: string[] }
interface HangoverTips { hydration: string[]; nutrition: string[]; supplements: string[]; activity: string[]; duration: string }

type ViewState = "welcome" | "disclaimer" | "menu" | "step1" | "step2" | "step3" | "step4" | "step5";

export default function App() {
  // Telegram WebApp Integration (Mock for local dev)
  const tg = (window as any).Telegram?.WebApp;
  
  const [view, setView] = useState<ViewState>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [s1Data, setS1Data] = useState<{drink: Drink, dishes: Dish[]} | null>(null);
  const [s1Recipe, setS1Recipe] = useState<string | null>(null);
  const [s1SelectedDish, setS1SelectedDish] = useState<string | null>(null);

  const [s2Form, setS2Form] = useState({ type: "", country: "", notes: "" });
  const [s2Recs, setS2Recs] = useState<any[]>([]);

  const [s3Data, setS3Data] = useState<{dish: string, wines: WineRec[]} | null>(null);
  
  const [s4Level, setS4Level] = useState("light");
  const [s4Data, setS4Data] = useState<Workout | null>(null);

  const [s5Data, setS5Data] = useState<HangoverTips | null>(null);

  // --- Telegram Integration Effects ---
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  // Управление кнопкой "Назад"
  useEffect(() => {
    if (!tg) return;
    if (view !== "welcome" && view !== "menu" && view !== "disclaimer") {
      tg.BackButton.show();
      tg.BackButton.onClick(() => setView("menu"));
    } else {
      tg.BackButton.hide();
    }
    return () => tg.BackButton.offClick();
  }, [view]);

  // --- Helpers ---
  const handleError = (err: any) => {
    console.error(err);
    setError(err.response?.data?.error || "Произошла ошибка. Попробуйте еще раз.");
    setLoading(false);
  };

  const uploadFile = async (endpoint: string, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return axios.post(`${API_URL}/api/sommelier/${endpoint}`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  };

  // --- Handlers ---
  const handleStep1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const res = await uploadFile("label-to-dishes", file);
      setS1Data(res.data);
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleGetRecipe = async () => {
    if (!s1SelectedDish) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/sommelier/get-recipe`, { dishName: s1SelectedDish });
      setS1Recipe(res.data.recipe);
    } catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  const handleStep2 = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/sommelier/personalized-drinks`, s2Form);
      setS2Recs(res.data.recommendations);
    } catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  const handleStep3 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const res = await uploadFile("dish-to-wine", file);
      setS3Data(res.data);
    } catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  const handleStep4 = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/sommelier/hangover-workouts`, { level: s4Level });
      setS4Data(res.data);
    } catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  const handleStep5 = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/sommelier/hangover-tips`);
      setS5Data(res.data);
    } catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  // --- UI Components (Apple-style) ---
  const Card = ({ children, className = "" }: any) => (
    <div className={`apple-card p-5 ${className}`}>
      {children}
    </div>
  );

  const Button = ({ onClick, disabled, children, variant = "primary" }: any) => {
    const isPrimary = variant === "primary";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-center gap-2 ${isPrimary ? "apple-btn-primary" : "apple-btn-secondary"}`}
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : children}
      </button>
    );
  };

  const FileUploader = ({ onChange, label }: any) => (
    <label
      className="flex flex-col items-center justify-center w-full min-h-[140px] rounded-[var(--radius-apple-lg)] cursor-pointer transition-colors border-2 border-dashed"
      style={{ borderColor: "var(--color-apple-separator-strong)", background: "var(--color-apple-fill)" }}
    >
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <Camera size={28} style={{ color: "var(--color-apple-text-tertiary)" }} className="mb-2" />
        <p className="text-sm" style={{ color: "var(--color-apple-text-secondary)" }}>{label}</p>
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={onChange} />
    </label>
  );

  // --- Render Views ---

  if (view === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center animate-apple-in">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6"
          style={{ background: "var(--color-apple-fill)" }}
        >
          🍷
        </div>
        <h1 className="mb-2">AI Сомелье</h1>
        <p className="text-base mb-8 max-w-[280px]" style={{ color: "var(--color-apple-text-secondary)" }}>
          Ваш персональный гид в мире напитков. Подбор вина, рецепты коктейлей и восстановление.
        </p>
        <div className="w-full max-w-[280px]">
          <Button onClick={() => setView("disclaimer")}>Начать</Button>
        </div>
      </div>
    );
  }

  if (view === "disclaimer") {
    return (
      <div className="flex flex-col justify-center min-h-screen px-6 py-10 animate-apple-in">
        <div className="text-center mb-8">
          <h2 className="mb-2">Вам есть 18 лет?</h2>
          <p className="text-sm" style={{ color: "var(--color-apple-text-secondary)" }}>Мы обязаны спросить. Контент 18+</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => alert("Доступ запрещен")}>Нет</Button>
          <Button onClick={() => setView("menu")}>Да, мне 18+</Button>
        </div>
      </div>
    );
  }

  if (view === "menu") {
    const menuItems = [
      { id: "step1", title: "Фото этикетки", desc: "Подбор блюд к напитку", icon: <Camera size={22} />, color: "#0071e3" },
      { id: "step2", title: "Выбор напитка", desc: "Под ваш вкус", icon: <Wine size={22} />, color: "#af52de" },
      { id: "step3", title: "Вино к еде", desc: "По фото блюда", icon: <Utensils size={22} />, color: "#ff9500" },
      { id: "step4", title: "Тренировка", desc: "После вечеринки", icon: <Activity size={22} />, color: "#34c759" },
      { id: "step5", title: "Анти-похмелье", desc: "Как прийти в себя", icon: <HeartPulse size={22} />, color: "#ff3b30" },
    ];

    return (
      <div className="px-4 py-6 pb-12 animate-apple-in">
        <h2 className="mb-6">Меню</h2>
        <div className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setS1Data(null); setS2Recs([]); setS3Data(null); setS4Data(null); setS5Data(null);
                setView(item.id as ViewState);
              }}
              className="apple-list-row text-left"
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-apple)] flex items-center justify-center shrink-0 mr-4"
                style={{ background: `${item.color}18`, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--color-apple-text)]">{item.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-apple-text-secondary)" }}>{item.desc}</p>
              </div>
              <ChevronRight size={20} style={{ color: "var(--color-apple-text-tertiary)" }} className="shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Feature Views ---

  const featureTitles: Record<string, string> = {
    step1: "Этикетка → Блюда",
    step2: "Подбор напитка",
    step3: "Блюдо → Вино",
    step4: "Детокс-тренировка",
    step5: "Анти-похмелье",
  };

  return (
    <div className="min-h-screen pb-12 animate-apple-in" style={{ background: "var(--color-apple-bg)" }}>
      <header className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10" style={{ background: "var(--color-apple-bg)", borderBottom: "1px solid var(--color-apple-separator)" }}>
        <button
          type="button"
          onClick={() => setView("menu")}
          className="p-2 -ml-1 rounded-[var(--radius-apple)] flex items-center justify-center"
          style={{ color: "var(--color-apple-blue)" }}
          aria-label="Назад"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold flex-1" style={{ color: "var(--color-apple-text)" }}>
          {featureTitles[view]}
        </h2>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {error && (
          <div
            className="p-4 rounded-[var(--radius-apple)] text-sm"
            style={{ background: "rgba(255, 59, 48, 0.12)", color: "var(--color-apple-red)", border: "1px solid rgba(255, 59, 48, 0.2)" }}
          >
            {error}
          </div>
        )}

        {view === "step1" && (
          <>
            {!s1Data ? (
              <Card>
                <p className="text-sm mb-4" style={{ color: "var(--color-apple-text-secondary)" }}>
                  Сфотографируйте этикетку бутылки, чтобы узнать, с чем это пить.
                </p>
                <FileUploader onChange={handleStep1} label="Загрузить фото этикетки" />
              </Card>
            ) : (
              <div className="space-y-4">
                <Card style={{ background: "linear-gradient(135deg, rgba(0,113,227,0.08) 0%, var(--color-apple-bg-elevated) 100%)" }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-apple-text)" }}>{s1Data.drink.name}</h3>
                  <div className="flex gap-2 text-xs uppercase tracking-wider mb-3">
                    <span className="px-2.5 py-1 rounded-[var(--radius-apple-sm)]" style={{ background: "var(--color-apple-fill)", color: "var(--color-apple-text-secondary)" }}>{s1Data.drink.type}</span>
                    <span className="px-2.5 py-1 rounded-[var(--radius-apple-sm)]" style={{ background: "var(--color-apple-fill)", color: "var(--color-apple-text-secondary)" }}>{s1Data.drink.country}</span>
                  </div>
                  <p className="text-sm italic" style={{ color: "var(--color-apple-text-secondary)" }}>«{s1Data.drink.notes.join(", ")}»</p>
                </Card>

                <h3 className="font-semibold text-sm" style={{ color: "var(--color-apple-text)" }}>Идеальные пары</h3>
                <div className="flex flex-col gap-2">
                  {s1Data.dishes.map((dish, i) => (
                    <label
                      key={i}
                      className={`block p-4 rounded-[var(--radius-apple)] cursor-pointer transition-all border ${s1SelectedDish === dish.name ? "border-[var(--color-apple-blue)]" : ""}`}
                      style={{
                        background: s1SelectedDish === dish.name ? "rgba(0,113,227,0.08)" : "var(--color-apple-bg-elevated)",
                        borderColor: s1SelectedDish === dish.name ? "var(--color-apple-blue)" : "var(--color-apple-separator)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="dish"
                          value={dish.name}
                          onChange={(e) => setS1SelectedDish(e.target.value)}
                          className="w-4 h-4 accent-[var(--color-apple-blue)]"
                        />
                        <div>
                          <div className="font-medium" style={{ color: "var(--color-apple-text)" }}>{dish.name}</div>
                          {dish.desc && <div className="text-xs mt-0.5" style={{ color: "var(--color-apple-text-secondary)" }}>{dish.desc}</div>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {s1SelectedDish && !s1Recipe && (
                  <Button onClick={handleGetRecipe}>Получить рецепт</Button>
                )}

                {s1Recipe && (
                  <Card style={{ background: "rgba(255,149,0,0.08)", borderColor: "rgba(255,149,0,0.25)" }}>
                    <h4 className="font-semibold mb-2" style={{ color: "var(--color-apple-text)" }}>📖 Рецепт: {s1SelectedDish}</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-apple-text-secondary)" }}>{s1Recipe}</p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {view === "step2" && (
          <>
            {s2Recs.length === 0 ? (
              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--color-apple-text)" }}>Что хотите?</label>
                    <select
                      className="w-full p-3 rounded-[var(--radius-apple)] border-none text-[var(--color-apple-text)]"
                      style={{ background: "var(--color-apple-fill)" }}
                      value={s2Form.type}
                      onChange={(e) => setS2Form({ ...s2Form, type: e.target.value })}
                    >
                      <option value="">Не выбрано</option>
                      <option value="Вино красное">Красное вино</option>
                      <option value="Вино белое">Белое вино</option>
                      <option value="Виски">Виски</option>
                      <option value="Коктейль">Коктейль</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--color-apple-text)" }}>Какие ноты?</label>
                    <input
                      className="w-full p-3 rounded-[var(--radius-apple)] border-none text-[var(--color-apple-text)] placeholder:opacity-70"
                      style={{ background: "var(--color-apple-fill)" }}
                      placeholder="Сладкое, фруктовое, дымное..."
                      value={s2Form.notes}
                      onChange={(e) => setS2Form({ ...s2Form, notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleStep2} disabled={!s2Form.type || !s2Form.notes}>Подобрать</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {s2Recs.map((rec, i) => (
                  <Card key={i}>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold" style={{ color: "var(--color-apple-text)" }}>{rec.name}</h3>
                      <span className="text-xs font-semibold shrink-0 px-2 py-1 rounded-[var(--radius-apple-sm)]" style={{ background: "rgba(52,199,89,0.2)", color: "var(--color-apple-green)" }}>{rec.priceUSD}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--color-apple-text-secondary)" }}>{rec.region}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rec.notes?.map((n: string) => (
                        <span key={n} className="text-xs px-2 py-1 rounded-[var(--radius-apple-sm)]" style={{ background: "var(--color-apple-fill)", color: "var(--color-apple-text-secondary)" }}>{n}</span>
                      ))}
                    </div>
                  </Card>
                ))}
                <Button variant="secondary" onClick={() => setS2Recs([])}>Искать снова</Button>
              </div>
            )}
          </>
        )}

        {view === "step3" && (
          <>
            {!s3Data ? (
              <Card>
                <p className="text-sm mb-4" style={{ color: "var(--color-apple-text-secondary)" }}>
                  Фотографируйте еду — AI подберёт идеальное вино.
                </p>
                <FileUploader onChange={handleStep3} label="Сделать фото блюда" />
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <span
                    className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                    style={{ background: "rgba(255,149,0,0.15)", color: "var(--color-apple-orange)" }}
                  >
                    🍽️ {s3Data.dish}
                  </span>
                </div>
                {s3Data.wines.map((wine, i) => (
                  <Card key={i} className="border-l-4" style={{ borderLeftColor: "var(--color-apple-purple)" }}>
                    <h3 className="font-semibold" style={{ color: "var(--color-apple-text)" }}>{wine.name}</h3>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--color-apple-purple)" }}>{wine.type}</p>
                    <p className="text-sm" style={{ color: "var(--color-apple-text-secondary)" }}>{wine.why}</p>
                  </Card>
                ))}
                <Button variant="secondary" onClick={() => setS3Data(null)}>Другое фото</Button>
              </div>
            )}
          </>
        )}

        {view === "step4" && (
          <>
            {!s4Data ? (
              <Card>
                <p className="text-sm mb-4" style={{ color: "var(--color-apple-text-secondary)" }}>Насколько тяжело состояние?</p>
                <div className="space-y-2 mb-4">
                  {[
                    { id: "light", t: "🙂 Легкое", d: "Просто освежиться" },
                    { id: "medium", t: "😐 Среднее", d: "Нужно подвигаться" },
                    { id: "advanced", t: "🤢 Тяжелое", d: "Только подышать" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setS4Level(l.id)}
                      className="w-full p-4 rounded-[var(--radius-apple)] border text-left transition-all"
                      style={{
                        borderColor: s4Level === l.id ? "var(--color-apple-green)" : "var(--color-apple-separator)",
                        background: s4Level === l.id ? "rgba(52,199,89,0.1)" : "var(--color-apple-bg-elevated)",
                      }}
                    >
                      <div className="font-medium" style={{ color: "var(--color-apple-text)" }}>{l.t}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-apple-text-secondary)" }}>{l.d}</div>
                    </button>
                  ))}
                </div>
                <Button onClick={handleStep4}>Создать тренировку</Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1" style={{ color: "var(--color-apple-text)" }}>
                  <span className="font-semibold">Уровень: {s4Data.level}</span>
                  <span className="text-sm">⏱ {s4Data.duration}</span>
                </div>
                <div className="space-y-2">
                  {s4Data.exercises.map((ex, i) => (
                    <Card key={i} className="py-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium" style={{ color: "var(--color-apple-text)" }}>{ex.name}</span>
                        <span className="font-semibold shrink-0" style={{ color: "var(--color-apple-blue)" }}>{ex.reps}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--color-apple-text-secondary)" }}>{ex.notes}</p>
                    </Card>
                  ))}
                </div>
                <Button variant="secondary" onClick={() => setS4Data(null)}>Сменить уровень</Button>
              </div>
            )}
          </>
        )}

        {view === "step5" && (
          <div className="space-y-4">
            {!s5Data ? (
              <Card className="text-center py-8">
                <p className="mb-4" style={{ color: "var(--color-apple-text-secondary)" }}>Медицинские советы по восстановлению</p>
                <Button onClick={handleStep5}>Загрузить советы</Button>
              </Card>
            ) : (
              <>
                <Card style={{ background: "rgba(0,113,227,0.08)", borderColor: "rgba(0,113,227,0.2)" }}>
                  <h3 className="font-semibold mb-2" style={{ color: "var(--color-apple-blue)" }}>💧 Пьём</h3>
                  <ul className="list-disc pl-4 text-sm space-y-1" style={{ color: "var(--color-apple-text-secondary)" }}>
                    {s5Data.hydration.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </Card>
                <Card style={{ background: "rgba(52,199,89,0.08)", borderColor: "rgba(52,199,89,0.2)" }}>
                  <h3 className="font-semibold mb-2" style={{ color: "var(--color-apple-green)" }}>🍎 Едим</h3>
                  <ul className="list-disc pl-4 text-sm space-y-1" style={{ color: "var(--color-apple-text-secondary)" }}>
                    {s5Data.nutrition.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </Card>
                <p className="text-center text-sm mt-4" style={{ color: "var(--color-apple-text-tertiary)" }}>
                  Восстановление займёт: {s5Data.duration}
                </p>
              </>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}