<script lang="ts">
    import { startWaku, connectionState } from '$lib/waku.svelte';
    
    export let size = "normal"; // can be "normal" or "large"
  
    async function handleConnect() {
      try {
        await startWaku();
      } catch (error) {
        // Error is already handled in startWaku function
        console.error('Connection error in component:', error);
      }
    }
  </script>
  
  <div class="connection-ui {size}">
    {#if $connectionState.status === 'disconnected'}
    <a onclick={handleConnect} class="text-blue-600 hover:text-blue-800 font-medium"
    >Connect →</a
  >
    {:else if $connectionState.status === 'connecting'}
      <span class="status">Starting node...</span>
    {:else if $connectionState.status === 'waiting_for_peers'}
      <span class="status">Waiting for peers...</span>
    {:else if $connectionState.status === 'connected'}
      <span class="status connected">Connected</span>
      {:else if $connectionState.status === 'error'}
      <div class="error-container">
        <span class="error">Error: {$connectionState.error}</span>
        <a onclick={handleConnect}>Retry</a>
      </div>
    {/if}
  </div>
  
  <style>
    .connection-ui {
      display: flex;
      align-items: center;
    }
  
    .connection-ui.large button {
      font-size: 1.2rem;
      padding: 0.75rem 1.5rem;
    }
  
    .connection-ui.large .status {
      font-size: 1.2rem;
      padding: 0.75rem 1.5rem;
    }
  
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
  
    .connection-ui.normal .error-container {
      align-items: flex-end;
    }
  
    button {
      background-color: #4F46E5;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
  
    button:hover {
      background-color: #4338CA;
    }
  
    .status {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      background-color: #E5E7EB;
      color: #374151;
    }
  
    .status.connected {
      background-color: #D1FAE5;
      color: #065F46;
    }
  
    .error {
      color: #B91C1C;
      background-color: #FEE2E2;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
    
    .connection-ui.large .error {
      font-size: 1rem;
      max-width: 600px;
    }
  </style> 