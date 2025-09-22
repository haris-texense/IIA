import React, { useState, useEffect, useRef } from 'react';

export default function TabbedMessage({ message, dir }) {
	const [activeTab, setActiveTab] = useState('document');
	const contentRef = useRef(null);

	// Position citation tooltips within viewport
	useEffect(() => {
		function positionTooltip(badgeEl, tooltipEl) {
			if (!badgeEl || !tooltipEl) return;
			const rect = badgeEl.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const gap = 8;
			const minWidth = 260;
			const maxWidth = Math.min(960, Math.floor(vw * 0.9));
			const availableRight = vw - rect.left - gap;
			const availableLeft = rect.right - gap;
			const width = Math.max(minWidth, Math.min(maxWidth, Math.max(availableRight, availableLeft)));
			let left = Math.min(Math.max(gap, rect.left), Math.max(gap, vw - width - gap));
			let top = rect.bottom + gap;
			// Prefer placing below; if not enough space, flip above
			const approximateHeight = Math.min(520, Math.floor(vh * 0.8));
			const spaceBelow = vh - rect.bottom - gap;
			const spaceAbove = rect.top - gap;
			let maxHeight = Math.min(approximateHeight, Math.max(200, Math.floor(vh * 0.8)));
			if (spaceBelow < 200 && spaceAbove > spaceBelow) {
				// place above
				maxHeight = Math.min(maxHeight, Math.floor(spaceAbove));
				top = Math.max(gap, rect.top - maxHeight - gap);
			} else {
				maxHeight = Math.min(maxHeight, Math.floor(spaceBelow));
			}
			tooltipEl.style.left = left + 'px';
			tooltipEl.style.top = top + 'px';
			tooltipEl.style.maxHeight = Math.max(200, maxHeight) + 'px';
			tooltipEl.style.width = 'auto';
			tooltipEl.style.maxWidth = width + 'px';
		}

		function onEnter(e) {
			const wrap = e.currentTarget;
			const badge = wrap.querySelector('.citation-badge');
			const tip = wrap.querySelector('.citation-tooltip');
			if (!badge || !tip) return;
			// make visible before measuring
			tip.style.display = 'block';
			positionTooltip(badge, tip);
		}

		function onMove(e) {
			const wrap = e.currentTarget;
			const badge = wrap.querySelector('.citation-badge');
			const tip = wrap.querySelector('.citation-tooltip');
			if (!badge || !tip) return;
			positionTooltip(badge, tip);
		}

		function onLeave(e) {
			const wrap = e.currentTarget;
			const tip = wrap.querySelector('.citation-tooltip');
			if (tip) {
				tip.style.display = '';
				tip.style.left = '';
				tip.style.top = '';
				tip.style.maxHeight = '';
				tip.style.maxWidth = '';
			}
		}

		const root = contentRef.current;
		if (!root) return;
		const wraps = root.querySelectorAll('.citation-wrap');
		wraps.forEach(w => {
			w.addEventListener('mouseenter', onEnter);
			w.addEventListener('mousemove', onMove);
			w.addEventListener('mouseleave', onLeave);
		});
		function onResize() {
			wraps.forEach(w => {
				const badge = w.querySelector('.citation-badge');
				const tip = w.querySelector('.citation-tooltip');
				if (tip && badge && tip.style.display === 'block') {
					positionTooltip(badge, tip);
				}
			});
		}
		window.addEventListener('resize', onResize);
		return () => {
			wraps.forEach(w => {
				w.removeEventListener('mouseenter', onEnter);
				w.removeEventListener('mousemove', onMove);
				w.removeEventListener('mouseleave', onLeave);
			});
			window.removeEventListener('resize', onResize);
		};
	}, [activeTab]);

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
	}, [docIsValid, webIsValid]);

    // Extract references for the active tab
    const documentReferences = Array.isArray(message.documentReferences) ? message.documentReferences : [];
    const websiteReferences = Array.isArray(message.websiteReferences) ? message.websiteReferences : [];
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

    // Reverted: no citation processing or inline annotations

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
			
			<div className="tab-content" ref={contentRef}>
                {(() => {
                    function escapeRegExp(s) {
                        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    }
                    function annotateWithSupports(html, supports) {
                        if (typeof html !== 'string' || !Array.isArray(supports) || supports.length === 0) return html;
                        const sorted = [...supports]
                            .map(s => ({ ...s, text: String(s?.text || '').trim(), snippet: String(s?.snippet || s?.text || '').trim() }))
                            .filter(s => s.text && s.text.length >= 4 && Number.isFinite(s.refNumber))
                            .sort((a, b) => b.text.length - a.text.length);
                        let out = html;
                        for (const s of sorted) {
                            const num = s.refNumber;
                            const normalized = escapeRegExp(s.text).replace(/\s+/g, '\\s+');
                            const pattern = new RegExp(normalized, 'im');
                            const base = String(s.snippet || s.text || '');
                            let tooltipHtml = base
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#39;');
                            tooltipHtml = tooltipHtml
                                .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
                                .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
                                .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
                                .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                .replace(/(^|\s)\*(.+?)\*(?=\s|$)/g, '$1<em>$2</em>')
                                .replace(/`([^`]+?)`/g, '<code>$1</code>')
                                .replace(/\r?\n/g, '<br/>' );
                            // Decide alignment based on approximate position (fallback: left)
                            const alignClass = 'citation-wrap';
                            out = out.replace(pattern, (m) => `${m}<span class=\"${alignClass}\"><sup class=\"citation-badge\">${num}</sup><span class=\"citation-tooltip\">${tooltipHtml}</span></span>`);
                        }
                        return out;
                    }

                    const docSupports = Array.isArray(message.documentSupports) ? message.documentSupports : [];
                    const webSupports = Array.isArray(message.websiteSupports) ? message.websiteSupports : [];
                    const docHtmlRaw = normalizeAssistantHtml(docRaw);
                    const webHtmlRaw = normalizeAssistantHtml(webRaw);
                    const docHtml = shouldUseIframe(docHtmlRaw) ? docHtmlRaw : annotateWithSupports(docHtmlRaw, docSupports);
                    const webHtml = shouldUseIframe(webHtmlRaw) ? webHtmlRaw : annotateWithSupports(webHtmlRaw, webSupports);

                    if (activeTab === 'document') {
                        return renderHtmlOrIframe(docHtml);
                    }
                    return renderHtmlOrIframe(webHtml);
                })()}

                {/* No cited passages list: tooltips only on inline markers */}

				{/* References list - render only if present */}
                {Array.isArray(activeReferences) && activeReferences.length > 0 && (
                    <div className="references">
                        <div className="references-title"><strong>References</strong></div>
                        <ul className="references-list">
                            {activeReferences.map((ref, idx) => {
                                const uri = ref?.uri || ref?.url;
                                const title = ref?.title || uri;
                                if (!uri) return null;
                                return (
                                    <li key={`${uri}-${idx}`}>
                                        <span style={{ marginRight: 6 }}>[{idx + 1}]</span>
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

function shouldUseIframe(html) {
	if (typeof html !== 'string') return false;
	const h = html.toLowerCase();
	return h.includes('<script') || h.includes('<canvas') || h.includes('echarts') || h.includes('plotly') || h.includes('chart(') || h.includes('highcharts') || h.includes('chart.js');
}

function renderHtmlOrIframe(html) {
	if (!shouldUseIframe(html)) {
		return (
			<div
				className="tab-panel"
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	}
	return <IframeHtml html={html} />;
}

function IframeHtml({ html }) {
	const ref = useRef(null);
	const docHtml = `<!doctype html><html><head><meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<style>
			html, body {
				margin: 0;
				padding: 16px;
				background: #fff;
				color: #0f172a;
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
				width: 100%;
				height: 100%;
				box-sizing: border-box;
			}
			/* Make charts expand to iframe width */
			canvas, svg {
				display: block;
				width: 100% !important;
				height: 600px !important;
			}
		</style>
	</head><body>${html}</body></html>`;

	useEffect(() => {
		function resize() {
			try {
				const iframe = ref.current;
				if (!iframe) return;
				const doc = iframe.contentDocument;
				if (!doc) return;
				const h = Math.max(
					doc.body?.scrollHeight || 0,
					doc.documentElement?.scrollHeight || 0,
					800
				);
				iframe.style.height = h + 'px';
			} catch {}
		}
		const t = setInterval(resize, 350);
		resize();
		return () => clearInterval(t);
	}, [html]);

	return (
		<iframe
			ref={ref}
			title="graph"
			style={{
				width: '100%', 
				minWidth: '1000px',   // force wider charts        // ✅ fit inside bubble
				border: '0',
				borderRadius: '8px',
				background: '#ffffff',
				minHeight: '800px'
			}}
			sandbox="allow-scripts allow-same-origin"
			srcDoc={docHtml}
		/>
	);
}
