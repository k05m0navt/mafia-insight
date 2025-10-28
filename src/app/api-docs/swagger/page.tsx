'use client';

import React, { useEffect, useState } from 'react';
import { apiDocumentation } from '@/lib/apiDocumentation';
import { OpenAPISpec } from '@/types/api';

export default function SwaggerUIPage() {
  const [openApiSpec, setOpenApiSpec] = useState<OpenAPISpec | null>(null);

  useEffect(() => {
    const spec = apiDocumentation.generateOpenAPISpec();
    setOpenApiSpec(spec);
  }, []);

  if (!openApiSpec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui" className="swagger-ui"></div>
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
