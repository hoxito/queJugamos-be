import { INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { HttpAdapterHost } from "@nestjs/core";
import { ProblemDetailsExceptionFilter } from "./common/http/problem-details.filter";

export const defaultApiPrefix = "api/v1";

export function configureApiApp(app: INestApplication, apiPrefix: string) {
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalFilters(new ProblemDetailsExceptionFilter(app.get(HttpAdapterHost)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("QueJugamos API")
    .setDescription("Catalogo de juegos de mesa buscables por materiales, jugadores y reglas.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, swaggerConfig);
}

export function setupSwagger(app: INestApplication, apiPrefix: string): OpenAPIObject {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    jsonDocumentUrl: `${apiPrefix}/docs-json`
  });

  return document;
}
