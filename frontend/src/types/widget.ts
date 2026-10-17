export interface WidgetConfig {
  bot_name: string;
  primary_color: string;
  placeholder_text: string;
  greeting_message: string;
}

export interface WidgetChatRequest {
  message: string;
  session_id?: string | null;
  visitor_id?: string | null;
}

export interface WidgetChatResponse {
  session_id: string;
  answer: string;
  sources: string[];
}
