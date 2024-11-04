const { marked } = require('marked');
const { getEmailAdapter } = require('../../../infrastructure/email');

// Its possible that 'marked' will HTML encode strings. For example, the word [You've] will be
// encoded as [You&#39;ve]. decodeHtmlEntities attempts to resolve this.
const decodeHtmlEntities = (str) => {
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x5C;': '\\',
    '&#96;': '`',
  };

  return str.replace(/&[#A-Za-z0-9]+;/g, (entity) => htmlEntities[entity] || entity);
};

const convertMarkdownToHtml = (content) => marked.parse(content).trim();

const convertMarkdownToText = (content) => {
  const html = convertMarkdownToHtml(content);
  return decodeHtmlEntities(html.replace(/<[^>]+?>/g, ''));
};

const process = async (config, logger, data) => {
  try {
    const { serviceName } = data;
    const source = data.source || undefined;
    let subject = data.selfInvoked
      ? `${data.code} is your DfE Sign-in verification code`
      : 'You’ve been invited to join DfE Sign-in';
    const overrides = { ...data.overrides || {} };

    if (overrides.subject) {
      subject = data.overrides.subject;
    }
    if (overrides.body) {
      overrides.textBody = convertMarkdownToText(overrides.body).trim();
      overrides.htmlBody = convertMarkdownToHtml(overrides.body);
    }

    let template;
    if (config.entra?.enableEntraSignIn === true) {
      template = 'invitation-entra-registration';
    } else {
      template = data.isMigrationInvite ? 'migrationv2' : 'invitation';
      if (data.isChaserEmail) {
        template = 'invitation-chaser-email';
        subject = `You must take action to keep accessing the ${serviceName}`;
      }
      if (data.isServiceActivationChaserEmail) {
        template = 'invitation-serviceactivation-chaser-email';
        subject = `You must take action to keep accessing the ${serviceName}`;
      }
    }
    let bccEmail = 'NoReply.PireanMigration@education.gov.uk';
    if (process && process.env && process.env.INV_BCC_EMAIL) {
      bccEmail = process.env.INV_BCC_EMAIL;
    }
    const email = getEmailAdapter(config, logger);
    await email.send(data.email, template, {
      firstName: data.firstName,
      lastName: data.lastName,
      serviceName,
      selfInvoked: data.selfInvoked,
      code: data.code,
      returnUrl: `${config.notifications.profileUrl}/register/${data.invitationId}?id=email`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
      getmoreinfoUrl: `${config.notifications.helpUrl}/moving-to-DfE-Sign-in`,
      feConnectUrl: `${config.notifications.feConnectUrl}` || null,
      overrides,
      email: data.email,
      approverEmail: data.approverEmail,
      orgName: data.orgName,
      isApprover: data.isApprover,
      source,
    }, subject, bccEmail);
  } catch (e) {
    console.log(`bcc-email invitation_v2 :${JSON.stringify(e)}`);
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
