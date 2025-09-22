import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function ChatInput({ input, setInput, isLoading, canSend, onSubmit, onCreateGraph, canCreateGraph, centered, suggestions = [], searchMode = 'kb', setSearchMode }) {
	const { t } = useLanguage();
	return (
		<form className={`chat-input${centered ? ' center-form' : ''}`} onSubmit={onSubmit}>
			<div className="input-wrap">
				<input
					type="text"
					className="textbox"
					placeholder={t('input_placeholder')}
					value={input}
					onChange={e => setInput(e.target.value)}
					autoComplete="off"
					disabled={isLoading}
				/>
				{Array.isArray(suggestions) && suggestions.length > 0 && (
					<div className="suggestions-inline" role="list">
						{suggestions.map((s, idx) => (
							<button
								key={`${idx}-${s}`}
								type="button"
								className="chip"
								onClick={() => setInput(s)}
								role="listitem"
							>
								{s}
							</button>
						))}
					</div>
				)}
				<div style={{ marginTop: 8 }}>
					<select
						className="textbox"
						style={{ width: 'auto', display: 'inline-block', borderRadius: 8, border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}
						value={searchMode}
						onChange={e => setSearchMode?.(e.target.value)}
						disabled={isLoading}
						aria-label="Search mode"
					>
						<option value="kb">SAIA Docs</option>
						<option value="web">Web Search</option>
					</select>
				</div>
			</div>
			<div className="actions">
				<button className="button" type="submit" disabled={!canSend}>{t('send')}</button>
				{/* <button className="button secondary" type="button" disabled={!canCreateGraph} onClick={onCreateGraph}>{t('create_graph')}</button> */}
			</div>
		</form>
	);
}


