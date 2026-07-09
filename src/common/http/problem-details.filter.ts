import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

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
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<{ url?: string }>();
    const response = context.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.toProblemDetails(exception, status, request.url ?? "");

    response.setHeader("Content-Type", "application/problem+json");
    httpAdapter.reply(response, body, status);
  }

  private toProblemDetails(exception: unknown, status: number, instance: string): ProblemDetails {
    const title = this.defaultTitle(status);
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

  private defaultTitle(status: number) {
    return HttpStatus[status] ? String(HttpStatus[status]).replaceAll("_", " ") : "Error";
  }
}
