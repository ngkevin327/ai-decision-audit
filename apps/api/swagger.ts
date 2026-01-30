import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';

const SPEC_PATH = join(__dirname, 'openapi.yaml');

/**
 * Serves the OpenAPI 3.1 document and a minimal Swagger UI page for local/staging use.
 * Call from `main.ts` after `NestFactory.create`: `registerOpenApi(app)`.
 */
export function registerOpenApi(app: INestApplication): void {
  const spec = readFileSync(SPEC_PATH, 'utf8');
  const http = app.getHttpAdapter().getInstance() as {
    get: (path: string, handler: (req: unknown, res: ResponseLike) => void) => void;
  };

  http.get('/openapi.yaml', (_req, res) => {
    res.type('text/yaml');
    res.send(spec);
  });

  http.get('/docs', (_req, res) => {
    res.type('text/html');
    res.send(swaggerHtml());
  });
}

function swaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>AI Audit Trail API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    </script>
  </body>
</html>`;
}

interface ResponseLike {
  type: (contentType: string) => ResponseLike;
  send: (body: string) => void;
}
