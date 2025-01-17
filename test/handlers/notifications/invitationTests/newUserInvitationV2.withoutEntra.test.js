jest.mock("../../../../src/infrastructure/notify");

const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/invite/newUserInvitationV2");

const config = {
  notifications: {
    profileUrl: "https://profile.test/reg",
    helpUrl: "https://help.test",
  },
  entra: {
    useEntraForAccountRegistration: false,
  },
};
const commonJobData = {
  firstName: "User",
  lastName: "One",
  email: "user.one@unit.tests",
  invitationId: "59205751-c229-4924-8acb-61a7d5edfa33",
};

describe("when sending v2 user invitation when Entra feature flag is turned off", () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  describe("invite new user", () => {
    it("should send email with expected template", async () => {
      const handler = getHandler(config);

      await handler.processor(commonJobData);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith(
        "inviteNewUser",
        expect.anything(),
        expect.anything(),
      );
    });

    it("should send email to users email address", async () => {
      const handler = getHandler(config);

      await handler.processor(commonJobData);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.anything(),
        commonJobData.email,
        expect.anything(),
      );
    });

    it("has expected common personalisation attributes", async () => {
      const handler = getHandler(config);

      await handler.processor({
        ...commonJobData,
        isApprover: true,
        code: "ABC123",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          personalisation: expect.objectContaining({
            firstName: "User",
            lastName: "One",
            email: "user.one@unit.tests",
            isApprover: true,
            code: "ABC123",
            returnUrl:
              "https://profile.test/reg/register/59205751-c229-4924-8acb-61a7d5edfa33?id=email",
            helpUrl: "https://help.test",
          }),
        }),
      );
    });

    describe("personalisation.subject", () => {
      it("assumes the default value when no override is provided", async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          code: "ABC123",
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              subject: "ABC123 is your DfE Sign-in verification code",
            }),
          }),
        );
      });

      it("replaces the placeholder with the actual verification code", async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          code: "ABC123",
          overrides: {
            subject:
              "((VERIFICATION CODE)) is your DfE Sign-in verification code",
          },
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              subject: "ABC123 is your DfE Sign-in verification code",
            }),
          }),
        );
      });

      it("uses override when one is provided", async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          overrides: {
            subject: "Custom subject override",
          },
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              subject: "Custom subject override",
            }),
          }),
        );
      });
    });

    describe("personalisation.customMessage", () => {
      it("assumes empty value when no override is provided", async () => {
        const handler = getHandler(config);

        await handler.processor(commonJobData);

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              customMessage: "",
            }),
          }),
        );
      });

      it("uses custom message when one is provided", async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          overrides: {
            body: "Custom message text",
          },
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              customMessage: "Custom message text",
            }),
          }),
        );
      });
    });

    describe("personalisation.reason", () => {
      it('should match format " by {approverEmail} at {orgName}"', async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          approverEmail: "approver@example.com",
          orgName: "Example Organisation",
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              reason: " by approver@example.com at Example Organisation",
            }),
          }),
        );
      });

      it('should match format " for {orgName}"', async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          approverEmail: null,
          orgName: "Example Organisation",
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              reason: " for Example Organisation",
            }),
          }),
        );
      });
    });
  });

  describe("user self registers for an account", () => {
    it("should send email with expected template", async () => {
      const handler = getHandler(config);

      await handler.processor({
        ...commonJobData,
        selfInvoked: true,
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith(
        "selfRegisterNewAccount",
        expect.anything(),
        expect.anything(),
      );
    });

    it("should send email to users email address", async () => {
      const handler = getHandler(config);

      await handler.processor({
        ...commonJobData,
        selfInvoked: true,
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.anything(),
        commonJobData.email,
        expect.anything(),
      );
    });

    it("has expected common personalisation attributes", async () => {
      const handler = getHandler(config);

      await handler.processor({
        ...commonJobData,
        selfInvoked: true,
        serviceName: "Example Service Name",
        code: "ABC123",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          personalisation: expect.objectContaining({
            firstName: "User",
            lastName: "One",
            email: "user.one@unit.tests",
            isApprover: false,
            serviceName: "Example Service Name",
            code: "ABC123",
            returnUrl:
              "https://profile.test/reg/register/59205751-c229-4924-8acb-61a7d5edfa33?id=email",
            helpUrl: "https://help.test",
          }),
        }),
      );
    });

    describe("personalisation.reason", () => {
      it('should match format " by {approverEmail} at {orgName}"', async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          approverEmail: "approver@example.com",
          orgName: "Example Organisation",
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              reason: " by approver@example.com at Example Organisation",
            }),
          }),
        );
      });

      it('should match format " for {orgName}"', async () => {
        const handler = getHandler(config);

        await handler.processor({
          ...commonJobData,
          selfInvoked: false,
          approverEmail: null,
          orgName: "Example Organisation",
        });

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            personalisation: expect.objectContaining({
              reason: " for Example Organisation",
            }),
          }),
        );
      });
    });
  });
});
