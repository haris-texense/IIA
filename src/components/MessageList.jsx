import React, { useEffect, useState } from 'react';
import TabbedMessage from './TabbedMessage.jsx';

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function isArabicText(s) {
	if (!s || typeof s !== 'string') return false;
	// Check for Arabic unicode block
	return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(s);
}

function PendingBubble({ dir }) {
	const [showSearching, setShowSearching] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setShowSearching(true), 5000);
		return () => clearTimeout(t);
	}, []);
	return (
		<div className="bubble" dir={dir}><span className="loading-dot">{showSearching ? 'Searching through the documents and websites' : 'Thinking...'}</span></div>
	);
}

export default function MessageList({ messages, endRef, isChartsUseCase = false, onCreateGraph, canCreateGraph }) {
	return (
		<div className="chat-messages">
			{messages.map(m => {
				const isAssistant = m.role === 'assistant';
				const assistantContentToCheck = (m.documentResponse || m.content || '') + ' ' + (m.websiteResponse || '');
				const assistantRtl = isAssistant && isArabicText(assistantContentToCheck);
				const userRtl = !isAssistant && isArabicText(m.content || '');
				return (
					<div key={m.id} className={`row ${m.role === 'user' ? 'user-wrap' : ''}`}>
						{isAssistant && (
							<img
								className="avatar bot"
								src="/ii-logo.png"
								width={28}
								height={28}
								loading="lazy"
								decoding="async"
								onError={(e) => { try { e.currentTarget.onerror = null; e.currentTarget.src = '/iia-logo.png'; } catch {} }}
								alt="Assistant"
								title="Assistant"
							/>
						)}
						<div className={`${m.role === 'user' ? 'user' : 'bot'}`}>
							{m.pending ? (
								<PendingBubble dir={assistantRtl ? 'rtl' : 'ltr'} />
							) : isAssistant ? (
								<>
									<TabbedMessage message={m} dir={assistantRtl ? 'rtl' : 'ltr'} />
									{isChartsUseCase && canCreateGraph && (
										<div style={{ paddingTop: '6px' }}>
											<button className="button secondary" type="button" onClick={onCreateGraph}>Create graph</button>
										</div>
									)}
								</>
							) : (
								<div className="bubble" dir={userRtl ? 'rtl' : 'ltr'}>{escapeHtml(m.content)}</div>
							)}
						</div>
						{m.role === 'user' && <div className="avatar user" title="You">U</div>}
					</div>
				);
			})}
			<div ref={endRef} />
		</div>
	);
}


