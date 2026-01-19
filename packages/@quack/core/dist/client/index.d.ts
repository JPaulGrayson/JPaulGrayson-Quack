/**
 * @quack/core - QuackClient
 * API client for interacting with a Quack server
 */
import { QuackMessage, SendMessageRequest, InboxResponse, SendResponse, MessageStatus, QuackStats } from '../types/index.js';
export interface QuackClientOptions {
    baseUrl: string;
    defaultFrom?: string;
}
export declare class QuackClient {
    private baseUrl;
    private defaultFrom;
    constructor(options: QuackClientOptions);
    send(request: SendMessageRequest): Promise<SendResponse>;
    checkInbox(inbox: string, includeRead?: boolean): Promise<InboxResponse>;
    getMessage(messageId: string): Promise<QuackMessage | null>;
    receive(messageId: string): Promise<QuackMessage | null>;
    approve(messageId: string): Promise<QuackMessage | null>;
    updateStatus(messageId: string, status: MessageStatus): Promise<QuackMessage | null>;
    complete(messageId: string): Promise<QuackMessage | null>;
    delete(messageId: string): Promise<boolean>;
    getStats(): Promise<QuackStats>;
    getAllInboxes(): Promise<string[]>;
}
//# sourceMappingURL=index.d.ts.map