const EmailAdapter = require("./EmailAdapter");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const emailUtils = require("./utils");

const makeDirectory = async (dirPath) => {
  const mkdir = promisify(fs.mkdir);
  try {
    await mkdir(dirPath);
  } catch (e) {
    if (e.code !== "EEXIST") {
      throw e;
    }
  }
};
const ensureDirectory = async (template) => {
  let dir = path.resolve("app_data");
  await makeDirectory(dir);

  dir = path.join(dir, "email");
  await makeDirectory(dir);

  dir = path.join(dir, template);
  await makeDirectory(dir);

  return dir;
};
const writeData = async (destination, content) => {
  const writeFile = promisify(fs.writeFile);
  await writeFile(destination, content);
};
const writeRenderedDataContentType = async (
  name,
  destination,
  contentTypes,
) => {
  const type = contentTypes.find(
    (item) => item.type.toLowerCase() === name.toLowerCase(),
  );
  if (!type) {
    return;
  }

  await writeData(destination, type.content);
};

class DiskEmailAdapter extends EmailAdapter {
  constructor(config, logger) {
    super();

    this.logger = logger;

    this.renderContent = false;
    if (
      config &&
      config.notifications &&
      config.notifications.email &&
      config.notifications.email.params
    ) {
      this.renderContent = config.notifications.email.params.renderContent;
    } else {
      this.logger.info("DiskEmailAdapter- render content is missing");
    }
  }

  async send(recipient, template, data, subject) {
    try {
      const dirPath = await ensureDirectory(template);

      const dataFileName = emailUtils.makeFileName();
      const content = emailUtils.getFileContent(
        recipient,
        template,
        data,
        subject,
      );
      await writeData(path.join(dirPath, dataFileName), content);

      if (this.renderContent) {
        const renderedContent = await emailUtils.renderEmailContent(
          template,
          data,
        );
        const renderedFileNameWithoutExt = dataFileName.substr(
          0,
          dataFileName.length - 5,
        );
        await writeRenderedDataContentType(
          "html",
          path.join(dirPath, `${renderedFileNameWithoutExt}.html`),
          renderedContent,
        );
        await writeRenderedDataContentType(
          "text",
          path.join(dirPath, `${renderedFileNameWithoutExt}.txt`),
          renderedContent,
        );
      }
    } catch (e) {
      this.logger.error(
        `Fail to render email content into disk from disk email adapter - ${JSON.stringify(e)}`,
      );
      throw new Error(
        `Fail to render email content into disk from disk email adapter - ${JSON.stringify(e)}`,
      );
    }
  }
}

module.exports = DiskEmailAdapter;
