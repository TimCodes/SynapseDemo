import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('HTTP trigger function processing request');
    
    const method = request.method;
    const timestamp = new Date().toISOString();

    try {
        if (method === 'GET') {
            return handleGetRequest(context, timestamp);
        } else if (method === 'POST') {
            return await handlePostRequest(request, context, timestamp);
        } else {
            return {
                status: 405,
                jsonBody: {
                    error: 'Method not allowed',
                    allowedMethods: ['GET', 'POST']
                }
            };
        }
    } catch (error) {
        context.error('Error processing request:', error);
        return {
            status: 500,
            jsonBody: {
                error: 'Internal server error',
                message: error.message,
                timestamp
            }
        };
    }
}

function handleGetRequest(context: InvocationContext, timestamp: string): HttpResponseInit {
    context.log('Processing GET request');
    
    return {
        status: 200,
        jsonBody: {
            message: 'Azure Function HTTP trigger is working!',
            method: 'GET',
            timestamp,
            functionName: 'http-trigger'
        }
    };
}

async function handlePostRequest(request: HttpRequest, context: InvocationContext, timestamp: string): Promise<HttpResponseInit> {
    context.log('Processing POST request');
    
    let body: any;
    try {
        body = await request.json();
    } catch (parseError) {
        context.warn('Failed to parse request body as JSON');
        body = await request.text();
    }

    context.log('Received data:', body);

    return {
        status: 200,
        jsonBody: {
            message: 'Data received and processed successfully',
            method: 'POST',
            receivedData: body,
            timestamp,
            functionName: 'http-trigger'
        }
    };
}

app.http('http-trigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'process',
    handler: httpTrigger
});
