"use client";

import React, { useState, useEffect } from "react";
import {
	Plus,
	MessageSquare,
	Search,
	X,
	MoreHorizontal,
	Trash2,
	Edit3,
	Clock,
	User,
	Bot,
} from "lucide-react";
import { generateId, storage, formatTimestamp } from "@/lib/utils";

interface ChatThread {
	id: string;
	title: string;
	lastMessage: string;
	timestamp: string;
	messageCount: number;
	userRole: string;
	userEmail: string;
}

interface SidebarProps {
	activeThreadId: string | null;
	onThreadSelect: (threadId: string | null) => void;
	onClose: () => void;
}

export function Sidebar({
	activeThreadId,
	onThreadSelect,
	onClose,
}: SidebarProps) {
	const [threads, setThreads] = useState<ChatThread[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [showOptions, setShowOptions] = useState<string | null>(null);

	// Load threads from localStorage on mount
	useEffect(() => {
		const savedThreads = storage.get("chat_threads") || [];
		setThreads(savedThreads);
	}, []);

	// Save threads to localStorage when threads change
	useEffect(() => {
		storage.set("chat_threads", threads);
	}, [threads]);

	const createNewThread = () => {
		const newThread: ChatThread = {
			id: generateId(),
			title: "New conversation",
			lastMessage: "",
			timestamp: new Date().toISOString(),
			messageCount: 0,
			userRole: "HR",
			userEmail: "user@company.com",
		};

		setThreads((prev) => [newThread, ...prev]);
		onThreadSelect(newThread.id);
		setSearchQuery("");
	};

	const deleteThread = (threadId: string) => {
		setThreads((prev) => prev.filter((t) => t.id !== threadId));
		if (activeThreadId === threadId) {
			onThreadSelect(null);
		}
		setShowOptions(null);
	};

	const updateThreadTitle = (threadId: string, newTitle: string) => {
		setThreads((prev) =>
			prev.map((thread) =>
				thread.id === threadId ? { ...thread, title: newTitle } : thread,
			),
		);
		setShowOptions(null);
	};

	const filteredThreads = threads.filter(
		(thread) =>
			thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
			thread.userRole.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const groupThreadsByDate = (threads: ChatThread[]) => {
		const groups: { [key: string]: ChatThread[] } = {};
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

		threads.forEach((thread) => {
			const threadDate = new Date(thread.timestamp);
			const threadDay = new Date(
				threadDate.getFullYear(),
				threadDate.getMonth(),
				threadDate.getDate(),
			);

			let group: string;
			if (threadDay.getTime() === today.getTime()) {
				group = "Today";
			} else if (threadDay.getTime() === yesterday.getTime()) {
				group = "Yesterday";
			} else if (threadDate >= weekAgo) {
				group = "Previous 7 days";
			} else {
				group = "Older";
			}

			if (!groups[group]) groups[group] = [];
			groups[group].push(thread);
		});

		return groups;
	};

	const threadGroups = groupThreadsByDate(filteredThreads);

	return (
		<div className="h-full bg-gray-900 text-white flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-gray-700">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Chat History</h2>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-700 rounded transition-colors lg:hidden"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* New Chat Button */}
				<button
					onClick={createNewThread}
					className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
				>
					<Plus className="w-4 h-4" />
					<span>New conversation</span>
				</button>
			</div>

			{/* Search */}
			<div className="p-4 border-b border-gray-700">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search conversations..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
					/>
				</div>
			</div>

			{/* Thread List */}
			<div className="flex-1 overflow-y-auto custom-scrollbar">
				{threads.length === 0 ? (
					<div className="p-4 text-center text-gray-400">
						<MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">No conversations yet</p>
						<p className="text-xs mt-1">Start a new conversation to begin</p>
					</div>
				) : filteredThreads.length === 0 ? (
					<div className="p-4 text-center text-gray-400">
						<Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">No conversations found</p>
						<p className="text-xs mt-1">Try a different search term</p>
					</div>
				) : (
					<div className="p-2">
						{Object.entries(threadGroups).map(([group, groupThreads]) => (
							<div key={group} className="mb-4">
								<h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">
									{group}
								</h3>
								<div className="space-y-1">
									{groupThreads.map((thread) => (
										<div
											key={thread.id}
											className={`group relative rounded-lg transition-colors ${
												activeThreadId === thread.id
													? "bg-blue-600"
													: "hover:bg-gray-700"
											}`}
										>
											<button
												onClick={() => onThreadSelect(thread.id)}
												className="w-full text-left p-3 relative"
											>
												<div className="flex items-start gap-2 mb-1">
													<MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
													<div className="flex-1 min-w-0">
														<h4 className="text-sm font-medium truncate">
															{thread.title}
														</h4>
													</div>
												</div>

												{thread.lastMessage && (
													<p className="text-xs text-gray-300 truncate ml-6">
														{thread.lastMessage}
													</p>
												)}

												<div className="flex items-center justify-between mt-2 ml-6">
													<div className="flex items-center gap-2 text-xs text-gray-400">
														<User className="w-3 h-3" />
														<span>{thread.userRole}</span>
														<span>•</span>
														<span>{thread.messageCount} messages</span>
													</div>
													<div className="flex items-center gap-1 text-xs text-gray-400">
														<Clock className="w-3 h-3" />
														<span>{formatTimestamp(thread.timestamp)}</span>
													</div>
												</div>
											</button>

											{/* Options Menu */}
											<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={(e) => {
														e.stopPropagation();
														setShowOptions(
															showOptions === thread.id ? null : thread.id,
														);
													}}
													className="p-1 hover:bg-gray-600 rounded transition-colors"
												>
													<MoreHorizontal className="w-3 h-3" />
												</button>

												{showOptions === thread.id && (
													<div className="absolute top-6 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 z-10">
														<button
															onClick={() => {
																const newTitle = prompt(
																	"Enter new title:",
																	thread.title,
																);
																if (newTitle && newTitle.trim()) {
																	updateThreadTitle(thread.id, newTitle.trim());
																}
															}}
															className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
														>
															<Edit3 className="w-3 h-3" />
															Rename
														</button>
														<button
															onClick={() => deleteThread(thread.id)}
															className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2"
														>
															<Trash2 className="w-3 h-3" />
															Delete
														</button>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="p-4 border-t border-gray-700">
				<div className="text-xs text-gray-400">
					<div className="flex items-center justify-between">
						<span>{threads.length} conversations</span>
						<span>Compliance AI v1.0</span>
					</div>
				</div>
			</div>
		</div>
	);
}
