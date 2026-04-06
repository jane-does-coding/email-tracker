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

	// Poll the server every 2 seconds to see if email has been opened
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
		<div style={{ padding: "40px", fontFamily: "sans-serif" }}>
			<h1>Email Tracker Generator</h1>
			<button onClick={generate}>Generate Tracking Pixel</button>

			{trackingId && (
				<>
					<p>Tracking URL:</p>
					<code>{trackingUrl}</code>

					<p style={{ marginTop: 20 }}>Embed this in your email:</p>
					<textarea
						readOnly
						value={emailHTML}
						style={{ width: "100%", height: 100 }}
					/>

					<h2 style={{ marginTop: 20 }}>Opened Logs:</h2>
					{logs.length ? (
						<ul>
							{logs.map((log, i) => (
								<li key={i}>{log}</li>
							))}
						</ul>
					) : (
						<p>No opens yet</p>
					)}
				</>
			)}
		</div>
	);
}
