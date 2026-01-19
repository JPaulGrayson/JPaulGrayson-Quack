/**
 * @quack/core - Type Definitions
 * Core types for the Quack agent-to-agent relay system
 */
export type AgentType = 'claude' | 'replit' | 'cursor' | 'gemini' | 'gpt' | 'grok' | 'copilot' | 'antigravity' | 'custom';
export type MessageStatus = 'pending' | 'approved' | 'in_progress' | 'read' | 'completed' | 'failed' | 'expired';
export declare const VALID_STATUSES: MessageStatus[];
export declare const STATUS_TRANSITIONS: Record<string, string[]>;
export interface QuackFile {
    name: string;
    content: string;
    type: 'code' | 'doc' | 'image' | 'data';
    mimeType?: string;
    size: number;
}
export interface QuackMessage {
    id: string;
    to: AgentType | string;
    from: AgentType | string;
    timestamp: string;
    expiresAt: string;
    status: MessageStatus;
    readAt?: string;
    task: string;
    context?: string;
    files: QuackFile[];
    projectName?: string;
    conversationExcerpt?: string;
    replyTo?: string;
}
export interface SendMessageRequest {
    to: AgentType | string;
    from: AgentType | string;
    task: string;
    context?: string;
    files?: QuackFile[];
    fileRefs?: string[];
    projectName?: string;
    conversationExcerpt?: string;
    replyTo?: string;
}
export interface InboxResponse {
    inbox: string;
    messages: QuackMessage[];
    count: number;
}
export interface SendResponse {
    success: boolean;
    messageId: string;
    message: QuackMessage;
}
export interface QuackStats {
    inboxes: number;
    messages: number;
    pending: number;
}
export declare const MCP_TOOLS: {
    quack_send: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                to: {
                    type: string;
                    description: string;
                };
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                files: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                            };
                            content: {
                                type: string;
                            };
                            type: {
                                type: string;
                                enum: string[];
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
                projectName: {
                    type: string;
                    description: string;
                };
                conversationExcerpt: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    quack_check: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                inbox: {
                    type: string;
                    description: string;
                };
                includeRead: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    quack_receive: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                messageId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    quack_complete: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                messageId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    quack_reply: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                messageId: {
                    type: string;
                    description: string;
                };
                task: {
                    type: string;
                    description: string;
                };
                files: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                            };
                            content: {
                                type: string;
                            };
                            type: {
                                type: string;
                                enum: string[];
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
};
//# sourceMappingURL=index.d.ts.map