
export enum AgentName {
  USER = 'User',
  AURA = 'Aura',
  MUSE = 'Muse',
  SORA = 'Sora',
  GEMINI = 'Gemini',
  SYSTEM = 'System',
}

export interface ChatMessage {
  id: string;
  sender: AgentName;
  text: string;
  imageUrl?: string;
  isGenerating?: boolean;
  prompts?: string[];
  questions?: string[];
}