import React from 'react';

export default function Header({ isHistoryOpen, onToggleHistory, isLoading }) {
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
					<div>
						<div className="title">AI Assistant</div>
					</div>
				</div>
			</div>
			{/* <div className="header-right">
				<div className="status">
					<span className={`status-dot${isLoading ? ' loading' : ''}`} />
					{isLoading ? 'Thinking…' : 'Online'}
				</div>
			</div> */}
		</div>
	);
}


