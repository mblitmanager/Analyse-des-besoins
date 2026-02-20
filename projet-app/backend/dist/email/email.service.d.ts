export declare class EmailService {
    sendReport(to: string, subject: string, content: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
