/**
 * ConstructionPM - API Types
 * Unified API response format and DTOs for REST/WebSocket
 */

import type {
  User,
  UserRole,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  ConstructionSite,
  SiteStatus,
  WorkType,
  Team,
  Employee,
  EmployeeStatus,
  Equipment,
  EquipmentStatus,
  Comment,
  Notification,
  Attachment,
} from './types.js';

// ============================================================================
// UNIFIED API RESPONSE FORMAT
// ============================================================================

export interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
  timestamp?: string; // ISO 8601
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: Required<Pick<ApiMeta, 'total' | 'page' | 'pageSize' | 'totalPages'>>;
}

// ============================================================================
// ERROR CODES (для согласованной обработки на клиенте)
// ============================================================================

export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================================
// AUTH DTOs
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole; // по умолчанию EMPLOYEE
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// USER DTOs
// ============================================================================

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserResponse {
  user: User;
}

export type UsersListResponse = PaginatedResponse<User>;

// ============================================================================
// PROJECT DTOs
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  constructionSiteId: string;
  managerId: string;
  startDate: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  endDate?: string;
  budget?: number; // в минорных единицах (копейки)
  currency?: string; // 'RUB', 'USD'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ProjectResponse {
  project: Project;
}

export type ProjectsListResponse = PaginatedResponse<Project>;

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalEmployees: number;
  progress: number; // 0-100
  budgetUsed: number;
  budgetTotal: number;
}

// ============================================================================
// TASK DTOs
// ============================================================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  workTypeId?: string;
  assigneeId?: string;
  teamId?: string;
  parentId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  progress?: number; // 0-100
  location?: {
    constructionSiteId: string;
    zone?: string;
    floor?: string;
    room?: string;
  };
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string;
  teamId?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  location?: {
    constructionSiteId: string;
    zone?: string;
    floor?: string;
    room?: string;
  };
}

export interface TaskResponse {
  task: Task;
}

export type TasksListResponse = PaginatedResponse<Task>;

export interface TaskFilter {
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  teamId?: string;
  workTypeId?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

// ============================================================================
// CONSTRUCTION SITE DTOs
// ============================================================================

export interface CreateConstructionSiteRequest {
  name: string;
  address: string;
  city: string;
  region?: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface UpdateConstructionSiteRequest {
  name?: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  status?: SiteStatus;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ConstructionSiteResponse {
  constructionSite: ConstructionSite;
}

export type ConstructionSitesListResponse = PaginatedResponse<ConstructionSite>;

// ============================================================================
// WORK TYPE DTOs
// ============================================================================

export interface CreateWorkTypeRequest {
  name: string;
  code: string;
  description?: string;
  unit: string; // 'm2', 'hours', 'pieces'
  defaultRate?: number;
  category: 'CONSTRUCTION' | 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'FINISHING' | 'OTHER';
}

export interface UpdateWorkTypeRequest {
  name?: string;
  description?: string;
  unit?: string;
  defaultRate?: number;
  category?: 'CONSTRUCTION' | 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'FINISHING' | 'OTHER';
}

export interface WorkTypeResponse {
  workType: WorkType;
}

export type WorkTypesListResponse = PaginatedResponse<WorkType>;

// ============================================================================
// TEAM DTOs
// ============================================================================

export interface CreateTeamRequest {
  name: string;
  description?: string;
  leaderId: string;
  projectId?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  leaderId?: string;
  projectId?: string;
}

export interface TeamResponse {
  team: Team;
}

export type TeamsListResponse = PaginatedResponse<Team>;

export interface AddTeamMemberRequest {
  employeeId: string;
}

export interface RemoveTeamMemberRequest {
  employeeId: string;
}

// ============================================================================
// EMPLOYEE DTOs
// ============================================================================

export interface CreateEmployeeRequest {
  userId: string;
  tabNumber: string;
  position: string;
  department?: string;
  hireDate: string;
  teamId?: string;
  hourlyRate?: number;
  skills: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UpdateEmployeeRequest {
  position?: string;
  department?: string;
  status?: EmployeeStatus;
  teamId?: string;
  hourlyRate?: number;
  skills?: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface EmployeeResponse {
  employee: Employee;
}

export type EmployeesListResponse = PaginatedResponse<Employee>;

// ============================================================================
// EQUIPMENT DTOs
// ============================================================================

export interface CreateEquipmentRequest {
  name: string;
  model?: string;
  serialNumber?: string;
  type: 'VEHICLE' | 'MACHINERY' | 'TOOL' | 'SAFETY' | 'OTHER';
  purchaseDate?: string;
  warrantyEndDate?: string;
  specifications?: Record<string, unknown>;
}

export interface UpdateEquipmentRequest {
  name?: string;
  model?: string;
  serialNumber?: string;
  status?: EquipmentStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  location?: string;
  assignedToId?: string;
  projectId?: string;
  specifications?: Record<string, unknown>;
}

export interface EquipmentResponse {
  equipment: Equipment;
}

export type EquipmentListResponse = PaginatedResponse<Equipment>;

// ============================================================================
// COMMENT DTOs
// ============================================================================

export interface CreateCommentRequest {
  content: string;
  taskId?: string;
  projectId?: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentResponse {
  comment: Comment;
}

export type CommentsListResponse = PaginatedResponse<Comment>;

// ============================================================================
// NOTIFICATION DTOs
// ============================================================================

export interface NotificationResponse {
  notification: Notification;
}

export type NotificationsListResponse = PaginatedResponse<Notification>;

export interface MarkNotificationReadRequest {
  notificationId: string;
}

export interface MarkAllNotificationsReadRequest {
  userId: string;
}

// ============================================================================
// ATTACHMENT DTOs
// ============================================================================

export interface AttachmentResponse {
  attachment: Attachment;
}

export type AttachmentsListResponse = PaginatedResponse<Attachment>;

export interface UploadAttachmentRequest {
  taskId?: string;
  projectId?: string;
}

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    onHold: number;
    completed: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  employees: {
    total: number;
    active: number;
    onVacation: number;
  };
  equipment: {
    total: number;
    available: number;
    inUse: number;
    underMaintenance: number;
  };
}

export interface ProjectTimelineItem {
  date: string; // ISO date
  tasksCompleted: number;
  tasksPlanned: number;
}

export interface ResourceUtilization {
  employeeId: string;
  employeeName: string;
  allocatedHours: number;
  workedHours: number;
  utilizationRate: number; // 0-100
}

// ============================================================================
// WEBSOCKET MESSAGES (real-time events)
// ============================================================================

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string; // ISO 8601
}

export interface TaskUpdateEvent {
  taskId: string;
  projectId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'ASSIGNED' | 'STATUS_CHANGED';
  data: Partial<Task>;
  userId: string; // кто инициировал
}

export interface NotificationEvent {
  notificationId: string;
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  isRead: boolean;
}

export interface ProjectUpdateEvent {
  projectId: string;
  action: 'UPDATED' | 'STATUS_CHANGED' | 'BUDGET_UPDATED' | 'TEAM_CHANGED';
  data: Partial<Project>;
}

export interface TaskAssignedEvent {
  taskId: string;
  assignedToId: string;
  assignedById: string;
  timestamp: string;
}