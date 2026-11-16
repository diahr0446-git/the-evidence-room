import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
const isGithubPages = (globalThis as any).process?.env?.GITHUB_PAGES === 'true';
export default defineConfig({base:isGithubPages?'/the-evidence-room/':'/',plugins:[react()],server:{port:5173}});
