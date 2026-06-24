interface ChatParams {
  prompt: string;
  systemInstruction?: string;
}


export const chatWithAI = async (params: ChatParams) => {
  try {
    const token = sessionStorage.getItem('taskstudio_token') || localStorage.getItem('taskstudio_token');
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to communicate with AI');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
};
