export default async function handler() {
  return Response.json({
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        defaultModel: 'gemini-3.5-flash-lite',
        models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash'],
        hasServerKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
      },
      {
        id: 'openai',
        name: 'OpenAI',
        defaultModel: 'gpt-4o-mini',
        models: ['gpt-4o-mini', 'gpt-4o'],
        hasServerKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
      },
      {
        id: 'claude',
        name: 'Anthropic Claude',
        defaultModel: 'claude-sonnet-4-20250514',
        models: ['claude-sonnet-4-20250514', 'claude-haiku-35-20241022'],
        hasServerKey: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      },
    ],
  });
}
