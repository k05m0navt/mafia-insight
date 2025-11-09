'use client';

import React, { useState } from 'react';
import { apiDocumentation } from '@/lib/apiDocumentation';
import { OpenAPISpec } from '@/types/api';

export default function SwaggerUIPage() {
  const [openApiSpec] = useState<OpenAPISpec | null>(() =>
    apiDocumentation.generateOpenAPISpec()
  );

  if (!openApiSpec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="swagger-ui" className="swagger-ui"></div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              const ui = SwaggerUIBundle({
                url: '/api-docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                  // Add any custom request headers here
                  return request;
                },
                responseInterceptor: function(response) {
                  // Handle responses here
                  return response;
                }
              });
            };
          `,
        }}
      />
    </div>
  );
}
