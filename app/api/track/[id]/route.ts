import { NextRequest } from "next/server";
import { openedEmails } from "../shared";

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	const ip =
		req.headers.get("x-forwarded-for") ||
		req.headers.get("x-real-ip") ||
		"unknown";
	const userAgent = req.headers.get("user-agent") || "unknown";
	const timestamp = new Date().toISOString();

	if (!openedEmails[id]) openedEmails[id] = [];
	openedEmails[id].push(`${timestamp} - ${ip} - ${userAgent}`);

	const pixel = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
		"base64"
	);

	return new Response(pixel, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "no-cache, no-store, must-revalidate",
		},
	});
}
