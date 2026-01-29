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
      tg.expand(); // Раскрыть на весь экран
      // Настройка цветов под тему пользователя
      document.body.style.backgroundColor = tg.themeParams.bg_color || "#f8fafc";
      document.body.style.color = tg.themeParams.text_color || "#0f172a";
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

  // --- UI Components ---
  const Card = ({ children, className = "" }: any) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className}`}>
      {children}
    </div>
  );

  const Button = ({ onClick, disabled, children, variant = "primary" }: any) => {
    const base = "w-full py-3.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
    const styles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      outline: "border-2 border-slate-200 text-slate-700 hover:border-blue-500",
    };
    return (
      <button onClick={onClick} disabled={disabled || loading} className={`${base} ${styles[variant as keyof typeof styles]}`}>
        {loading ? <Loader2 className="animate-spin" size={20}/> : children}
      </button>
    );
  };

  const FileUploader = ({ onChange, label }: any) => (
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Camera className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={onChange} />
    </label>
  );

  // --- Render Views ---

  if (view === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl">🍷</div>
        <h1 className="text-2xl font-bold text-slate-800">AI Сомелье</h1>
        <p className="text-slate-500">
          Ваш персональный гид в мире напитков. Подбор вина, рецепты коктейлей и восстановление.
        </p>
        <Button onClick={() => setView("disclaimer")}>Начать</Button>
      </div>
    );
  }

  if (view === "disclaimer") {
    return (
      <div className="flex flex-col justify-center min-h-screen p-6 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Вам есть 18 лет?</h2>
          <p className="text-slate-500 text-sm">Мы обязаны спросить. Контент 18+</p>
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
      { id: "step1", title: "Фото этикетки", desc: "Подбор блюд к напитку", icon: <Camera size={20}/>, color: "bg-blue-50 text-blue-600" },
      { id: "step2", title: "Выбор напитка", desc: "Под ваш вкус", icon: <Wine size={20}/>, color: "bg-purple-50 text-purple-600" },
      { id: "step3", title: "Вино к еде", desc: "По фото блюда", icon: <Utensils size={20}/>, color: "bg-orange-50 text-orange-600" },
      { id: "step4", title: "Тренировка", desc: "После вечеринки", icon: <Activity size={20}/>, color: "bg-green-50 text-green-600" },
      { id: "step5", title: "Анти-похмелье", desc: "Как прийти в себя", icon: <HeartPulse size={20}/>, color: "bg-red-50 text-red-600" },
    ];

    return (
      <div className="p-4 space-y-4 pb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Меню</h2>
        <div className="grid gap-3">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => {
                 // Reset states if needed
                 setS1Data(null); setS2Recs([]); setS3Data(null); setS4Data(null); setS5Data(null);
                 setView(item.id as ViewState);
              }}
              className="flex items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-left"
            >
              <div className={`p-3 rounded-xl ${item.color} mr-4`}>{item.icon}</div>
              <div>
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <ChevronRight className="ml-auto text-slate-300" size={20} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Feature Views ---

  return (
    <div className="p-4 min-h-screen bg-slate-50 pb-12">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView("menu")} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">
          {view === "step1" && "Этикетка → Блюда"}
          {view === "step2" && "Подбор напитка"}
          {view === "step3" && "Блюдо → Вино"}
          {view === "step4" && "Детокс-тренировка"}
          {view === "step5" && "Анти-похмелье"}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Ошибки */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {view === "step1" && (
          <>
            {!s1Data ? (
              <Card>
                <p className="text-sm text-slate-600 mb-4">Сфотографируйте этикетку бутылки, чтобы узнать, с чем это пить.</p>
                <FileUploader onChange={handleStep1} label="Загрузить фото этикетки" />
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{s1Data.drink.name}</h3>
                  <div className="flex gap-2 text-xs text-slate-500 uppercase tracking-wider mb-3">
                    <span className="bg-white px-2 py-1 rounded shadow-sm">{s1Data.drink.type}</span>
                    <span className="bg-white px-2 py-1 rounded shadow-sm">{s1Data.drink.country}</span>
                  </div>
                  <p className="text-sm text-slate-600 italic">"{s1Data.drink.notes.join(", ")}"</p>
                </Card>

                <h3 className="font-semibold text-slate-700">Идеальные пары:</h3>
                {s1Data.dishes.map((dish, i) => (
                  <label key={i} className={`block p-4 border rounded-xl cursor-pointer transition-all ${s1SelectedDish === dish.name ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="dish" 
                        value={dish.name} 
                        onChange={(e) => setS1SelectedDish(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-slate-800">{dish.name}</div>
                        {dish.desc && <div className="text-xs text-slate-500">{dish.desc}</div>}
                      </div>
                    </div>
                  </label>
                ))}

                {s1SelectedDish && !s1Recipe && (
                  <Button onClick={handleGetRecipe}>Получить рецепт</Button>
                )}

                {s1Recipe && (
                   <Card className="bg-yellow-50 border-yellow-100">
                     <h4 className="font-bold text-yellow-800 mb-2">📖 Рецепт: {s1SelectedDish}</h4>
                     <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{s1Recipe}</p>
                   </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* STEP 2 */}
        {view === "step2" && (
          <>
            {s2Recs.length === 0 ? (
              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Что хотите?</label>
                    <select 
                      className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl"
                      value={s2Form.type}
                      onChange={(e) => setS2Form({...s2Form, type: e.target.value})}
                    >
                      <option value="">Не выбрано</option>
                      <option value="Вино красное">Красное вино</option>
                      <option value="Вино белое">Белое вино</option>
                      <option value="Виски">Виски</option>
                      <option value="Коктейль">Коктейль</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Какие ноты?</label>
                    <input 
                      className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl"
                      placeholder="Сладкое, фруктовое, дымное..."
                      value={s2Form.notes}
                      onChange={(e) => setS2Form({...s2Form, notes: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleStep2} disabled={!s2Form.type || !s2Form.notes}>Подобрать</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                 {s2Recs.map((rec, i) => (
                   <Card key={i}>
                     <div className="flex justify-between items-start">
                       <h3 className="font-bold text-slate-800">{rec.name}</h3>
                       <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{rec.priceUSD}</span>
                     </div>
                     <p className="text-xs text-slate-500 mb-2">{rec.region}</p>
                     <div className="flex flex-wrap gap-1">
                       {rec.notes?.map((n: string) => <span key={n} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{n}</span>)}
                     </div>
                   </Card>
                 ))}
                 <Button variant="secondary" onClick={() => setS2Recs([])}>Искать снова</Button>
              </div>
            )}
          </>
        )}

        {/* STEP 3 */}
        {view === "step3" && (
          <>
             {!s3Data ? (
              <Card>
                <p className="text-sm text-slate-600 mb-4">Фотографируйте еду, AI подберет идеальное вино.</p>
                <FileUploader onChange={handleStep3} label="Сделать фото блюда" />
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    🍽️ {s3Data.dish}
                  </span>
                </div>
                {s3Data.wines.map((wine, i) => (
                  <Card key={i} className="border-l-4 border-l-purple-500">
                    <h3 className="font-bold text-slate-800">{wine.name}</h3>
                    <p className="text-xs text-purple-600 font-medium mb-2">{wine.type}</p>
                    <p className="text-sm text-slate-600">{wine.why}</p>
                  </Card>
                ))}
                <Button variant="secondary" onClick={() => setS3Data(null)}>Другое фото</Button>
              </div>
            )}
          </>
        )}

        {/* STEP 4 */}
        {view === "step4" && (
           <>
             {!s4Data ? (
               <Card>
                 <p className="text-sm text-slate-600 mb-4">Насколько тяжело состояние?</p>
                 <div className="space-y-2 mb-4">
                   {[
                     {id: "light", t: "🙂 Легкое", d: "Просто освежиться"},
                     {id: "medium", t: "😐 Среднее", d: "Нужно подвигаться"},
                     {id: "advanced", t: "🤢 Тяжелое", d: "Только подышать"}
                   ].map((l) => (
                     <button
                       key={l.id}
                       onClick={() => setS4Level(l.id)}
                       className={`w-full p-3 rounded-xl border text-left transition-all ${s4Level === l.id ? "border-green-500 bg-green-50" : "border-slate-100"}`}
                     >
                       <div className="font-medium text-slate-800">{l.t}</div>
                       <div className="text-xs text-slate-500">{l.d}</div>
                     </button>
                   ))}
                 </div>
                 <Button onClick={handleStep4}>Создать тренировку</Button>
               </Card>
             ) : (
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-slate-800 font-bold px-2">
                   <span>Уровень: {s4Data.level}</span>
                   <span>⏱ {s4Data.duration}</span>
                 </div>
                 <div className="space-y-2">
                   {s4Data.exercises.map((ex, i) => (
                     <Card key={i} className="py-3">
                       <div className="flex justify-between">
                         <span className="font-medium text-slate-800">{ex.name}</span>
                         <span className="font-bold text-blue-600">{ex.reps}</span>
                       </div>
                       <p className="text-xs text-slate-500 mt-1">{ex.notes}</p>
                     </Card>
                   ))}
                 </div>
                 <Button variant="secondary" onClick={() => setS4Data(null)}>Сменить уровень</Button>
               </div>
             )}
           </>
        )}

        {/* STEP 5 */}
        {view === "step5" && (
          <div className="space-y-4">
            {!s5Data ? (
              <Card className="text-center py-8">
                <p className="text-slate-600 mb-4">Получаем медицинские советы...</p>
                <Button onClick={handleStep5}>Загрузить советы</Button>
              </Card>
            ) : (
              <>
                 <Card className="bg-blue-50 border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-2">💧 Пьем</h3>
                    <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                      {s5Data.hydration.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                 </Card>
                 <Card className="bg-green-50 border-green-100">
                    <h3 className="font-bold text-green-800 mb-2">🍎 Едим</h3>
                    <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                      {s5Data.nutrition.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                 </Card>
                 <div className="text-center text-sm text-slate-400 mt-4">
                   Восстановление займет: {s5Data.duration}
                 </div>
              </>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}