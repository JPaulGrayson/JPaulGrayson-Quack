/**
 * @quack/core - QuackClient
 * API client for interacting with a Quack server
 */
export class QuackClient {
    baseUrl;
    defaultFrom;
    constructor(options) {
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.defaultFrom = options.defaultFrom || 'unknown';
    }
    async send(request) {
        const res = await fetch(`${this.baseUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...request,
                from: request.from || this.defaultFrom,
            }),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    }
    async checkInbox(inbox, includeRead = false) {
        const url = new URL(`${this.baseUrl}/api/inbox/${inbox}`);
        if (includeRead)
            url.searchParams.set('includeRead', 'true');
        const res = await fetch(url.toString());
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
    async getMessage(messageId) {
        const res = await fetch(`${this.baseUrl}/api/message/${messageId}`);
        if (res.status === 404)
            return null;
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
    async receive(messageId) {
        const res = await fetch(`${this.baseUrl}/api/receive/${messageId}`, {
            method: 'POST',
        });
        if (res.status === 404)
            return null;
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.message;
    }
    async approve(messageId) {
        const res = await fetch(`${this.baseUrl}/api/approve/${messageId}`, {
            method: 'POST',
        });
        if (res.status === 404)
            return null;
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.message;
    }
    async updateStatus(messageId, status) {
        const res = await fetch(`${this.baseUrl}/api/status/${messageId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (res.status === 404)
            return null;
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.message;
    }
    async complete(messageId) {
        const res = await fetch(`${this.baseUrl}/api/complete/${messageId}`, {
            method: 'POST',
        });
        if (res.status === 404)
            return null;
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.message;
    }
    async delete(messageId) {
        const res = await fetch(`${this.baseUrl}/api/message/${messageId}`, {
            method: 'DELETE',
        });
        if (res.status === 404)
            return false;
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.success;
    }
    async getStats() {
        const res = await fetch(`${this.baseUrl}/api/stats`);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
    async getAllInboxes() {
        const res = await fetch(`${this.baseUrl}/api/inboxes`);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.inboxes;
    }
}
//# sourceMappingURL=index.js.map