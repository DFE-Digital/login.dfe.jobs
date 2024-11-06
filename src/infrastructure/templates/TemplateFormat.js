const ejs = require('ejs');

class TemplateFormat {
  constructor({ type, contentTypes }) {
    this.type = type;
    this.contentTypes = contentTypes;
  }

  render(contentType, data) {
    return ejs.render(contentType.contents, data);
  };
}

module.exports = TemplateFormat;