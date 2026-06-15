export const TOPIC_SLUGS: { [key: string]: string } = {
  "two-pointer-patterns": "I. Two Pointer Patterns",
  "sliding-window-patterns": "II. Sliding Window Patterns",
  "tree-traversal-patterns": "III. Tree Traversal Patterns (DFS & BFS)",
  "graph-traversal-patterns": "IV. Graph Traversal Patterns (DFS & BFS)",
  "dynamic-programming-patterns": "V. Dynamic Programming (DP) Patterns",
  "heap-patterns": "VI. Heap (Priority Queue) Patterns",
  "backtracking-patterns": "VII. Backtracking Patterns",
  "greedy-patterns": "VIII. Greedy Patterns",
  "binary-search-patterns": "IX. Binary Search Patterns",
  "stack-patterns": "X. Stack Patterns",
  "bit-manipulation-patterns": "XI. Bit Manipulation Patterns",
  "linked-list-patterns": "XII. Linked List Manipulation Patterns",
  "array-matrix-patterns": "XIII. Array/Matrix Manipulation Patterns",
  "string-manipulation-patterns": "XIV. String Manipulation Patterns",
  "design-patterns": "XV. Design Patterns"
};

export const TOPIC_DISPLAY_NAMES: { [key: string]: string } = {
  "two-pointer-patterns": "Two Pointer Patterns",
  "sliding-window-patterns": "Sliding Window Patterns",
  "tree-traversal-patterns": "Tree Traversal Patterns",
  "graph-traversal-patterns": "Graph Traversal Patterns",
  "dynamic-programming-patterns": "Dynamic Programming Patterns",
  "heap-patterns": "Heap Patterns",
  "backtracking-patterns": "Backtracking Patterns",
  "greedy-patterns": "Greedy Patterns",
  "binary-search-patterns": "Binary Search Patterns",
  "stack-patterns": "Stack Patterns",
  "bit-manipulation-patterns": "Bit Manipulation Patterns",
  "linked-list-patterns": "Linked List Patterns",
  "array-matrix-patterns": "Array / Matrix Patterns",
  "string-manipulation-patterns": "String Manipulation Patterns",
  "design-patterns": "Design Patterns"
};

export function slugifyPattern(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s&-]/g, "")
    .replace(/&/g, "and")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugifyTopic(dbName: string): string {
  if (!dbName) return "";
  const match = Object.entries(TOPIC_SLUGS).find(([_, value]) => value === dbName);
  if (match) return match[0];
  
  return dbName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s&-]/g, "")
    .replace(/&/g, "and")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
