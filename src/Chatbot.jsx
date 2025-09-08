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

	// Use the latest completed assistant reply to drive suggestions
	const { lastAssistantText, hasValidContext } = useMemo(() => {
		const result = { lastAssistantText: '', hasValidContext: false };
		for (let i = messages.length - 1; i >= 0; i--) {
			const m = messages[i];
			if (m?.role === 'assistant' && !m?.pending) {
				const text = (m.documentResponse || m.content || '').trim();
				const lower = text.toLowerCase();
				const containsNoDataEn = lower.includes('no data found');
				const containsNoDataAr = text.includes('لم يتم العثور على بيانات');
				result.lastAssistantText = text;
				result.hasValidContext = Boolean(text) && !containsNoDataEn && !containsNoDataAr;
				break;
			}
		}
		return result;
	}, [messages]);

	useEffect(() => {
		let aborted = false;
		(async () => {
			if (!hasValidContext) { setSuggested([]); return; }
			// strip HTML tags to keep only visible text context
			const plain = String(lastAssistantText)
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			if (!plain) { setSuggested([]); return; }
			const prompts = await fetchSuggestedPrompts(plain);
			if (!aborted) setSuggested(prompts || []);
		})();
		return () => { aborted = true; };
	}, [lastAssistantText, hasValidContext]);

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
							<MessageList messages={messages} endRef={endRef} isChartsUseCase={String(contextPrefix).toLowerCase().includes('chart')} onCreateGraph={handleCreateGraph} canCreateGraph={canCreateGraph} />
						)}
						<ChatInput input={input} setInput={setInput} isLoading={isLoading} canSend={canSend} onSubmit={handleSend} onCreateGraph={handleCreateGraph} canCreateGraph={canCreateGraph} suggestions={suggested} centered />
					</main>
				</div>
			</div>
		</div>
	);
}


