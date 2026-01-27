class QuackBridgeClient {
  constructor(bridgeUrl = 'wss://quack.us.com/bridge/connect') {
    this.bridgeUrl = bridgeUrl;
    this.ws = null;
    this.agentId = null;
    this.capabilities = [];
    this.isConnected = false;
    this.isAuthenticated = false;
    this.handlers = new Map();
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    ['message', 'command', 'response', 'broadcast', 'presence', 'error', 'connected', 'disconnected', 'notification']
      .forEach(e => this.handlers.set(e, []));
  }

  async connect(agentId, capabilities = []) {
    this.agentId = agentId;
    this.capabilities = capabilities;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.bridgeUrl);
      } catch (err) {
        reject(err);
        return;
      }
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[BridgeClient] Connected to Quack Bridge');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data, resolve, reject);
        } catch (err) {
          console.error('[BridgeClient] Failed to parse message:', err);
        }
      };
      
      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isAuthenticated = false;
        console.log('[BridgeClient] Disconnected:', event.code, event.reason);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        if (this.reconnectAttempts < this.maxReconnectAttempts && !event.wasClean) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (err) => {
        console.error('[BridgeClient] WebSocket error:', err);
        if (!this.isAuthenticated) reject(err);
      };
    });
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[BridgeClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected && this.agentId) {
        this.connect(this.agentId, this.capabilities).catch(err => {
          console.error('[BridgeClient] Reconnect failed:', err);
        });
      }
    }, delay);
  }

  handleMessage(data, resolveConnect, rejectConnect) {
    switch (data.type) {
      case 'welcome':
        this.sendRaw({ type: 'auth', agent_id: this.agentId, capabilities: this.capabilities });
        break;
      case 'auth_success':
        this.isAuthenticated = true;
        console.log('[BridgeClient] Authenticated as:', data.agent_id);
        this.emit('connected', data);
        if (resolveConnect) resolveConnect(data);
        this.startPing();
        if (this.subscriptions.size > 0) {
          this.subscribe(Array.from(this.subscriptions));
        }
        break;
      case 'pong':
        break;
      case 'message':
      case 'command':
      case 'response':
      case 'broadcast':
      case 'presence':
      case 'notification':
      case 'error':
        this.emit(data.type, data);
        break;
      case 'agent_list':
        this.emit('agent_list', data);
        break;
      case 'subscribed':
        console.log('[BridgeClient] Subscribed to:', data.channels);
        break;
      default:
        console.log('[BridgeClient] Unknown message type:', data.type);
    }
  }

  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    if (this.handlers.has(event)) {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
    return this;
  }

  emit(event, data) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).forEach(h => {
        try {
          h(data);
        } catch (err) {
          console.error(`[BridgeClient] Handler error for ${event}:`, err);
        }
      });
    }
  }

  sendRaw(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  send(to, content, metadata = {}) {
    return this.sendRaw({ type: 'message', to, content, metadata });
  }

  command(to, action, payload = {}) {
    return this.sendRaw({ type: 'command', to, action, payload });
  }

  respond(commandId, to, result = null, error = null) {
    return this.sendRaw({ type: 'response', command_id: commandId, to, result, error });
  }

  broadcast(channel, content) {
    return this.sendRaw({ type: 'broadcast', channel, content });
  }

  subscribe(channels) {
    if (!Array.isArray(channels)) channels = [channels];
    channels.forEach(ch => this.subscriptions.add(ch));
    return this.sendRaw({ type: 'subscribe', channels });
  }

  listAgents(filter = {}) {
    return this.sendRaw({ type: 'list_agents', filter });
  }

  startPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.isAuthenticated) {
        this.sendRaw({ type: 'ping' });
      }
    }, 25000);
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
    this.isConnected = false;
    this.isAuthenticated = false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuackBridgeClient };
}
