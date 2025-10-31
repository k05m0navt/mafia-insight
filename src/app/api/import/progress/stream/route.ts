import { NextRequest } from 'next/server';
import { importProgressManager } from '@/lib/importProgress';

export async function GET(request: NextRequest) {
  try {
    // Check authentication via cookie
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      // Return error as SSE
      const errorStream = new ReadableStream({
        start(controller) {
          const errorData = `data: ${JSON.stringify({
            error: 'Authentication required',
            message: 'Please sign in to view import progress',
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        },
      });

      return new Response(errorStream, {
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        const sendProgress = () => {
          const progress = importProgressManager.getCurrentProgress();

          if (progress) {
            const data = `data: ${JSON.stringify(progress)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            // Continue if still running
            if (progress.status === 'RUNNING') {
              setTimeout(sendProgress, 5000); // Send update every 5 seconds
            } else {
              // Send final update and close
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(progress)}\n\n`
                )
              );
              controller.close();
            }
          } else {
            // No progress, send empty message and close
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"message": "No import in progress"}\n\n'
              )
            );
            controller.close();
          }
        };

        // Send initial progress
        sendProgress();
      },

      cancel() {
        // Cleanup when client disconnects
        console.log('SSE connection closed');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE error:', error);

    // Return error as SSE
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = `data: ${JSON.stringify({
          error: 'Authentication required',
          message: 'Please sign in to view import progress',
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorData));
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 401,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
}
