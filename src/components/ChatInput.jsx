import React from 'react';

export default function ChatInput({ input, setInput, isLoading, canSend, onSubmit, centered }) {
	return (
		<form className={`chat-input${centered ? ' center-form' : ''}`} onSubmit={onSubmit}>
			<div className="input-wrap">
				<input
					type="text"
					className="textbox"
					placeholder="Type your message and press Enter..."
					value={input}
					onChange={e => setInput(e.target.value)}
					autoComplete="off"
					disabled={isLoading}
				/>
			</div>
			<div className="actions">
				<button className="button" type="submit" disabled={!canSend}>Send</button>
			</div>
		</form>
	);
}


