/**
 * ConstructionPM - Shared Types
 * Core entity definitions (NO business logic, NO Prisma dependencies)
 */

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  FOREMAN: 'FOREMAN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ============================================================================
// TASK STATUSES
// ============================================================================

export const TASK_STATUSES = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

// ============================================================================
// PROJECT STATUSES
// ============================================================================

export const PROJECT_STATUSES = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

// ============================================================================
// EMPLOYEE STATUSES
// ============================================================================

export const EMPLOYEE_STATUSES = {
  ACTIVE: 'ACTIVE',
  ON_VACATION: 'ON_VACATION',
  ON_SICK_LEAVE: 'ON_SICK_LEAVE',
  INACTIVE: 'INACTIVE',
} as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[keyof typeof EMPLOYEE_STATUSES];

// ============================================================================
// EQUIPMENT STATUSES
// ============================================================================

export const EQUIPMENT_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
} as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[keyof typeof EQUIPMENT_STATUSES];

// ============================================================================
// CONSTRUCTION SITE STATUS
// ============================================================================

export const SITE_STATUSES = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
} as const;

export type SiteStatus = (typeof SITE_STATUSES)[keyof typeof SITE_STATUSES];

// ============================================================================
// BASE ENTITIES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER (без passwordHash - security best practice)
// ============================================================================

export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

// ============================================================================
// CONSTRUCTION SITE
// ============================================================================

export interface ConstructionSite extends BaseEntity {
  name: string;
  address: string;
  city: string;
  region?: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  status: SiteStatus;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

// ============================================================================
// PROJECT
// ============================================================================

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  status: ProjectStatus;
  constructionSiteId: string;
  constructionSite?: ConstructionSite;
  managerId: string;
  manager?: User;
  startDate: Date;
  endDate?: Date;
  budget?: number; // хранить в минорных единицах (копейки/центы)
  currency?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============================================================================
// WORK TYPE
// ============================================================================

export interface WorkType extends BaseEntity {
  name: string;
  code: string; // уникальный код для интеграций
  description?: string;
  unit: string; // 'm2', 'hours', 'pieces'
  defaultRate?: number;
  category: 'CONSTRUCTION' | 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'FINISHING' | 'OTHER';
}

// ============================================================================
// TEAM
// ============================================================================

export interface Team extends BaseEntity {
  name: string;
  description?: string;
  leaderId: string;
  leader?: User;
  projectId?: string;
  project?: Project;
  memberCount: number;
}

// ============================================================================
// EMPLOYEE (расширенные данные работника)
// ============================================================================

export interface Employee extends BaseEntity {
  userId: string;
  user?: User;
  tabNumber: string; // табельный номер
  position: string;
  department?: string;
  hireDate: Date;
  status: EmployeeStatus;
  teamId?: string;
  team?: Team;
  hourlyRate?: number;
  skills: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// ============================================================================
// TASK
// ============================================================================

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectId: string;
  project?: Project;
  workTypeId?: string;
  workType?: WorkType;
  assigneeId?: string;
  assignee?: User;
  teamId?: string;
  team?: Team;
  parentId?: string;
  parent?: Task;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress: number; // 0-100
  location?: {
    constructionSiteId: string;
    zone?: string;
    floor?: string;
    room?: string;
  };
  dependencies?: string[]; // ID зависимых задач
  attachments?: Attachment[];
}

// ============================================================================
// EQUIPMENT
// ============================================================================

export interface Equipment extends BaseEntity {
  name: string;
  model?: string;
  serialNumber?: string;
  type: 'VEHICLE' | 'MACHINERY' | 'TOOL' | 'SAFETY' | 'OTHER';
  status: EquipmentStatus;
  purchaseDate?: Date;
  warrantyEndDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  location?: string;
  assignedToId?: string;
  assignedTo?: Employee;
  projectId?: string;
  project?: Project;
  specifications?: Record<string, unknown>;
}

// ============================================================================
// ATTACHMENT
// ============================================================================

export interface Attachment extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  uploadedBy: User;
  taskId?: string;
  task?: Task;
  projectId?: string;
  project?: Project;
}

// ============================================================================
// COMMENT
// ============================================================================

export interface Comment extends BaseEntity {
  content: string;
  authorId: string;
  author: User;
  taskId?: string;
  task?: Task;
  projectId?: string;
  project?: Project;
  parentId?: string;
  parent?: Comment;
  isEdited: boolean;
}

// ============================================================================
// NOTIFICATION
// ============================================================================

export interface Notification extends BaseEntity {
  userId: string;
  user: User;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'DEADLINE_APPROACHING' | 'COMMENT' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  relatedEntity?: {
    type: 'TASK' | 'PROJECT' | 'USER';
    id: string;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};