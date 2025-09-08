import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function Header({ isHistoryOpen, onToggleHistory, isLoading }) {
	const { lang, toggle, t } = useLanguage();
	return (
		<div className="chat-header">
			<div className="header-left">
				<button className="button secondary icon" type="button" onClick={onToggleHistory} title="Toggle History" aria-label="History">
					<svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
						<path d="M12 8v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						<path d="M3 12a9 9 0 1 0 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						<path d="M3 3v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
			</div>
			<div className="header-center">
				<div className="title-wrap brand">
					<img src="/iia-logo.png" alt="IIA" className="brand-logo" onError={(e)=>{e.currentTarget.style.display='none';}} />
				</div>
			</div>
			<div className="header-right" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
				<button
					className="button secondary small"
					type="button"
					onClick={() => {
						try { window.dispatchEvent(new CustomEvent('landing-back')); } catch {}
					}}
					title={t('home')}
					aria-label={t('home')}
				>
					{t('home')}
				</button>
				<label htmlFor="lang-toggle" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
					<span style={{ fontSize: 12 }}>EN</span>
					<input id="lang-toggle" type="checkbox" checked={lang === 'ar'} onChange={toggle} aria-label="Toggle language" style={{ display: 'none' }} />
					<span style={{ position: 'relative', width: 40, height: 22, background: '#e2e8f0', borderRadius: 999, display: 'inline-block' }}>
						<span style={{ position: 'absolute', top: 2, left: lang === 'ar' ? 20 : 2, width: 18, height: 18, background: '#1e40af', borderRadius: '50%', transition: 'left 0.15s ease' }} />
					</span>
					<span style={{ fontSize: 12 }}>AR</span>
				</label>
			</div>
		</div>
	);
}


