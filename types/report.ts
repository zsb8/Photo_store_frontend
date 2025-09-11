export enum ComponentType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table'
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: string;
  height: string;
}

export interface TextData {
  content: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageData {
  url: string;
  position: 'left' | 'right';
  width?: number;
  height?: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ReportComponent {
  id: string;
  type: ComponentType;
  data: TextData | ImageData | TableData;
  position: Position;
  size: Size;
} 