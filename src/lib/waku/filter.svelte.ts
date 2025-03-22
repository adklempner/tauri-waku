import {
  topics,
  type DevicePairingMessage,
  type AckMessage,
  Topic,
  type DeviceInfoMessage,
  ramUsageProto,
  type RamUsage,
} from "./topics";

import type { DecodedMessage, ISubscription } from "@waku/sdk";
import {
  pairingState,
  subscribeToFilter,
  wakuNode,
  type PairingState,
} from "$lib/waku.svelte";
import { tokenStore } from "$lib/credential/TokenStore";
import { decodeBase64, encodeBase64 } from "@oslojs/encoding";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { WakuNode } from "$lib/waku.svelte";
import { outbox } from "$lib/credential/Outbox";
import { decrypt } from "$lib/credential/Keys";
import { bytesToUtf8 } from "@noble/ciphers/utils";
import { deviceInfo } from "$lib/deviceinfo/DeviceInfo";

export function devicePairingCallback(wakuNode: WakuNode) {
  return async (message: DecodedMessage) => {
    const error = topics[Topic.DevicePairing].protoType.verify(message.payload);
    if (error) {
      console.error("Error verifying device pairing message:", error);
      return;
    }
    const devicePairingMessage = topics[Topic.DevicePairing].protoType.decode(
      message.payload
    ) as unknown as DevicePairingMessage;
    console.log("Device pairing message:", devicePairingMessage);
    const scannedPublicKeyBase64 = devicePairingMessage.scannedPublicKeyBase64;

    // Update the pairing state when receiving a message
    pairingState.update((state: PairingState) => ({
      awaitingResponse: true,
      devicePubKey: scannedPublicKeyBase64,
    }));

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

    // Send an acknowledgment message
    try {
      // Create and send the ack message
      const ackMessage: AckMessage = {
        ackId: devicePairingMessage.ackId,
        success: success,
      };
      await wakuNode.send(Topic.Ack, ackMessage);
      console.log(
        `Sent acknowledgment for message ID: ${devicePairingMessage.ackId}, success: ${success}`
      );
    } catch (error) {
      console.error("Failed to send acknowledgment:", error);
    }
  };
}

export function ackCallback(wakuNode: WakuNode) {
  return async (message: DecodedMessage) => {
    const error = topics[Topic.Ack].protoType.verify(message.payload);
    if (error) {
      console.error("Error verifying ack message:", error);
      return;
    }

    const ackMessage = topics[Topic.Ack].protoType.decode(
      message.payload
    ) as unknown as AckMessage;

    console.log(
      `Received acknowledgment for message ID: ${ackMessage.ackId}, success: ${ackMessage.success}`
    );

    if (ackMessage.ackId && ackMessage.success) {
      // Mark the message as acknowledged in the outbox
      await outbox.ack(ackMessage.ackId);

      // Get the original message from the outbox to determine if this was a pairing message
      const originalMessage = await outbox.getMessage(ackMessage.ackId);

      if (originalMessage && originalMessage.topic === Topic.DevicePairing) {
        const devicePairingMessage =
          originalMessage.message as DevicePairingMessage;

        // If we were the sender of the DevicePairing message (i.e., we scanned the QR code)
        // we need to update our credential to mark it as paired
        if (
          devicePairingMessage.senderPublicKeyBase64 &&
          devicePairingMessage.scannedPublicKeyBase64
        ) {
          try {
            console.log(
              "Received successful ack for our pairing request, updating credential"
            );

            // Add a small delay to ensure credential creation is complete
            // This helps with race conditions where the ack comes back very quickly
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Check if we have a credential for this scanned key
            const credential = await tokenStore.getPairing(
              devicePairingMessage.senderPublicKeyBase64
            );

            if (credential && !credential.paired && credential.request) {
              // Update the credential to mark it as paired
              const success = await tokenStore.updatePairedStatus(
                devicePairingMessage.senderPublicKeyBase64,
                true
              );

              if (success) {
                console.log("Updated credential to paired state");
              } else {
                console.error("Failed to update credential paired state");
              }
            } else {
              console.log(
                "No unpaired credential found or credential not marked as request",
                credential
              );
            }
          } catch (err) {
            console.error("Error updating credential:", err);
          }
        }
      }

      // Update the pairing state if this is a pairing-related acknowledgment
      pairingState.update((state) => {
        if (state.awaitingResponse) {
          return {
            ...state,
            awaitingResponse: false,
          };
        }
        return state;
      });
    }
  };
}

export function deviceInfoCallback(wakuNode: WakuNode) {
  return async (message: DecodedMessage) => {
    let error = topics[Topic.DeviceInfo].protoType.verify(message.payload);
    if (error) {
      console.error("Error verifying device info message:", error);
      return;
    }
    const deviceInfoMessage = topics[Topic.DeviceInfo].protoType.decode(
      message.payload
    ) as unknown as DeviceInfoMessage;

    const senderPublicKeyBase64 = deviceInfoMessage.senderPublicKeyBase64;
    const myPublicKeyBase64 = await tokenStore.getMyPublicKey(senderPublicKeyBase64);
    const credential = await tokenStore.getPairing(myPublicKeyBase64);
    if (!credential) {
      console.error("No credential found for sender public key:", senderPublicKeyBase64);
      return;
    }
    if(!credential.sharedSecret) {
      console.error("No shared secret found for credential:", credential);
      return;
    }

    const decryptedMessage = decrypt(decodeBase64(deviceInfoMessage.nonceBase64), decodeBase64(deviceInfoMessage.ciphertextBase64), credential.sharedSecret);
    error = ramUsageProto.verify(decryptedMessage);
    if(error) {
      console.error("Error verifying ram usage message:", error);
      return;
    }
    const ramUsage = ramUsageProto.decode(decryptedMessage) as unknown as RamUsage;

    console.log("Ram usage:", ramUsage);

    await deviceInfo.addRamUsage(ramUsage, senderPublicKeyBase64);
  };
}
// Setup subscriptions
export async function setupSubscriptions(
  node: WakuNode
): Promise<Array<ISubscription>> {
  const subscriptions: Array<ISubscription> = [];

  // Subscribe to device pairing messages
  const devicePairingSub = await subscribeToFilter(
    Topic.DevicePairing,
    devicePairingCallback(node)
  );

  if (devicePairingSub) {
    subscriptions.push(devicePairingSub);
  }

  // Subscribe to acknowledgment messages
  const ackSub = await subscribeToFilter(Topic.Ack, ackCallback(node));

  if (ackSub) {
    subscriptions.push(ackSub);
  }

  const deviceInfoSub = await subscribeToFilter(Topic.DeviceInfo, deviceInfoCallback(node));

  if (deviceInfoSub) {
    subscriptions.push(deviceInfoSub);
  }

  return subscriptions;
}
