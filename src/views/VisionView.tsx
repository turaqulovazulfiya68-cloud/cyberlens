import { Eye, Send, ShieldCheck, FileSearch, Globe, Layers, ArrowRight } from 'lucide-react';

export function VisionView() {
  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <Eye className="w-12 h-12 text-cyber-cyan mx-auto mb-4 animate-pulse-glow" />
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white mb-4">
            CYBERLENS FAQAT SAYT BO'LIB QOLMASLIGI KERAK
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            CyberLens — bu ulashish oldidan avtomatik xavfsizlik qatlami. Kelajakda u har bir
            ulashish nuqtasida ishlaydi.
          </p>
        </div>

        {/* Future flow */}
        <div className="glass-panel rounded-xl p-6 sm:p-10 mb-8 corner-brackets">
          <h2 className="font-display font-bold text-xl text-cyber-cyan mb-8 text-center">
            KELAJAKDAGI KONSEPSIYA
          </h2>

          <div className="flex flex-col gap-4 max-w-xl mx-auto">
            {[
              { icon: Globe, label: 'Telegram Web / Gmail / Brauzer / boshqa platforma', color: '#00f0ff' },
              { icon: Layers, label: 'CYBERLENS XAVFSIZLIK QATLAMI', color: '#1a7fff' },
              { icon: FileSearch, label: "ULASHISH OLDIDAN AVTOMATIK TEKSHIRUV", color: '#ffaa00' },
              { icon: ShieldCheck, label: 'XAVF ANIQLANDI', color: '#ff2d55' },
              { icon: Send, label: 'HIMOYALANGAN NUSXANI YUBORISH', color: '#00ff88' },
              { icon: ArrowRight, label: 'XAVFSIZ ULASHISH', color: '#00ff88' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}40` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: item.color }} />
                  </div>
                  <div
                    className="flex-1 px-5 py-4 rounded-lg font-mono text-sm"
                    style={{ color: item.color, border: `1px solid ${item.color}30`, background: `${item.color}08` }}
                  >
                    {item.label}
                  </div>
                  {i < 5 && (
                    <ArrowRight className="w-5 h-5 text-cyber-cyan/30 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vision cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              title: 'PLATFORMA INTEGRATSIYASI',
              desc: "Telegram, Gmail va brauzer kengaytmalari orqali to'g'ridan-to'g'ri ulashish nuqtasida ishlaydi.",
              color: '#00f0ff',
            },
            {
              title: 'AVTOMATIK HIMOYA',
              desc: "Foydalanuvchi faylni ulashishni bosganda, CyberLens avtomatik tekshiradi va himoyalaydi.",
              color: '#1a7fff',
            },
            {
              title: 'XAVFSIZ ULASHISH',
              desc: "Himoyalangan nusxa avtomatik yuboriladi. Sezgir ma'lumotlar oshkor bo'lmaydi.",
              color: '#00ff88',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="glass-panel rounded-lg p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s`, borderColor: `${card.color}20` }}
            >
              <h3 className="font-display font-bold text-sm mb-2" style={{ color: card.color }}>
                {card.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Core question */}
        <div className="glass-panel-red rounded-xl p-8 sm:p-12 text-center corner-brackets">
          <p className="text-gray-500 font-mono text-xs mb-4">CYBERLENS — BU SHUNCHA FILE SCANNER EMAS</p>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-cyber-red text-glow-red mb-4">
            BU — ULASHISH NUQTASIDAGI XAVFSIZLIK QATLAMI
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            CyberLens foydalanuvchilarni "Share" tugmasini bosishdan oldin fikrlashga majbur qiladi.
            "Men bu faylni ulashsam, yana nimalarni oshkor qilaman?"
          </p>
        </div>
      </div>
    </div>
  );
}
