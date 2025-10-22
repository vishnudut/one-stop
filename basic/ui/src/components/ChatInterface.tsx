"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	Send,
	User,
	Bot,
	Loader2,
	AlertCircle,
	MessageSquare,
} from "lucide-react";
import { ChatMessage, WorkflowResponse } from "@/types/workflow";
import {
	APIClient,
	generateId,
	formatTimestamp,
	parseUserMessage,
	storage,
} from "@/lib/utils";
import { WorkflowExecutionView } from "./WorkflowExecutionView";
import { MinimizedWorkflowStatus } from "./MinimizedWorkflowStatus";

// Demo employee data for dropdown
const DEMO_EMPLOYEES = [
	{
		email: "grace.patel@company.com",
		name: "Grace Patel",
		role: "HR Manager",
		department: "HR",
	},
	{
		email: "lisa.brown@company.com",
		name: "Lisa Brown",
		role: "HR Director",
		department: "HR",
	},
	{
		email: "alice.chen@company.com",
		name: "Alice Chen",
		role: "Senior Engineer",
		department: "Engineering",
	},
	{
		email: "bob.martinez@company.com",
		name: "Bob Martinez",
		role: "Engineer",
		department: "Engineering",
	},
	{
		email: "carol.kim@company.com",
		name: "Carol Kim",
		role: "Staff Engineer",
		department: "Engineering",
	},
	{
		email: "david.okonkwo@company.com",
		name: "David Okonkwo",
		role: "Junior Engineer",
		department: "Engineering",
	},
	{
		email: "isabel.santos@company.com",
		name: "Isabel Santos",
		role: "Engineering Manager",
		department: "Engineering",
	},
	{
		email: "elena.rodriguez@company.com",
		name: "Elena Rodriguez",
		role: "Senior Analyst",
		department: "Finance",
	},
	{
		email: "james.wilson@company.com",
		name: "James Wilson",
		role: "Finance Manager",
		department: "Finance",
	},
	{
		email: "oscar.williams@company.com",
		name: "Oscar Williams",
		role: "CFO",
		department: "Executive",
	},
	{
		email: "frank.zhang@company.com",
		name: "Frank Zhang",
		role: "Account Executive",
		department: "Sales",
	},
	{
		email: "karen.johnson@company.com",
		name: "Karen Johnson",
		role: "Sales Manager",
		department: "Sales",
	},
	{
		email: "henry.lee@company.com",
		name: "Henry Lee",
		role: "SRE",
		department: "DevOps",
	},
	{
		email: "mike.davis@company.com",
		name: "Mike Davis",
		role: "DevOps Lead",
		department: "DevOps",
	},
	{
		email: "nancy.chen@company.com",
		name: "Nancy Chen",
		role: "CTO",
		department: "Executive",
	},
	{
		email: "paula.garcia@company.com",
		name: "Paula Garcia",
		role: "CEO",
		department: "Executive",
	},
	// Add some demo personas for testing
	{
		email: "test.engineer@company.com",
		name: "Test Engineer",
		role: "Engineer",
		department: "Demo",
	},
	{
		email: "test.manager@company.com",
		name: "Test Manager",
		role: "Engineering Manager",
		department: "Demo",
	},
	{
		email: "test.admin@company.com",
		name: "Test Admin",
		role: "Admin",
		department: "Demo",
	},
];

interface ChatInterfaceProps {
	className?: string;
	threadId?: string | null;
}

