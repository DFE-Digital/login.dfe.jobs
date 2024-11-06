const { maskEmail } = require('../../../src/infrastructure/email/utils');

describe('When attempting to mask an email in a non-audit log', () => {
  it('correctly masks characters except the first and last in the email username, if it is an email-like string', () => {
    expect(maskEmail('testing@education.gov.uk')).toBe('t*****g@education.gov.uk');
    expect(maskEmail('testing123@education.gov.uk')).toBe('t********3@education.gov.uk');
    expect(maskEmail('testing.email123@education.gov.uk')).toBe('t**************3@education.gov.uk');
    expect(maskEmail('testing.email_123@education.gov.uk')).toBe('t***************3@education.gov.uk');
    expect(maskEmail('testing.email+123@education.gov.uk')).toBe('t***************3@education.gov.uk');
  });

  it('correctly masks the second character in the email username, if it is an email-like string with a 2 character username', () => {
    expect(maskEmail('te@education.gov.uk')).toBe('t*@education.gov.uk');
    expect(maskEmail('1e@education.gov.uk')).toBe('1*@education.gov.uk');
  });

  it('does not attempt to mask characters if the passed argument does not contain an @ symbol', () => {
    expect(maskEmail('testing testing 123')).toBe('testing testing 123');
    expect(maskEmail('testing!testing$123')).toBe('testing!testing$123');
    expect(maskEmail('testing(#testing~) 123')).toBe('testing(#testing~) 123');
  });

  it('returns an empty string if the passed argument is not a string', () => {
    expect(maskEmail(undefined)).toBe('');
    expect(maskEmail(null)).toBe('');
    expect(maskEmail(1234)).toBe('');
    expect(maskEmail(false)).toBe('');
  });

  it('returns an empty string if the passed argument is an empty string', () => {
    expect(maskEmail('')).toBe('');
  });
});
