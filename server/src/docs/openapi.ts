import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'walkMe API',
      version: '1.0.0',
      description: 'First testable version of the walkMe server. All routes are versioned under /api/v1.',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../modules/**/routes.{ts,js}')],
});
