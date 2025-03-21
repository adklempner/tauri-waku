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
import { writable } from "svelte/store";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";

class WakuNode {
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
    await node.dial("/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ");
    wakuNode.setNode(node);
    (window as any).waku = node;
    connectionState.update((state) => ({
      ...state,
      status: "waiting_for_peers",
    }));

    try {
      await node.waitForPeers([Protocols.LightPush, Protocols.Filter]);
      connectionState.update((state) => ({
        ...state,
        status: "connected",
      }));
    } catch (error) {
      console.error("Error waiting for peers:", error);
      connectionState.update((state) => ({
        ...state,
        error:
          error instanceof Error ? error.message : "Failed to wait for peers",
      }));
      connectionState.update((state) => ({
        ...state,
        status: "error",
      }));
      throw error;
    }

    try {
      // TODO: need to retry if failed
      await subscribeToFilter(Topic.DevicePairing, async (message) => {
        const error = topics[Topic.DevicePairing].protoType.verify(
          message.payload
        );
        if (error) {
          console.error("Error verifying device pairing message:", error);
          return;
        }
        const devicePairingMessage = topics[
          Topic.DevicePairing
        ].protoType.decode(message.payload) as unknown as DevicePairingMessage;
        console.log("Device pairing message:", devicePairingMessage);
        const scannedPublicKeyBase64 =
          devicePairingMessage.scannedPublicKeyBase64;
        const success = await tokenStore.receiveDevicePairing(
          {
            nonce: decodeBase64(devicePairingMessage.nonceBase64),
            ciphertext: decodeBase64(devicePairingMessage.ciphertextBase64),
          },
          devicePairingMessage.scannedPublicKeyBase64,
          decodeBase64(devicePairingMessage.senderPublicKeyBase64)
        );
        if (success) {
          toast.success("Device successfully paired!");

          // If we're on the pairing page and the scanned key matches the one being displayed
          const currentPath = window.location.pathname;
          const displayedPublicKey = document
            .getElementById("qrcode")
            ?.getAttribute("data-public-key");

          if (
            currentPath === "/pairing" &&
            displayedPublicKey === scannedPublicKeyBase64
          ) {
            // Navigate back to device list
            goto("/");
          }
        } else {
          toast.error("Failed to pair device. Please try again.");
        }
        // await wakuNode.send(Topic.Ack, {
        //   ackId: devicePairingMessage.ackId,
        //   success: true,
        // });
      });
    } catch (error) {
      console.error("Error subscribing for device pairing:", error);
    }
  } catch (error) {
    console.error("Error starting Waku node:", error);
    connectionState.update((state) => ({
      ...state,
      error:
        error instanceof Error ? error.message : "Failed to start Waku node",
    }));
    connectionState.update((state) => ({
      ...state,
      status: "error",
    }));
    throw error;
  }
}

export let subscription: ISubscription | undefined;

export async function subscribeToFilter(
  topic: Topic,
  callback: (message: DecodedMessage) => void
) {
  if (!node) {
    throw new Error("Waku node not started");
  }

  const result = await node.filter.subscribe(
    [topics[topic].decoder],
    (message) => {
      callback(message);
    },
    { forceUseAllPeers: false }
  );

  if (result.error) {
    console.error("Error subscribing to filter:", result.error);
    throw new Error("Failed to subscribe to filter");
  }

  // At this point TypeScript knows we have a SubscriptionSuccess
  subscription = result.subscription;

  if (
    result.results.failures.length > 0 ||
    result.results.successes.length === 0
  ) {
    throw new Error(
      "Failed to subscribe to filter: No successful peer connections"
    );
  }
}

export function health(): HealthStatus {
  if (!node) {
    return HealthStatus.Unhealthy;
  }
  return node.health.getHealthStatus();
}
