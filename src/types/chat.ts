export interface Model {
  id: string;
  name: string;
  version: string;
  size: string;
  description: string;
  isInstalled: boolean;
  status?: 'downloading' | 'ready' | 'error';
  progress?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  updatedAt: Date;
}
