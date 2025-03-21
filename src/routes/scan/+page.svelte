<script lang="ts">
	import '../../app.css';
	import ScanCode from '$lib/components/ScanCode.svelte';
</script>

<div class="flex max-w-5xl mx-auto px-4 my-8 justify-center">
	<ScanCode />
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
