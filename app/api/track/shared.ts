export interface EmailLog {
	timestamp: string;
	ip: string;
	userAgent: string;
	isRealOpen: boolean;
	reason?: string;
	priority?: number; // Add priority field
	type?: string; // Add type field
}

export const openedEmails: { [id: string]: EmailLog[] } = {};
