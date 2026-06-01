'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/dictionaries';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export function LanguageSwitcher({ currentLang }: { currentLang: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = (newLocale: string) => {
    if (newLocale === currentLang) {
      setIsOpen(false);
      return;
    }
    
    // Replace the first path segment (the locale)
    const newPathname = pathname.replace(`/${currentLang}`, `/${newLocale}`);
    router.push(newPathname || `/${newLocale}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-bold text-slate-700 cursor-pointer border-none"
      >
        <Globe size={14} className="text-slate-500" />
        <span className="uppercase">{currentLang === 'am' ? 'አማ' : 'EN'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute top-10 right-0 z-50 min-w-[120px]">
            <div 
              className="fixed inset-0" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-lg border border-slate-100 py-1"
            >
              <button
                onClick={() => toggleLanguage('en')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer border-none ${currentLang === 'en' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
              >
                English
              </button>
              <button
                onClick={() => toggleLanguage('am')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer border-none ${currentLang === 'am' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
              >
                አማርኛ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
