import { OpenAPI } from '@/lib/schemas'

// CSS styles using lit-css for automatic minification
const css = /*css*/`
html {
  box-sizing: border-box;
  overflow-y: scroll;
}

*, *:before, *:after {
  box-sizing: inherit;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Swagger UI Custom Theme Overrides */
.swagger-ui html {
  box-sizing: border-box
}

.swagger-ui *, .swagger-ui :after, .swagger-ui :before {
  box-sizing: inherit
}

.swagger-ui body {
  margin: 0;
  background: #fafafa
}

.swagger-ui .wrapper {
  width: 100%;
  max-width: 1460px;
  margin: 0 auto;
  padding: 0 20px
}

.swagger-ui .opblock-tag-section {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column
}

.swagger-ui .opblock-tag {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  padding: 10px 20px 10px 10px;
  cursor: pointer;
  -webkit-transition: all .2s;
  transition: all .2s;
  border-bottom: 1px solid rgba(59, 65, 81, .3);
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center
}

.swagger-ui .opblock-tag:hover {
  background: rgba(0, 0, 0, .02)
}

.swagger-ui .opblock-tag {
  font-size: 24px;
  margin: 0 0 5px;
  font-family: Titillium Web, sans-serif;
  color: #3b4151
}

.swagger-ui .opblock.opblock-post {
  border-color: #DADFE1;
  background: rgba(246, 246, 246, .1);
}

.swagger-ui .opblock.opblock-post .opblock-summary-method {
  background: #64908A;
}

.swagger-ui .opblock.opblock-get {
  border-color: #DADFE1;
  background: rgba(246, 246, 246, .1);
}

.swagger-ui .opblock.opblock-get .opblock-summary-method {
  background: #3F778E;
}

.swagger-ui .opblock.opblock-put {
  border-color: #DADFE1;
  background: rgba(246, 246, 246, .1);
}

.swagger-ui .opblock.opblock-put .opblock-summary-method {
  background: #633B63;
}

.swagger-ui .opblock.opblock-delete {
  border-color: #DADFE1;
  background: rgba(246, 246, 246, .1);
}

.swagger-ui .opblock.opblock-delete .opblock-summary-method {
  background: #C1786A;
}

.swagger-ui .topbar {
  padding: 8px 30px;
  background-color: #6F7E88;
}

.swagger-ui .btn.authorize {
  line-height: 1;
  display: inline;
  color: #6F7E88;
  border-color: #6F7E88;
}
`

/**
 * Generate HTML page with Swagger UI using inlined templates
 */
export const generateSwaggerUIPage = (openAPISpec: OpenAPI): string => {
  const specJson = JSON.stringify(openAPISpec, null, 2)
  
  // HTML template with inlined CSS using html literal for minification
  return /*html*/`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>${openAPISpec.info.title} - API Documentation</title>
  <link href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" rel="stylesheet" type="text/css" />
  <style>
    ${css}
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${specJson}

      SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'BaseLayout',
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      })
    }
  </script>
</body>
</html>
  `.trim()
}