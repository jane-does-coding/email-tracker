"use client";
import { useState, useEffect } from "react";

interface EmailLog {
	timestamp: string;
	ip: string;
	userAgent: string;
	isRealOpen: boolean;
	reason?: string;
}

export default function Home() {
	const [trackingId, setTrackingId] = useState("");
	const [realOpens, setRealOpens] = useState<EmailLog[]>([]);
	const [allRequests, setAllRequests] = useState<EmailLog[]>([]);
	const [showAllRequests, setShowAllRequests] = useState(false);

	const generate = () => {
		const id = crypto.randomUUID();
		setTrackingId(id);
		setRealOpens([]);
		setAllRequests([]);
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
			setRealOpens(data);

			// Fetch all requests (you'd need another endpoint for this)
			const allRes = await fetch(`/api/track-all/${trackingId}`);
			const allData = await allRes.json();
			setAllRequests(allData);
		};

		fetchLogs();

		const interval = setInterval(fetchLogs, 3000);
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
					actually opened by real people.
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

						<div className="mt-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold text-gray-800">
									✅ Real Opens ({realOpens.length})
								</h2>
								<button
									onClick={() => setShowAllRequests(!showAllRequests)}
									className="text-sm text-gray-500 hover:text-gray-700 underline"
								>
									{showAllRequests ? "Hide" : "Show"} all requests (
									{allRequests.length})
								</button>
							</div>

							{realOpens.length > 0 ? (
								<div className="space-y-2 max-h-96 overflow-y-auto">
									{realOpens.map((log, i) => (
										<div
											key={i}
											className="bg-green-50 border-l-4 border-green-500 p-3"
										>
											<div className="text-sm font-mono">
												<span className="font-bold">
													🕐 {new Date(log.timestamp).toLocaleString()}
												</span>
												<span className="mx-2">•</span>
												<span>🌐 {log.ip}</span>
											</div>
											<div className="text-xs text-gray-600 mt-1 break-all">
												{log.userAgent.substring(0, 100)}...
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-gray-400 italic">
									No real opens detected yet
								</p>
							)}

							{showAllRequests && allRequests.length > 0 && (
								<div className="mt-6">
									<h3 className="text-md font-semibold text-gray-600 mb-2">
										🚫 Filtered Out Requests (
										{allRequests.length - realOpens.length})
									</h3>
									<div className="space-y-2 max-h-96 overflow-y-auto">
										{allRequests
											.filter((log) => !log.isRealOpen)
											.map((log, i) => (
												<div
													key={i}
													className="bg-gray-50 border-l-4 border-gray-300 p-3"
												>
													<div className="text-sm font-mono">
														<span>
															🕐 {new Date(log.timestamp).toLocaleString()}
														</span>
														<span className="mx-2">•</span>
														<span>🌐 {log.ip}</span>
													</div>
													<div className="text-xs text-gray-500 mt-1">
														Filtered: {log.reason}
													</div>
													<div className="text-xs text-gray-400 mt-1 break-all">
														{log.userAgent.substring(0, 80)}...
													</div>
												</div>
											))}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
