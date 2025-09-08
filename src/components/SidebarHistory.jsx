import React from 'react';

export default function SidebarHistory({ conversations, currentConversationId, onNewChat, onSelect, onDelete }) {
	return (
		<aside className="sidebar" aria-label="Sidebar">
			<div className="sidebar-header">
			 <div className="tabs">
					<span className="tab active">History</span>
				</div> 
				<div className="sidebar-actions">
					<button className="button secondary" type="button" onClick={onNewChat}>New chat</button>
				</div>
			</div>
			<div className="history-list">
				{conversations.map(conv => (
					<div key={conv.id} className={`history-item history-card${currentConversationId === conv.id ? ' active' : ''}`} title={conv.title}>
						<button
							title="Delete"
							className="history-delete"
							onClick={(e) => { e.stopPropagation?.(); onDelete?.(conv.id); }}
							aria-label={`Delete ${conv.title}`}
						>
							<span aria-hidden>✕</span>
						</button>
						<button
							onClick={() => onSelect?.(conv)}
							className="history-item-button"
						>
							<div className="history-title">{conv.title || 'Untitled chat'}</div>
						</button>
					</div>
				))}
			</div>
		</aside>
	);
}


