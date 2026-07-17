import { HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export const PrismaKnownErrorCode = {
  UniqueConstraintFailed: "P2002",
  RecordNotFound: "P2025"
} as const;

export type PrismaKnownErrorCode = (typeof PrismaKnownErrorCode)[keyof typeof PrismaKnownErrorCode];

export type PrismaKnownErrorMetadata = {
  status: HttpStatus;
  detail: (exception: Prisma.PrismaClientKnownRequestError) => string;
};

const PRISMA_ERROR_REFERENCE_BASE_URL = "https://www.prisma.io/docs/orm/reference/error-reference";

const prismaKnownErrorMetadata: Partial<Record<PrismaKnownErrorCode, PrismaKnownErrorMetadata>> = {
  [PrismaKnownErrorCode.UniqueConstraintFailed]: {
    status: HttpStatus.CONFLICT,
    detail: (exception) => {
      const target = Array.isArray(exception.meta?.target) ? exception.meta.target.join(", ") : "unique field";
      return `A resource with the same ${target} already exists.`;
    }
  },
  [PrismaKnownErrorCode.RecordNotFound]: {
    status: HttpStatus.NOT_FOUND,
    detail: () => "The requested resource does not exist."
  }
};

export function getPrismaKnownErrorMetadata(exception: Prisma.PrismaClientKnownRequestError) {
  return prismaKnownErrorMetadata[exception.code as PrismaKnownErrorCode];
}

export function getPrismaErrorReferenceUrl(code: string) {
  return `${PRISMA_ERROR_REFERENCE_BASE_URL}#${code.toLowerCase()}`;
}
