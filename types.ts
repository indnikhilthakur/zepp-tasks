export enum WidgetType {
  TEXT = 'TEXT',
  BUTTON = 'BUTTON',
  IMG = 'IMG',
  CIRCLE = 'CIRCLE',
  RECT = 'RECT',
  TODO_LIST = 'TODO_LIST',
  VOICE_BUTTON = 'VOICE_BUTTON'
}

export interface WidgetProps {
  // Common
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string; // Hex color
  
  // Text specific
  text?: string;
  text_size?: number;
  
  // Button specific
  normal_color?: string;
  press_color?: string;
  radius?: number;

  // Image specific
  src?: string; // In a real app this maps to a resource ID, here we act as placeholder

  // API / Task specific
  api_endpoint?: string;
  api_token_placeholder?: string;
}

export interface ZeppWidget {
  id: string;
  type: WidgetType;
  name: string;
  props: WidgetProps;
}

export interface GeneratedResponse {
  code: string;
  explanation: string;
}

// Gemini Response Schema Types
export interface AIWidgetSchema {
  type: string; 
  props: {
    x: number;
    y: number;
    w: number;
    h: number;
    text?: string;
    color?: string;
    text_size?: number;
    api_endpoint?: string;
  }
}