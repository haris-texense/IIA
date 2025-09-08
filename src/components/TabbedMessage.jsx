import React, { useState, useEffect } from 'react';

export default function TabbedMessage({ message, dir }) {
	const [activeTab, setActiveTab] = useState('document');

	// Check if this is a new message format with both responses
	const hasNewFormat = message.documentResponse !== undefined && message.websiteResponse !== undefined;
	
	if (!hasNewFormat) {
		// Fallback for old message format
		return (
			<div className="bubble" dir={dir} dangerouslySetInnerHTML={{ __html: normalizeAssistantHtml(message.content) }} />
		);
	}

	// Determine which responses are present and valid
	const docRaw = (message.documentResponse || '').trim();
	const webRaw = (message.websiteResponse || '').trim();
	const hasDocumentResponse = docRaw.length > 0;
	const hasWebsiteResponse = webRaw.length > 0;

	// Treat both English and Arabic no-data markers as no data
	const containsEnNoData = (s) => typeof s === 'string' && s.toLowerCase().includes('no data found');
	const containsArNoData = (s) => typeof s === 'string' && s.includes('لم يتم العثور على بيانات');
	const isNoData = (s) => containsEnNoData(s) || containsArNoData(s);

	const docIsNoData = hasDocumentResponse && isNoData(docRaw);
	const webIsNoData = hasWebsiteResponse && isNoData(webRaw);
	const docIsValid = hasDocumentResponse && !docIsNoData;
	const webIsValid = hasWebsiteResponse && !webIsNoData;
	
	// Set default tab:
	// - If one tab has no data and the other is valid, pick the valid one
	// - If both valid, default to Document
	// - If both no data or missing, keep current (defaults to Document)
	useEffect(() => {
		if (docIsValid && !webIsValid) {
			setActiveTab('document');
			return;
		}
		if (!docIsValid && webIsValid) {
			setActiveTab('website');
			return;
		}
		if (docIsValid && webIsValid) {
			setActiveTab('document');
			return;
		}
		// Else leave as-is (document)
	}, [docIsValid, webIsValid]);

	// Extract references for the active tab
	const documentReferences = Array.isArray(message.documentReferences) ? message.documentReferences : [];
	const websiteReferences = Array.isArray(message.websiteReferences) ? message.websiteReferences : [];
	// De-duplicate references by URI at render time as a safeguard
	const srcReferences = activeTab === 'document' ? documentReferences : websiteReferences;
	const activeReferences = Array.isArray(srcReferences)
		? (() => {
			const seen = new Set();
			const list = [];
			for (const r of srcReferences) {
				const key = String(r?.uri || r?.url || '').trim();
				if (key && !seen.has(key)) {
					seen.add(key);
					list.push(r);
				}
			}
			return list;
		})()
		: [];

	return (
		<div className="bubble tabbed-message" dir={dir}>
			<div className="tab-header">
				<button
					className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
					onClick={() => setActiveTab('document')}
					disabled={!hasDocumentResponse}
				>
					Response from Document
				</button>
				<button
					className={`tab-button ${activeTab === 'website' ? 'active' : ''}`}
					onClick={() => setActiveTab('website')}
					disabled={!hasWebsiteResponse}
				>
					Response from Websites
				</button>
			</div>
			
			<div className="tab-content">
				{activeTab === 'document' && (
					<div 
						className="tab-panel"
						dangerouslySetInnerHTML={{ __html: normalizeAssistantHtml(docRaw) }}
					/>
				)}
				{activeTab === 'website' && (
					<div 
						className="tab-panel"
						dangerouslySetInnerHTML={{ __html: normalizeAssistantHtml(webRaw) }}
					/>
				)}

				{/* References list - render only if present */}
				{Array.isArray(activeReferences) && activeReferences.length > 0 && (
					<div className="references">
						<div className="references-title">References</div>
						<ul className="references-list">
							{activeReferences.map((ref, idx) => {
								const uri = ref?.uri || ref?.url;
								const title = ref?.title || uri;
								if (!uri) return null;
								return (
									<li key={`${uri}-${idx}`}>
										<a href={uri} target="_blank" rel="noopener noreferrer">{title}</a>
									</li>
								);
							})}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}

function normalizeAssistantHtml(html) {
	if (typeof html !== 'string') return '';
	let s = html.trim();
	// Strip fenced code blocks like ```html ... ``` or ``` ... ```
	if (s.startsWith('```')) {
		const firstNewline = s.indexOf('\n');
		if (firstNewline !== -1) {
			// drop first fence line (may include language)
			s = s.slice(firstNewline + 1);
		}
		// remove trailing closing fence if present at the end
		if (s.endsWith('```')) {
			s = s.slice(0, -3);
		}
		s = s.trim();
	}
	return s;
}
