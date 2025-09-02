import { useEffect, useRef, useState } from 'react';
import { readConversations, writeConversations } from '../services/storage.js';

export function useHistory() {
	const [conversations, setConversations] = useState([]);
	const [currentConversationId, setCurrentConversationId] = useState(null);
	const currentIdRef = useRef(null);

	useEffect(() => {
		setConversations(readConversations());
	}, []);

	function deriveTitle(messages) {
		const firstUser = (messages || []).find(m => m.role === 'user');
		const base = firstUser?.content?.trim() || 'New chat';
		return base.length > 60 ? `${base.slice(0, 57)}…` : base;
	}

	function upsertCurrent(messages) {
		const now = Date.now();
		setConversations(prev => {
			let next = Array.isArray(prev) ? [...prev] : [];
			let activeId = currentIdRef.current || currentConversationId;
			if (!activeId) {
				activeId = crypto.randomUUID();
				currentIdRef.current = activeId;
				setCurrentConversationId(activeId);
				next = [
					{ id: activeId, title: deriveTitle(messages), messages: [...messages], createdAt: now, updatedAt: now },
					...next,
				];
			} else {
				next = next.map(c =>
					c.id === activeId
						? { ...c, title: deriveTitle(messages), messages: [...messages], updatedAt: now }
						: c,
				);
			}
			writeConversations(next);
			return next;
		});
	}

	function newChat() {
		currentIdRef.current = null;
		setCurrentConversationId(null);
	}

	function loadConversation(conv) {
		if (!conv) return;
		currentIdRef.current = conv.id;
		setCurrentConversationId(conv.id);
		return Array.isArray(conv.messages) ? conv.messages : [];
	}

	return { conversations, currentConversationId, upsertCurrent, newChat, loadConversation };
}


