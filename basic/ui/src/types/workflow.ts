// Types for the Compliance Concierge workflow responses

export interface WorkflowResponse {
	handler_id: string;
	workflow_name: string;
	run_id: string;
	error: string | null;
	result: WorkflowResult | WorkflowError;
	status: "running" | "completed" | "failed";
	started_at: string;
	updated_at: string;
	completed_at?: string;
}

export interface WorkflowResult {
	answer?: string;
	steps?: WorkflowStep[];
	tools_used?: ToolCall[];
}

export interface WorkflowError {
	error: string;
	error_type: string;
	traceback: string;
}

export interface WorkflowStep {
	step_name: string;
	timestamp: string;
	status: "running" | "completed" | "failed";
	description: string;
	details?: Record<string, any>;
}

export interface ToolCall {
	tool_name: string;
	timestamp: string;
	input: Record<string, any>;
	output: Record<string, any>;
	status: "running" | "completed" | "failed";
	duration_ms?: number;
}

export interface PermissionCheck {
	allow: boolean;
	reason: string;
	policy_ref: string;
	user_email: string;
	user_role: string;
	resource: string;
	action: string;
}

export interface DataFetch {
	rows: Employee[];
	resource: string;
	filters?: Record<string, any>;
}

export interface Employee {
	employee_id: number;
	name: string;
	email: string;
	department: string;
	role: string;
	manager_id?: number;
	salary?: number;
	hire_date?: string;
	performance_rating?: number;
	performance_summary?: string;
	ssn_last4?: string;
	home_city?: string;
}

export interface AuditEntry {
	user_email: string;
	role: string;
	resource: string;
	action: string;
	decision: "allowed" | "denied";
	policy_ref: string;
	timestamp: string;
	details?: Record<string, any>;
}

export interface ChatMessage {
	id: string;
	type: "user" | "assistant" | "system";
	content: string;
	timestamp: string;
	workflow_response?: WorkflowResponse;
	tool_calls?: ToolCall[];
	steps?: WorkflowStep[];
}

export interface UserQuery {
	user_email: string;
	role: string;
	query: string;
}

// Common request types
export interface WorkflowRequest {
	start_event: {
		message: string;
	};
}

// UI State types
export interface UIState {
	loading: boolean;
	error: string | null;
	messages: ChatMessage[];
	currentWorkflowId?: string;
}
