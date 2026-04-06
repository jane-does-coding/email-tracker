import { NextRequest } from "next/server";
import { openedEmails, EmailLog } from "../shared";

// Only filter out known bots, not regular browsers
const botPatterns = [
	"googleimageproxy",
	"googleusercontent",
	"facebookexternalhit",
	"linkedinbot",
	"slackbot",
	"telegrambot",
	"discordbot",
	"whatsapp",
	"bingbot",
	"duckduckbot",
	"yandexbot",
	"baiduspider",
	"zoomInfoBot",
	"ahrefs",
	"semrush",
	"mj12bot",
];

function isKnownBot(userAgent: string): boolean {
	const lowerUA = userAgent.toLowerCase();
	return botPatterns.some((pattern) => lowerUA.includes(pattern));
}

export async function GET(req: NextRequest, context: any) {
	const params =
		context.params instanceof Promise ? await context.params : context.params;
	const id = params.id;

	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		"unknown";
	const userAgent = req.headers.get("user-agent") || "unknown";
	const timestamp = new Date().toISOString();

	if (!openedEmails[id]) {
		openedEmails[id] = [];
	}

	// Check if it's a known bot
	const isBot = isKnownBot(userAgent);

	// Get last log from this IP (for deduplication)
	const now = Date.now();
	const recentLogFromIP = openedEmails[id].find(
		(log) => log.ip === ip && now - new Date(log.timestamp).getTime() < 30000 // 30 seconds
	);

	// Log as real open if:
	// 1. Not a known bot, AND
	// 2. Not a duplicate within 30 seconds
	const isRealOpen = !isBot && !recentLogFromIP;

	let reason: string | undefined;
	if (isBot) {
		reason = "Known bot detected";
	} else if (recentLogFromIP) {
		reason = "Duplicate request within 30 seconds";
	}

	const logEntry: EmailLog = {
		timestamp,
		ip,
		userAgent,
		isRealOpen,
		reason,
	};

	openedEmails[id].push(logEntry);

	// Keep only last 200 logs
	if (openedEmails[id].length > 200) {
		openedEmails[id] = openedEmails[id].slice(-200);
	}

	// Return 1x1 transparent pixel
	const pixel = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
		"base64"
	);

	return new Response(pixel, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "no-cache, no-store, must-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		},
	});
}
