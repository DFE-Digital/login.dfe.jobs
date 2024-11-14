const { NotifyClient } = require('notifications-node-client');

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
    return await this.client.sendEmail(templateId, emailAddress, options);
  }
}

module.exports = GovNotifyAdapter;
