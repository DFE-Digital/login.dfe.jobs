const TemplateFormat = require("../../../src/infrastructure/templates/TemplateFormat");

describe("when rendering a template", () => {
  const htmlContentType = { type: "html", contents: "<p><%=token%></p>" };
  const data = { token: "value1" };

  let templateFormat;

  beforeEach(() => {
    templateFormat = new TemplateFormat({
      type: "email",
      contentTypes: [htmlContentType],
    });
  });

  it("then it should return the transformed contents", () => {
    const actual = templateFormat.render(htmlContentType, data);

    expect(actual).toBe("<p>value1</p>");
  });
});
