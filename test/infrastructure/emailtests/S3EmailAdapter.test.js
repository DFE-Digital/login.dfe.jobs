const utils = require('../../utils');
const configData = utils.getDefaultConfig();
configData.notifications.email.type = 's3';
configData.notifications.email.params = {
  bucketName: 'unit-test-bucket'
};

jest.mock('aws-sdk');


describe('when sending an email using S3EmailAdapter', () => {

  let putObject;
  let adapter;
  const recipient = 'user.one@unit.test';
  const template = 'unit-tests';
  const data = {
    name: 'user one',
    code: '123abc'
  };

  beforeEach(() => {
    putObject = jest.fn().mockImplementation((object, callback) => {
      callback();
    });

    const aws = require('aws-sdk');
    aws.S3.mockImplementation(() => {
      return {
        putObject: putObject
      }
    });

    const S3EmailAdapter = require('../../../src/infrastructure/email/S3EmailAdapter');
    adapter = new S3EmailAdapter(configData, {
      info: jest.fn(),
      error: jest.fn(),
    });
  });

  test('then it should put an object in bucket', async () => {
    await adapter.send(recipient, template, data);

    expect(putObject.mock.calls.length).toBe(1);
    expect(putObject.mock.calls[0][0].Bucket).toBe('unit-test-bucket');
  });

  test('then it should put an object in a notification/email/[template] folder', async () => {
    await adapter.send(recipient, template, data);

    expect(putObject.mock.calls[0][0].Key).toMatch(/^notifications\/email\/unit-tests\//);
  });

  test('then it should put an object in a notification/email/[template] folder', async () => {
    await adapter.send(recipient, template, data);

    expect(putObject.mock.calls[0][0].Key).toMatch(/^notifications\/email\/unit-tests\//);
  });

  test('then it should put an object with send data as body', async () => {
    await adapter.send(recipient, template, data);

    const expectedFileContent = JSON.stringify({
      recipient,
      template,
      data
    });

    expect(putObject.mock.calls[0][0].Body).toBe(expectedFileContent);
  });

  test('then it should throw error if S3 putObject fails', async () => {
    putObject = jest.fn().mockImplementation((object, callback) => {
      callback(new Error('ENETWORKERROR'));
    });
    const aws = require('aws-sdk');
    aws.S3.mockImplementation(() => {
      return {
        putObject: putObject
      }
    });

    await expect(adapter.send(recipient, template, data)).rejects.toBeDefined();
  });

});
