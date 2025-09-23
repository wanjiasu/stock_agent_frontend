import { auth } from "@/lib/auth"; 
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

// Create a handler with CORS support
const handler = toNextJsHandler(auth);

// Add CORS headers to the response
function withCorsHeaders(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For other requests, call the original handler
    const response = await handler(req);
    
    // Add CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  };
}

// Export the handlers with CORS support
export const POST = withCorsHeaders(handler.POST);
export const GET = withCorsHeaders(handler.GET);