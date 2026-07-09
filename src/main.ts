import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApiApp, defaultApiPrefix, setupSwagger } from "./openapi";

const defaultFrontendOrigins = ["http://localhost:8081", "http://127.0.0.1:8081"];

function parseAllowedOrigins(value?: string): string[] {
  if (!value || value.trim() === "*") {
    return defaultFrontendOrigins;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>("API_PREFIX", defaultApiPrefix);
  const allowedOrigins = parseAllowedOrigins(
    config.get<string>("FRONTEND_ORIGINS") ?? config.get<string>("FRONTEND_ORIGIN")
  );

  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  });
  configureApiApp(app, apiPrefix);
  setupSwagger(app, apiPrefix);

  await app.listen(config.get<number>("PORT", 3000), "0.0.0.0");
}

void bootstrap();
