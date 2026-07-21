import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SniperAI V2.1 API',
      version: '1.0.0',
      description: 'API documentation for SniperAI V2.1 Sales Analytics SaaS Platform',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/backend/routes/*.ts', './src/backend/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
