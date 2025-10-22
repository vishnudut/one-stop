"use client";

import React, { useState, useEffect } from "react";
import {
	Brain,
	Search,
	Shield,
	Database,
	FileText,
	CheckCircle,
	AlertTriangle,
	Clock,
	Zap,
	Eye,
} from "lucide-react";

interface ThinkingStep {
	id: string;
	type: "reasoning" | "tool_call" | "decision" | "reflection";
	content: string;
	timestamp: string;
	status: "active" | "completed";
	icon?: React.ReactNode;
	details?: string;
}

interface ThinkingProcessProps {
	isActive: boolean;
	userQuery: string;
	userRole: string;
	onComplete?: () => void;
	className?: string;
}

export function ThinkingProcess({
	isActive,
	userQuery,
	userRole,
	onComplete,
	className = "",
}: ThinkingProcessProps) {
	const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
	const [currentStepIndex, setCurrentStepIndex] = useState(-1);

	useEffect(() => {
		if (!isActive) {
			setThinkingSteps([]);
			setCurrentStepIndex(-1);
			return;
		}

		const generateThinkingSteps = (): ThinkingStep[] => {
			const steps: ThinkingStep[] = [];

			// Initial reasoning
			steps.push({
				id: "initial-analysis",
				type: "reasoning",
				content: `Analyzing request from ${userRole}: "${userQuery}"`,
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <Brain className="w-4 h-4" />,
				details:
					"Breaking down the user's request and identifying required actions",
			});

			// Identify resource type
			const resourceType = userQuery.toLowerCase().includes("salary")
				? "salary"
				: userQuery.toLowerCase().includes("performance")
					? "performance_summary"
					: userQuery.toLowerCase().includes("directory")
						? "directory"
						: "unknown";

			steps.push({
				id: "resource-identification",
				type: "reasoning",
				content: `Identified requested resource: ${resourceType}`,
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <Search className="w-4 h-4" />,
				details: `Parsing query to determine data type and access requirements`,
			});

			// Permission strategy
			steps.push({
				id: "permission-strategy",
				type: "reasoning",
				content: "Need to check permissions before accessing any data",
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <Shield className="w-4 h-4" />,
				details: "Following principle of least privilege - verify access first",
			});

			// Permission check tool call
			steps.push({
				id: "check-permissions",
				type: "tool_call",
				content: "Calling check_permissions() to validate access",
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <Shield className="w-4 h-4" />,
				details: `Checking if ${userRole} can access ${resourceType} data`,
			});

			// Permission decision analysis
			const willAllow = resourceType === "directory" || userRole.includes("HR");
			steps.push({
				id: "permission-analysis",
				type: "decision",
				content: willAllow
					? "Permission granted - proceeding with data fetch"
					: "Permission denied - will explain policy restriction",
				timestamp: new Date().toISOString(),
				status: "active",
				icon: willAllow ? (
					<CheckCircle className="w-4 h-4" />
				) : (
					<AlertTriangle className="w-4 h-4" />
				),
				details: willAllow
					? "User role has appropriate access level"
					: "Access restricted by company policy",
			});

			// Conditional data fetch
			if (willAllow) {
				steps.push({
					id: "data-fetch",
					type: "tool_call",
					content: "Calling fetch_data() to retrieve information",
					timestamp: new Date().toISOString(),
					status: "active",
					icon: <Database className="w-4 h-4" />,
					details: "Fetching requested data with appropriate filters",
				});
			}

			// Audit logging
			steps.push({
				id: "audit-logging",
				type: "tool_call",
				content: "Calling audit_log() to record access attempt",
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <FileText className="w-4 h-4" />,
				details: "Recording this interaction for compliance purposes",
			});

			// Response formulation
			steps.push({
				id: "response-formulation",
				type: "reasoning",
				content: willAllow
					? "Formatting data into user-friendly response"
					: "Crafting policy explanation for denied request",
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <Zap className="w-4 h-4" />,
				details: "Preparing final response with appropriate context",
			});

			// Final reflection
			steps.push({
				id: "final-check",
				type: "reflection",
				content:
					"Verifying response includes policy context and compliance info",
				timestamp: new Date().toISOString(),
				status: "active",
				icon: <Eye className="w-4 h-4" />,
				details: "Ensuring transparency about decision-making process",
			});

			return steps;
		};

		const steps = generateThinkingSteps();
		setThinkingSteps(steps);

		// Animate through steps
		let stepIndex = 0;
		const animateSteps = () => {
			if (stepIndex < steps.length) {
				setCurrentStepIndex(stepIndex);

				// Mark previous steps as completed
				setThinkingSteps((prevSteps) =>
					prevSteps.map((step, index) => ({
						...step,
						status:
							index < stepIndex
								? "completed"
								: index === stepIndex
									? "active"
									: "active",
					})),
				);

				stepIndex++;
				// Vary timing based on step type
				const delay = steps[stepIndex - 1]?.type === "tool_call" ? 1500 : 800;
				setTimeout(animateSteps, delay);
			} else {
				// Mark all as completed
				setThinkingSteps((prevSteps) =>
					prevSteps.map((step) => ({ ...step, status: "completed" })),
				);

				// Call completion callback after a brief delay
				setTimeout(() => {
					onComplete?.();
				}, 500);
			}
		};

		// Start animation after a brief delay
		setTimeout(animateSteps, 300);
	}, [isActive, userQuery, userRole, onComplete]);

	if (!isActive || thinkingSteps.length === 0) {
		return null;
	}

	return (
		<div
			className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}
		>
			<div className="flex items-center gap-2 mb-4">
				<Brain className="w-5 h-5 text-blue-600" />
				<h3 className="text-sm font-semibold text-blue-900">
					AI Thinking Process
				</h3>
				<div className="flex items-center gap-1">
					<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
					<span className="text-xs text-blue-600">
						Step {Math.min(currentStepIndex + 1, thinkingSteps.length)} of{" "}
						{thinkingSteps.length}
					</span>
				</div>
			</div>

			<div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
				{thinkingSteps.map((step, index) => (
					<div
						key={step.id}
						className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-500 ${
							step.status === "active"
								? "bg-white border border-blue-200 shadow-sm"
								: step.status === "completed"
									? "bg-gray-50 border border-gray-200"
									: "bg-gray-50 border border-gray-100 opacity-50"
						} ${index <= currentStepIndex ? "opacity-100" : "opacity-30"}`}
					>
						{/* Icon */}
						<div
							className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
								step.type === "reasoning"
									? "bg-blue-100 text-blue-600"
									: step.type === "tool_call"
										? "bg-green-100 text-green-600"
										: step.type === "decision"
											? "bg-amber-100 text-amber-600"
											: "bg-purple-100 text-purple-600"
							}`}
						>
							{step.icon}
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between mb-1">
								<h4 className="text-sm font-medium text-gray-900">
									{step.content}
								</h4>
								<div className="flex items-center gap-2">
									{step.status === "active" && (
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
									{step.status === "completed" && (
										<CheckCircle className="w-3 h-3 text-green-500" />
									)}
									<span className="text-xs text-gray-500">
										{new Date(step.timestamp).toLocaleTimeString()}
									</span>
								</div>
							</div>

							{step.details && (
								<p className="text-xs text-gray-600">{step.details}</p>
							)}

							{/* Type indicator */}
							<div className="mt-2">
								<span
									className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
										step.type === "reasoning"
											? "bg-blue-100 text-blue-700"
											: step.type === "tool_call"
												? "bg-green-100 text-green-700"
												: step.type === "decision"
													? "bg-amber-100 text-amber-700"
													: "bg-purple-100 text-purple-700"
									}`}
								>
									{step.type === "reasoning" && "🤔 Reasoning"}
									{step.type === "tool_call" && "🔧 Tool Call"}
									{step.type === "decision" && "⚖️ Decision"}
									{step.type === "reflection" && "🔍 Reflection"}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Progress indicator */}
			<div className="mt-4 pt-3 border-t border-blue-100">
				<div className="flex justify-between text-xs text-blue-600 mb-2">
					<span>Thinking Progress</span>
					<span>
						{Math.round(((currentStepIndex + 1) / thinkingSteps.length) * 100)}%
					</span>
				</div>
				<div className="w-full bg-blue-100 rounded-full h-1.5">
					<div
						className="bg-blue-500 h-1.5 rounded-full transition-all duration-700 ease-out"
						style={{
							width: `${Math.min(((currentStepIndex + 1) / thinkingSteps.length) * 100, 100)}%`,
						}}
					></div>
				</div>
			</div>
		</div>
	);
}
