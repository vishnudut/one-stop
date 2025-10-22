"use client";

import React, { useState, useEffect } from "react";
import {
	Shield,
	Database,
	FileText,
	Activity,
	Loader2,
	CheckCircle,
	XCircle,
	Clock,
	ChevronDown,
	ChevronRight,
} from "lucide-react";

interface ToolCallStep {
	id: string;
	tool_name: string;
	status: "pending" | "running" | "completed" | "failed";
	timestamp: string;
	description: string;
	input?: Record<string, any>;
	output?: Record<string, any>;
	error?: string;
	duration_ms?: number;
}

interface StreamingToolCallsProps {
	isActive: boolean;
	onComplete?: (steps: ToolCallStep[]) => void;
	className?: string;
}

function getToolIcon(toolName: string) {
	switch (toolName) {
		case "check_permissions":
			return <Shield className="w-4 h-4" />;
		case "fetch_data":
			return <Database className="w-4 h-4" />;
		case "audit_log":
			return <FileText className="w-4 h-4" />;
		default:
			return <Activity className="w-4 h-4" />;
	}
}

function getToolColor(toolName: string) {
	switch (toolName) {
		case "check_permissions":
			return "border-amber-200 bg-amber-50";
		case "fetch_data":
			return "border-blue-200 bg-blue-50";
		case "audit_log":
			return "border-green-200 bg-green-50";
		default:
			return "border-gray-200 bg-gray-50";
	}
}

function getStatusIndicator(status: string) {
	switch (status) {
		case "pending":
			return <Clock className="w-4 h-4 text-gray-400" />;
		case "running":
			return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
		case "completed":
			return <CheckCircle className="w-4 h-4 text-green-500" />;
		case "failed":
			return <XCircle className="w-4 h-4 text-red-500" />;
		default:
			return <Clock className="w-4 h-4 text-gray-400" />;
	}
}

