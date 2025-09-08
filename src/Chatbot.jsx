import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import SidebarHistory from './components/SidebarHistory.jsx';
import MessageList from './components/MessageList.jsx';
import ChatInput from './components/ChatInput.jsx';
import Landing from './components/Landing.jsx';
import { useSuggestedPrompts } from './hooks/useSuggestedPrompts.js';
import { useHistory } from './hooks/useHistory.js';
import { useChat } from './hooks/useChat.js';
import { fetchSuggestedPrompts } from './services/openai.js';
import './styles/chat.css';

export default function Chatbot() {
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [contextPrefix, setContextPrefix] = useState('');
	const useCases = useSuggestedPrompts();
	const { conversations, currentConversationId, upsertCurrent, newChat, loadConversation, removeConversation } = useHistory();
	const { messages, setMessages, input, setInput, isLoading, canSend, canCreateGraph, handleSend, handleSendPrompt, handleCreateGraph, resetChat, endRef } = useChat(upsertCurrent, contextPrefix);
	const [suggested, setSuggested] = useState([]);

	const lastUserText = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i]?.role === 'user') return messages[i]?.content || '';
		}
		return '';
	}, [messages]);

	useEffect(() => {
		let aborted = false;
		(async () => {
			if (!lastUserText || lastUserText.trim().length === 0) { setSuggested([]); return; }
			const prompts = await fetchSuggestedPrompts(lastUserText.trim());
			if (!aborted) setSuggested(prompts || []);
		})();
		return () => { aborted = true; };
	}, [lastUserText]);

	function handleNewChat() {
		// Save current conversation before starting new one
		if (messages.length > 0) {
			upsertCurrent(messages);
		}
		
		resetChat();
		newChat();
		setContextPrefix('');
	}

	function handleSelectConversation(conv) {
		// Save current conversation before loading another one
		if (messages.length > 0) {
			upsertCurrent(messages);
		}
		
		const msgs = loadConversation(conv);
		if (msgs) setMessages(msgs);
		setInput('');
	}

	function handleDeleteConversation(id) {
		removeConversation(id);
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
							onDelete={handleDeleteConversation}
						/>
					)}
					<main className="content">
						{messages.length === 0 ? (
							<Landing
								useCases={useCases}
								onSelectContext={setContextPrefix}
								setInput={setInput}
								onSubmit={handleSend}
								onSendPrompt={handleSendPrompt}
							/>
						) : (
							<MessageList messages={messages} endRef={endRef} />
						)}
						<ChatInput input={input} setInput={setInput} isLoading={isLoading} canSend={canSend} onSubmit={handleSend} onCreateGraph={handleCreateGraph} canCreateGraph={canCreateGraph} suggestions={suggested} />
					</main>
				</div>
			</div>
		</div>
	);
}


