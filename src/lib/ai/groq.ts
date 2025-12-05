import { createOpenAI } from '@ai-sdk/openai';

// Create Groq client using OpenAI-compatible interface
export const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Model to use for predictions - Llama 3.1 70B is fast and powerful
export const GROQ_MODEL = 'llama-3.1-70b-versatile';
