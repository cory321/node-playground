// Connection between two nodes
export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

// Connection state during drag operations
export interface ConnectionDragState {
  fromId: string | null;
  toId: string | null;
}
