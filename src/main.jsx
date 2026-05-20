import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

Sentry.init({
  dsn: 'https://bdde764e9756f8bde7e4ce053ea5c6a5@o4511253268791296.ingest.de.sentry.io/4511253280915536',
  environment: 'production',
  integrations: [],
  tracesSampleRate: 0.05,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
