const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  try {
    const notify = getNotifyAdapter(config);

    const commonPersonalisation = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      customMessage: data.overrides?.body ?? '',
      isApprover: !!data.isApprover,
      helpUrl: config.notifications.helpUrl,
    };

    let reason = '';
    if (!!data.approverEmail && !!data.orgName) {
      reason = ` by ${data.approverEmail} at ${data.orgName}`;
    }
    else if (!!data.orgName) {
      reason = ` for ${data.orgName}`;
    }

    if (!!config.entra?.enableEntraSignIn) {
      const returnUrl = `${config.notifications.profileUrl}/register`;
      if (!data.selfInvoked) {
        await notify.sendEmail('inviteNewUserEntra', data.email, {
          personalisation: {
            ...commonPersonalisation,
            returnUrl,
            reason,
            subject: !!data.overrides?.subject
              ? data.overrides.subject
              : 'You’ve been invited to join DfE Sign-in',
          },
        });
      }
    }
    else {
      const returnUrl = `${config.notifications.profileUrl}/register/${data.invitationId}?id=email`;
      if (!!data.selfInvoked) {
        await notify.sendEmail('selfRegisterNewAccount', data.email, {
          personalisation: {
            ...commonPersonalisation,
            returnUrl,
            serviceName: data.serviceName,
            code: data.code,
          },
        });
      }
      else {
        await notify.sendEmail('inviteNewUser', data.email, {
          personalisation: {
            ...commonPersonalisation,
            returnUrl,
            code: data.code,
            reason,
            subject: !!data.overrides?.subject
              ? data.overrides.subject
              : 'You’ve been invited to join DfE Sign-in',
          },
        });
      }
    }
  } catch (e) {
    logger.error(`Failed to process and send the email for type invitation_v2- ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for type invitation_v2 - ${JSON.stringify(e)}`);
  }
};

const getHandler = (config, logger) => ({
  type: 'invitation_v2',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
