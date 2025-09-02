import React from 'react';

export default function SuggestedPromptCard({ text, onClick, subtitle }) {
	return (
		<button className="adaptive-card card-button" type="button" onClick={onClick}>
			<span className="card-icon" aria-hidden>
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
			</span>
			<div className="card-text">{text}</div>
			{subtitle ? <div className="card-subtitle">{subtitle}</div> : null}
		</button>
	);
}


