import {
  createLightNode,
  DecodedMessage,
  type LightNode,
  type ISubscription,
  Protocols,
  HealthStatus,
  type SDKProtocolResult,
} from "@waku/sdk";
import { tokenStore } from "./credential/TokenStore";
import { topics, Topic, type DevicePairingMessage } from "./waku/topics";
import { decodeBase64 } from "@oslojs/encoding";
import { writable, type Writable } from "svelte/store";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { setupSubscriptions } from "./waku/filter.svelte";
// Define the pairing state type
export interface PairingState {
  awaitingResponse: boolean;
  devicePubKey: string | null;
}

// Create a pairing state store
export const pairingState: Writable<PairingState> = writable({
  awaitingResponse: false,
  devicePubKey: null,
});

export class WakuNode {
  public node = $state<LightNode | undefined>(undefined);

  async setNode(node: LightNode) {
    this.node = node;
  }

  async send(contentTopic: Topic, message: any) {
    if (!this.node) {
      throw new Error("Waku node not started");
    }
    const topic = topics[contentTopic];
    const error = topic.protoType.verify(message);
    if (error) {
      throw new Error(
        `Error encoding message ${message} to protobuf type ${topic.protoType}: ${error}`
      );
    }
    return this.node.lightPush.send(topic.encoder, {
      payload: topic.protoType.encode(message).finish(),
      timestamp: new Date(),
    });
  }
}

let node = $state<LightNode | undefined>(undefined);
export const connectionState = writable({
  status: "disconnected" as
    | "error"
    | "disconnected"
    | "connecting"
    | "waiting_for_peers"
    | "setting_up_subscriptions"
    | "connected",
  error: null as string | null,
});

export const wakuNode = new WakuNode();

export async function startWaku(): Promise<void> {
  connectionState.update((state) => ({
    ...state,
    status: "connecting",
    error: null,
  }));

  try {
    node = await createLightNode({
      defaultBootstrap: false,
      networkConfig: {
        clusterId: 42,
        shards: [0],
        // contentTopics: Object.values(topics).map((t) => t.contentTopic),
      },
    });

    await node.start();
    await wakuNode.setNode(node);
    
    // Connect to peers
    await node.dial(
      "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ"
    );
    (window as any).waku = node;
    connectionState.update((state) => ({
      ...state,
      status: "waiting_for_peers",
    }));

    // Start the periodic rebroadcasting of outbox messages
    const { outbox } = await import('./credential/Outbox');
    outbox.startPeriodicRebroadcast();
    
    // Add cleanup for when the app is closed
    window.addEventListener('beforeunload', () => {
      outbox.stopPeriodicRebroadcast();
    });
    
    // Wait for peer connections
    try {
      await node.waitForPeers([Protocols.LightPush, Protocols.Filter]);
      connectionState.update((state) => ({
        ...state,
        status: "setting_up_subscriptions",
      }));
    } catch (error) {
      console.error("Error waiting for peers:", error);
    }

    // Set up subscriptions for message handling
    try {
      await setupSubscriptions(wakuNode);
    } catch (error) {
      console.error("Error setting up subscriptions:", error);
    }

    connectionState.update((state) => ({
      ...state,
      status: "connected",
    }));
  } catch (error) {
    console.error("Error starting Waku node:", error);
    connectionState.update((state) => ({
      ...state,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    }));
    throw error;
  }
}

export async function subscribeToFilter(
  topic: Topic,
  callback: (message: DecodedMessage) => void
) {
  if (!node) {
    throw new Error("Waku node not started");
  }

  const result = await node.filter.subscribe(
    [topics[topic].decoder],
    callback,
    { forceUseAllPeers: false }
  );

  if (result.error) {
    console.error("Error subscribing to filter:", result.error);
    throw new Error("Failed to subscribe to filter");
  }

  if (
    result.results.failures.length > 0 ||
    result.results.successes.length === 0
  ) {
    throw new Error(
      "Failed to subscribe to filter: No successful peer connections"
    );
  }

  return result.subscription;
}

export function health(): HealthStatus {
  if (!node) {
    return HealthStatus.Unhealthy;
  }
  return node.health.getHealthStatus();
}
