import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { UsersService } from "./users.service";
import { UserRole } from "./domain/user-role.enum";

describe("UsersService.create", () => {
  it("idempotently upserts users by email", async () => {
    let upsertArgs: unknown;
    const prisma = {
      user: {
        upsert: (args: unknown) => {
          upsertArgs = args;
          return Promise.resolve({ email: "player@example.com" });
        }
      }
    };
    const service = new UsersService(prisma as never);

    await service.create({ email: "player@example.com", displayName: "Player", role: UserRole.Admin });

    assert.deepEqual(upsertArgs, {
      where: { email: "player@example.com" },
      update: { displayName: "Player", role: UserRole.Admin },
      create: { email: "player@example.com", displayName: "Player", role: UserRole.Admin }
    });
  });
});
