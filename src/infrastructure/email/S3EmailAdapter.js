const EmailAdapter = require("./EmailAdapter");
const aws = require("aws-sdk");
const emailUtils = require("./utils");

class S3EmailAdapter extends EmailAdapter {
  constructor(config, logger) {
    super();

    this.bucketName = config.notifications.email.params.bucketName;
    this.logger = logger;

    if (
      config.notifications.email.params &&
      config.notifications.email.params.accessKey &&
      config.notifications.email.params.accessSecret
    ) {
      aws.config.update({
        accessKeyId: config.notifications.email.params.accessKey,
        secretAccessKey: config.notifications.email.params.accessSecret,
      });
    } else {
      this.logger.info(
        "S3EmailAdapter- accessKeyId or secretAccessKey are missing",
      );
    }
  }

  async send(recipient, template, data, subject) {
    try {
      return new Promise((resolve, reject) => {
        const fileName = emailUtils.makeFileName();
        const content = emailUtils.getFileContent(
          recipient,
          template,
          data,
          subject,
        );
        const object = {
          Bucket: this.bucketName,
          Key: `notifications/email/${template}/${fileName}`,
          Body: content,
        };

        const s3 = new aws.S3();
        s3.putObject(object, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (e) {
      this.logger.error(
        `Error sending S3 email- outer catch block - ${JSON.stringify(e)}`,
      );
      return Promise.reject(
        `Error sending S3 email- outer catch block - ${JSON.stringify(e)}`,
      );
    }
  }
}

module.exports = S3EmailAdapter;
