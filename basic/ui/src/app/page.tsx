"use client";

import React, { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { Sidebar } from "@/components/Sidebar";
import { PanelLeft } from "lucide-react";

export default function HomePage() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<div
				className={`transition-all duration-300 ${sidebarOpen ? "w-80" : "w-0"} overflow-hidden`}
			>
				<Sidebar
					activeThreadId={activeThreadId}
					onThreadSelect={setActiveThreadId}
					onClose={() => setSidebarOpen(false)}
				/>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Header */}
				<div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
					{!sidebarOpen && (
						<button
							onClick={() => setSidebarOpen(true)}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<PanelLeft className="w-5 h-5 text-gray-600" />
						</button>
					)}
					<div>
						<h1 className="text-lg font-semibold text-gray-900">One-Stop</h1>
						<p className="text-sm text-gray-600">
							Secure AI-powered access to employee data with policy enforcement
						</p>
					</div>
				</div>

				{/* Chat Interface */}
				<div className="flex-1 overflow-hidden">
					<ChatInterface className="h-full" threadId={activeThreadId} />
				</div>
			</div>
		</div>
	);
}
