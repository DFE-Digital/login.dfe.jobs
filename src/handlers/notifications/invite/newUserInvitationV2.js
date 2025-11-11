const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  try {
    const notify = getNotifyAdapter(config);

    const commonPersonalisation = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      customMessage: data.overrides?.body ?? "",
      isApprover: !!data.isApprover,
      returnUrl: `${config.notifications.interactionsUrl}/register/${data.invitationId}?id=email`,
      helpUrl: config.notifications.helpUrl,
    };

    let reason = "";
    if (!!data.approverEmail && !!data.orgName) {
      reason = ` by ${data.approverEmail} at ${data.orgName}`;
    } else if (data.orgName) {
      reason = ` for ${data.orgName}`;
    }

    if (config.entra?.useEntraForAccountRegistration) {
      if (!data.selfInvoked) {
        await notify.sendEmail("inviteNewUserEntra", data.email, {
          personalisation: {
            ...commonPersonalisation,
            reason,
            subject: data.overrides?.subject
              ? data.overrides.subject
              : "You’ve been invited to join DfE Sign-in",
          },
        });
      }
    } else {
      if (data.selfInvoked) {
        await notify.sendEmail("selfRegisterNewAccount", data.email, {
          personalisation: {
            ...commonPersonalisation,
            serviceName: data.serviceName,
            code: data.code,
          },
        });
      } else {
        await notify.sendEmail("inviteNewUser", data.email, {
          personalisation: {
            ...commonPersonalisation,
            code: data.code,
            reason,
            subject: data.overrides?.subject
              ? data.overrides.subject.replace(
                  "((VERIFICATION CODE))",
                  data.code,
                )
              : `${data.code} is your DfE Sign-in verification code`,
          },
        });
      }
    }
  } catch (e) {
    logger.error(
      `Failed to process and send the email for type invitation_v2- ${JSON.stringify(e)}`,
    );
    throw new Error(
      `Failed to process and send the email for type invitation_v2 - ${JSON.stringify(e)}`,
    );
  }
};

const getHandler = (config, logger) => ({
  type: "invitation_v2",
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
