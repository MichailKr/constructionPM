// ConstructionPM Shared Package
// Common types, utilities, and constants

export const APP_VERSION = '0.1.0';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'worker';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  assignedTo?: string;
  dueDate?: Date;
}

// Core types
export * from './types.js';

// API types and DTOs
export * from './api-types.js';

// Import specific types for utility definitions
import type { ApiResponse } from './api-types.js';

// Version
export const PACKAGE_VERSION = '0.1.0' as const;

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<ApiResponse<T>>;