class EmailAdapter {
  constructor() {
    if (new.target === EmailAdapter) {
      throw new TypeError("Cannot construct EmailAdapter instances directly");
    }
  }

  async send() {
    return Promise.resolve({});
  }
}

module.exports = EmailAdapter;
