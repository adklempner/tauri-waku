<script lang="ts">
  import { page } from "$app/stores";
  import { tokenStore } from "$lib/credential/TokenStore";
  import { onMount } from "svelte";
  import { encodeBase64 } from "@oslojs/encoding";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import { decodeBase64 } from "@oslojs/encoding";
  import { deviceInfo, type RamUsageItem } from "$lib/deviceinfo/DeviceInfo";
  import { liveQuery, type Observable } from "dexie";
  let Identicon: any;
  import RamUsageChart2 from "$lib/components/RamUsageChart2.svelte";
  // Get device ID from URL
  const deviceId = $derived($page.url.searchParams.get("id") || "");
  let ramUsageList: Observable<RamUsageItem[]> | undefined = $state();
  let lastUpdate: Observable<number | undefined> | undefined = $state();
  onMount(async () => {
    const identiconModule = await import("identicon.js");
    Identicon = identiconModule.default;
    let deviceInfoReady = false;
    let tokenStoreReady = false;

    function checkBothReady() {
      if (deviceInfoReady && tokenStoreReady) {
        loadDeviceData(deviceId);
      }
    }

    deviceInfo.ready.subscribe(async (ready) => {
      if (!ready) {
        console.log("DeviceInfo database not ready");
        return;
      }
      deviceInfoReady = true;
      checkBothReady();
    });

    tokenStore.ready.subscribe(async (ready) => {
      if (!ready) {
        console.log("TokenStore database not ready");
        return;
      }
      tokenStoreReady = true;
      checkBothReady();
    });
  });

  const ramUsageChartData = $derived(
    $ramUsageList
      ?.map((r) => [
        {
          group: "Used Memory",
          date: new Date(r.ramUsage.timestamp).toISOString(),
          value: r.ramUsage.used_memory / 1024 / 1024 / 1024,
        },
        {
          group: "Used Swap",
          date: new Date(r.ramUsage.timestamp).toISOString(),
          value: r.ramUsage.used_swap / 1024 / 1024 / 1024,
        },
        {
          group: "Total Memory",
          date: new Date(r.ramUsage.timestamp).toISOString(),
          value: r.ramUsage.total_memory / 1024 / 1024 / 1024,
        },
        {
          group: "Total Swap",
          date: new Date(r.ramUsage.timestamp).toISOString(),
          value: r.ramUsage.total_swap / 1024 / 1024 / 1024,
        },
      ])
      .flat()
  );

  // Store device data
  let deviceData = $state({
    id: "",
    status: "",
    publicKey: new Uint8Array(),
  });

  async function loadDeviceData(id: string) {
    try {
      // Get all devices and find the matching one
      const devices = await tokenStore.getDevices();
      const device = devices.find((d) => encodeBase64(d.publicKey) === id);
      if (!device) {
        throw new Error("Device not found");
      }
      if (!device.devicePublicKey) {
        throw new Error("Device public key not found");
      }
      const devicePublicKeyBase64 = encodeBase64(device.devicePublicKey);

      if (device) {
        deviceData = {
          id: devicePublicKeyBase64,
          status: device.paired
            ? "Paired"
            : device.request
              ? "Requested"
              : "Awaiting Scan",
          publicKey: new Uint8Array(device.publicKey),
        };
      }

      lastUpdate = liveQuery(async () => {
        return await deviceInfo.lastUpdate.get(devicePublicKeyBase64);
      });
      console.log(lastUpdate);
      ramUsageList = liveQuery(async () => {
        return (
          await deviceInfo.ramUsage
            .where("deviceId")
            .equals(devicePublicKeyBase64)
            .reverse()
            .limit(20)
            .toArray()
        ).sort((a, b) => {
          return b.ramUsage.timestamp - a.ramUsage.timestamp;
        });
      });
    } catch (error) {
      console.error("Error loading device data:", error);
    }
  }

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
</script>

<PageLayout title="Device Information" maxWidth="lg">
  {#if deviceData.id}
    <div class="bg-white rounded-lg overflow-hidden">
      <div class="flex items-center space-x-4 p-6 border-b border-gray-200">
        <img
          src={generateIdenticon(deviceData.id)}
          alt="Device icon"
          class="h-16 w-16 rounded-full"
        />
        <div>
          <h2 class="text-xl font-semibold text-gray-800">
            Device {deviceData.id.substring(0, 8)}...
          </h2>
          <div class="mt-1">
            <span
              class={`px-2 py-1 text-xs font-medium rounded-full 
              ${
                deviceData.status === "Paired"
                  ? "bg-green-100 text-green-800"
                  : deviceData.status === "Requested"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {deviceData.status}
            </span>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Last Update</h3>
          <div class="bg-gray-50 p-3 rounded-md overflow-x-auto">
            <code class="text-sm text-gray-800 break-all">
              {$lastUpdate ? new Date($lastUpdate).toLocaleString() : "N/A"}
            </code>   
          </div>
        </div>

        {#if deviceData.status === "Paired"}
          <div class="mt-6">
            <button
              class="py-2 px-4 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors w-full sm:w-auto"
            >
              Remove Device
            </button>
          </div>
        {:else if deviceData.status === "Requested"}
          <div class="mt-6">
            <button
              class="py-2 px-4 bg-yellow-600 text-white font-medium rounded hover:bg-yellow-700 transition-colors w-full sm:w-auto"
            >
              Retry Pairing
            </button>
          </div>
        {:else if deviceData.status === "Awaiting Scan"}
          <div class="mt-6">
            <a
              href={`/pairing?key=${encodeURIComponent(deviceData.id)}`}
              class="inline-block py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors w-full sm:w-auto text-center"
            >
              Show QR Code
            </a>
          </div>
        {/if}
      </div>
    </div>
    {#if ramUsageChartData}
      <RamUsageChart2 {ramUsageChartData} />
    {/if}
  {:else if deviceId}
    <div class="flex justify-center items-center p-8">
      <p class="text-gray-500">Loading device information...</p>
    </div>
  {:else}
    <div class="flex justify-center items-center p-8">
      <p class="text-gray-500">
        No device selected. Please select a device from the device list.
      </p>
    </div>
  {/if}
</PageLayout>
