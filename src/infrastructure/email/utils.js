const { getTemplateFormats } = require('./../templates');

const makeFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth().toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hour}-${minute}-${second}.json`;
};

const getFileContent = (recipient, template, data, subject) =>
  JSON.stringify({
    recipient,
    template,
    data,
    subject
  });

const renderEmailContent = async (template, data) => {
  const templateFormats = await getTemplateFormats(template);
  const emailTemplate = templateFormats.find(item => item.type === 'email');
  if (!emailTemplate) {
    throw new Error('No email format supported');
  }

  return emailTemplate.contentTypes.map(contentType => {
    return {
      type: contentType.name,
      content: emailTemplate.render(contentType, data),
    };
  });
};

const maskEmail = (email) => {
  let maskedEmail = '';

  if (typeof email === 'string' && email.length > 1) {
    const emailSplit = email.split('@');
    const regex = (emailSplit.length > 1 && emailSplit[0].length === 2)
      ? /^(.)(.)(@.*)$/ // Mask the second character if the username only has 2 characters.
      : /^(.)(.*)(.@.*)$/; // Mask all characters between first and last if the username has > 2 characters.

    maskedEmail = email.replace(
      regex,
      (_, firstSection, toBeMasked, remainder) => `${firstSection}${toBeMasked.replace(/./g, '*')}${remainder}`,
    );
  }
  return maskedEmail;
};

module.exports = {
  makeFileName,
  getFileContent,
  renderEmailContent,
  maskEmail,
};
