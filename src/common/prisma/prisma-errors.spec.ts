import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  getPrismaErrorReferenceUrl,
  getPrismaKnownErrorMetadata,
  PrismaKnownErrorCode
} from "./prisma-errors";

describe("Prisma error metadata", () => {
  it("maps unique constraint failures to conflict responses", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      clientVersion: "test",
      code: PrismaKnownErrorCode.UniqueConstraintFailed,
      meta: { target: ["email"] }
    });

    const metadata = getPrismaKnownErrorMetadata(error);

    assert.equal(metadata?.status, HttpStatus.CONFLICT);
    assert.equal(metadata?.detail(error), "A resource with the same email already exists.");
  });

  it("maps record-not-found errors to not found responses", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      clientVersion: "test",
      code: PrismaKnownErrorCode.RecordNotFound
    });

    const metadata = getPrismaKnownErrorMetadata(error);

    assert.equal(metadata?.status, HttpStatus.NOT_FOUND);
    assert.equal(metadata?.detail(error), "The requested resource does not exist.");
  });

  it("builds the Prisma reference URL without scattering URL literals", () => {
    assert.equal(
      getPrismaErrorReferenceUrl(PrismaKnownErrorCode.UniqueConstraintFailed),
      "https://www.prisma.io/docs/orm/reference/error-reference#p2002"
    );
  });
});
