import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const savedTheme = window.localStorage.getItem('powershare-theme');
const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = initialTheme;
document.documentElement.lang = window.localStorage.getItem('powershare-language') === 'my' ? 'my' : 'en';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
