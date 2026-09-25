export type NodeId = string;
export type BinaryOrder = "preorder" | "inorder" | "postorder";
export type ForestOrder = "preorder" | "postorder";

export interface BinaryNode {
  id: NodeId;
  left: NodeId | null;
  right: NodeId | null;
  ltag?: number;
  rtag?: number;
}

export interface BinaryTree {
  root: NodeId | null;
  nodes: BinaryNode[];
}

export interface ForestNode {
  id: NodeId;
  children: NodeId[];
}

export interface Forest {
  roots: NodeId[];
  nodes: ForestNode[];
}

export interface TraceChange {
  from: NodeId;
  slot: "left" | "right";
  before: NodeId | null;
  after: NodeId | null;
}

export interface TraceFrame {
  curr: NodeId | null;
  prev: NodeId | null;
  pred: NodeId | null;
  output: NodeId[];
  stack: NodeId[];
  temporary: NodeId[];
  scans: number;
  nodes: BinaryNode[];
  changes: TraceChange[];
  phase: string;
  message: string;
  line: number;
}

export interface ForestTraceFrame extends TraceFrame {
  stage: number;
  rightOutput: NodeId[];
}

export type BinaryRow = readonly [NodeId, (NodeId | null)?, (NodeId | null)?];

export function binaryTree(rows: readonly BinaryRow[]): BinaryTree;
export function binaryOrder(tree: BinaryTree, order?: BinaryOrder): NodeId[];
export function threadingTrace(tree: BinaryTree): TraceFrame[];
export function morrisTrace(tree: BinaryTree): TraceFrame[];
export function flattenTrace(tree: BinaryTree): TraceFrame[];
export function forestToBinary(forest: Forest): BinaryTree;
export function forestOrder(forest: Forest, order?: ForestOrder): NodeId[];
export function forestTrace(forest: Forest, order?: ForestOrder): ForestTraceFrame[];

export const BINARY_PRESETS: Record<string, { label: string; tree: BinaryTree }>;
export const FOREST_PRESETS: Record<string, Forest & { label: string }>;
