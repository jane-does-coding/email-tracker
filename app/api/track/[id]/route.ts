import { NextRequest } from "next/server";
import { openedEmails, EmailLog } from "../shared";

// Known bot patterns to filter out
const botPatterns = [
	"googleimageproxy",
	"googleusercontent",
	"bot",
	"crawler",
	"spider",
	"prefetch",
	"whatsapp",
	"facebookexternalhit",
	"linkedinbot",
	"slackbot",
	"telegrambot",
	"discordbot",
	"applebot",
	"bingbot",
	"duckduckbot",
	"yandexbot",
	"baiduspider",
	"zoomInfoBot",
	"ahrefs",
	"semrush",
	"mj12bot",
];

// Genuine email client patterns
const emailClientPatterns = [
	"outlook",
	"gmail",
	"apple mail",
	"thunderbird",
	"mail.app",
	"ios mail",
	"android mail",
	"spark",
	"canary mail",
	"airmail",
	"edison mail",
	"polymail",
];

function isBot(userAgent: string): boolean {
	const lowerUA = userAgent.toLowerCase();
	return botPatterns.some((pattern) => lowerUA.includes(pattern));
}

function isEmailClient(userAgent: string): boolean {
	const lowerUA = userAgent.toLowerCase();
	return emailClientPatterns.some((pattern) => lowerUA.includes(pattern));
}

function shouldLogAsRealOpen(
	userAgent: string,
	accept: string,
	openedEmailsForId: EmailLog[],
	ip: string
): { shouldLog: boolean; reason: string } {
	const lowerUA = userAgent.toLowerCase();

	// Check 1: Bot detection
	if (isBot(userAgent)) {
		return { shouldLog: false, reason: "Bot detected" };
	}

	// Check 2: Accept header check (real email clients ask for images)
	const acceptsImages =
		accept.includes("image/png") ||
		accept.includes("image/*") ||
		(accept.includes("*/*") && !accept.includes("text/html"));

	if (!acceptsImages) {
		return { shouldLog: false, reason: "Doesn't accept images" };
	}

	// Check 3: Deduplication - only log one open per IP per hour
	const oneHourAgo = Date.now() - 60 * 60 * 1000;
	const recentLogFromIP = openedEmailsForId?.some(
		(log) =>
			log.ip === ip &&
			new Date(log.timestamp).getTime() > oneHourAgo &&
			log.isRealOpen === true
	);

	if (recentLogFromIP) {
		return {
			shouldLog: false,
			reason: "Duplicate from same IP within last hour",
		};
	}

	// Check 4: If it's a known email client or not a common browser
	const isCommonBrowser =
		lowerUA.includes("chrome") ||
		lowerUA.includes("safari") ||
		lowerUA.includes("firefox") ||
		lowerUA.includes("edge");

	if (isEmailClient(userAgent)) {
		return { shouldLog: true, reason: "Known email client" };
	}

	if (!isCommonBrowser) {
		return { shouldLog: true, reason: "Not a common browser" };
	}

	return { shouldLog: false, reason: "Likely a browser pre-fetch" };
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
	const accept = req.headers.get("accept") || "";
	const timestamp = new Date().toISOString();

	if (!openedEmails[id]) {
		openedEmails[id] = [];
	}

	const { shouldLog, reason } = shouldLogAsRealOpen(
		userAgent,
		accept,
		openedEmails[id],
		ip
	);

	const logEntry: EmailLog = {
		timestamp,
		ip,
		userAgent,
		isRealOpen: shouldLog,
		reason: shouldLog ? undefined : reason,
	};

	openedEmails[id].push(logEntry);

	// Optional: Keep only last 100 logs per ID to prevent memory issues
	if (openedEmails[id].length > 100) {
		openedEmails[id] = openedEmails[id].slice(-100);
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
