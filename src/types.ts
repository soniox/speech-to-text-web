export interface SpeechToTextAPIRequest {
  api_key: string;
  model: string;
  audio_format?: string;
  sample_rate?: number;
  num_channels?: number;
  language_hints?: string[];
  context?: string;
  enable_speaker_diarization?: boolean;
  max_non_final_tokens_duration_ms?: number;
  client_reference_id?: string;
}

export interface Token {
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  is_final: boolean;
  speaker?: string;
  language_code?: string;
}

export interface SpeechToTextAPIResponse {
  text: string;
  tokens: Token[];
  finished?: boolean;
  error_code?: number;
  error_message?: string;
}
