import Dexie from "dexie";
import { wakuNode } from "$lib/waku.svelte";
import { Topic } from "$lib/waku/topics";
import { onMount, onDestroy } from "svelte";

interface OutboxItem {
    messageId: string;
    topic: Topic;
    message: any;
    ack: boolean;       
}

class Outbox extends Dexie {
  outbox!: Dexie.Table<OutboxItem, string>;
  queue: OutboxItem[] = [];
  private rebroadcastInterval: number | null = null;
  private readonly REBROADCAST_INTERVAL_MS = 30000; // 30 seconds
  private isRebroadcasting = false;

  constructor() {
    super("outbox_db");
    this.version(1).stores({
        outbox: "messageId, topic, message, ack",
    });
  }

  async add(topic: Topic, message: any, sendNow: boolean = false): Promise<string> {
    const messageId = crypto.randomUUID();
    message.ackId = messageId;
    
    const outboxItem = {
        messageId,
        topic,
        message,
        ack: false, 
    };
    
    await this.outbox.add(outboxItem, messageId);
    console.log(`Added message to outbox with ID: ${messageId}`);
    
    // Immediately broadcast the message if requested
    if (sendNow) {
      try {
        await wakuNode.send(topic, message);
        console.log(`Immediately sent message ${messageId} for topic ${topic}`);
      } catch (error) {
        console.error(`Failed to immediately send message ${messageId}:`, error);
        // The message is still in the outbox and will be retried by the rebroadcast mechanism
      }
    }
    
    return messageId;
  }

  async rebroadcast() {
    // Prevent concurrent rebroadcasts
    if (this.isRebroadcasting) {
      console.log("Rebroadcast already in progress, skipping");
      return;
    }
    
    this.isRebroadcasting = true;
    
    try {
      this.queue = [];
      await this.outbox.filter((item) => item.ack === false).each((item) => {
        this.queue.push(item);
      });

      if (this.queue.length === 0) {
        console.log("No unacknowledged messages to rebroadcast");
        return;
      }
      
      console.log(`Rebroadcasting ${this.queue.length} unacknowledged messages`);
      
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (item) {
          try {
            await wakuNode.send(item.topic, item.message);
            console.log(`Rebroadcast message ${item.messageId} for topic ${item.topic}`);
          } catch (error) {
            console.error(`Failed to rebroadcast message ${item.messageId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error during rebroadcast:", error);
    } finally {
      this.isRebroadcasting = false;
    }
  }

  async ack(messageId: string) {
    try {
      const n = await this.outbox.update(messageId, { ack: true });
      if (n === 0) {
        console.error(`Outbox.ack: Message with id ${messageId} not found`);
      } else {
        console.log(`Message ${messageId} acknowledged successfully`);
      }
    } catch (error) {
      console.error(`Error acknowledging message ${messageId}:`, error);
    }
  }

  async getMessage(messageId: string): Promise<OutboxItem | undefined> {
    try {
      return await this.outbox.get(messageId);
    } catch (error) {
      console.error(`Error getting message ${messageId}:`, error);
      return undefined;
    }
  }

  startPeriodicRebroadcast() {
    // Clear any existing interval first
    this.stopPeriodicRebroadcast();
    
    // Start a new rebroadcast interval
    this.rebroadcastInterval = window.setInterval(() => {
      this.rebroadcast();
    }, this.REBROADCAST_INTERVAL_MS);
    
    // Do an initial rebroadcast immediately
    this.rebroadcast();
    
    console.log("Started periodic message rebroadcasting");
  }

  stopPeriodicRebroadcast() {
    if (this.rebroadcastInterval !== null) {
      window.clearInterval(this.rebroadcastInterval);
      this.rebroadcastInterval = null;
      console.log("Stopped periodic message rebroadcasting");
    }
  }
}

export const outbox = new Outbox();

// Initialize the rebroadcasting mechanism when this module is loaded
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.addEventListener('load', () => {
    outbox.startPeriodicRebroadcast();
  });
}