import {
	createDecoder,
	createEncoder,
	createLightNode,
	DecodedMessage,
	type LightNode,
	type ISubscription,
	Protocols,
	HealthStatus,
	type SDKProtocolResult
} from '@waku/sdk';

const contentTopic = '/sds-demo/1/messages/proto';

export const encoder = createEncoder({ contentTopic });

export const decoder = createDecoder(contentTopic);

let node = $state<LightNode | undefined>(undefined);
export const connectionState = $state<{
	status: 'disconnected' | 'connecting' | 'waiting_for_peers' | 'connected' | 'error';
	error: string | null;
}>({ status: 'disconnected', error: null });

export async function startWaku(): Promise<void> {
	connectionState.status = 'connecting';
	connectionState.error = null;

	try {
		node = await createLightNode({
			defaultBootstrap: true,
			networkConfig: {
				contentTopics: [contentTopic]
			}
		});
		(window as any).waku = node;
		await node.start();

		connectionState.status = 'waiting_for_peers';

		try {
			await node.waitForPeers([Protocols.LightPush, Protocols.Filter]);
			connectionState.status = 'connected';
		} catch (error) {
			console.error('Error waiting for peers:', error);
			connectionState.error = error instanceof Error ? error.message : 'Failed to wait for peers';
			connectionState.status = 'error';
			throw error;
		}
	} catch (error) {
		console.error('Error starting Waku node:', error);
		connectionState.error = error instanceof Error ? error.message : 'Failed to start Waku node';
		connectionState.status = 'error';
		throw error;
	}
}

export let subscription: ISubscription | undefined;

export async function subscribeToFilter(callback: (message: DecodedMessage) => void) {
	if (!node) {
		throw new Error('Waku node not started');
	}

	const result = await node.filter.subscribe(
		[decoder],
		(message) => {
			callback(message);
		},
		{ forceUseAllPeers: false }
	);

	if (result.error) {
		console.error('Error subscribing to filter:', result.error);
		throw new Error('Failed to subscribe to filter');
	}

	// At this point TypeScript knows we have a SubscriptionSuccess
	subscription = result.subscription;

	if (result.results.failures.length > 0 || result.results.successes.length === 0) {
		throw new Error('Failed to subscribe to filter: No successful peer connections');
	}
}

export async function sendWithLightPush(payload: Uint8Array): Promise<SDKProtocolResult> {
	if (!node) {
		throw new Error('Waku node not started');
	}
	return await node.lightPush.send(encoder, {
		payload: payload,
		timestamp: new Date()
	});
}

export function health(): HealthStatus {
	if (!node) {
		return HealthStatus.Unhealthy;
	}
	return node.health.getHealthStatus();
}
