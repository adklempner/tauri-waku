<script lang="ts">
  import "../../app.css";
  import ScanCode from "$lib/components/ScanCode.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import CallToAction from "$lib/components/CallToAction.svelte";
  import {
    checkPermissions,
    requestPermissions,
  } from "@tauri-apps/plugin-barcode-scanner";
  import { onMount } from "svelte";
  import MobileScan from "./MobileScan.svelte";
  import { tokenStore } from "$lib/credential/TokenStore";
  import { outbox } from "$lib/credential/Outbox";
  import { Topic, type DevicePairingMessage } from "$lib/waku/topics";
  import { pairingState } from "$lib/waku.svelte";
  import { encodeBase64 } from "@oslojs/encoding";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";

  let isMobile = $state(false);
  let devicePubKeyBase64: string | null = $state(null);
  let isPairing: boolean = $state(false);
  let isAwaitingResponse: boolean = $state(false);
  let hasReceivedAck: boolean = $state(false);

  // Subscribe to the pairingState store
  const unsubscribe = pairingState.subscribe((state) => {
    // Check if we were awaiting a response and now we're not (ack received)
    const wasAwaiting = isAwaitingResponse;
    isAwaitingResponse =
      state.awaitingResponse && state.devicePubKey === devicePubKeyBase64;

    // If we received an ack for our pairing request
    if (
      wasAwaiting &&
      !isAwaitingResponse &&
      devicePubKeyBase64 &&
      !hasReceivedAck
    ) {
      hasReceivedAck = true; // Prevent multiple navigations
      toast.success("Device successfully paired!");
      // Navigate back to device list with a small delay to allow the toast to show
      setTimeout(() => {
        goto("/devices", {
          keepFocus: true,
        });
      }, 1000);
    }
  });

  onMount(() => {
    try {
      checkPermissions().then(() => {
        isMobile = true;
      });
    } catch (error: any) {
      console.log("unable to check tauri permissions");
      if (
        error.message.includes(
          "Cannot read properties of undefined (reading 'invoke')"
        )
      ) {
        console.log("We are in the browser and will use html5 qr code scanner");
      }
      console.error(error);
    }

    return () => {
      unsubscribe();
    };
  });

  async function handleScanSuccess(event: CustomEvent<string>) {
    devicePubKeyBase64 = event.detail;
    await pairNewDevice();
  }

  async function pairNewDevice() {
    if (!devicePubKeyBase64) {
      return;
    }
    isPairing = true;
    const success = await tokenStore.pairNewDevice(devicePubKeyBase64);
    if (!success) {
      goto("/");
      return;
    }
    const {
      myKey,
      encryptedMessage: { nonce, ciphertext },
    } = await tokenStore.encryptMessageForDevice(
      devicePubKeyBase64,
      devicePubKeyBase64
    );
    // add message to outbox for tracking and potential rebroadcasting
    const message: Partial<DevicePairingMessage> = {
      senderPublicKeyBase64: encodeBase64(myKey),
      nonceBase64: encodeBase64(nonce),
      ciphertextBase64: encodeBase64(ciphertext),
      scannedPublicKeyBase64: devicePubKeyBase64,
    };

    try {
      // First update the pairing state to indicate we're awaiting response
      // This needs to happen before sending to ensure state is consistent
      pairingState.update((state) => ({
        awaitingResponse: true,
        devicePubKey: devicePubKeyBase64,
      }));

      // Add to outbox and immediately send the message
      const ackId = await outbox.add(Topic.DevicePairing, message, true);
      console.log(`Sent pairing request with ID ${ackId}`);
    } catch (error) {
      console.error("Failed to send initial pairing request:", error);
      // Reset pairing state since the request failed
      pairingState.update((state) => ({
        awaitingResponse: false,
        devicePubKey: null,
      }));
      // The message is already in the outbox and will be retried automatically
    }
  }
</script>

<PageLayout title="Scan Code" maxWidth="md">
  {#if devicePubKeyBase64}
    <div class="flex flex-col items-center justify-center mt-4">
      <div
        class="w-32 h-32 overflow-hidden flex items-center justify-center perspective-500"
      >
        <img
          src="/waku-mark-primary-black.svg"
          alt="Waku Logo"
          class="w-full h-full transform scale-125 animate-spin-y"
        />
      </div>
      <p class="text-gray-600 mt-4 text-lg font-medium">
        {#if hasReceivedAck}
          <span class="animate-success text-green-600 font-bold">Success!</span>
        {:else}
          <span class="animate-dots">
            {#if isAwaitingResponse}
              Awaiting Response . . .
            {:else}
              Sending Pair Request . . .
            {/if}
          </span>
        {/if}
      </p>
    </div>
  {:else if isMobile}
    <MobileScan on:scanSuccess={handleScanSuccess} />
  {:else}
    <ScanCode on:scanSuccess={handleScanSuccess} />
  {/if}
  <CallToAction
    message="Want to return to your devices?"
    linkText="View Devices"
    linkHref="/devices"
  />
</PageLayout>

<style>
  .perspective-500 {
    perspective: 500px;
  }

  @keyframes spin-y {
    0% {
      transform: scale(1.25) rotateY(0deg);
    }
    50% {
      transform: scale(1.25) rotateY(180deg);
    }
    100% {
      transform: scale(1.25) rotateY(360deg);
    }
  }

  @keyframes successAnimation {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
  }

  .animate-success {
    animation: successAnimation 1s infinite ease-in-out;
    display: inline-block;
  }

  @keyframes dotAnimation {
    0% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.3;
    }
  }

  .animate-dots {
    animation: dotAnimation 1.5s infinite ease-in-out;
    display: inline-block;
  }

  .animate-spin-y {
    animation: spin-y 10s infinite linear;
    transform-style: preserve-3d;
  }
</style>
