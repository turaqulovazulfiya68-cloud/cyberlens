import { useState } from 'react';
import { Settings, Eye, Database, Bell, Trash2, Globe, Lock, ShieldCheck } from 'lucide-react';

const HISTORY_KEY = 'cyberlens_history_enabled';

function readHistoryPref(): boolean {
  try {
    const v = localStorage.getItem(HISTORY_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

interface ToggleProps {
  label: string;
  description: string;
  defaultOn?: boolean;
  icon: typeof Eye;
}

function Toggle({ label, description, defaultOn = false, icon: Icon }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyber-cyan" />
        </div>
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-12 h-6 rounded-full transition-all ${on ? 'bg-cyber-cyan/30' : 'bg-gray-700'}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
            on ? 'left-6 bg-cyber-cyan glow-cyan' : 'left-0.5 bg-gray-400'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsView() {
  const [language, setLanguage] = useState('uz');
  const [historyOn, setHistoryOn] = useState(readHistoryPref);

  const setHistory = (on: boolean) => {
    setHistoryOn(on);
    try {
      localStorage.setItem(HISTORY_KEY, on ? '1' : '0');
    } catch {
      // localStorage unavailable: preference applies to this session only
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-7 h-7 text-cyber-cyan animate-rotate-slow" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Sozlamalar</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Faqat haqiqatan ishlayotgan funksiyalar "yoqilgan" deb ko'rsatiladi.
          </p>
        </div>

        <div className="space-y-3">
          {/* Privacy */}
          <div className="mb-2">
            <h2 className="font-mono text-xs text-cyber-cyan mb-2">Maxfiylik</h2>
            <Toggle
              label="Maxfiylik rejimi"
              description="Fayllaringiz faqat shu brauzerda qayta ishlanadi, hech qayerga yuborilmaydi"
              defaultOn={true}
              icon={Lock}
            />
            <div className="mt-2 glass-panel rounded-lg p-4 border-cyber-green/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400 leading-relaxed">
                  <p className="text-cyber-green font-medium mb-1">Qanday ma'lumot qayerda ishlanadi:</p>
                  <p>• Fayl mazmuni — faqat shu brauzerda o'qiladi, internetga chiqmaydi, saqlanmaydi.</p>
                  <p>• Parollar va matn tahlili — to'liq qurilmangizda, hech qanday uzatishsiz.</p>
                  <p>• Tekshiruv tarixi (fayl nomi, xesh, xulq) — faqat siz yuborgan ma'lumot saqlanadi, Supabase bazasida.</p>
                  <p>• Faylning o'zi hech qachon yuklanmaydi va saqlanmaydi.</p>
                </div>
              </div>
            </div>
          </div>

          {/* File storage */}
          <div className="mb-2">
            <h2 className="font-mono text-xs text-cyber-cyan mb-2">Fayllarni saqlash</h2>
            <Toggle
              label="Tekshiruv tarixini saqlash"
              description={
                historyOn
                  ? "Yoqilgan: fayl nomi, xesh va natija Supabase bulutida saqlanadi (fayl mazmuni emas)"
                  : "O'chirilgan: yangi tekshiruvlar tarixga yozilmaydi"
              }
              defaultOn={historyOn}
              icon={Database}
            />
            <div className="mt-2">
              <Toggle
                label="Avtomatik o'chirish"
                description="30 kundan eski yozuvlarni avtomatik o'chirish (hozircha ishlamaydi)"
                defaultOn={false}
                icon={Trash2}
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-2">
            <h2 className="font-mono text-xs text-cyber-cyan mb-2">Bildirishnomalar</h2>
            <Toggle
              label="Xavf haqida ogohlantirish"
              description="Yuqori xavf aniqlanganda sizni ogohlantirish"
              defaultOn={true}
              icon={Bell}
            />
          </div>

          {/* Language */}
          <div className="mb-2">
            <h2 className="font-mono text-xs text-cyber-cyan mb-2">Til</h2>
            <div className="glass-panel rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-cyber-cyan" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Interfeys tili</p>
                  <p className="text-xs text-gray-500 mt-0.5">Qaysi til ishlatishni tanlang</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { code: 'uz', label: "O'zbekcha" },
                  { code: 'ru', label: 'Русский' },
                  { code: 'en', label: 'English' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-4 py-2 text-xs font-mono rounded transition-all ${
                      language === lang.code
                        ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/40'
                        : 'text-gray-500 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-cyber-amber mt-3 font-mono">
                * Hozircha faqat O'zbekcha to'liq qo'llab-quvvatlanadi.
              </p>
            </div>
          </div>

          {/* About */}
          <div className="mt-6 glass-panel rounded-lg p-6 text-center">
            <p className="font-display font-bold text-lg text-cyber-cyan text-glow-cyan">CYBERLENS</p>
            <p className="text-xs text-gray-500 mt-1">v1.0.0 — Prototip</p>
            <p className="text-xs text-gray-600 mt-2 max-w-md mx-auto">
              Ulashishdan oldin faylingizni avtomatik tekshiruvchi xavfsizlik yordamchisi.
              Bu taxminiy baholashdan foydalanadi va 100% aniqlikni kafolatlamaydi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
