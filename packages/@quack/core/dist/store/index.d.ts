/**
 * @quack/core - Store Module
 * Abstract storage interface and implementations
 */
import { QuackMessage, SendMessageRequest, MessageStatus, QuackStats } from '../types/index.js';
export interface QuackStore {
    init(): Promise<void>;
    sendMessage(req: SendMessageRequest, fromAgent: string): Promise<QuackMessage>;
    checkInbox(inbox: string, includeRead?: boolean): Promise<QuackMessage[]>;
    getMessage(messageId: string): Promise<QuackMessage | null>;
    receiveMessage(messageId: string): Promise<QuackMessage | null>;
    completeMessage(messageId: string): Promise<QuackMessage | null>;
    approveMessage(messageId: string): Promise<QuackMessage | null>;
    updateMessageStatus(messageId: string, status: MessageStatus): Promise<QuackMessage | null>;
    deleteMessage(messageId: string): Promise<boolean>;
    getAllInboxes(): Promise<string[]>;
    getStats(): Promise<QuackStats>;
}
export declare class MemoryStore implements QuackStore {
    private inboxes;
    private persistFn?;
    private loadFn?;
    constructor(options?: {
        persist?: (data: Record<string, QuackMessage[]>) => void;
        load?: () => Record<string, QuackMessage[]> | null;
    });
    init(): Promise<void>;
    private persist;
    private cleanupExpired;
    sendMessage(req: SendMessageRequest, fromAgent: string): Promise<QuackMessage>;
    checkInbox(inbox: string, includeRead?: boolean): Promise<QuackMessage[]>;
    getMessage(messageId: string): Promise<QuackMessage | null>;
    receiveMessage(messageId: string): Promise<QuackMessage | null>;
    completeMessage(messageId: string): Promise<QuackMessage | null>;
    approveMessage(messageId: string): Promise<QuackMessage | null>;
    updateMessageStatus(messageId: string, status: MessageStatus): Promise<QuackMessage | null>;
    deleteMessage(messageId: string): Promise<boolean>;
    getAllInboxes(): Promise<string[]>;
    getStats(): Promise<QuackStats>;
}
//# sourceMappingURL=index.d.ts.map