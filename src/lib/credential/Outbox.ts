import Dexie from "dexie";
import { wakuNode } from "$lib/waku.svelte";
import { Topic } from "$lib/waku/topics";

interface OutboxItem {
    messageId: string;
    topic: Topic;
    message: any;
    ack: boolean;       
}

class Outbox extends Dexie {
  outbox!: Dexie.Table<OutboxItem, string>;
  queue: OutboxItem[] = [];

  constructor() {
    super("outbox_db");
    this.version(1).stores({
        outbox: "messageId, topic, message, ack",
    });
  }

  async add(topic: Topic, message: any): Promise<string> {
    const messageId = crypto.randomUUID();
    message.ackId = messageId;
    await this.outbox.add({
        messageId,
        topic,
        message,
        ack: false, 
    }, messageId);
    return messageId;
  }

  async rebroadcast() {
    this.outbox.filter((item) => item.ack === false).each((item) => {
      this.queue.push(item);
    });

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        wakuNode.send(item.topic, item.message);
      }
    }
  }

  async ack(messageId: string) {
    const n = await this.outbox.update(messageId, { ack: true });
    if (n === 0) {
      console.error(`Outbox.ack: Message with id ${messageId} not found`);
    }
  }
}

export const outbox = new Outbox();