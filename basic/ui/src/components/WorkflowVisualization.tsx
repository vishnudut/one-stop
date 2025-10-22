"use client";

import React from "react";
import { CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { WorkflowResponse, WorkflowStep } from "@/types/workflow";
import {
	generateWorkflowSteps,
	formatTimestamp,
	getStatusIcon,
} from "@/lib/utils";

interface WorkflowVisualizationProps {
	workflowResponse: WorkflowResponse;
	className?: string;
}

export function WorkflowVisualization({
	workflowResponse,
	className,
}: WorkflowVisualizationProps) {
	const steps = generateWorkflowSteps(workflowResponse);
	const isError = "error" in workflowResponse.result;

	return (
		<div
			className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-semibold text-gray-900">Workflow Steps</h3>
				<div className="flex items-center gap-2">
					<span
						className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
							workflowResponse.status === "completed"
								? "bg-green-100 text-green-800"
								: workflowResponse.status === "failed"
									? "bg-red-100 text-red-800"
									: "bg-blue-100 text-blue-800"
						}`}
					>
						{getStatusIcon(workflowResponse.status)} {workflowResponse.status}
					</span>
					<span className="text-xs text-gray-500">
						ID: {workflowResponse.run_id.slice(0, 8)}...
					</span>
				</div>
			</div>

			{/* Timeline */}
			<div className="relative">
				{steps.map((step, index) => (
					<div key={index} className="relative">
						{/* Timeline line */}
						{index < steps.length - 1 && (
							<div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-300" />
						)}

						{/* Step */}
						<div className="flex items-start gap-3 pb-4">
							{/* Status icon */}
							<div className="flex-shrink-0">
								{step.status === "completed" ? (
									<CheckCircle className="w-8 h-8 text-green-500" />
								) : step.status === "failed" ? (
									<XCircle className="w-8 h-8 text-red-500" />
								) : (
									<Clock className="w-8 h-8 text-blue-500" />
								)}
							</div>

							{/* Step details */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium text-gray-900">
										{step.step_name}
									</h4>
									<span className="text-xs text-gray-500">
										{formatTimestamp(step.timestamp)}
									</span>
								</div>
								<p className="text-sm text-gray-600 mt-1">{step.description}</p>

								{/* Additional details */}
								{step.details && (
									<div className="mt-2 text-xs bg-white rounded border p-2">
										<pre className="whitespace-pre-wrap text-gray-700">
											{JSON.stringify(step.details, null, 2)}
										</pre>
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Workflow metadata */}
			<div className="mt-4 pt-4 border-t border-gray-200">
				<div className="grid grid-cols-2 gap-4 text-xs">
					<div>
						<span className="font-medium text-gray-700">Started:</span>
						<span className="ml-1 text-gray-600">
							{formatTimestamp(workflowResponse.started_at)}
						</span>
					</div>
					<div>
						<span className="font-medium text-gray-700">Duration:</span>
						<span className="ml-1 text-gray-600">
							{workflowResponse.completed_at
								? `${Math.round(
										(new Date(workflowResponse.completed_at).getTime() -
											new Date(workflowResponse.started_at).getTime()) /
											1000,
									)}s`
								: "Running..."}
						</span>
					</div>
				</div>
			</div>

			{/* Error details */}
			{isError && (
				<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
					<h4 className="text-sm font-medium text-red-800 mb-2">
						Error Details
					</h4>
					<div className="text-xs text-red-700">
						<div className="mb-1">
							<span className="font-medium">Type:</span>{" "}
							{workflowResponse.result.error_type}
						</div>
						<div className="mb-2">
							<span className="font-medium">Message:</span>{" "}
							{workflowResponse.result.error}
						</div>
						{workflowResponse.result.traceback && (
							<details className="mt-2">
								<summary className="cursor-pointer text-red-600 hover:text-red-800">
									Show Traceback
								</summary>
								<pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">
									{workflowResponse.result.traceback}
								</pre>
							</details>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
