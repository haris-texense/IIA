import React from 'react';

export default function MessageList({ messages, endRef }) {
	return (
		<div className="chat-messages">
			{messages.map(m => (
				<div key={m.id} className={`row ${m.role === 'user' ? 'user-wrap' : ''}`}>
					{m.role === 'assistant' && <div className="avatar bot" title="Assistant">AI</div>}
					<div className={`${m.role === 'user' ? 'user' : 'bot'}`}>
						<div className="bubble">
							{m.pending ? <span className="loading-dot">...</span> : m.content}
						</div>
					</div>
					{m.role === 'user' && <div className="avatar user" title="You">U</div>}
				</div>
			))}
			<div ref={endRef} />
		</div>
	);
}


