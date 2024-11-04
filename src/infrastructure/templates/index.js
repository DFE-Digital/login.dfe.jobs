const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const TemplateFormat = require('./TemplateFormat');

const readdir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);
const readFile = promisify(fs.readFile);
const appRoot = path.resolve(__dirname, 'renderTemplates');

const getFilesAndContents = async (source) => {
  const contents = await readdir(source);
  const files = await Promise.all(contents.filter(async (item) => {
    const itemPath = path.join(source, item);
    return !(await lstat(itemPath)).isDirectory()
  }));

  return await Promise.all(files.map(async (item) => {
    const filePath = path.join(source, item);
    return {
      name: item.substring(0, item.length - 4),
      contents: await readFile(filePath, 'utf8')
    };
  }));
};
const getSubDirectories = async (source) => {
  const contents = await readdir(source);
  const directories = await Promise.all(contents.filter(async (item) => {
    const itemPath = path.join(source, item);
    return (await lstat(itemPath)).isDirectory();
  }));
  return directories;
};

const getTemplateFormats = async (template) => {
  const templatePath = path.join(appRoot, template.toLowerCase());
  const availableFormats = await getSubDirectories(templatePath);

  const templateFormats = await Promise.all(availableFormats.map(async (format) => {
    const formatPath = path.join(templatePath, format);
    const files = await getFilesAndContents(formatPath);

    return new TemplateFormat({
      type: format.toLowerCase(),
      contentTypes: files,
    });
  }));

  return templateFormats;
};

module.exports = {
  getTemplateFormats,
};