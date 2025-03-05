export interface SpeechToTextAPIRequest {
  api_key: string;

  model: string;

  // TODO: are these all optional?
  audio_format?: string;
  sample_rate?: number;
  num_channels?: number;

  language_hints?: string[];
  enable_speaker_tags?: boolean;
  enable_language_tags?: boolean;
  enable_acoustic_tags?: boolean;
  context?: string;
}

export interface Token {
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
}

export interface SpeechToTextAPIResponse {
  text: string;
  tokens: Token[];
  finished?: boolean;
  error_code?: number;
  error_message?: string;
}
