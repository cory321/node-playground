// Connection between two nodes
export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromPort?: string; // e.g., "cat-0", "cat-1" for multi-port nodes
  toPort?: string;   // Reserved for future multi-input nodes
}

// Connection state during drag operations
export interface ConnectionDragState {
  fromId: string | null;
  toId: string | null;
  fromPort?: string | null; // Port ID when dragging from multi-port node
  toPort?: string | null;   // Port ID when dragging to multi-input node
}
