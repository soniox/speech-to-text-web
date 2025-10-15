export interface SpeechToTextAPIRequest {
  api_key: string;
  model: string;
  audio_format?: string;
  sample_rate?: number;
  num_channels?: number;
  language_hints?: string[];
  context?: Context;
  enable_speaker_diarization?: boolean;
  enable_language_identification?: boolean;
  enable_endpoint_detection?: boolean;
  client_reference_id?: string;
  translation?: TranslationConfig;
}

export type Context =
  // Context is an object for model v3 and higher.
  | {
      general?: { key: string; value: string }[];
      text?: string;
      terms?: string[];
      translation_terms?: { source: string; target: string }[];
    }
  // Context is a string for older model versions.
  | string;

export type TranslationConfig =
  | {
      type: 'one_way';
      target_language: string;
    }
  | {
      type: 'two_way';
      language_a: string;
      language_b: string;
    };

export type TranslationStatus = 'original' | 'translation' | 'none';

export interface Token {
  text: string;
  start_ms?: number;
  end_ms?: number;
  confidence: number;
  is_final: boolean;
  speaker?: string;
  translation_status?: TranslationStatus;
  language?: string;
  source_language?: string;
}

export interface SpeechToTextAPIResponse {
  text: string;
  tokens: Token[];
  final_audio_proc_ms: number;
  total_audio_proc_ms: number;
  finished?: boolean;
  error_code?: number;
  error_message?: string;
}
