import { useEffect, useRef, useState } from 'react';
import { readConversations, writeConversations, deleteConversation as storageDelete } from '../services/storage.js';

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
		if (!messages || messages.length === 0) return;
		
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
				const existingIndex = next.findIndex(c => c.id === activeId);
				if (existingIndex >= 0) {
					next[existingIndex] = { 
						...next[existingIndex], 
						title: deriveTitle(messages), 
						messages: [...messages], 
						updatedAt: now 
					};
				} else {
					next = [
						{ id: activeId, title: deriveTitle(messages), messages: [...messages], createdAt: now, updatedAt: now },
						...next,
					];
				}
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

	function removeConversation(id) {
		setConversations(prev => {
			const next = prev.filter(c => c.id !== id);
			writeConversations(next);
			storageDelete(id);
			if (currentIdRef.current === id) {
				currentIdRef.current = null;
				setCurrentConversationId(null);
			}
			return next;
		});
	}

	return { conversations, currentConversationId, upsertCurrent, newChat, loadConversation, removeConversation };
}


