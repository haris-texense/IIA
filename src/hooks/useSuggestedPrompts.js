import { useEffect, useState } from 'react';

export function useSuggestedPrompts() {
	const [suggestedPrompts, setSuggestedPrompts] = useState([]);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/suggested-prompts.json');
				if (!res.ok) throw new Error('Failed to load suggestions');
				const data = await res.json();
				if (Array.isArray(data)) setSuggestedPrompts(data.slice(0, 5));
			} catch {
				setSuggestedPrompts([]);
			}
		})();
	}, []);

	return suggestedPrompts;
}


