import { useState } from 'react';
import { Settings, Eye, Database, Bell, Trash2, Globe, Lock } from 'lucide-react';

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
              description="Fayllaringiz shu kompyuteringizda qayta ishlanadi, hech qayerga yuborilmaydi"
              defaultOn={true}
              icon={Lock}
            />
          </div>

          {/* File storage */}
          <div className="mb-2">
            <h2 className="font-mono text-xs text-cyber-cyan mb-2">Fayllarni saqlash</h2>
            <Toggle
              label="Tekshiruv tarixini saqlash"
              description="Tekshiruv natijalarini saqlab borish"
              defaultOn={true}
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
