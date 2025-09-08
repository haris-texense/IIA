import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

function Icon({ name }) {
	if (name === 'certification') {
		return (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 2l3 3 4-.5-1 4 3 3-4 .5-1 4-3-3-4 1 1-4-3-3 4-.5L12 2z" fill="url(#g)"/>
				<defs>
					<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#0ea5e9" />
						<stop offset="100%" stopColor="#22c55e" />
					</linearGradient>
				</defs>
			</svg>
		);
	}
	if (name === 'training') {
		return (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M4 6h16v2H4V6zm0 4h16v8H4v-8zm2 2v4h12v-4H6z" fill="url(#g)"/>
				<defs>
					<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#f59e0b" />
						<stop offset="100%" stopColor="#ef4444" />
					</linearGradient>
				</defs>
			</svg>
		);
	}
	if (name === 'membership') {
		return (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" fill="url(#g)"/>
				<defs>
					<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#6366f1" />
						<stop offset="100%" stopColor="#a855f7" />
					</linearGradient>
				</defs>
			</svg>
		);
	}
	if (name === 'standards') {
		return (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M6 4h12v2H6V4zm0 4h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z" fill="url(#g)"/>
				<defs>
					<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#10b981" />
						<stop offset="100%" stopColor="#14b8a6" />
					</linearGradient>
				</defs>
			</svg>
		);
	}
	if (name === 'events') {
		return (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z" fill="url(#g)"/>
				<defs>
					<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#3b82f6" />
						<stop offset="100%" stopColor="#06b6d4" />
					</linearGradient>
				</defs>
			</svg>
		);
	}
	// default/edit icon
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#f97316" />
					<stop offset="100%" stopColor="#a855f7" />
				</linearGradient>
			</defs>
			<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="url(#g)"/>
			<path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="url(#g)"/>
		</svg>
	);
}

export default function SuggestedPromptCard({ text, onClick, subtitle, active, icon }) {
	const { translateText } = useLanguage();
	const translatedText = translateText(text || '');
	const translatedSubtitle = subtitle ? translateText(subtitle || '') : undefined;
	return (
		<button className={`adaptive-card card-button${active ? ' active' : ''}`} type="button" onClick={onClick}>
			<span className="card-icon" aria-hidden>
				<Icon name={icon} />
			</span>
			<div className="card-text">{translatedText}</div>
			{translatedSubtitle ? <div className="card-subtitle">{translatedSubtitle}</div> : null}
		</button>
	);
}


