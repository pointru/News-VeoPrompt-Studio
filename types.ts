
export enum OutputMode {
  NORMAL = 'normal',
  JSON = 'json',
  BOTH = 'keduanya'
}

export interface MultimediaSource {
  data: string; // base64
  mimeType: string;
}

export interface PromptRequest {
  text: string;
  image?: MultimediaSource;
  video?: MultimediaSource;
  mode: OutputMode;
}

export interface ProjectOutput {
  program_name: string;
  project_title: string;
  total_clips: number;
  // Added summary_points to hold key news insights
  summary_points?: string[];
  clips: Array<{
    clip_id: number;
    duration: string;
    tone_of_voice: string;
    dialogue: string;
    visual_action: string;
    camera_logic?: string;
    insert_point: {
      time: string;
      position: string;
      content: string;
    };
    veo3_prompt: string;
  }>;
}
