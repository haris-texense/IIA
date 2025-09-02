import React from 'react';

export default function SidebarHistory({ conversations, currentConversationId, onNewChat, onSelect }) {
	return (
		<aside className="sidebar" aria-label="Sidebar">
			<div className="sidebar-header">
				{/* <div className="tabs">
					<span className="tab active">History</span>
				</div> */}
				<div className="sidebar-actions">
					<button className="button secondary" type="button" onClick={onNewChat}>New chat</button>
				</div>
			</div>
			<div className="history-list">
				{conversations.map(conv => (
					<button
						key={conv.id}
						className={`adaptive-card card-button${currentConversationId === conv.id ? ' active' : ''}`}
						onClick={() => onSelect(conv)}
						title={conv.title}
					>
						<div className="history-title">{conv.title || 'Untitled chat'}</div>
					</button>
				))}
			</div>
		</aside>
	);
}


