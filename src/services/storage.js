import { STORAGE_KEY } from '../constants/index.js';

export function readConversations() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const data = raw ? JSON.parse(raw) : [];
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}

export function writeConversations(conversations) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
	} catch {}
}

export function deleteConversation(id) {
	try {
		const list = readConversations();
		const next = list.filter(c => c.id !== id);
		writeConversations(next);
		return next;
	} catch {
		return readConversations();
	}
}


