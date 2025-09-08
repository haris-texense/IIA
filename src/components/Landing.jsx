import React, { useEffect, useMemo, useState } from 'react';
import SuggestedPromptCard from './SuggestedPromptCard.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function Landing({ useCases, onSelectContext, setInput, onSubmit, onSendPrompt }) {
	const [selectedIndex, setSelectedIndex] = useState(null);
	const [selectedIntent, setSelectedIntent] = useState('');
	const [doneSelecting, setDoneSelecting] = useState(false);
	const [conferences, setConferences] = useState([]);
	const [selectedConferenceIndex, setSelectedConferenceIndex] = useState(null);
	const { t } = useLanguage();

	const current = useMemo(() => {
		if (selectedIndex == null) return null;
		return useCases?.[selectedIndex] || null;
	}, [selectedIndex, useCases]);

	const iconForUseCase = (useCase) => {
		if (!useCase) return undefined;
		const uc = useCase.toLowerCase();
		if (uc.includes('certification') || uc.includes('exams')) return 'certification';
		if (uc.includes('learn')) return 'training';
		if (uc.includes('membership')) return 'membership';
		if (uc.includes('standards') || uc.includes('guidance')) return 'standards';
		if (uc.includes('events') || uc.includes('event') || uc.includes('conference')) return 'events';
		return undefined;
	};

	const isEventsUseCase = (useCase) => {
		if (!useCase) return false;
		const s = useCase.toLowerCase();
		return s.includes('events') || s.includes('event') || s.includes('conference');
	};

	useEffect(() => {
		function onBack() {
			setSelectedIndex(null);
			setSelectedIntent('');
			setSelectedConferenceIndex(null);
			onSelectContext?.('');
		}
		window.addEventListener('landing-back', onBack);
		(async () => {
			try {
				const res = await fetch('/conferences-details.json');
				if (!res.ok) throw new Error('Failed to load conferences');
				const data = await res.json();
				if (Array.isArray(data)) {
					const normalized = data.map((item, idx) => {
						const summary = item.summary || item.srummary || '';
						const key = `conference${idx + 1}`;
						return { key, title: item[key] || item.title || '', summary };
					});
					setConferences(normalized);
				}
			} catch {}
		})();
		return () => {
			window.removeEventListener('landing-back', onBack);
		};
	}, []);

	function handleSelectUseCase(idx) {
		setSelectedIndex(idx);
		setSelectedIntent('');
		setSelectedConferenceIndex(null);
		const uc = useCases?.[idx]?.useCase;
		if (uc) onSelectContext?.(uc);
	}

	function handleSelectIntent(intent) {
		const uc = current?.useCase;
		if (!uc || !intent) return;
		// Keep context strictly as the use_case (not intent)
		onSelectContext?.(uc);
		setSelectedIntent(intent);
		setSelectedConferenceIndex(null);
	}

	function handleSelectConference(idx) {
		const c = conferences?.[idx];
		if (!c) return;
		// Set context to conference title + summary
		const prefix = `${c.title} - ${c.summary}`;
		onSelectContext?.(prefix);
		setSelectedIntent('');
		setSelectedConferenceIndex(idx);
	}

	function handleSelectPrompt(prompt) {
		if (!prompt) return;
		// Ensure context is set to use_case before sending a suggested prompt
		const uc = current?.useCase;
		if (uc) onSelectContext?.(uc);
		onSendPrompt?.(prompt);
	}

	return (
		<div className="landing">
			<div className="landing-inner">
				{selectedIndex == null && (
					<div className="landing-title">{t('landing_title')}</div>
				)}
				<div className="card-grid center" aria-live="polite">
					{selectedIndex == null ? (
						(useCases && useCases.length > 0 ? useCases : []).slice(0, 3 * 3).map((uc, idx) => (
							<SuggestedPromptCard key={idx} text={uc.useCase} onClick={() => handleSelectUseCase(idx)} active={selectedIndex === idx} icon={iconForUseCase(uc.useCase)} />
						))
					) : (
						isEventsUseCase(current?.useCase) ? (
							(conferences || []).slice(0, 3).map((c, idx) => (
								<button key={idx} type="button" className={`adaptive-card card-button conference-card${selectedConferenceIndex === idx ? ' active' : ''}`} onClick={() => handleSelectConference(idx)}>
									<img className="conference-image" src={`/conference${idx + 1}${idx === 0 ? '.jpg' : '.png'}`} alt={c.title || `Conference ${idx + 1}`} />
									<div className="card-title">{c.title || `Conference ${idx + 1}`}</div>
									<div className="card-subtitle">{c.summary || ''}</div>
								</button>
							))
						) : (
							(current?.prompts || []).map((p, i) => (
								<SuggestedPromptCard key={i} text={p} onClick={() => handleSelectPrompt(p)} icon={iconForUseCase(current?.useCase)} />
							))
						)
					)}
				</div>
			</div>
		</div>
	);
}


