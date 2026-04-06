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
		const interval = setInterval(fetchLogs, 3000);
		return () => clearInterval(interval);
	}, [trackingId]);

	// Count real opens
	const realOpens = logs.filter((log) => log.includes("REAL OPEN"));

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
			<div className="flex flex-col border border-dashed p-8 max-w-4xl w-full">
				<h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-2">
					📧 Email Tracker Generator
				</h1>
				<p className="text-gray-600 mb-6 text-center max-w-md">
					Track when your emails are opened with smart priority detection
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

						<div className="mt-4 bg-blue-50 p-3 rounded text-sm">
							<p className="font-semibold">📌 Smart Priority System:</p>
							<p className="text-gray-600 mt-1">
								📧 Email proxies (Gmail, Outlook) have highest priority →
								counted as real opens
							</p>
							<p className="text-gray-600">
								🌐 Browsers have medium priority → counted only if no email
								proxy is detected
							</p>
							<p className="text-gray-600">
								🤖 Crawlers (Facebook, LinkedIn bots) are filtered out
							</p>
							<p className="text-gray-600 text-xs mt-2">
								This ensures the most reliable open source is always counted!
							</p>
						</div>

						<h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
							📊 Open Logs{" "}
							{realOpens.length > 0 &&
								`(${realOpens.length} real ${
									realOpens.length === 1 ? "open" : "opens"
								})`}
						</h2>
						{logs.length > 0 ? (
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{logs.map((log, i) => (
									<div
										key={i}
										className={`p-2 rounded text-sm font-mono ${
											log.includes("REAL OPEN")
												? "bg-green-50 border-l-4 border-green-500 text-green-800"
												: "bg-gray-50 border-l-4 border-gray-400 text-gray-600"
										}`}
									>
										{log}
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-400 italic">
								No requests yet. Send a test email to see tracking in action!
							</p>
						)}

						<div className="mt-6 text-xs text-gray-500 border-t pt-4">
							<p className="font-semibold">
								Priority System (highest to lowest):
							</p>
							<ol className="list-decimal list-inside mt-1 space-y-1">
								<li>
									<strong>📧 Email proxies</strong> (Gmail, Outlook, Yahoo) -
									Most reliable open indicator
								</li>
								<li>
									<strong>🌐 Browsers/Email clients</strong> - Could be
									previews, but usually real
								</li>
								<li>
									<strong>🤖 Crawlers</strong> (Social media bots, search
									engines) - Filtered out
								</li>
							</ol>
							<p className="mt-2">
								If an email proxy open is detected after a browser open, it will
								override the browser open.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