export function ChatInterface({ className, threadId }: ChatInterfaceProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [userEmail, setUserEmail] = useState("grace.patel@company.com");
	const [userRole, setUserRole] = useState("HR Manager");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentQuery, setCurrentQuery] = useState<string>("");

	// Handle email change and auto-sync role
	const handleEmailChange = (email: string) => {
		const selectedEmployee = DEMO_EMPLOYEES.find((emp) => emp.email === email);
		setUserEmail(email);
		if (selectedEmployee) {
			setUserRole(selectedEmployee.role);
		}
	};

	// Load messages for specific thread
	useEffect(() => {
		if (threadId) {
			const savedMessages = storage.get(`messages_${threadId}`) || [];
			setMessages(savedMessages);
		} else {
			setMessages([]);
		}
	}, [threadId]);

	// Save messages when they change
	useEffect(() => {
		if (threadId && messages.length > 0) {
			storage.set(`messages_${threadId}`, messages);

			// Update thread metadata
			const threads = storage.get("chat_threads") || [];
			const updatedThreads = threads.map((thread: any) =>
				thread.id === threadId
					? {
							...thread,
							title:
								messages[0]?.content?.slice(0, 50) + "..." ||
								"New conversation",
							lastMessage: messages[messages.length - 1]?.content || "",
							messageCount: messages.length,
							timestamp: new Date().toISOString(),
							userRole,
							userEmail,
						}
					: thread,
			);
			storage.set("chat_threads", updatedThreads);
		}
	}, [messages, threadId, userRole, userEmail]);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const apiClient = new APIClient();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || loading) return;

		const userQuery = input.trim();
		const formattedMessage = `[user_email=${userEmail}; role=${userRole}] ${userQuery}`;

		// Store current query for WorkflowExecutionView
		setCurrentQuery(userQuery);

		// Add user message
		const userMessage: ChatMessage = {
			id: generateId(),
			type: "user",
			content: userQuery,
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);
		setError(null);

		try {
			// Call the workflow API
			const workflowResponse = await apiClient.runWorkflow(formattedMessage);

			// Create assistant message with workflow data
			const assistantMessage: ChatMessage = {
				id: generateId(),
				type: "assistant",
				content:
					"error" in workflowResponse.result
						? `Error: ${workflowResponse.result.error}`
						: workflowResponse.result.answer || "No response received",
				timestamp: new Date().toISOString(),
				workflow_response: workflowResponse,
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");

			const errorMessage: ChatMessage = {
				id: generateId(),
				type: "system",
				content: `Error: ${err instanceof Error ? err.message : "Failed to process request"}`,
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
		}
	};

	const handleClearChat = () => {
		setMessages([]);
		setError(null);
	};

	const suggestedQueries = [
		"Get salary for employee_id 101 (Alice Chen)",
		"Show performance review for employee_id 102 (Bob Martinez)",
		"Get performance_summary for employee_id 107 (Grace Patel)",
		"Show directory information for all employees",
		"What salary information can I access?",
		"Show me all HR policies",
	];

	return (
		<div className={`flex flex-col h-full bg-white ${className}`}>
			{/* User Controls - Compact Header */}
			<div className="border-b border-gray-200 px-4 py-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<label
								htmlFor="user-select"
								className="text-xs font-medium text-gray-600"
							>
								User:
							</label>
							<select
								id="user-select"
								value={userEmail}
								onChange={(e) => handleEmailChange(e.target.value)}
								className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[200px]"
							>
								{/* Group by department for easier demo navigation */}
								<optgroup label="👔 Executive">
									{DEMO_EMPLOYEES.filter(
										(emp) => emp.department === "Executive",
									).map((emp) => (
										<option key={emp.email} value={emp.email}>
											{emp.name} - {emp.role}
										</option>
									))}
								</optgroup>
								<optgroup label="👥 HR">
									{DEMO_EMPLOYEES.filter((emp) => emp.department === "HR").map(
										(emp) => (
											<option key={emp.email} value={emp.email}>
												{emp.name} - {emp.role}
											</option>
										),
									)}
								</optgroup>
								<optgroup label="💰 Finance">
									{DEMO_EMPLOYEES.filter(
										(emp) => emp.department === "Finance",
									).map((emp) => (
										<option key={emp.email} value={emp.email}>
											{emp.name} - {emp.role}
										</option>
									))}
								</optgroup>
								<optgroup label="⚙️ Engineering">
									{DEMO_EMPLOYEES.filter(
										(emp) => emp.department === "Engineering",
									).map((emp) => (
										<option key={emp.email} value={emp.email}>
											{emp.name} - {emp.role}
										</option>
									))}
								</optgroup>
								<optgroup label="📈 Sales">
									{DEMO_EMPLOYEES.filter(
										(emp) => emp.department === "Sales",
									).map((emp) => (
										<option key={emp.email} value={emp.email}>
											{emp.name} - {emp.role}
										</option>
									))}
								</optgroup>
								<optgroup label="🔧 DevOps">
									{DEMO_EMPLOYEES.filter(
										(emp) => emp.department === "DevOps",
									).map((emp) => (
										<option key={emp.email} value={emp.email}>
											{emp.name} - {emp.role}
										</option>
									))}
								</optgroup>
								<optgroup label="🧪 Demo Personas">
									{DEMO_EMPLOYEES.filter(
										(emp) => emp.department === "Demo",
									).map((emp) => (
										<option key={emp.email} value={emp.email}>
											{emp.name} - {emp.role}
										</option>
									))}
								</optgroup>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<label
								htmlFor="user-role"
								className="text-xs font-medium text-gray-600"
							>
								Role:
							</label>
							<div
								id="user-role"
								className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-gray-700 min-w-[120px]"
							>
								{userRole}
							</div>
						</div>
					</div>
					{threadId && (
						<button
							type="button"
							onClick={handleClearChat}
							className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
						>
							Clear Thread
						</button>
					)}
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
				{messages.length === 0 && !threadId && (
					<div className="text-center text-gray-500 mt-16">
						<Bot className="mx-auto h-16 w-16 mb-4 text-gray-300" />
						<p className="text-xl mb-2">Welcome to the Compliance Concierge</p>
						<p className="text-gray-600 mb-8 max-w-md mx-auto">
							Ask questions about employee data, access policies, or system
							administration. I'll check permissions and provide appropriate
							responses.
						</p>

						<div className="text-left max-w-lg mx-auto">
							<p className="text-sm font-semibold text-gray-700 mb-3">
								Try these examples:
							</p>
							<div className="grid gap-2">
								{suggestedQueries.map((query) => (
									<button
										key={query}
										type="button"
										onClick={() => setInput(query)}
										className="text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
									>
										{query}
									</button>
								))}
							</div>
						</div>
					</div>
				)}

				{messages.length === 0 && threadId && (
					<div className="text-center text-gray-500 mt-16">
						<MessageSquare className="mx-auto h-12 w-12 mb-4 text-gray-300" />
						<p className="text-lg mb-2">Start a conversation</p>
						<p className="text-sm text-gray-600">
							Ask a question to begin this conversation thread.
						</p>
					</div>
				)}

				{messages.map((message) => (
					<div key={message.id} className="group">
						<div
							className={`flex gap-4 ${
								message.type === "user" ? "flex-row-reverse" : ""
							}`}
						>
							{/* Avatar */}
							<div className="flex-shrink-0">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center ${
										message.type === "user"
											? "bg-blue-600 text-white"
											: message.type === "system"
												? "bg-red-500 text-white"
												: "bg-gray-700 text-white"
									}`}
								>
									{message.type === "user" ? (
										<User className="w-4 h-4" />
									) : message.type === "system" ? (
										<AlertCircle className="w-4 h-4" />
									) : (
										<Bot className="w-4 h-4" />
									)}
								</div>
							</div>

							{/* Message Content */}
							<div
								className={`flex-1 space-y-3 ${
									message.type === "user" ? "text-right" : ""
								}`}
							>
								{/* Workflow Status (above bot response) */}
								{message.type === "assistant" && message.workflow_response && (
									<div className={message.type === "user" ? "text-left" : ""}>
										<MinimizedWorkflowStatus
											workflowResponse={message.workflow_response}
										/>
									</div>
								)}

								{/* Message Bubble */}
								<div
									className={message.type === "user" ? "flex justify-end" : ""}
								>
									<div
										className={`max-w-4xl px-4 py-3 rounded-2xl ${
											message.type === "user"
												? "bg-blue-600 text-white"
												: message.type === "system"
													? "bg-red-50 text-red-800 border border-red-200"
													: "bg-gray-100 text-gray-800"
										}`}
									>
										<div className="whitespace-pre-wrap leading-relaxed">
											{message.content}
										</div>
									</div>
								</div>

								{/* Timestamp */}
								<div
									className={`text-xs text-gray-500 px-1 ${
										message.type === "user" ? "text-right" : "text-left"
									}`}
								>
									{formatTimestamp(message.timestamp)}
								</div>
							</div>
						</div>
					</div>
				))}

				{loading && (
					<div className="flex gap-4">
						<div className="flex-shrink-0">
							<div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center">
								<Bot className="w-4 h-4" />
							</div>
						</div>
						<div className="flex-1">
							<WorkflowExecutionView
								isActive={loading}
								userQuery={currentQuery}
								userRole={userRole}
								userEmail={userEmail}
								onComplete={() => {
									// Workflow execution completed
								}}
							/>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Error display */}
			{error && (
				<div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
					<div className="flex items-center gap-2 text-red-800">
						<AlertCircle className="w-4 h-4" />
						<span className="text-sm">{error}</span>
						<button
							type="button"
							onClick={() => setError(null)}
							className="ml-auto text-red-600 hover:text-red-800"
						>
							✕
						</button>
					</div>
				</div>
			)}

			{/* Input */}
			<div className="border-t border-gray-200 p-4">
				<form onSubmit={handleSubmit} className="flex gap-3">
					<div className="flex-1 relative">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Message Compliance Concierge..."
							className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={!input.trim() || loading}
							className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<Send className="w-5 h-5" />
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
