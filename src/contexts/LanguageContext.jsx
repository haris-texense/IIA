import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext({ lang: 'en', toggle: () => {}, t: (k) => k, translateText: (s) => s });

const DICTIONARY = {
	en: {
		'home': 'Home',
		'send': 'Send',
		'create_graph': 'Create graph',
		'input_placeholder': 'Type your message and press Enter...',
		'landing_title': 'How can I help you today?',
	},
	ar: {
		'home': 'الرئيسية',
		'send': 'إرسال',
		'create_graph': 'إنشاء مخطط',
		'input_placeholder': 'اكتب رسالتك واضغط إدخال...',
		'landing_title': 'كيف يمكنني مساعدتك اليوم؟',
	}
};

// Simple glossary for common terms in prompts/cards; extendable
const GLOSSARY = [
    // Existing entries...
	['Certification', 'الشهادات'],
	['Exams', 'الامتحانات'],
	['Membership', 'العضوية'],
	['Standards', 'المعايير'],
	['Guidance', 'الإرشادات'],
    ['Guidelines', 'الإرشادات'],
	['Training', 'التدريب'],
	['Events', 'الفعاليات'],
	['Conferences', 'المؤتمرات'],
	['Conference', 'مؤتمر'],
	['Guide', 'أرشد'],
	['registration', 'التسجيل'],
	['process', 'العملية'],
	['policy', 'سياسة'],
	['procedure', 'إجراء'],
	['risk-based audit planning', 'تخطيط المراجعة المبني على المخاطر'],
	['interpretation', 'تفسير'],
	['clause', 'فقرة'],
	['Conference Agenda', 'برنامج المؤتمر'],
	['Recent Conferences', 'المؤتمرات الأخيرة'],
    ['and', 'و'],
    ['or', 'أو'],
    ['but', 'لكن'],
    ['if', 'إذا'],
    ['then', 'ثم'],
    ['else', 'إلا'],
    ['because', 'لأن'],

    // ✅ Newly added words/phrases
    ['Register', 'التسجيل'],
    ['Exam', 'امتحان'],
    ['schedules', 'جداول'],
    ['Eligibility', 'الأهلية'],
    ['Fees', 'الرسوم'],
    ['Renew', 'تجديد'],
    ['Process', 'عملية'],
    ['Agenda', 'جدول الأعمال'],
    ['Recent', 'الأخيرة'],
    ['Guide me', 'أرشدني'],
    ['through', 'خلال'],
    ['CIA', 'CIA'],
    ['exam registration', 'تسجيل الامتحان'],
    ['Can', 'هل يمكن'],
    ['you', 'أنت'],
    ['explain', 'تشرح'],
    ['criteria', 'معايير'],
    ['fee', 'رسوم'],
    ['structure', 'هيكل'],
    ['How', 'كيف'],
    ['do', 'تقوم'],
    ['I', 'أنا'],
    ['renew', 'أجدد'],
    ['my', 'ملكي'],
    ['online', 'عبر الإنترنت'],
    ['steps', 'خطوات'],
    ['to', 'إلى'],
    ['become', 'تصبح'],
    ['a', 'أداة نكرة'],
    ['member', 'عضو'],
    ['What', 'ما'],
    ['are', 'هي'],
    ['benefits', 'فوائد'],
    ['of', 'من'],
    ['maintaining', 'الحفاظ على'],
    ['an', 'أداة نكرة'],
    ['active', 'نشطة'],
    ['Provide', 'قدم'],
    ['implementing', 'تنفيذ'],
    ['global', 'العالمية'],
    ['internal', 'داخلي'],
    ['audit', 'تدقيق'],
    ['standards', 'معايير'],
    ['ensure', 'ضمان'],
    ['independence', 'الاستقلال'],
    ['objectivity', 'الموضوعية'],
    ['impairments', 'حالات الضعف'],
    ['disclosed', 'الإفصاح'],
    ['apply', 'تنطبق'],
    ['practices', 'ممارسات'],
    ['Share', 'شارك'],
    ['upcoming', 'القادمة'],
    ['highlights', 'أبرز النقاط'],
    ['most', 'الأكثر'],
    ['list', 'اذكر'],
    ['relevant', 'ذات الصلة'],
    ['auditors', 'المدققين'],
    ['the', 'ال'],
    ['on', 'على'],
];


export function LanguageProvider({ children }) {
	const [lang, setLang] = useState('en');

	useEffect(() => {
		try { document.documentElement.setAttribute('lang', lang); } catch {}
	}, [lang]);

	const toggle = useCallback(() => {
		setLang(prev => (prev === 'en' ? 'ar' : 'en'));
	}, []);

	const t = useCallback((key) => {
		return DICTIONARY[lang]?.[key] ?? DICTIONARY.en[key] ?? key;
	}, [lang]);

	const translateText = useCallback((text) => {
		if (!text || typeof text !== 'string') return text;
		if (lang === 'en') return text;
		let out = text;
		for (const [en, ar] of GLOSSARY) {
			const re = new RegExp(`\\b${en}\\b`, 'gi');
			out = out.replace(re, (m) => {
				// Preserve capitalization basic
				return ar;
			});
		}
		return out;
	}, [lang]);

	const value = useMemo(() => ({ lang, toggle, t, translateText }), [lang, toggle, t, translateText]);
	return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
	return useContext(LanguageContext);
}
