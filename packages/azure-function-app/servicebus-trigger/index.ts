import { app, InvocationContext } from "@azure/functions";

export async function serviceBusTrigger(message: unknown, context: InvocationContext): Promise<void> {
    context.log('Service Bus queue trigger function processing message');
    
    try {
        // Log message metadata
        context.log('Message metadata:', {
            messageId: context.triggerMetadata?.messageId,
            enqueuedTimeUtc: context.triggerMetadata?.enqueuedTimeUtc,
            deliveryCount: context.triggerMetadata?.deliveryCount,
            sequenceNumber: context.triggerMetadata?.sequenceNumber
        });

        // Parse and log message content
        let messageContent: any;
        if (typeof message === 'string') {
            try {
                messageContent = JSON.parse(message);
                context.log('Parsed message content (JSON):', messageContent);
            } catch (parseError) {
                context.log('Message content (text):', message);
                messageContent = message;
            }
        } else {
            context.log('Message content (object):', message);
            messageContent = message;
        }

        // Simulate message processing
        await processMessage(messageContent, context);

        context.log('Message processed successfully');
    } catch (error) {
        context.error('Error processing Service Bus message:', error);
        throw error; // Re-throw to trigger retry or dead-letter
    }
}

async function processMessage(message: any, context: InvocationContext): Promise<void> {
    // Placeholder for actual message processing logic
    context.log('Processing message:', {
        type: message?.type || 'unknown',
        timestamp: new Date().toISOString()
    });

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
}

app.serviceBusQueue('servicebus-trigger', {
    queueName: 'demo-queue',
    connection: 'ServiceBusConnection',
    handler: serviceBusTrigger
});
