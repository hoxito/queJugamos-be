import { appendFile } from "node:fs/promises";
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Prisma } from "@prisma/client";

type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: unknown;
};

@Catch()
export class ProblemDetailsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<{ url?: string }>();
    const response = context.getResponse();
    const status = this.statusFor(exception);
    const body = this.toProblemDetails(exception, status, request.url ?? "");

    this.logException(exception, body);
    response.setHeader("Content-Type", "application/problem+json");
    httpAdapter.reply(response, body, status);
  }

  private statusFor(exception: unknown) {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") return HttpStatus.CONFLICT;
      if (exception.code === "P2025") return HttpStatus.NOT_FOUND;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private toProblemDetails(exception: unknown, status: number, instance: string): ProblemDetails {
    const title = this.defaultTitle(status);
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        type: `https://www.prisma.io/docs/orm/reference/error-reference#${exception.code.toLowerCase()}`,
        title,
        status,
        detail: this.prismaDetail(exception),
        instance
      };
    }

    if (!(exception instanceof HttpException)) {
      return {
        type: "about:blank",
        title,
        status,
        detail: "Unexpected server error.",
        instance
      };
    }

    const response = exception.getResponse();
    if (typeof response === "object" && response !== null) {
      const payload = response as { message?: unknown; error?: string };
      return {
        type: "about:blank",
        title: payload.error ?? title,
        status,
        detail: Array.isArray(payload.message) ? "Request validation failed." : String(payload.message ?? title),
        instance,
        ...(Array.isArray(payload.message) ? { errors: payload.message } : {})
      };
    }

    return {
      type: "about:blank",
      title,
      status,
      detail: String(response),
      instance
    };
  }

  private prismaDetail(exception: Prisma.PrismaClientKnownRequestError) {
    if (exception.code === "P2002") {
      const target = Array.isArray(exception.meta?.target) ? exception.meta.target.join(", ") : "unique field";
      return `A resource with the same ${target} already exists.`;
    }
    if (exception.code === "P2025") {
      return "The requested resource does not exist.";
    }
    return "Database request failed.";
  }

  private logException(exception: unknown, body: ProblemDetails) {
    const message = `${body.status} ${body.title}: ${body.detail}`;
    if (body.status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(message);
    }

    const logFilePath = process.env.BACKEND_ERROR_LOG_FILE;
    if (!logFilePath) return;
    const payload = JSON.stringify({
      time: new Date().toISOString(),
      problem: body,
      error: exception instanceof Error ? { name: exception.name, message: exception.message, stack: exception.stack } : exception
    });
    void appendFile(logFilePath, `${payload}\n`, "utf8").catch((error) => {
      this.logger.error(`Could not write backend error log file: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private defaultTitle(status: number) {
    return HttpStatus[status] ? String(HttpStatus[status]).replaceAll("_", " ") : "Error";
  }
}
