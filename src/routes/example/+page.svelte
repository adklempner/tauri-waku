<script lang="ts">
  import { wakuConnection } from "$lib/connectionUtils";
  import WakuAwareButton from "$lib/components/WakuAwareButton.svelte";
  import { startWaku } from "$lib/waku.svelte";

  let someCondition = false;
  
  function toggleCondition() {
    someCondition = !someCondition;
  }
  
  async function handleWakuAction() {
    alert("Waku action performed successfully!");
  }
  
  async function handleConnect() {
    try {
      await startWaku();
    } catch (error) {
      console.error("Failed to connect to Waku:", error);
    }
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-xl font-bold mb-4">Waku Connection Example</h1>
  
  <div class="bg-gray-100 p-4 rounded-lg mb-6">
    <h2 class="font-semibold mb-2">Current Waku Status</h2>
    <div class="flex flex-col gap-2">
      <p>Status: <span class="font-mono">{$wakuConnection.status}</span></p>
      {#if $wakuConnection.error}
        <p class="text-red-500">Error: {$wakuConnection.error}</p>
      {/if}
      <p>Is Connected: <span class="font-mono">{$wakuConnection.isConnected ? "Yes" : "No"}</span></p>
      <p>Is Connecting: <span class="font-mono">{$wakuConnection.isConnecting ? "Yes" : "No"}</span></p>
    </div>
  </div>
  
  <div class="mb-6">
    <h2 class="font-semibold mb-2">Connection Controls</h2>
    {#if !$wakuConnection.isConnected && !$wakuConnection.isConnecting}
      <button 
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        on:click={handleConnect}
      >
        Connect to Waku
      </button>
    {:else if $wakuConnection.isConnecting}
      <button 
        class="px-4 py-2 bg-yellow-500 text-white rounded opacity-50 cursor-not-allowed"
        disabled
      >
        Connecting...
      </button>
    {:else}
      <p class="text-green-500">Connected to Waku!</p>
    {/if}
  </div>
  
  <div class="bg-gray-100 p-4 rounded-lg mb-6">
    <h2 class="font-semibold mb-2">Additional Condition</h2>
    <div class="flex items-center gap-2 mb-4">
      <input 
        type="checkbox" 
        id="condition" 
        bind:checked={someCondition}
      />
      <label for="condition">Extra condition {someCondition ? "enabled" : "disabled"}</label>
    </div>
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      on:click={toggleCondition}
    >
      Toggle Condition
    </button>
  </div>
  
  <div class="mb-6">
    <h2 class="font-semibold mb-2">Examples</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Example 1: Using the reusable component -->
      <div class="border p-4 rounded-lg">
        <h3 class="font-medium mb-2">Using WakuAwareButton Component</h3>
        <WakuAwareButton
          onClick={handleWakuAction}
          label="Perform Waku Action"
          extraCondition={someCondition}
        />
        <p class="text-sm mt-2 text-gray-600">
          This button checks both Waku connection and the extra condition.
        </p>
      </div>
      
      <!-- Example 2: Using the getButtonProps utility -->
      <div class="border p-4 rounded-lg">
        <h3 class="font-medium mb-2">Using getButtonProps() Helper</h3>
        <button
          {...$wakuConnection.getButtonProps(someCondition)}
          on:click={handleWakuAction}
          class="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600"
        >
          Custom Waku Action
        </button>
        <p class="text-sm mt-2 text-gray-600">
          This button uses getButtonProps() directly with the extra condition.
        </p>
      </div>
      
      <!-- Example 3: Using the check function -->
      <div class="border p-4 rounded-lg">
        <h3 class="font-medium mb-2">Using disableIfNotConnected()</h3>
        <button
          disabled={$wakuConnection.disableIfNotConnected(someCondition)}
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 
                 {$wakuConnection.disableIfNotConnected(someCondition) ? 'opacity-50 cursor-not-allowed' : ''}"
          on:click={handleWakuAction}
        >
          Another Waku Action
        </button>
        <p class="text-sm mt-2 text-gray-600">
          This button uses the disableIfNotConnected() helper function.
        </p>
      </div>
      
      <!-- Example 4: Just checking isConnected -->
      <div class="border p-4 rounded-lg">
        <h3 class="font-medium mb-2">Using isConnected directly</h3>
        <button
          disabled={!$wakuConnection.isConnected || !someCondition}
          class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600
                 {!$wakuConnection.isConnected || !someCondition ? 'opacity-50 cursor-not-allowed' : ''}"
          on:click={handleWakuAction}
        >
          Simple Waku Action
        </button>
        <p class="text-sm mt-2 text-gray-600">
          This button directly checks the isConnected value.
        </p>
      </div>
    </div>
  </div>
</div> 