/**
 * @quack/core - Store Module
 * Abstract storage interface and implementations
 */
import { v4 as uuid } from 'uuid';
const TTL_HOURS = 48;
export class MemoryStore {
    inboxes = new Map();
    persistFn;
    loadFn;
    constructor(options) {
        this.persistFn = options?.persist;
        this.loadFn = options?.load;
    }
    async init() {
        if (this.loadFn) {
            const data = this.loadFn();
            if (data) {
                for (const [inbox, messages] of Object.entries(data)) {
                    this.inboxes.set(inbox, messages);
                }
                console.log(`📦 Loaded ${this.inboxes.size} inboxes from store`);
            }
        }
        this.cleanupExpired();
        setInterval(() => this.cleanupExpired(), 60 * 60 * 1000);
    }
    persist() {
        if (this.persistFn) {
            const data = {};
            for (const [inbox, messages] of this.inboxes) {
                data[inbox] = messages;
            }
            this.persistFn(data);
        }
    }
    cleanupExpired() {
        const now = new Date();
        let cleaned = 0;
        for (const [inbox, messages] of this.inboxes) {
            const valid = messages.filter(m => new Date(m.expiresAt) > now);
            cleaned += messages.length - valid.length;
            this.inboxes.set(inbox, valid);
        }
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired messages`);
            this.persist();
        }
    }
    async sendMessage(req, fromAgent) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + TTL_HOURS * 60 * 60 * 1000);
        const message = {
            id: uuid(),
            to: req.to,
            from: fromAgent || req.from,
            timestamp: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'pending',
            task: req.task,
            context: req.context,
            files: (req.files || []).map(f => ({
                ...f,
                size: f.size || Buffer.byteLength(f.content, 'utf-8'),
            })),
            projectName: req.projectName,
            conversationExcerpt: req.conversationExcerpt,
            replyTo: req.replyTo,
        };
        const inbox = req.to.toLowerCase();
        if (!this.inboxes.has(inbox)) {
            this.inboxes.set(inbox, []);
        }
        this.inboxes.get(inbox).push(message);
        this.persist();
        console.log(`📨 Message ${message.id} sent to /${inbox}`);
        return message;
    }
    async checkInbox(inbox, includeRead = false) {
        const messages = this.inboxes.get(inbox.toLowerCase()) || [];
        if (includeRead) {
            return messages;
        }
        const actionableStatuses = ['pending', 'approved', 'in_progress'];
        return messages.filter(m => actionableStatuses.includes(m.status));
    }
    async getMessage(messageId) {
        for (const [_, messages] of this.inboxes) {
            const message = messages.find(m => m.id === messageId);
            if (message)
                return message;
        }
        return null;
    }
    async receiveMessage(messageId) {
        for (const [_, messages] of this.inboxes) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.status = 'read';
                message.readAt = new Date().toISOString();
                this.persist();
                console.log(`📬 Message ${messageId} marked as read`);
                return message;
            }
        }
        return null;
    }
    async completeMessage(messageId) {
        for (const [_, messages] of this.inboxes) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.status = 'completed';
                this.persist();
                console.log(`✅ Message ${messageId} marked as completed`);
                return message;
            }
        }
        return null;
    }
    async approveMessage(messageId) {
        for (const [_, messages] of this.inboxes) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
                if (message.status !== 'pending')
                    return null;
                message.status = 'approved';
                this.persist();
                console.log(`👍 Message ${messageId} approved`);
                return message;
            }
        }
        return null;
    }
    async updateMessageStatus(messageId, status) {
        for (const [_, messages] of this.inboxes) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.status = status;
                this.persist();
                console.log(`📝 Message ${messageId} status updated to: ${status}`);
                return message;
            }
        }
        return null;
    }
    async deleteMessage(messageId) {
        for (const [_, messages] of this.inboxes) {
            const index = messages.findIndex(m => m.id === messageId);
            if (index !== -1) {
                messages.splice(index, 1);
                this.persist();
                console.log(`🗑️ Message ${messageId} deleted`);
                return true;
            }
        }
        return false;
    }
    async getAllInboxes() {
        return Array.from(this.inboxes.keys());
    }
    async getStats() {
        let inboxCount = 0;
        let messageCount = 0;
        let pending = 0;
        for (const [_, msgs] of this.inboxes) {
            if (msgs.length > 0) {
                inboxCount++;
                messageCount += msgs.length;
                pending += msgs.filter(m => m.status === 'pending').length;
            }
        }
        return { inboxes: inboxCount, messages: messageCount, pending };
    }
}
//# sourceMappingURL=index.js.map