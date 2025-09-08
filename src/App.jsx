import React from 'react';
import Chatbot from './Chatbot.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';

export default function App() {
	return (
		<div style={{ height: '100vh' }}>
			<LanguageProvider>
				<Chatbot />
			</LanguageProvider>
		</div>
	);
}

