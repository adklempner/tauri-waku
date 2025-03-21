<script lang="ts">
  import { liveQuery } from "dexie";
  import { tokenStore } from "$lib/credential/TokenStore";
  import { onMount } from "svelte";
  import { encodeBase64 } from "@oslojs/encoding";
  import { goto } from "$app/navigation";
  let Identicon: any;

  // Load identicon.js
  onMount(async () => {
    const identiconModule = await import("identicon.js");
    Identicon = identiconModule.default;
  });

  // Generate identicon data URL
  function generateIdenticon(messageId: string) {
    if (!Identicon) return "";

    // Convert the message ID to a hash if it's not already in the right format
    const hash = messageId
      .replace(/[^0-9a-f]/g, "")
      .substring(0, 15)
      .padEnd(15, "0");

    try {
      const data = new Identicon(hash, {
        size: 64,
        format: "svg",
      }).toString();

      return `data:image/svg+xml;base64,${data}`;
    } catch (error) {
      console.error("Failed to generate identicon:", error);
      return "";
    }
  }

  let devices = $state(
    liveQuery(async () => {
      return (await tokenStore.getDevices()).map((device) => {
        return {
          id: encodeBase64(device.publicKey),
          status: device.paired ? "Paired" : device.request ? "Requested" : "Awaiting Scan",
        };
      });
    })
  );

  function navigateToPairingQR(deviceId: string) {
    goto(`/pairing?key=${encodeURIComponent(deviceId)}`);
  }
</script>

{#if $devices?.length > 0}
  <div class="w-full overflow-x-auto border border-gray-200 rounded-lg">
    <table class="w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Device
          </th>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each $devices as device}
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <img
                  src={generateIdenticon(device.id)}
                  alt="Device icon"
                  class="h-8 w-8 rounded-full mr-3"
                />
                <span class="text-sm text-gray-700 font-medium truncate max-w-[100px]">
                  {device.id.substring(0, 8)}...
                </span>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap">
              <span class={`px-2 py-1 text-xs font-medium rounded-full 
                ${device.status === 'Paired' ? 'bg-green-100 text-green-800' : 
                  device.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'}`}>
                {device.status}
              </span>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
              {#if device.status === "Paired"}
                <button class="py-1 px-3 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors">
                  Remove
                </button>
              {:else if device.status === "Requested"}
                <button class="py-1 px-3 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition-colors">
                  Retry
                </button>
              {:else if device.status === "Awaiting Scan"}
                <button 
                  class="py-1 px-3 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  on:click={() => navigateToPairingQR(device.id)}
                >
                  Show QR
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center py-8">
    <p class="text-gray-500 mb-4">
      No devices found, add your first device below.
    </p>
  </div>
{/if}
