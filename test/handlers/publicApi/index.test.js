const { register } = require("../../../src/handlers/publicApi");

const config = {};
const logger = {};

describe("when registering jobs", () => {
  it("then it should return invitation handlers", () => {
    const handlers = register(config, logger);

    expect(
      handlers.find((h) => h.type === "publicinvitationrequest_v1"),
    ).toBeDefined();
    expect(
      handlers.find((h) => h.type === "publicinvitationcomplete_v1"),
    ).toBeDefined();
    expect(
      handlers.find((h) => h.type === "publicinvitationnotifyrelyingparty_v1"),
    ).toBeDefined();
  });
});
