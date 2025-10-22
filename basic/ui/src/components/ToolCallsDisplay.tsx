"use client";

import React, { useState } from "react";
import {
	ChevronDown,
	ChevronRight,
	Shield,
	Database,
	FileText,
	Clock,
	CheckCircle,
	XCircle,
	Activity,
} from "lucide-react";
import { WorkflowResponse, ToolCall } from "@/types/workflow";
import { extractToolCalls, formatTimestamp, formatDuration } from "@/lib/utils";

interface ToolCallsDisplayProps {
	workflowResponse: WorkflowResponse;
	className?: string;
}

interface ToolCallItemProps {
	toolCall: ToolCall;
	index: number;
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
			return "text-amber-600 bg-amber-50 border-amber-200";
		case "fetch_data":
			return "text-blue-600 bg-blue-50 border-blue-200";
		case "audit_log":
			return "text-green-600 bg-green-50 border-green-200";
		default:
			return "text-gray-600 bg-gray-50 border-gray-200";
	}
}

function getToolDescription(toolName: string) {
	switch (toolName) {
		case "check_permissions":
			return "Validates user permissions against company policies using role-based access control and policy lookup";
		case "fetch_data":
			return "Retrieves requested data from the employee database with appropriate filtering";
		case "audit_log":
			return "Records the access attempt and decision for compliance auditing purposes";
		default:
			return `Executes ${toolName} function`;
	}
}

function ToolCallItem({ toolCall, index }: ToolCallItemProps) {
	const [expanded, setExpanded] = useState(false);
	const toolColor = getToolColor(toolCall.tool_name);
	const toolIcon = getToolIcon(toolCall.tool_name);

	return (
		<div className={`border rounded-lg p-3 ${toolColor}`}>
			<div
				className="flex items-center justify-between cursor-pointer"
				onClick={() => setExpanded(!expanded)}
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						{toolIcon}
						<span className="font-medium text-sm">
							{index + 1}. {toolCall.tool_name}
						</span>
					</div>

					<div className="flex items-center gap-2">
						{toolCall.status === "completed" ? (
							<CheckCircle className="w-4 h-4 text-green-500" />
						) : toolCall.status === "failed" ? (
							<XCircle className="w-4 h-4 text-red-500" />
						) : (
							<Clock className="w-4 h-4 text-blue-500" />
						)}

						{toolCall.duration_ms && (
							<span className="text-xs text-gray-500">
								{toolCall.duration_ms}ms
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-500">
						{formatTimestamp(toolCall.timestamp)}
					</span>
					{expanded ? (
						<ChevronDown className="w-4 h-4" />
					) : (
						<ChevronRight className="w-4 h-4" />
					)}
				</div>
			</div>

			<div className="mt-2 text-xs text-gray-600">
				{getToolDescription(toolCall.tool_name)}
			</div>

			{expanded && (
				<div className="mt-4 space-y-3 border-t pt-3">
					{/* Input */}
					<div>
						<h5 className="font-medium text-xs text-gray-700 mb-1">Input:</h5>
						<div className="bg-white rounded border p-2 text-xs">
							<pre className="whitespace-pre-wrap text-gray-800">
								{JSON.stringify(toolCall.input, null, 2)}
							</pre>
						</div>
					</div>

					{/* Output */}
					<div>
						<h5 className="font-medium text-xs text-gray-700 mb-1">Output:</h5>
						<div className="bg-white rounded border p-2 text-xs">
							{toolCall.tool_name === "check_permissions" && toolCall.output ? (
								<div className="space-y-1">
									<div>
										<span className="font-medium">Decision:</span>{" "}
										<span
											className={
												toolCall.output.allow
													? "text-green-600 font-medium"
													: "text-red-600 font-medium"
											}
										>
											{toolCall.output.allow ? "✅ ALLOWED" : "❌ DENIED"}
										</span>
									</div>
									{toolCall.output.reason && (
										<div>
											<span className="font-medium">Reason:</span>{" "}
											{toolCall.output.reason}
										</div>
									)}
									{toolCall.output.policy_ref && (
										<div>
											<span className="font-medium">Policy:</span>{" "}
											{toolCall.output.policy_ref}
										</div>
									)}
								</div>
							) : toolCall.tool_name === "fetch_data" &&
								toolCall.output?.rows ? (
								<div>
									<div className="mb-1">
										<span className="font-medium">Records found:</span>{" "}
										{toolCall.output.rows.length}
									</div>
									{toolCall.output.rows.length > 0 && (
										<div className="text-xs">
											<span className="font-medium">Sample:</span>{" "}
											{Object.keys(toolCall.output.rows[0]).join(", ")}
										</div>
									)}
								</div>
							) : (
								<pre className="whitespace-pre-wrap text-gray-800">
									{JSON.stringify(toolCall.output, null, 2)}
								</pre>
							)}
						</div>
					</div>

					{/* Status and timing */}
					<div className="flex justify-between items-center text-xs text-gray-500">
						<span>Status: {toolCall.status}</span>
						{toolCall.duration_ms && (
							<span>Execution time: {toolCall.duration_ms}ms</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export function ToolCallsDisplay({
	workflowResponse,
	className,
}: ToolCallsDisplayProps) {
	const toolCalls = extractToolCalls(workflowResponse);

	if (toolCalls.length === 0) {
		return null;
	}

	return (
		<div
			className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
					<Activity className="w-4 h-4" />
					Tool Calls ({toolCalls.length})
				</h3>
				<div className="text-xs text-gray-500">
					Function executions during workflow
				</div>
			</div>

			<div className="space-y-3">
				{toolCalls.map((toolCall, index) => (
					<ToolCallItem
						key={`${toolCall.tool_name}-${index}`}
						toolCall={toolCall}
						index={index}
					/>
				))}
			</div>

			{/* Summary */}
			<div className="mt-4 pt-3 border-t border-gray-200">
				<div className="flex justify-between items-center text-xs text-gray-600">
					<span>Total tools executed: {toolCalls.length}</span>
					<span>
						Total execution time:{" "}
						{toolCalls.reduce((sum, call) => sum + (call.duration_ms || 0), 0)}
						ms
					</span>
				</div>
			</div>
		</div>
	);
}
