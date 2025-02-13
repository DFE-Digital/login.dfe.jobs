const { NotifyClient } = require("notifications-node-client");
const GovNotifyAdapter = require("../../../src/infrastructure/notify/GovNotifyAdapter");

jest.mock("notifications-node-client");

describe("GovNotifyAdapter", () => {
  const fakeConfig = {
    notifications: {
      govNotify: {
        apiKey: "fake-api-key",
        templates: {
          email: {
            exampleTemplateName: "2f8f1cb5-e323-4fe8-a4d5-33f3abffcaf8",
          },
        },
      },
    },
  };

  const instance = new GovNotifyAdapter(fakeConfig);

  describe("sendEmail()", () => {
    it("throws error when an invalid template name was specified", async () => {
      const act = async () => {
        await instance.sendEmail("invalidTemplateName", "test@example.com", {});
      };
      await expect(act).rejects.toThrow(
        "Invalid notify email template name 'invalidTemplateName'.",
      );
    });

    it("invokes notifications client with the expected parameters", async () => {
      const MockedNotifyClient = jest.mocked(NotifyClient);

      await instance.sendEmail("exampleTemplateName", "test@example.com", {
        personalisation: {
          firstName: "FirstName",
          lastName: "LastName",
        },
      });

      expect(MockedNotifyClient.prototype.sendEmail).toHaveBeenCalledWith(
        "2f8f1cb5-e323-4fe8-a4d5-33f3abffcaf8",
        "test@example.com",
        expect.objectContaining({
          personalisation: expect.objectContaining({
            firstName: "FirstName",
            lastName: "LastName",
          }),
        }),
      );
    });

    it("returns response from notifications client", async () => {
      const MockedNotifyClient = jest.mocked(NotifyClient);
      const fakeResponse = { abc: 123 };
      MockedNotifyClient.prototype.sendEmail.mockResolvedValue(fakeResponse);

      const response = await instance.sendEmail(
        "exampleTemplateName",
        "test@example.com",
        {},
      );

      expect(response).toBe(fakeResponse);
    });

    it("throws when notifications client throws", async () => {
      const MockedNotifyClient = jest.mocked(NotifyClient);
      MockedNotifyClient.prototype.sendEmail.mockImplementation(() => {
        throw new Error("Some internal error");
      });

      const act = async () => {
        await instance.sendEmail("exampleTemplateName", "test@example.com", {});
      };

      expect(act).rejects.toThrow("Some internal error");
    });
  });
});
