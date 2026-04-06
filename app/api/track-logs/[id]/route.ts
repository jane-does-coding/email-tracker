import { NextRequest } from "next/server";
import { openedEmails } from "../../track/shared";

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	const logs = openedEmails[id] || [];

	// Sort by timestamp to show chronological order
	const sortedLogs = [...logs].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);

	// Format logs for display
	const formattedLogs = sortedLogs.map((log) => {
		if (log.isRealOpen) {
			let typeIndicator = "";
			if (log.type === "email_proxy") typeIndicator = "📧";
			else if (log.type === "browser") typeIndicator = "🌐";
			else typeIndicator = "✅";

			return `${typeIndicator} REAL OPEN: ${log.timestamp} - ${log.ip} - ${log.userAgent} [${log.reason}]`;
		} else {
			return `🚫 FILTERED: ${log.timestamp} - ${log.ip} - ${log.reason} - ${log.userAgent}`;
		}
	});

	return new Response(JSON.stringify(formattedLogs), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	});
}
