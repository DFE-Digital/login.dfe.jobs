/* eslint-disable no-prototype-builtins */
const { NotifyClient } = require("notifications-node-client");
const sanitizeHtml = require("sanitize-html");
class GovNotifyAdapter {
  constructor(config) {
    const { govNotify } = config.notifications;

    this.client = new NotifyClient(govNotify.apiKey);
    this.templateMappings = govNotify.templates;
  }

  async sendEmail(templateName, emailAddress, options) {
    const templateId = this.templateMappings.email[templateName];
    if (!templateId) {
      throw new Error(`Invalid notify email template name '${templateName}'.`);
    }

    const sanitisedOptions = {};

    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        sanitisedOptions[key] = sanitizeHtml(options[key]);
      }
    }

    return await this.client.sendEmail(
      templateId,
      emailAddress,
      sanitisedOptions,
    );
  }
}

module.exports = GovNotifyAdapter;
