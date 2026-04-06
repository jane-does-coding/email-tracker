import { NextRequest } from "next/server";
import { openedEmails, EmailLog } from "../shared";

// Only filter out actual crawlers that don't represent real opens
const crawlerPatterns = [
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
	"applebot",
	"crawler",
	"spider",
];

// Email service proxies that ARE real opens (these are the most reliable indicators)
const emailProxyPatterns = [
	"googleimageproxy", // Gmail
	"googleusercontent", // Gmail
	"outlook", // Outlook/Hotmail
	"mail.yahoo", // Yahoo Mail
	"protonmail", // ProtonMail
	"icloud", // iCloud Mail
	"aol mail", // AOL Mail
];

function getRequestType(userAgent: string): {
	type: string;
	priority: number;
	isReal: boolean;
} {
	const lowerUA = userAgent.toLowerCase();

	// Email service proxies (highest priority - definitely real opens)
	for (const pattern of emailProxyPatterns) {
		if (lowerUA.includes(pattern)) {
			return { type: "email_proxy", priority: 3, isReal: true };
		}
	}

	// Direct browsers or email clients (medium priority - could be previews)
	const isBrowser =
		lowerUA.includes("chrome") ||
		lowerUA.includes("safari") ||
		lowerUA.includes("firefox") ||
		lowerUA.includes("edge") ||
		lowerUA.includes("opera");

	if (isBrowser) {
		return { type: "browser", priority: 2, isReal: true };
	}

	// Crawlers/Bots (lowest priority - not real opens)
	for (const pattern of crawlerPatterns) {
		if (lowerUA.includes(pattern)) {
			return { type: "crawler", priority: 0, isReal: false };
		}
	}

	// Unknown (treat as potential real open, medium priority)
	return { type: "unknown", priority: 1, isReal: true };
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

	// Get request type and priority
	const requestInfo = getRequestType(userAgent);

	// Check if we already have a real open for this email
	const existingRealOpens = openedEmails[id].filter(
		(log) => log.isRealOpen === true
	);

	let isRealOpen = false;
	let reason: string | undefined;

	if (!requestInfo.isReal) {
		// It's a crawler - definitely not a real open
		reason = `Crawler detected: ${requestInfo.type}`;
	} else if (existingRealOpens.length === 0) {
		// First real open - always count it
		isRealOpen = true;
		reason =
			requestInfo.type === "email_proxy"
				? "Email service proxy (real open)"
				: "First open from browser/email client";
	} else {
		// We already have at least one real open - check if this one has higher priority
		const highestPriorityExisting = Math.max(
			...existingRealOpens.map((log) => log.priority || 0)
		);

		if (requestInfo.priority > highestPriorityExisting) {
			// This request has higher priority (e.g., email proxy vs browser)
			// Mark all previous real opens as filtered and make this the new real open
			openedEmails[id] = openedEmails[id].map((log) => {
				if (log.isRealOpen === true) {
					return {
						...log,
						isRealOpen: false,
						reason: `Overridden by higher priority request (${requestInfo.type})`,
					};
				}
				return log;
			});
			isRealOpen = true;
			reason = `Higher priority request (${requestInfo.type}) overrode previous opens`;
		} else {
			// Lower or equal priority - filter this one
			reason = `Already have a real open (${
				existingRealOpens[0].type || "unknown"
			}) with equal or higher priority`;
		}
	}

	const logEntry: EmailLog & { priority?: number; type?: string } = {
		timestamp,
		ip,
		userAgent,
		isRealOpen,
		reason,
		priority: requestInfo.priority,
		type: requestInfo.type,
	};

	openedEmails[id].push(logEntry);

	// Keep only last 200 logs per ID
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
