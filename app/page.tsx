"use client";
import { useState, useEffect } from "react";

export default function Home() {
	const [trackingId, setTrackingId] = useState("");
	const [logs, setLogs] = useState<string[]>([]);

	const generate = () => {
		const id = crypto.randomUUID();
		setTrackingId(id);
		setLogs([]);
	};

	const trackingUrl =
		trackingId && `${window.location.origin}/api/track/${trackingId}`;
	const emailHTML =
		trackingUrl && `<img src="${trackingUrl}" width="1" height="1" alt="" />`;

	useEffect(() => {
		if (!trackingId) return;

		const fetchLogs = async () => {
			const res = await fetch(`/api/track-logs/${trackingId}`);
			const data = await res.json();
			setLogs(data);
		};

		fetchLogs();
		const interval = setInterval(fetchLogs, 2000);
		return () => clearInterval(interval);
	}, [trackingId]);

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
			<div className="flex flex-col border border-dashed p-8 max-w-4xl w-full">
				<h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-2">
					📧 Email Tracker Generator
				</h1>
				<p className="text-gray-600 mb-6 text-center max-w-md">
					Generate a tracking pixel for your emails and see when they are
					opened.
					<br />
					<span className="text-sm">
						✅ = Real open | 🚫 = Filtered (bot/duplicate)
					</span>
				</p>

				<button
					onClick={generate}
					className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 px-6 border border-dashed transition-colors"
				>
					Generate Tracking Pixel
				</button>

				{trackingId && (
					<div className="bg-white border border-dashed p-6 mt-8 w-full">
						<h2 className="text-xl font-semibold text-gray-800 mb-2">
							🔗 Tracking URL
						</h2>
						<code className="block bg-gray-100 rounded-md p-3 break-all text-sm text-gray-700">
							{trackingUrl}
						</code>

						<h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
							📝 Embed in your email
						</h2>
						<textarea
							readOnly
							value={emailHTML}
							className="w-full h-24 p-3 rounded-md border border-gray-200 text-sm font-mono bg-gray-50 text-gray-700"
						/>

						<h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
							📊 Open Logs
						</h2>
						{logs.length > 0 ? (
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{logs.map((log, i) => (
									<div
										key={i}
										className={`p-2 rounded text-sm font-mono ${
											log.includes("✅")
												? "bg-green-50 border-l-4 border-green-500"
												: "bg-gray-50 border-l-4 border-gray-400"
										}`}
									>
										{log}
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-400 italic">
								No requests yet. Send a test email!
							</p>
						)}

						<div className="mt-4 text-xs text-gray-500">
							<p>
								💡 <strong>Note:</strong> Only the first request from each IP
								within 30 seconds is counted as a real open.
							</p>
							<p>
								🤖 Known bots (GoogleImageProxy, Facebook, etc.) are
								automatically filtered out.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
