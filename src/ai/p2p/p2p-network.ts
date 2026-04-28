import { create } from 'ipfs-core';
import { CID } from 'multiformats/cid';
import * as crypto from 'crypto';

export interface NodeInfo {
  id: string;
  ip: string;
  port: number;
  lastSeen: Date;
  capabilities: string[];
  healthScore: number;
}

export interface P2PMessage {
  id: string;
  from: string;
  to?: string;
  type: 'state_sync' | 'model_update' | 'feedback_batch' | 'node_discovery' | 'migration_alert';
  data: any;
  timestamp: Date;
  signature: string;
}

export class P2PNetworkManager {
  private ipfs: any;
  private nodeId: string;
  private knownNodes: Map<string, NodeInfo> = new Map();
  private messageHandlers: Map<string, (message: P2PMessage) => void> = new Map();
  private isConnected: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private bootstrapNodes: string[] = []) {
    this.nodeId = crypto.randomUUID();
  }

  async initialize(): Promise<void> {
    console.log('🌐 Initializing IPFS P2P Network...');

    try {
      // Initialize IPFS node
      this.ipfs = await create({
        repo: './ipfs-repo',
        config: {
          Addresses: {
            Swarm: [
              '/ip4/0.0.0.0/tcp/4001',
              '/ip4/0.0.0.0/tcp/4002/ws'
            ]
          },
          Bootstrap: this.bootstrapNodes.length > 0 ? this.bootstrapNodes : [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
          ]
        }
      });

      const { id } = await this.ipfs.id();
      console.log(`📡 IPFS Node ID: ${id}`);

      this.isConnected = true;
      this.startHeartbeat();
      this.startMessageListener();

      // Connect to bootstrap nodes
      await this.discoverNodes();

      console.log('✅ P2P Network initialized');

    } catch (error) {
      console.error('❌ Failed to initialize P2P network:', error);
      throw error;
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  private async sendHeartbeat() {
    const heartbeatMessage: P2PMessage = {
      id: crypto.randomUUID(),
      from: this.nodeId,
      type: 'node_discovery',
      data: {
        nodeInfo: await this.getNodeInfo(),
        timestamp: new Date()
      },
      timestamp: new Date(),
      signature: this.signMessage('heartbeat')
    };

    await this.broadcastMessage(heartbeatMessage);
  }

  private async getNodeInfo(): Promise<NodeInfo> {
    // Get current node information
    const { addresses } = await this.ipfs.id();

    return {
      id: this.nodeId,
      ip: '127.0.0.1', // Would get actual IP
      port: 4001,
      lastSeen: new Date(),
      capabilities: ['chat', 'model_serving', 'feedback_processing'],
      healthScore: 95 // Would calculate based on actual health
    };
  }

  private startMessageListener() {
    // Subscribe to pubsub topic for OpenMind network
    const topic = 'openmind-network';

    this.ipfs.pubsub.subscribe(topic, async (msg: any) => {
      try {
        const message: P2PMessage = JSON.parse(msg.data.toString());

        // Verify message signature
        if (!this.verifyMessage(message)) {
          console.warn('⚠️  Invalid message signature');
          return;
        }

        // Update node last seen
        if (this.knownNodes.has(message.from)) {
          const nodeInfo = this.knownNodes.get(message.from)!;
          nodeInfo.lastSeen = new Date();
          this.knownNodes.set(message.from, nodeInfo);
        }

        // Handle message
        await this.handleMessage(message);

      } catch (error) {
        console.error('Error processing P2P message:', error);
      }
    });

    console.log(`👂 Listening for messages on topic: ${topic}`);
  }

  private async handleMessage(message: P2PMessage) {
    console.log(`📨 Received ${message.type} from ${message.from}`);

    // Handle different message types
    switch (message.type) {
      case 'node_discovery':
        await this.handleNodeDiscovery(message);
        break;
      case 'state_sync':
        await this.handleStateSync(message);
        break;
      case 'model_update':
        await this.handleModelUpdate(message);
        break;
      case 'feedback_batch':
        await this.handleFeedbackBatch(message);
        break;
      case 'migration_alert':
        await this.handleMigrationAlert(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }

    // Call registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  private async handleNodeDiscovery(message: P2PMessage) {
    const nodeInfo: NodeInfo = message.data.nodeInfo;
    this.knownNodes.set(message.from, nodeInfo);
    console.log(`🔍 Discovered node: ${message.from}`);
  }

  private async handleStateSync(message: P2PMessage) {
    console.log('🔄 Received state sync');
    // Apply state updates from other nodes
    // This would merge state with current node state
  }

  private async handleModelUpdate(message: P2PMessage) {
    console.log('🧠 Received model update');
    // Download and apply model updates from IPFS
    const modelHash = message.data.modelHash;
    await this.downloadFromIPFS(modelHash, `./models/${modelHash}`);
  }

  private async handleFeedbackBatch(message: P2PMessage) {
    console.log('📊 Received feedback batch');
    // Store feedback for learning
    const feedback = message.data.feedback;
    await this.storeFeedback(feedback);
  }

  private async handleMigrationAlert(message: P2PMessage) {
    console.log('🏃 Migration alert received');
    // Prepare for potential network reconfiguration
  }

  async broadcastMessage(message: P2PMessage): Promise<void> {
    if (!this.isConnected) throw new Error('P2P network not connected');

    const topic = 'openmind-network';
    const data = JSON.stringify(message);

    await this.ipfs.pubsub.publish(topic, data);
    console.log(`📢 Broadcasted ${message.type} message`);
  }

  async sendMessage(targetNodeId: string, message: P2PMessage): Promise<void> {
    // Send direct message to specific node
    message.to = targetNodeId;
    await this.broadcastMessage(message);
  }

  async uploadToIPFS(filePath: string): Promise<string> {
    console.log(`📤 Uploading ${filePath} to IPFS...`);

    const file = await this.ipfs.add({
      path: filePath,
      content: require('fs').createReadStream(filePath)
    });

    console.log(`✅ Uploaded to IPFS: ${file.cid.toString()}`);
    return file.cid.toString();
  }

  async downloadFromIPFS(hash: string, outputPath: string): Promise<void> {
    console.log(`📥 Downloading ${hash} from IPFS...`);

    const chunks = [];
    for await (const chunk of this.ipfs.cat(hash)) {
      chunks.push(chunk);
    }

    const content = Buffer.concat(chunks);
    require('fs').writeFileSync(outputPath, content);

    console.log(`✅ Downloaded to ${outputPath}`);
  }

  async discoverNodes(): Promise<void> {
    console.log('🔍 Discovering network nodes...');

    // Connect to known bootstrap nodes
    for (const addr of this.bootstrapNodes) {
      try {
        await this.ipfs.swarm.connect(addr);
        console.log(`✅ Connected to ${addr}`);
      } catch (error) {
        console.log(`❌ Failed to connect to ${addr}:`, error);
      }
    }
  }

  registerMessageHandler(type: string, handler: (message: P2PMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  getKnownNodes(): NodeInfo[] {
    return Array.from(this.knownNodes.values());
  }

  getNodeId(): string {
    return this.nodeId;
  }

  private signMessage(message: string): string {
    // Simple signing - in production use proper cryptographic signing
    const hmac = crypto.createHmac('sha256', 'openmind-secret-key');
    hmac.update(message);
    return hmac.digest('hex');
  }

  private verifyMessage(message: P2PMessage): boolean {
    // Verify message signature
    const expectedSignature = this.signMessage(JSON.stringify(message.data));
    return message.signature === expectedSignature;
  }

  private async storeFeedback(feedback: any): Promise<void> {
    // Store feedback in local database for processing
    const fs = require('fs').promises;
    const path = require('path');

    const feedbackPath = path.join(process.cwd(), 'data', 'p2p-feedback.jsonl');
    const line = JSON.stringify({ ...feedback, receivedAt: new Date() }) + '\n';

    try {
      await fs.appendFile(feedbackPath, line);
    } catch (error) {
      // Create directory if needed
      await fs.mkdir(path.dirname(feedbackPath), { recursive: true });
      await fs.writeFile(feedbackPath, line);
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down P2P network...');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.ipfs) {
      await this.ipfs.stop();
    }

    this.isConnected = false;
    console.log('✅ P2P network shutdown');
  }
}

// Export singleton instance
export const p2pNetwork = new P2PNetworkManager([
  // Custom bootstrap nodes would be added here
  // '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
]);