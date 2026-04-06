import { NextRequest } from "next/server";
import { openedEmails } from "../../track/shared";

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	const logs = openedEmails[id] || [];

	// Format logs for display
	const formattedLogs = logs.map((log) => {
		if (log.isRealOpen) {
			return `✅ REAL OPEN: ${log.timestamp} - ${log.ip} - ${log.userAgent}`;
		} else {
			return `🚫 FILTERED: ${log.timestamp} - ${log.ip} - [${log.reason}] - ${log.userAgent}`;
		}
	});

	return new Response(JSON.stringify(formattedLogs), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	});
}
