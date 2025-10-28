'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Tabs components not used in this implementation
import {
  BookOpen,
  Code,
  Download,
  Copy,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { apiDocumentation } from '@/lib/apiDocumentation';

export default function APIDocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const endpoints = apiDocumentation.getEndpoints();
  const openApiSpec = apiDocumentation.generateOpenAPISpec();

  const tags = Array.from(new Set(endpoints.flatMap((ep) => ep.tags))).sort();

  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesTag =
      selectedTag === 'all' || endpoint.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const copyToClipboard = async (text: string, endpointId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpointId);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadOpenAPISpec = () => {
    const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mafia-insight-api.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">
            Complete API reference for the Mafia Insight platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadOpenAPISpec}>
            <Download className="h-4 w-4 mr-2" />
            Download OpenAPI Spec
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/api-docs/swagger', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Swagger UI
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search endpoints, descriptions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            API Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {endpoints.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Endpoints
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tags.length}
              </div>
              <div className="text-sm text-muted-foreground">
                API Categories
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">v1.0.0</div>
              <div className="text-sm text-muted-foreground">API Version</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEndpoints.map((endpoint) => (
              <div
                key={`${endpoint.path}-${endpoint.method}`}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${endpoint.method} ${endpoint.path}`,
                        `${endpoint.path}-${endpoint.method}`
                      )
                    }
                  >
                    {copiedEndpoint ===
                    `${endpoint.path}-${endpoint.method}` ? (
                      <span className="text-green-600">Copied!</span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {endpoint.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {endpoint.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Parameters:</h4>
                    <div className="space-y-1">
                      {endpoint.parameters
                        .slice(0, 3)
                        .map((param, paramIndex) => (
                          <div
                            key={paramIndex}
                            className="text-xs text-muted-foreground"
                          >
                            <code className="bg-muted px-1 py-0.5 rounded">
                              {param.name}
                            </code>
                            <span className="ml-2">({param.type})</span>
                            <span className="ml-2">{param.description}</span>
                          </div>
                        ))}
                      {endpoint.parameters.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{endpoint.parameters.length - 3} more parameters
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {endpoint.responses && endpoint.responses.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Responses:</h4>
                    <div className="space-y-1">
                      {endpoint.responses
                        .slice(0, 2)
                        .map((response, responseIndex) => (
                          <div
                            key={responseIndex}
                            className="text-xs text-muted-foreground"
                          >
                            <span className="font-mono">{response.status}</span>
                            <span className="ml-2">{response.description}</span>
                          </div>
                        ))}
                      {endpoint.responses.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{endpoint.responses.length - 2} more responses
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredEndpoints.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No endpoints found matching your search</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Base URL</h3>
              <code className="bg-muted px-3 py-2 rounded block text-sm">
                https://api.mafiainsight.com
              </code>
            </div>
            <div>
              <h3 className="font-medium mb-3">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Most endpoints require no authentication. Admin endpoints
                require an API key in the Authorization header.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3">Rate Limits</h3>
              <p className="text-sm text-muted-foreground">
                1000 requests per hour per IP address for public endpoints.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3">Response Format</h3>
              <p className="text-sm text-muted-foreground">
                All responses are in JSON format with appropriate HTTP status
                codes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
