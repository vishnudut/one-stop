import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Compliance-Aware Data Concierge",
	description: "AI-powered compliance system for secure data access",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="bg-gray-50 min-h-screen">{children}</body>
		</html>
	);
}
