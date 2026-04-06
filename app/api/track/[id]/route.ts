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

// Email service proxies that ARE real opens (not bots)
const emailProxyPatterns = [
	"googleimageproxy", // Gmail
	"googleusercontent", // Gmail
	"outlook", // Outlook/Hotmail
	"mail.yahoo", // Yahoo Mail
	"protonmail", // ProtonMail
	"icloud", // iCloud Mail
	"aol mail", // AOL Mail
];

function shouldCountAsRealOpen(userAgent: string): {
	isReal: boolean;
	reason: string;
} {
	const lowerUA = userAgent.toLowerCase();

	// Check if it's an email service proxy (these ARE real opens)
	for (const pattern of emailProxyPatterns) {
		if (lowerUA.includes(pattern)) {
			return { isReal: true, reason: "Email service proxy" };
		}
	}

	// Check if it's a crawler/bot (these are NOT real opens)
	for (const pattern of crawlerPatterns) {
		if (lowerUA.includes(pattern)) {
			return { isReal: false, reason: "Crawler/bot" };
		}
	}

	// Regular browsers and unknown user agents count as real opens
	return { isReal: true, reason: "Direct browser or email client" };
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

	// Check if this request should count as a real open
	const { isReal: shouldCountAsReal, reason: classificationReason } =
		shouldCountAsRealOpen(userAgent);

	// Deduplication: Only count one open per email ID per hour (to prevent counting multiple image loads)
	const oneHourAgo = Date.now() - 60 * 60 * 1000;
	const recentRealOpen = openedEmails[id].find(
		(log) =>
			log.isRealOpen === true && new Date(log.timestamp).getTime() > oneHourAgo
	);

	// Determine if this specific request should be marked as a real open
	let isRealOpen = false;
	let reason: string | undefined;

	if (recentRealOpen && shouldCountAsReal) {
		reason = `Already counted a real open from this email within the last hour (${classificationReason})`;
	} else if (shouldCountAsReal) {
		isRealOpen = true;
		reason = classificationReason;
	} else {
		reason = classificationReason;
	}

	const logEntry: EmailLog = {
		timestamp,
		ip,
		userAgent,
		isRealOpen,
		reason,
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
