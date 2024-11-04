const { take, tail } = require('lodash');
const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);

  let moreData = true;

  let bccRecipients;
  let emails = data.recipients;
  let skip =0;

  while(moreData) {
    bccRecipients =  take(emails.slice(skip),49);
    if(bccRecipients && bccRecipients.length > 0 ) {
      await email.send(bccRecipients[0], 'approver-access-request-email', {
        orgName: data.orgName,
        name: data.userName,
        email: data.userEmail,
        returnUrl:`${config.notifications.servicesUrl}/access-requests/organisation-requests/${data.requestId}`,
        helpUrl: `${config.notifications.helpUrl}/contact`,
      }, `DfE Sign-in access request for ${data.orgName}`, tail(bccRecipients));
      skip = skip + 49;
    } else {
      moreData = false;
    }
  }

};

const getHandler = (config, logger) => {
  return {
    type: 'approveraccessrequest_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
