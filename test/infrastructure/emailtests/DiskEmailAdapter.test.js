jest.mock('path');
jest.mock('fs');

describe('When sending email using DiskAdapter', () => {

  let pathResolve;
  let fsMkdir;
  let fsWriteFile;
  let adapter;
  const recipient = 'user.one@unit.test';
  const template = 'unit-tests';
  const data = {
    name: 'user one',
    code: '123abc'
  };

  beforeEach(() => {
    pathResolve = jest.fn();
    pathResolve.mockImplementation((path) => {
      return `/temp/${path}`;
    });

    const path = require('path');
    path.resolve = pathResolve;
    path.join = jest.fn().mockImplementation((a,b) => {
      return `${a}/${b}`;
    });

    fsMkdir = jest.fn().mockImplementation((path, callback) => {
      callback();
    });

    fsWriteFile = jest.fn().mockImplementation((path, data, callback) => {
      callback();
    });

    const fs = require('fs');
    fs.mkdir = fsMkdir;
    fs.writeFile = fsWriteFile;

    const DiskEmailAdapter = require('../../../src/infrastructure/email/DiskEmailAdapter');
    adapter = new DiskEmailAdapter({}, {
      info: jest.fn(),
      error: jest.fn(),
    });
  });

  test('then it should write param to disk', async () => {
    await adapter.send(recipient, template, data);

    const expectedFileContent = JSON.stringify({
      recipient,
      template,
      data
    });

    expect(fsWriteFile.mock.calls.length).toBe(1);
    expect(fsWriteFile.mock.calls[0][0]).toMatch(/\/temp\/app_data\/email\/unit-tests\/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\.json/)
    expect(fsWriteFile.mock.calls[0][1]).toBe(expectedFileContent);
  });

  test('then it should suppress errors for folder already existing', async () => {
    fsMkdir = jest.fn().mockImplementation((path, callback) => {
      const error = new Error();
      error.code = 'EEXIST';
      callback(error);
    });
    const fs = require('fs');
    fs.mkdir = fsMkdir;
    fs.writeFile = fsWriteFile;

    await expect(adapter.send(recipient, template, data)).resolves.toBeUndefined();
  })

  test('then it should not suppress errors for error other than folder already existing', async () => {
    fsMkdir = jest.fn().mockImplementation((path, callback) => {
      const error = new Error();
      error.code = 'EUNAUTHORISED';
      callback(error);
    });
    const fs = require('fs');
    fs.mkdir = fsMkdir;
    fs.writeFile = fsWriteFile;

    await expect(adapter.send(recipient, template, data)).rejects.toBeDefined();
  });

});
