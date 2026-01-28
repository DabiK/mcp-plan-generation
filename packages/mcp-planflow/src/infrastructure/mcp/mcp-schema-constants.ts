// MCP Schema Constants
// This file contains the allowed values for MCP tool schemas
// These should match the domain enums but may be filtered/transformed for API compatibility

export const STEP_KIND_VALUES = [
  'create_file',
  'edit_file',
  'delete_file',
  'run_command',
  'test',
  'review',
  'documentation',
  'custom'
] as const;

export const STEP_STATUS_VALUES = [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'skipped',
  'blocked'
] as const;

export const STEP_REVIEW_DECISION_VALUES = [
  'approved',
  'rejected',
  'skipped'
] as const;

export const PLAN_TYPE_VALUES = [
  'feature',
  'refactor',
  'migration',
  'bugfix',
  'optimization',
  'documentation'
] as const;

export const COMMENT_ACTION_VALUES = [
  'get',
  'add',
  'update',
  'delete'
] as const;

export const COMMENT_TARGET_VALUES = [
  'plan',
  'step'
] as const;

export const STEP_NAVIGATION_MODE_VALUES = [
  'current',
  'next'
] as const;

export const STEP_SELECTOR_BY_VALUES = [
  'id',
  'index'
] as const;

export const STEP_REMOVAL_MODE_VALUES = [
  'strict',
  'cascade'
] as const;