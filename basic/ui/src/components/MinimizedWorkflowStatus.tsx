"use client";

import React, { useState } from "react";
import {
	ChevronDown,
	ChevronRight,
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
	Activity,
	Zap,
} from "lucide-react";
import { WorkflowResponse } from "@/types/workflow";
import {
	formatTimestamp,
	formatDuration,
	extractToolCalls,
	generateWorkflowSteps,
} from "@/lib/utils";

interface MinimizedWorkflowStatusProps {
	workflowResponse: WorkflowResponse;
	className?: string;
}

function getStatusIcon(status: string) {
	switch (status) {
		case "running":
			return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
		case "completed":
			return <CheckCircle className="w-3 h-3 text-green-500" />;
		case "failed":
			return <XCircle className="w-3 h-3 text-red-500" />;
		default:
			return <Clock className="w-3 h-3 text-gray-400" />;
	}
}

function getToolIcon(toolName: string) {
	switch (toolName) {
		case "check_permissions":
			return <Shield className="w-3 h-3" />;
		case "fetch_data":
			return <Database className="w-3 h-3" />;
		case "audit_log":
			return <FileText className="w-3 h-3" />;
		default:
			return <Activity className="w-3 h-3" />;
	}
}

export function MinimizedWorkflowStatus({
	workflowResponse,
	className = "",
}: MinimizedWorkflowStatusProps) {
	const [expanded, setExpanded] = useState(false);
	const toolCalls = extractToolCalls(workflowResponse);
	const workflowSteps = generateWorkflowSteps(workflowResponse);
	const isError = "error" in workflowResponse.result;
	const duration = formatDuration(
		workflowResponse.started_at,
		workflowResponse.completed_at,
	);

	const completedTools = toolCalls.filter(
		(tool) => tool.status === "completed",
	);
	const hasPermissionDenied =
		completedTools.some(
			(tool) => tool.tool_name === "check_permissions" && !tool.output?.allow,
		) ||
		(workflowResponse.result as any)?.answer?.toLowerCase().includes("denied");

	return (
		<div
			className={`mb-3 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden ${className}`}
		>
			{/* Minimized Header */}
			<button
				onClick={() => setExpanded(!expanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						{getStatusIcon(workflowResponse.status)}
						<span className="text-sm font-medium text-gray-700">
							Workflow Execution
						</span>
					</div>

					{/* Quick Status Indicators */}
					<div className="flex items-center gap-2">
						{/* Duration */}
						<span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
							{duration}
						</span>

						{/* Tool Count */}
						{toolCalls.length > 0 && (
							<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
								{toolCalls.length} tools
							</span>
						)}

						{/* Permission Status */}
						{hasPermissionDenied && (
							<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
								❌ Access Denied
							</span>
						)}

						{/* Success indicator */}
						{workflowResponse.status === "completed" &&
							!isError &&
							!hasPermissionDenied && (
								<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
									✅ Completed
								</span>
							)}

						{/* Error indicator */}
						{isError && (
							<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
								❌ Error
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-500">
						{formatTimestamp(workflowResponse.started_at)}
					</span>
					{expanded ? (
						<ChevronDown className="w-4 h-4 text-gray-400" />
					) : (
						<ChevronRight className="w-4 h-4 text-gray-400" />
					)}
				</div>
			</button>

			{/* Expanded Content */}
			{expanded && (
				<div className="border-t border-gray-200 bg-white">
					{/* Workflow Steps */}
					<div className="p-4 border-b border-gray-100">
						<h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
							<Brain className="w-4 h-4 text-blue-500" />
							Workflow Steps
						</h4>
						<div className="space-y-2">
							{workflowSteps.map((step, index) => (
								<div key={index} className="flex items-center gap-3 text-sm">
									<div className="flex-shrink-0">
										{step.status === "completed" ? (
											<CheckCircle className="w-4 h-4 text-green-500" />
										) : step.status === "failed" ? (
											<XCircle className="w-4 h-4 text-red-500" />
										) : (
											<Clock className="w-4 h-4 text-gray-400" />
										)}
									</div>
									<div className="flex-1">
										<span className="text-gray-700">{step.step_name}</span>
									</div>
									<span className="text-xs text-gray-500">
										{formatTimestamp(step.timestamp)}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Tool Calls */}
					{toolCalls.length > 0 && (
						<div className="p-4 border-b border-gray-100">
							<h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
								<Cog className="w-4 h-4 text-green-500" />
								Tool Executions ({toolCalls.length})
							</h4>
							<div className="space-y-3">
								{toolCalls.map((tool, index) => (
									<div key={index} className="bg-gray-50 rounded-lg p-3">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												{getToolIcon(tool.tool_name)}
												<span className="text-sm font-medium text-gray-800">
													{tool.tool_name}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{getStatusIcon(tool.status)}
												{tool.duration_ms && (
													<span className="text-xs text-gray-500">
														{tool.duration_ms}ms
													</span>
												)}
											</div>
										</div>

										{/* Tool-specific output */}
										{tool.tool_name === "check_permissions" && tool.output && (
											<div className="text-xs space-y-1">
												<div>
													<span className="font-medium">Decision: </span>
													<span
														className={
															tool.output.allow
																? "text-green-600 font-medium"
																: "text-red-600 font-medium"
														}
													>
														{tool.output.allow ? "✅ ALLOWED" : "❌ DENIED"}
													</span>
												</div>
												{tool.output.reason && (
													<div className="text-gray-600">
														<span className="font-medium">Reason: </span>
														{tool.output.reason}
													</div>
												)}
												{tool.output.policy_ref && (
													<div className="text-gray-500">
														<span className="font-medium">Policy: </span>
														{tool.output.policy_ref}
													</div>
												)}
											</div>
										)}

										{tool.tool_name === "fetch_data" && tool.output?.rows && (
											<div className="text-xs text-gray-600">
												<span className="font-medium">Records retrieved: </span>
												{tool.output.rows.length}
											</div>
										)}

										{tool.tool_name === "audit_log" && tool.output && (
											<div className="text-xs text-gray-600">
												<span className="font-medium">Status: </span>
												{tool.output.status || "logged"}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Error Details */}
					{isError && (
						<div className="p-4 bg-red-50 border-l-4 border-red-400">
							<h4 className="text-sm font-semibold text-red-800 mb-2">
								Error Details
							</h4>
							<div className="text-sm text-red-700">
								<div className="mb-1">
									<span className="font-medium">Type: </span>
									{workflowResponse.result.error_type}
								</div>
								<div className="mb-2">
									<span className="font-medium">Message: </span>
									{workflowResponse.result.error}
								</div>
							</div>
						</div>
					)}

					{/* Metadata */}
					<div className="p-4 bg-gray-50 text-xs text-gray-600">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="font-medium">Run ID: </span>
								{workflowResponse.run_id.slice(0, 8)}...
							</div>
							<div>
								<span className="font-medium">Handler: </span>
								{workflowResponse.handler_id}
							</div>
							<div>
								<span className="font-medium">Started: </span>
								{formatTimestamp(workflowResponse.started_at)}
							</div>
							<div>
								<span className="font-medium">Duration: </span>
								{duration}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
