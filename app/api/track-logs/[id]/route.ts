import { NextRequest } from "next/server";
import { openedEmails } from "../../track/shared";

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	// Return only real opens
	const realOpens = (openedEmails[id] || []).filter(
		(log) => log.isRealOpen === true
	);

	return new Response(JSON.stringify(realOpens), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	});
}
