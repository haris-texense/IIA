import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchBotReply, fetchFallbackReply, fetchGraphReply } from '../services/openai.js';

export function useChat(onAfterUpdate, contextPrefix = '') {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const endRef = useRef(null);
	const containerRef = useRef(null);
	const afterUpdateRef = useRef(onAfterUpdate);
	const contextPrefixRef = useRef(contextPrefix);

	// Keep latest callback without re-subscribing effect
	useEffect(() => {
		afterUpdateRef.current = onAfterUpdate;
	}, [onAfterUpdate]);

	useEffect(() => {
		contextPrefixRef.current = contextPrefix || '';
	}, [contextPrefix]);

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
	const canCreateGraph = useMemo(() => {
		if (isLoading) return false;
		for (let i = messages.length - 1; i >= 0; i--) {
			const m = messages[i];
			if (m.role === 'assistant' && !m.pending && (m.content || '').trim().length > 0) return true;
		}
		return false;
	}, [messages, isLoading]);

	async function internalSendWithUserText(baseMessage, useCase) {
		const prevMessages = [...messages];
		const userMsgUI = { id: crypto.randomUUID(), role: 'user', content: baseMessage };
		const botPlaceholder = { 
			id: crypto.randomUUID(), 
			role: 'assistant', 
			content: 'Thinking...', 
			pending: true,
			documentResponse: null,
			websiteResponse: null
		};

		setMessages(prev => [...prev, userMsgUI, botPlaceholder]);
		setIsLoading(true);

		try {
			const enrichedText = useCase && useCase.trim().length > 0
				? `For the context, ${useCase}, Act as an Internal Auditor and ${baseMessage}`
				: baseMessage;
			const apiUserMsg = { id: crypto.randomUUID(), role: 'user', content: enrichedText };
			const conversationForApi = [...prevMessages, apiUserMsg];

			// Make both API calls in parallel
			const [primaryReply, fallbackReply] = await Promise.all([
				fetchBotReply(conversationForApi),
				fetchFallbackReply(conversationForApi)
			]);

			// Normalize responses to expected shapes
			const primaryText = primaryReply?.text ?? (typeof primaryReply === 'string' ? primaryReply : '');
			const primaryRefs = Array.isArray(primaryReply?.references) ? primaryReply.references : [];
			const fallbackText = fallbackReply?.text ?? (typeof fallbackReply === 'string' ? fallbackReply : '');
			const fallbackRefs = Array.isArray(fallbackReply?.references) ? fallbackReply.references : [];

			// Update the message with both responses
			setMessages(prev => prev.map(m => 
				m.id === botPlaceholder.id 
					? { 
						...m, 
						content: primaryText || '...', 
						documentResponse: primaryText || '',
						websiteResponse: fallbackText || '',
						documentReferences: primaryRefs,
						websiteReferences: fallbackRefs,
						pending: false 
					} 
					: m
			));
		} catch (error) {
			console.error("API calls failed:", error);
			setMessages(prev => prev.map(m => 
				m.id === botPlaceholder.id 
					? { 
						...m, 
						content: 'Sorry, something went wrong. Please try again.', 
						documentResponse: 'Error occurred while fetching document response.',
						websiteResponse: 'Error occurred while fetching website response.',
						pending: false 
					} 
					: m
			));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleSend(e) {
		e?.preventDefault?.();
		if (!canSend) return;

		const useCase = contextPrefixRef.current?.trim();
		const baseMessage = input.trim();

		setInput('');

		await internalSendWithUserText(baseMessage, useCase);
	}

	// Send provided prompt immediately, without touching the textbox
	async function handleSendPrompt(promptText) {
		if (!promptText || isLoading) return;
		const useCase = contextPrefixRef.current?.trim();
		const baseMessage = promptText.trim();
		await internalSendWithUserText(baseMessage, useCase);
	}

	async function handleCreateGraph(e) {
		e?.preventDefault?.();
		if (!canCreateGraph) return;

		// Use the last completed assistant reply as the input for graph generation
		let replyText = '';
		for (let i = messages.length - 1; i >= 0; i--) {
			const m = messages[i];
			if (m.role === 'assistant' && !m.pending) {
				// Prefer documentResponse if available, otherwise fall back to content
				replyText = (m.documentResponse || m.content || '').trim();
				break;
			}
		}
		if (!replyText) return;

		// Prepare a virtual user message for the API call only (do not render in UI)
		const userMsg = { id: crypto.randomUUID(), role: 'user', content: replyText };
		const botPlaceholder = { 
			id: crypto.randomUUID(), 
			role: 'assistant', 
			content: 'Generating chart...', 
			pending: true,
			documentResponse: null,
			websiteResponse: null
		};

		// Only show the assistant placeholder in the UI
		setMessages(prev => [...prev, botPlaceholder]);
		setIsLoading(true);

		try {
			const primaryReply = await fetchGraphReply([...messages, userMsg]);
			const graphText = primaryReply?.text ?? (typeof primaryReply === 'string' ? primaryReply : '');
			setMessages(prev => prev.map(m => 
				m.id === botPlaceholder.id 
					? { 
						...m, 
						content: graphText || '...', 
						documentResponse: graphText || '',
						websiteResponse: '',
						pending: false 
					} 
					: m
			));
		} catch (error) {
			console.error("Graph generation failed:", error);
			setMessages(prev => prev.map(m => 
				m.id === botPlaceholder.id 
					? { 
						...m, 
						content: 'Sorry, something went wrong while generating the chart. Please try again.', 
						documentResponse: 'Error occurred while generating chart.',
						websiteResponse: '',
						pending: false 
					} 
					: m
			));
		} finally {
			setIsLoading(false);
		}
	}

	function resetChat() {
		setMessages([]);
		setInput('');
	}

	return { messages, setMessages, input, setInput, isLoading, canSend, canCreateGraph, handleSend, handleSendPrompt, handleCreateGraph, resetChat, endRef, containerRef };
}