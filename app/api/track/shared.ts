export interface EmailLog {
	timestamp: string;
	ip: string;
	userAgent: string;
	isRealOpen: boolean;
	reason?: string;
}

export const openedEmails: { [id: string]: EmailLog[] } = {};
