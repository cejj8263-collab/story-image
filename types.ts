
export interface Scene {
  id: string;
  originalText: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  errorMsg?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  imageBase64: string | null;
  mimeType: string | null;
}

export type AspectRatio = '16:9' | '9:16';

export type Theme = 'economic' | 'joseon';

export enum GenerationStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}
