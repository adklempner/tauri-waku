<script lang="ts">
	// import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import ConnectionButton from '$lib/components/ConnectionButton.svelte';
	// import ActionModule from '$lib/components/ActionModule.svelte';
	import { connectionState, sendWithLightPush } from '$lib/waku.svelte';

	async function handleSend() {
		const result = await sendWithLightPush(new Uint8Array([1, 2, 3]));
		console.log(result);
	}
</script>

<Header />

<div class="content">
	{#if connectionState.status !== 'connected'}
		<div class="connection-container">
			<p>Connect to the Waku network to start using the demo</p>
			<div class="large-connect-button">
				<ConnectionButton size="large" />
			</div>
		</div>
	{:else}
		<div class="action-container">
			<p> Connected to the Waku network</p>
		</div>
		<button onclick={handleSend}>Send</button>
	{/if}
</div>

<style>
	.content {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		color: #111827;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #4B5563;
		margin-bottom: 2rem;
	}

	.connection-container, .action-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 2rem;
	}

	.action-container {
		width: 100%;
	}

	.large-connect-button {
		margin-top: 1rem;
	}
</style>
