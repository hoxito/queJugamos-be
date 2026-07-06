import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>("API_PREFIX", "api/v1");

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: config.get<string>("FRONTEND_ORIGIN", "*"),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("QueJugamos API")
    .setDescription("Catalogo de juegos de mesa buscables por materiales, jugadores y reglas.")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(config.get<number>("PORT", 3000), "0.0.0.0");
}

void bootstrap();