function ToolCallStepDisplay({ step }: { step: ToolCallStep }) {
	const [expanded, setExpanded] = useState(false);
	const toolColor = getToolColor(step.tool_name);
	const toolIcon = getToolIcon(step.tool_name);
	const statusIndicator = getStatusIndicator(step.status);

	return (
		<div
			className={`border rounded-lg p-3 transition-all duration-300 ${toolColor}`}
		>
			<div
				className="flex items-center justify-between cursor-pointer"
				onClick={() => step.status === "completed" && setExpanded(!expanded)}
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						{toolIcon}
						<span className="font-medium text-sm">{step.tool_name}</span>
					</div>

					<div className="flex items-center gap-2">
						{statusIndicator}

						{step.status === "running" && (
							<div className="flex space-x-1">
								<div
									className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
									style={{ animationDelay: "0ms" }}
								></div>
								<div
									className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
									style={{ animationDelay: "150ms" }}
								></div>
								<div
									className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
									style={{ animationDelay: "300ms" }}
								></div>
							</div>
						)}

						{step.duration_ms && (
							<span className="text-xs text-gray-500">
								{step.duration_ms}ms
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-500">
						{new Date(step.timestamp).toLocaleTimeString()}
					</span>

					{step.status === "completed" &&
						(expanded ? (
							<ChevronDown className="w-4 h-4" />
						) : (
							<ChevronRight className="w-4 h-4" />
						))}
				</div>
			</div>

			{/* Status message */}
			<div className="mt-2">
				<div className="text-xs text-gray-600">
					{step.status === "pending" && "⏳ Queued for execution"}
					{step.status === "running" && `🔄 ${step.description}`}
					{step.status === "completed" && `✅ ${step.description}`}
					{step.status === "failed" &&
						`❌ Failed: ${step.error || "Unknown error"}`}
				</div>
			</div>

			{/* Expanded details */}
			{expanded && step.status === "completed" && (
				<div className="mt-4 space-y-3 border-t pt-3 animate-in slide-in-from-top-1">
					{step.input && (
						<div>
							<h5 className="font-medium text-xs text-gray-700 mb-1">Input:</h5>
							<div className="bg-white rounded border p-2 text-xs">
								<pre className="whitespace-pre-wrap text-gray-800">
									{JSON.stringify(step.input, null, 2)}
								</pre>
							</div>
						</div>
					)}

					{step.output && (
						<div>
							<h5 className="font-medium text-xs text-gray-700 mb-1">
								Output:
							</h5>
							<div className="bg-white rounded border p-2 text-xs">
								{step.tool_name === "check_permissions" && step.output ? (
									<div className="space-y-1">
										<div>
											<span className="font-medium">Decision:</span>{" "}
											<span
												className={
													step.output.allow
														? "text-green-600 font-medium"
														: "text-red-600 font-medium"
												}
											>
												{step.output.allow ? "✅ ALLOWED" : "❌ DENIED"}
											</span>
										</div>
										{step.output.reason && (
											<div>
												<span className="font-medium">Reason:</span>{" "}
												{step.output.reason}
											</div>
										)}
										{step.output.policy_ref && (
											<div>
												<span className="font-medium">Policy:</span>{" "}
												{step.output.policy_ref}
											</div>
										)}
									</div>
								) : (
									<pre className="whitespace-pre-wrap text-gray-800">
										{JSON.stringify(step.output, null, 2)}
									</pre>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function StreamingToolCalls({
	isActive,
	onComplete,
	className = "",
}: StreamingToolCallsProps) {
	const [steps, setSteps] = useState<ToolCallStep[]>([]);
	const [currentStep, setCurrentStep] = useState(0);

	// Simulate the workflow execution steps
	useEffect(() => {
		if (!isActive) {
			setSteps([]);
			setCurrentStep(0);
			return;
		}

		// Define the typical workflow steps
		const workflowSteps: Omit<ToolCallStep, "id" | "timestamp" | "status">[] = [
			{
				tool_name: "check_permissions",
				description: "Validating user permissions against company policies",
				input: { checking: "permissions" },
			},
			{
				tool_name: "fetch_data",
				description: "Retrieving requested data from employee database",
				input: { fetching: "data" },
			},
			{
				tool_name: "audit_log",
				description: "Recording access attempt for compliance audit",
				input: { logging: "audit" },
			},
		];

		// Initialize all steps as pending
		const initialSteps: ToolCallStep[] = workflowSteps.map((step, index) => ({
			...step,
			id: `step-${index}`,
			timestamp: new Date().toISOString(),
			status: "pending",
		}));

		setSteps(initialSteps);

		// Execute steps with realistic timing
		const executeSteps = async () => {
			for (let i = 0; i < initialSteps.length; i++) {
				// Mark current step as running
				setSteps((prev) =>
					prev.map((step, index) =>
						index === i ? { ...step, status: "running" } : step,
					),
				);
				setCurrentStep(i);

				// Simulate execution time
				const executionTime = Math.random() * 1500 + 500; // 500-2000ms
				await new Promise((resolve) => setTimeout(resolve, executionTime));

				// Mark current step as completed with mock output
				setSteps((prev) =>
					prev.map((step, index) =>
						index === i
							? {
									...step,
									status: "completed",
									duration_ms: Math.round(executionTime),
									output: getMockOutput(step.tool_name),
								}
							: step,
					),
				);
			}

			// Call onComplete after all steps are done
			setTimeout(() => {
				onComplete?.(initialSteps);
			}, 500);
		};

		executeSteps();
	}, [isActive, onComplete]);

	// Mock output based on tool name
	const getMockOutput = (toolName: string) => {
		switch (toolName) {
			case "check_permissions":
				return {
					allow: Math.random() > 0.3, // 70% chance of being allowed
					reason: "HR role has access to performance data per policy HR-1.2",
					policy_ref: "HR-1.2",
				};
			case "fetch_data":
				return {
					rows: [{ employee_id: 101, name: "Alice Chen" }],
					count: 1,
				};
			case "audit_log":
				return { status: "logged", entry_id: "audit_" + Date.now() };
			default:
				return { executed: true };
		}
	};

	if (!isActive) {
		return null;
	}

	return (
		<div
			className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
		>
			<div className="flex items-center gap-2 mb-4">
				<Activity className="w-4 h-4 text-blue-500" />
				<h3 className="text-sm font-semibold text-gray-900">
					Executing Workflow
				</h3>
				<div className="flex items-center gap-1">
					<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
					<span className="text-xs text-blue-600">
						Step {currentStep + 1} of {steps.length}
					</span>
				</div>
			</div>

			<div className="space-y-3">
				{steps.map((step) => (
					<ToolCallStepDisplay key={step.id} step={step} />
				))}
			</div>

			{/* Progress bar */}
			<div className="mt-4">
				<div className="flex justify-between text-xs text-gray-500 mb-1">
					<span>Progress</span>
					<span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-1.5">
					<div
						className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
						style={{
							width: `${((currentStep + 1) / steps.length) * 100}%`,
						}}
					></div>
				</div>
			</div>
		</div>
	);
}
