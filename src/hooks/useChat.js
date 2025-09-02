import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchBotReply } from '../services/openai.js';

export function useChat(onAfterUpdate) {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const endRef = useRef(null);
	const containerRef = useRef(null);
	const afterUpdateRef = useRef(onAfterUpdate);

	// Keep latest callback without re-subscribing effect
	useEffect(() => {
		afterUpdateRef.current = onAfterUpdate;
	}, [onAfterUpdate]);

	useEffect(() => {
		if (endRef.current) {
			endRef.current.scrollIntoView({ behavior: 'smooth' });
		} else if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
		if (messages && messages.length > 0) {
			try {
				afterUpdateRef.current?.(messages);
			} catch {}
		}
	}, [messages]);

	const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

	async function handleSend(e) {
		e?.preventDefault?.();
		if (!canSend) return;

		const userText = input.trim();
		setInput('');

		const userMsg = { id: crypto.randomUUID(), role: 'user', content: userText };
		const botPlaceholder = { id: crypto.randomUUID(), role: 'assistant', content: '...', pending: true };

		setMessages(prev => [...prev, userMsg, botPlaceholder]);
		setIsLoading(true);

		try {
			const reply = await fetchBotReply([...messages, userMsg]);
			setMessages(prev => prev.map(m => (m.id === botPlaceholder.id ? { ...m, content: reply || '...', pending: false } : m)));
		} catch {
			setMessages(prev => prev.map(m => (m.id === botPlaceholder.id ? { ...m, content: 'Sorry, something went wrong. Please try again.', pending: false } : m)));
		} finally {
			setIsLoading(false);
		}
	}

	function resetChat() {
		setMessages([]);
		setInput('');
	}

	return { messages, setMessages, input, setInput, isLoading, canSend, handleSend, resetChat, endRef, containerRef };
}