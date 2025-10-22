"use client";

import React, { useState, useEffect } from "react";
import {
	Brain,
	Cog,
	MessageSquare,
	Shield,
	Database,
	FileText,
	CheckCircle,
	XCircle,
	Clock,
	Loader2,
	ChevronDown,
	ChevronRight,
	Zap,
	AlertTriangle,
} from "lucide-react";

interface ExecutionPhase {
	id: string;
	name: string;
	status: "pending" | "active" | "completed" | "error";
	icon: React.ReactNode;
	startTime?: string;
	endTime?: string;
	description: string;
}

interface ThinkingStep {
	id: string;
	content: string;
	timestamp: string;
	completed: boolean;
}

interface ToolExecution {
	id: string;
	name: string;
	status: "pending" | "running" | "completed" | "failed";
	input?: any;
	output?: any;
	error?: string;
	duration?: number;
	startTime: string;
	endTime?: string;
}

interface WorkflowExecutionViewProps {
	isActive: boolean;
	userQuery: string;
	userRole: string;
	userEmail: string;
	onComplete?: () => void;
	className?: string;
}

export function WorkflowExecutionView({
	isActive,
	userQuery,
	userRole,
	userEmail,
	onComplete,
	className = "",
}: WorkflowExecutionViewProps) {
	const [currentPhase, setCurrentPhase] = useState<string>("thinking");
	const [phases, setPhases] = useState<ExecutionPhase[]>([]);
	const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
	const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(),
	);

	// Initialize phases
	useEffect(() => {
		if (!isActive) {
			setCurrentPhase("thinking");
			setPhases([]);
			setThinkingSteps([]);
			setToolExecutions([]);
			return;
		}

		const initialPhases: ExecutionPhase[] = [
			{
				id: "thinking",
				name: "Thinking",
				status: "active",
				icon: <Brain className="w-4 h-4" />,
				description: "Analyzing request and planning approach",
			},
			{
				id: "execution",
				name: "Tool Execution",
				status: "pending",
				icon: <Cog className="w-4 h-4" />,
				description: "Running compliance checks and data operations",
			},
			{
				id: "response",
				name: "Response Generation",
				status: "pending",
				icon: <MessageSquare className="w-4 h-4" />,
				description: "Formatting results and preparing final answer",
			},
		];

		setPhases(initialPhases);
		setExpandedSections(new Set(["thinking"]));
	}, [isActive]);

	// Simulate thinking process
	useEffect(() => {
		if (!isActive || currentPhase !== "thinking") return;

		const thinkingSequence = [
			"Understanding the user's request...",
			`Analyzing request from ${userRole}: "${userQuery}"`,
			"Identifying required data access permissions...",
			"Planning compliance validation workflow...",
			"Determining appropriate policy checks...",
			"Ready to execute permission validation...",
		];

		let stepIndex = 0;
		const addThinkingStep = () => {
			if (stepIndex < thinkingSequence.length) {
				setThinkingSteps((prev) => [
					...prev,
					{
						id: `thinking-${stepIndex}`,
						content: thinkingSequence[stepIndex],
						timestamp: new Date().toISOString(),
						completed: false,
					},
				]);

				// Mark as completed after a delay
				setTimeout(() => {
					setThinkingSteps((prev) =>
						prev.map((step, idx) =>
							idx === stepIndex ? { ...step, completed: true } : step,
						),
					);
				}, 800);

				stepIndex++;
				setTimeout(addThinkingStep, 1200);
			} else {
				// Complete thinking phase
				setTimeout(() => {
					setPhases((prev) =>
						prev.map((phase) =>
							phase.id === "thinking"
								? {
										...phase,
										status: "completed",
										endTime: new Date().toISOString(),
									}
								: phase.id === "execution"
									? {
											...phase,
											status: "active",
											startTime: new Date().toISOString(),
										}
									: phase,
						),
					);
					setCurrentPhase("execution");
					setExpandedSections(new Set(["execution"]));
				}, 500);
			}
		};

		addThinkingStep();
	}, [isActive, currentPhase, userQuery, userRole]);

	// Simulate tool execution
	useEffect(() => {
		if (!isActive || currentPhase !== "execution") return;

		const tools = [
			{
				name: "check_permissions",
				duration: 1500,
				input: {
					user_email: userEmail,
					user_role: userRole,
					resource: userQuery.includes("salary")
						? "salary"
						: userQuery.includes("performance")
							? "performance_summary"
							: "directory",
					action: "read",
				},
				output: null, // Will be set based on logic
			},
			{
				name: "fetch_data",
				duration: 2000,
				input: { resource: "employee_data", filters: {} },
				output: null,
			},
			{
				name: "audit_log",
				duration: 500,
				input: { action: "data_access", user: userEmail },
				output: { status: "logged", id: `audit_${Date.now()}` },
			},
		];

		// Initialize tool executions
		const initialTools = tools.map((tool, index) => ({
			id: `tool-${index}`,
			name: tool.name,
			status: "pending" as const,
			input: tool.input,
			startTime: new Date().toISOString(),
			duration: tool.duration,
		}));

		setToolExecutions(initialTools);

		// Execute tools sequentially
		let toolIndex = 0;
		const executeTool = async () => {
			if (toolIndex < tools.length) {
				const currentTool = tools[toolIndex];

				// Mark current tool as running
				setToolExecutions((prev) =>
					prev.map((tool, idx) =>
						idx === toolIndex ? { ...tool, status: "running" } : tool,
					),
				);

				// Simulate execution
				await new Promise((resolve) =>
					setTimeout(resolve, currentTool.duration),
				);

				// Generate realistic output
				let output = currentTool.output;
				if (currentTool.name === "check_permissions") {
					const isHR = userRole.toLowerCase().includes("hr");
					const isSalaryRequest = userQuery.toLowerCase().includes("salary");
					const allow = isHR || !isSalaryRequest;

					output = {
						allow,
						reason: allow
							? `${userRole} has access to requested data`
							: "Only HR roles can access salary information",
						policy_ref: "HR-1.2",
					};
				} else if (currentTool.name === "fetch_data") {
					output = {
						rows: [
							{
								employee_id: 101,
								name: "Alice Chen",
								department: "Engineering",
							},
						],
						count: 1,
					};
				}

				// Mark tool as completed
				setToolExecutions((prev) =>
					prev.map((tool, idx) =>
						idx === toolIndex
							? {
									...tool,
									status: "completed",
									output,
									endTime: new Date().toISOString(),
								}
							: tool,
					),
				);

				toolIndex++;
				setTimeout(executeTool, 300);
			} else {
				// Complete execution phase
				setTimeout(() => {
					setPhases((prev) =>
						prev.map((phase) =>
							phase.id === "execution"
								? {
										...phase,
										status: "completed",
										endTime: new Date().toISOString(),
									}
								: phase.id === "response"
									? {
											...phase,
											status: "active",
											startTime: new Date().toISOString(),
										}
									: phase,
						),
					);
					setCurrentPhase("response");
					setExpandedSections(new Set(["response"]));

					// Complete response phase after brief delay
					setTimeout(() => {
						setPhases((prev) =>
							prev.map((phase) =>
								phase.id === "response"
									? {
											...phase,
											status: "completed",
											endTime: new Date().toISOString(),
										}
									: phase,
							),
						);
						onComplete?.();
					}, 2000);
				}, 500);
			}
		};

		executeTool();
	}, [isActive, currentPhase, userEmail, userRole, userQuery, onComplete]);

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="w-4 h-4 text-gray-400" />;
			case "active":
				return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
			case "completed":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "error":
				return <XCircle className="w-4 h-4 text-red-500" />;
			default:
				return <Clock className="w-4 h-4 text-gray-400" />;
		}
	};

	if (!isActive) {
		return null;
	}

	return (
		<div
			className={`bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 ${className}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
						<Zap className="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-blue-900">
							Workflow Execution
						</h3>
						<p className="text-sm text-blue-600">
							Real-time AI decision making process
						</p>
					</div>
				</div>
				<div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
					{currentPhase === "thinking" && "🧠 Thinking"}
					{currentPhase === "execution" && "⚙️ Executing"}
					{currentPhase === "response" && "💬 Responding"}
				</div>
			</div>

			{/* Phase Timeline */}
			<div className="mb-6">
				<div className="flex items-center justify-between">
					{phases.map((phase, index) => (
						<React.Fragment key={phase.id}>
							<div className="flex flex-col items-center">
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
										phase.status === "active"
											? "bg-blue-500 text-white ring-4 ring-blue-200"
											: phase.status === "completed"
												? "bg-green-500 text-white"
												: "bg-gray-200 text-gray-400"
									}`}
								>
									{phase.status === "active" ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										phase.icon
									)}
								</div>
								<div className="mt-2 text-center">
									<div
										className={`text-sm font-medium ${
											phase.status === "completed"
												? "text-green-700"
												: phase.status === "active"
													? "text-blue-700"
													: "text-gray-500"
										}`}
									>
										{phase.name}
									</div>
									<div className="text-xs text-gray-500">
										{phase.description}
									</div>
								</div>
							</div>
							{index < phases.length - 1 && (
								<div
									className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
										phases[index + 1].status === "completed" ||
										phases[index + 1].status === "active"
											? "bg-blue-300"
											: "bg-gray-200"
									}`}
								/>
							)}
						</React.Fragment>
					))}
				</div>
			</div>

			{/* Thinking Section */}
			{thinkingSteps.length > 0 && (
				<div className="mb-4">
					<button
						onClick={() => toggleSection("thinking")}
						className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
					>
						<div className="flex items-center gap-3">
							<Brain className="w-5 h-5 text-blue-500" />
							<span className="font-medium text-gray-900">
								AI Thinking Process
							</span>
							<span className="text-sm text-gray-500">
								({thinkingSteps.length} steps)
							</span>
						</div>
						{expandedSections.has("thinking") ? (
							<ChevronDown className="w-4 h-4 text-gray-400" />
						) : (
							<ChevronRight className="w-4 h-4 text-gray-400" />
						)}
					</button>

					{expandedSections.has("thinking") && (
						<div className="mt-3 space-y-2 pl-4">
							{thinkingSteps.map((step, index) => (
								<div
									key={step.id}
									className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
										step.completed
											? "bg-green-50 border border-green-200"
											: "bg-blue-50 border border-blue-200"
									}`}
								>
									<div className="flex-shrink-0 mt-0.5">
										{step.completed ? (
											<CheckCircle className="w-4 h-4 text-green-500" />
										) : (
											<Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
										)}
									</div>
									<div className="flex-1">
										<p className="text-sm text-gray-800">{step.content}</p>
										{step.completed && (
											<p className="text-xs text-gray-500 mt-1">
												Completed at{" "}
												{new Date(step.timestamp).toLocaleTimeString()}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Tool Execution Section */}
			{toolExecutions.length > 0 && (
				<div className="mb-4">
					<button
						onClick={() => toggleSection("execution")}
						className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
					>
						<div className="flex items-center gap-3">
							<Cog className="w-5 h-5 text-green-500" />
							<span className="font-medium text-gray-900">Tool Executions</span>
							<span className="text-sm text-gray-500">
								({toolExecutions.length} tools)
							</span>
						</div>
						{expandedSections.has("execution") ? (
							<ChevronDown className="w-4 h-4 text-gray-400" />
						) : (
							<ChevronRight className="w-4 h-4 text-gray-400" />
						)}
					</button>

					{expandedSections.has("execution") && (
						<div className="mt-3 space-y-3 pl-4">
							{toolExecutions.map((tool) => (
								<div
									key={tool.id}
									className={`p-4 rounded-lg border transition-all duration-300 ${
										tool.status === "completed"
											? "bg-green-50 border-green-200"
											: tool.status === "running"
												? "bg-blue-50 border-blue-200"
												: tool.status === "failed"
													? "bg-red-50 border-red-200"
													: "bg-gray-50 border-gray-200"
									}`}
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											{tool.name === "check_permissions" && (
												<Shield className="w-4 h-4 text-amber-600" />
											)}
											{tool.name === "fetch_data" && (
												<Database className="w-4 h-4 text-blue-600" />
											)}
											{tool.name === "audit_log" && (
												<FileText className="w-4 h-4 text-green-600" />
											)}
											<span className="font-medium text-sm">{tool.name}</span>
										</div>
										<div className="flex items-center gap-2">
											{getStatusIcon(tool.status)}
											{tool.duration && tool.status === "completed" && (
												<span className="text-xs text-gray-500">
													{tool.duration}ms
												</span>
											)}
										</div>
									</div>

									{tool.status === "running" && (
										<div className="flex items-center gap-2 text-sm text-blue-600">
											<Loader2 className="w-3 h-3 animate-spin" />
											Executing {tool.name}...
										</div>
									)}

									{tool.status === "completed" && tool.output && (
										<div className="mt-2">
											<div className="text-xs text-gray-700 mb-1">Output:</div>
											{tool.name === "check_permissions" ? (
												<div className="text-xs space-y-1">
													<div>
														<span
															className={`font-medium ${
																tool.output.allow
																	? "text-green-600"
																	: "text-red-600"
															}`}
														>
															{tool.output.allow ? "✅ ALLOWED" : "❌ DENIED"}
														</span>
													</div>
													<div className="text-gray-600">
														{tool.output.reason}
													</div>
													<div className="text-gray-500">
														Policy: {tool.output.policy_ref}
													</div>
												</div>
											) : (
												<div className="bg-white p-2 rounded border text-xs">
													<pre className="whitespace-pre-wrap text-gray-800">
														{JSON.stringify(tool.output, null, 2)}
													</pre>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Response Generation Section */}
			{currentPhase === "response" && (
				<div className="mb-4">
					<div className="p-4 bg-white rounded-lg shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<MessageSquare className="w-5 h-5 text-purple-500" />
							<span className="font-medium text-gray-900">
								Generating Response
							</span>
							<Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
						</div>
						<div className="text-sm text-gray-600">
							Formatting results and preparing compliance-aware response...
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
