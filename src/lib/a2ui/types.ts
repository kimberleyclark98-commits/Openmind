// A2UI v0.9 TypeScript Type Definitions
// Based on https://a2ui.dev/specification/0.9/

export interface A2UIMessage {
  type: 'createSurface' | 'updateComponents' | 'updateDataModel' | 'destroySurface' | 'executeAction';
  surfaceId: string;
  timestamp: string;
  data: CreateSurfaceData | UpdateComponentsData | UpdateDataModelData | DestroySurfaceData | ExecuteActionData;
}

export interface CreateSurfaceData {
  title: string;
  description?: string;
  catalogUrl: string;
  rootComponent: string;
}

export interface UpdateComponentsData {
  components: ComponentDefinition[];
}

export interface UpdateDataModelData {
  dataModel: Record<string, any>;
}

export interface DestroySurfaceData {
  reason?: string;
}

export interface ExecuteActionData {
  actionId: string;
  parameters?: Record<string, any>;
}

export interface ComponentDefinition {
  id: string;
  componentType: string;
  properties?: Record<string, any>;
  children?: string[];
  parentId?: string;
}

export interface Surface {
  id: string;
  title: string;
  description?: string;
  catalogUrl: string;
  rootComponent: string;
  components: Record<string, ComponentDefinition>;
  dataModel: Record<string, any>;
  createdAt: Date;
}

export interface A2UIEvent {
  surfaceId: string;
  componentId: string;
  eventType: string;
  data?: any;
}

export interface A2UIAction {
  id: string;
  type: 'navigate' | 'api_call' | 'data_update' | 'custom';
  parameters: Record<string, any>;
}

// Cyberpunk theme configuration
export interface CyberpunkTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  background: string;
  text: string;
  fontFamily: string;
}

export const defaultCyberpunkTheme: CyberpunkTheme = {
  primary: '#00ffff', // Cyan
  secondary: '#ff00ff', // Magenta
  accent: '#00ff00', // Lime
  glow: '0 0 20px rgba(0, 255, 255, 0.5)',
  background: 'rgba(0, 0, 0, 0.9)',
  text: '#ffffff',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace'
};