const { getEmailAdapter } = require('../../../infrastructure/email');

const jobType = 'sub_service_request_rejected';

const process = async (config, logger, data) => {
  try {
    const templateName = 'sub-service-request-rejected';
    const isMultipleSubServicesReq = data.requestedSubServices.length > 1;
    const subject = isMultipleSubServicesReq ? 'Sub-service requests rejected' : 'Sub-service request rejected';
    const emailAdapter = getEmailAdapter(config, logger);
    const endUserEmail = data.email;
    const emailData = {
      firstName: data.firstName,
      lastName: data.lastName,
      orgName: data.orgName,
      serviceName: data.serviceName,
      requestedSubServices: data.requestedSubServices,
      reason: data.reason,
      signInUrl: `${config.notifications.servicesUrl}/my-services`,
      isMultipleSubServicesReq,
    };

    await emailAdapter.send(endUserEmail, templateName, emailData, subject);
  } catch (e) {
    logger.error(`Failed to process and send the email for job type ${jobType}  - ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for job type ${jobType} - ${JSON.stringify(e)}`);
  }
};

const getHandler = (config, logger) => ({
  type: jobType,
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
