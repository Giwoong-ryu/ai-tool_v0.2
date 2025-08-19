// src/types/workflow.ts
export interface WorkflowStep {
  id: string;
  step_number: number;
  tool_name: string;
  tool_action: string;
  details: string;
  type: 'manual' | 'instruction' | 'generator';
  estimated_time?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  required_inputs?: string[];
  expected_outputs?: string[];
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_total_time: string;
  steps: WorkflowStep[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RunStep {
  id: string;
  run_id: string;
  step_id: string;
  step_number: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  started_at?: string;
  completed_at?: string;
  
  // Step data
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  notes?: string;
  is_checked?: boolean;
  
  // Metadata
  actual_time_spent?: number; // in seconds
  error_message?: string;
  retry_count?: number;
  
  // UI state
  is_expanded?: boolean;
  is_copied?: boolean;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  user_id: string;
  title: string;
  description?: string;
  
  // Run status
  status: 'draft' | 'running' | 'completed' | 'paused' | 'failed' | 'cancelled';
  progress: number; // 0-100
  current_step: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  
  // Sharing
  share_token?: string;
  is_public?: boolean;
  
  // Metadata
  estimated_completion_time?: string;
  actual_completion_time?: number;
  total_steps: number;
  completed_steps: number;
  
  // Relations
  steps?: RunStep[];
  workflow?: Workflow;
}

export interface RunStepHistory {
  id: string;
  run_step_id: string;
  action: 'create' | 'update' | 'complete' | 'revert' | 'note_add';
  old_value?: any;
  new_value?: any;
  timestamp: string;
  created_by?: string;
}

export interface WorkflowRunnerState {
  // Current run
  currentRun: WorkflowRun | null;
  isLoading: boolean;
  error: string | null;
  
  // Run operations
  isAutoSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  
  // UI state
  currentStepIndex: number;
  expandedSteps: Set<string>;
  viewMode: 'timeline' | 'list' | 'compact';
  
  // History stack for undo/redo
  historyStack: RunStepHistory[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

// Action interfaces
export interface StepActionPayload {
  stepId: string;
  action: 'complete' | 'uncomplete' | 'add_note' | 'update_input' | 'update_output' | 'copy' | 'expand' | 'collapse';
  data?: any;
}

export interface RunActionPayload {
  action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel' | 'save' | 'share';
  data?: any;
}

// Analytics events
export interface WorkflowAnalyticsEvent {
  event_name: 'start_workflow' | 'complete_step' | 'complete_workflow' | 'share_workflow' | 'resume_workflow';
  workflow_id: string;
  run_id: string;
  step_id?: string;
  step_number?: number;
  time_spent?: number;
  completion_rate?: number;
  metadata?: Record<string, any>;
}

// Export utilities
export interface WorkflowExportData {
  workflow: Workflow;
  run: WorkflowRun;
  steps: RunStep[];
  export_format: 'json' | 'markdown' | 'pdf';
  include_sensitive_data: boolean;
  created_at: string;
}

// Share page data (sanitized)
export interface SharedWorkflowData {
  workflow: Omit<Workflow, 'created_at' | 'updated_at'>;
  run: Omit<WorkflowRun, 'user_id' | 'share_token'>;
  steps: Array<Omit<RunStep, 'input_data'>>; // Remove sensitive input data
  shared_at: string;
  is_completed: boolean;
  completion_rate: number;
  total_time_spent?: number;
}