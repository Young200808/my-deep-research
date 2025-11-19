export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isThinking?: boolean; // For UI indication
}

export interface Source {
  title: string;
  url: string;
}

export interface ResearchState {
  topic: string;
  status: 'idle' | 'researching' | 'streaming' | 'completed' | 'error';
  reportContent: string;
  sources: Source[];
  lastUpdated: number;
}

export interface StreamChunk {
  text: string;
  sources?: Source[];
}