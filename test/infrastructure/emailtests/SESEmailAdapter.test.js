jest.mock("../../../src/infrastructure/email/utils");
jest.mock("aws-sdk");

const aws = require("aws-sdk");
const emailUtils = require("../../../src/infrastructure/email/utils");
const SESEmailAdapter = require("../../../src/infrastructure/email/SESEmailAdapter");

describe("When sending an email using SES", () => {
  const sender = "noreply@secure.access";
  const recipient = "user.one@unit.tests";
  const singleBccRecipient = "firstUser@unit.tests";
  const multipleBccRecipients = [
    "firstUser@unit.tests",
    "secondUser@unit.tests",
  ];
  const template = "some-email";
  const data = {
    item1: "something",
  };
  const subject = "some email to user";

  let awsSESSendEmail;
  let emailUtilsRenderEmailContent;
  let adapter;

  beforeEach(() => {
    awsSESSendEmail = jest.fn().mockImplementation((_, done) => {
      done();
    });

    aws.SES.mockImplementation(() => ({
      sendEmail: awsSESSendEmail,
    }));

    emailUtilsRenderEmailContent = jest.fn().mockReturnValue([
      { type: "html", content: "some html" },
      { type: "text", content: "some plain text" },
    ]);
    emailUtils.renderEmailContent = emailUtilsRenderEmailContent;

    adapter = new SESEmailAdapter(
      {
        notifications: {
          email: {
            params: {
              accessKey: "accessKey",
              accessSecret: "accessKey",
              region: "region",
              sender,
            },
          },
        },
      },
      {
        info: jest.fn(),
        error: jest.fn(),
      },
    );
  });

  it("then it should render the content using the template", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(emailUtilsRenderEmailContent.mock.calls.length).toBe(1);
    expect(emailUtilsRenderEmailContent.mock.calls[0][0]).toBe(template);
    expect(emailUtilsRenderEmailContent.mock.calls[0][1]).toBe(data);
  });

  it("then it should send an email from the configured sender", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls[0][0].Source).toBe(sender);
  });

  it("then it should send an email to the recipient", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.ToAddresses.length,
    ).toBe(1);
    expect(awsSESSendEmail.mock.calls[0][0].Destination.ToAddresses[0]).toBe(
      recipient,
    );
  });

  it("then it should send without any supplied BCC addresses, stating the BCC addresses are an empty array", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.BccAddresses.length,
    ).toBe(0);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.BccAddresses,
    ).toStrictEqual([]);
  });

  it("then it should send to a single string BCC address, converting it to an array", async () => {
    await adapter.send(recipient, template, data, subject, singleBccRecipient);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.BccAddresses.length,
    ).toBe(1);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.BccAddresses,
    ).toStrictEqual([singleBccRecipient]);
  });

  it("then it should send to multiple BCC addresses in an array, without creating a 2d array", async () => {
    await adapter.send(
      recipient,
      template,
      data,
      subject,
      multipleBccRecipients,
    );

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.BccAddresses.length,
    ).toBe(multipleBccRecipients.length);
    expect(
      awsSESSendEmail.mock.calls[0][0].Destination.BccAddresses,
    ).toStrictEqual(multipleBccRecipients);
  });

  it("then it should send an email with the subject", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(awsSESSendEmail.mock.calls[0][0].Message.Subject.Data).toBe(subject);
  });

  it("then it should send an email with html content", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(awsSESSendEmail.mock.calls[0][0].Message.Body.Html.Data).toBe(
      "some html",
    );
  });

  it("then it should send an email with plain text content", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(awsSESSendEmail.mock.calls[0][0].Message.Body.Text.Data).toBe(
      "some plain text",
    );
  });

  it("then it should send an email with plain text content", async () => {
    await adapter.send(recipient, template, data, subject);

    expect(awsSESSendEmail.mock.calls.length).toBe(1);
    expect(awsSESSendEmail.mock.calls[0][0].Message.Body.Text.Data).toBe(
      "some plain text",
    );
  });

  it("then it should reject with an error if sending fails", async () => {
    awsSESSendEmail.mockImplementation((_, done) => {
      done("test error");
    });

    await expect(async () => {
      await adapter.send(recipient, template, data, subject);
    }).rejects.toBe("test error");
  });
});
