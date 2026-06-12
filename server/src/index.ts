// Server entry point: validates configuration and starts the HTTP server.
import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`AI Scribe API listening on http://localhost:${config.PORT}`);
});
