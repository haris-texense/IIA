import React, { useState } from 'react';
import Header from './components/Header.jsx';
import SidebarHistory from './components/SidebarHistory.jsx';
import MessageList from './components/MessageList.jsx';
import ChatInput from './components/ChatInput.jsx';
import Landing from './components/Landing.jsx';
import { useSuggestedPrompts } from './hooks/useSuggestedPrompts.js';
import { useHistory } from './hooks/useHistory.js';
import { useChat } from './hooks/useChat.js';
import './styles/chat.css';

export default function Chatbot() {
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const suggestedPrompts = useSuggestedPrompts();
	const { conversations, currentConversationId, upsertCurrent, newChat, loadConversation } = useHistory();
	const { messages, setMessages, input, setInput, isLoading, canSend, handleSend, resetChat, endRef } = useChat(upsertCurrent);

	function handleNewChat() {
		resetChat();
		newChat();
	}

	function handleSelectConversation(conv) {
		const msgs = loadConversation(conv);
		if (msgs) setMessages(msgs);
		setInput('');
	}

	return (
		<div className="chat-root gradient-bg" style={{ height: '100vh' }}>
			<div className="chat-card" role="region" aria-label="Chatbot">
				<Header isHistoryOpen={isHistoryOpen} onToggleHistory={() => setIsHistoryOpen(o => !o)} isLoading={isLoading} />

				<div className="shell">
					{isHistoryOpen && (
						<SidebarHistory
							conversations={conversations}
							currentConversationId={currentConversationId}
							onNewChat={handleNewChat}
							onSelect={handleSelectConversation}
						/>
					)}
					<main className="content">
						{messages.length === 0 ? (
							<Landing
								suggestedPrompts={suggestedPrompts}
								input={input}
								setInput={setInput}
								isLoading={isLoading}
								canSend={canSend}
								onSubmit={handleSend}
							/>
						) : (
							<>
								<MessageList messages={messages} endRef={endRef} />
								<ChatInput input={input} setInput={setInput} isLoading={isLoading} canSend={canSend} onSubmit={handleSend} />
							</>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}


