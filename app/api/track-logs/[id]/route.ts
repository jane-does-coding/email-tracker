import { NextRequest } from "next/server";
import { openedEmails } from "../../track/shared";

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	return new Response(JSON.stringify(openedEmails[id] || []), {
		headers: { "Content-Type": "application/json" },
	});
}
