import { useEffect, useState } from 'react';

export function useSuggestedPrompts() {
	const [useCases, setUseCases] = useState([]);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/suggested-prompts.json');
				if (!res.ok) throw new Error('Failed to load suggestions');
				const data = await res.json();
				if (Array.isArray(data)) {
					const normalized = data
						.filter(item => item && typeof item.use_case === 'string' && Array.isArray(item.example_intents))
						.map(item => ({ 
							useCase: item.use_case, 
							intents: item.example_intents.filter(x => typeof x === 'string'),
							prompts: Array.isArray(item.prompts) ? item.prompts.filter(x => typeof x === 'string') : []
						}));
					setUseCases(normalized);
				}
			} catch {
				setUseCases([]);
			}
		})();
	}, []);

	return useCases;
}


