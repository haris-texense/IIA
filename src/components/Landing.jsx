import React from 'react';
import ChatInput from './ChatInput.jsx';
import SuggestedPromptCard from './SuggestedPromptCard.jsx';

export default function Landing({ suggestedPrompts, input, setInput, isLoading, canSend, onSubmit }) {
	const fallbacks = [
		{ title: 'Analyze this text and make suggestions on how to improve...', subtitle: 'Sharpen your writing' },
		{ title: 'Summarize this text', subtitle: 'Get the gist fast' },
		{ title: 'Write a professional email to schedule a meeting', subtitle: 'Draft in seconds' },
		{ title: 'Explain this concept in simple terms', subtitle: 'Teach like I’m five' },
		{ title: 'Generate test cases for a login form', subtitle: 'QA-ready scenarios' }
	];

	const prompts = suggestedPrompts?.length
		? suggestedPrompts.map(p => ({ title: p, subtitle: '' }))
		: fallbacks;

	return (
		<div className="landing">
			<div className="landing-inner">
				<div className="landing-title">Welcome! How can I help you today?</div>
				<ChatInput input={input} setInput={setInput} isLoading={isLoading} canSend={canSend} onSubmit={onSubmit} centered />
				<div className="card-grid" aria-live="polite">
					{prompts.map((p, idx) => (
						<SuggestedPromptCard key={idx} text={p.title} subtitle={p.subtitle} onClick={() => setInput(p.title)} />
					))}
				</div>
			</div>
		</div>
	);
}


