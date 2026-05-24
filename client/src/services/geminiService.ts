interface ChatParams {
  prompt: string;
  systemInstruction?: string;
}

export const analyzeBrainDump = async (text: string) => {
  try {
    const token = localStorage.getItem('mydesk_token');
    const response = await fetch('/api/gemini/analyze-braindump', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze brain dump');
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Brain Dump Analysis Error:', error);
    throw error;
  }
};

export const chatWithAI = async (params: ChatParams) => {
  try {
    const token = localStorage.getItem('mydesk_token');
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
