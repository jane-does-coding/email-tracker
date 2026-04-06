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
		const interval = setInterval(async () => {
			const res = await fetch(`/api/track-logs/${trackingId}`);
			const data = await res.json();
			setLogs(data);
		}, 2000);
		return () => clearInterval(interval);
	}, [trackingId]);

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
			<div className="flex flex-col border border-dashed p-[2vh]">
				<h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-2 ">
					Email Tracker Generator
				</h1>
				<p className="text-gray-600 mb-6 text-center max-w-md">
					Generate a tracking pixel for your emails and see when they are
					opened.
				</p>

				<button
					onClick={generate}
					className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 px-6 border border-dashed transition-colors"
				>
					Generate Tracking Pixel
				</button>

				{trackingId && (
					<div className="bg-white border border-dashed p-6 mt-8 w-full max-w-xl">
						<h2 className="text-xl font-semibold text-gray-800 mb-2">
							Tracking URL
						</h2>
						<code className="block bg-gray-100 rounded-md p-3 break-all text-sm text-gray-700">
							{trackingUrl}
						</code>

						<h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
							Embed in your email
						</h2>
						<textarea
							readOnly
							value={emailHTML}
							className="w-full h-24 p-3 rounded-md border border-gray-200 text-sm font-mono bg-gray-50 text-gray-700"
						/>

						<h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
							Opened Logs
						</h2>
						{logs.length ? (
							<ul className="list-disc list-inside text-gray-700">
								{logs.map((log, i) => (
									<li key={i}>{log}</li>
								))}
							</ul>
						) : (
							<p className="text-gray-400">No opens yet</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
