import { NextRequest } from "next/server";
import { openedEmails } from "../../track/shared";

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	// Return formatted strings for display (backward compatible with your frontend)
	const logs = openedEmails[id] || [];

	// Format logs as strings for the existing frontend
	const formattedLogs = logs.map((log) => {
		if (log.isRealOpen) {
			return `✅ ${log.timestamp} - ${log.ip} - ${log.userAgent.substring(
				0,
				100
			)}`;
		} else {
			return `🚫 ${log.timestamp} - ${log.ip} - [FILTERED: ${
				log.reason
			}] - ${log.userAgent.substring(0, 80)}`;
		}
	});

	return new Response(JSON.stringify(formattedLogs), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	});
}
