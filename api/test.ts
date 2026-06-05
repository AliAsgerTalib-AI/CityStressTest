import type { IncomingMessage, ServerResponse } from 'http';

export default async (req: IncomingMessage & { method?: string }, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message: 'Serverless functions are working!', timestamp: new Date().toISOString() }));
};
