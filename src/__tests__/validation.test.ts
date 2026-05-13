import {
  validateEmailLogin,
  validateEmailSignup,
  validateEarnPoints,
  validateOtpRequest,
  validatePhoneSearch,
  validateProfileUpdate,
  validateRedeemPoints,
  validateSocialSignup,
  validateStaffDeviceAuth,
  validateStaffRegister,
} from '../utils/validation';

// ─── validateEmailLogin ───────────────────────────────────────────────────────

describe('validateEmailLogin', () => {
  it('returns null for valid email and password', () => {
    expect(validateEmailLogin('user@example.com', 'secret')).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateEmailLogin('', 'secret')).toBe('Email is required.');
  });

  it('rejects whitespace-only email', () => {
    expect(validateEmailLogin('   ', 'secret')).toBe('Email is required.');
  });

  it('rejects malformed email', () => {
    expect(validateEmailLogin('notanemail', 'secret')).toBe('Please enter a valid email address.');
  });

  it('rejects email missing domain', () => {
    expect(validateEmailLogin('user@', 'secret')).toBe('Please enter a valid email address.');
  });

  it('rejects empty password', () => {
    expect(validateEmailLogin('user@example.com', '')).toBe('Password is required.');
  });

  it('rejects whitespace-only password', () => {
    expect(validateEmailLogin('user@example.com', '   ')).toBe('Password is required.');
  });
});

// ─── validateOtpRequest ──────────────────────────────────────────────────────

describe('validateOtpRequest', () => {
  it('returns null for valid email', () => {
    expect(validateOtpRequest('user@example.com')).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateOtpRequest('')).toBe('Email is required.');
  });

  it('rejects invalid email format', () => {
    expect(validateOtpRequest('bademail')).toBe('Please enter a valid email address.');
  });
});

// ─── validateEmailSignup ─────────────────────────────────────────────────────

describe('validateEmailSignup', () => {
  const valid = ['user@example.com', '123456', '0812345678', 'Jane Doe', 'password1'];

  it('returns null when all fields are valid', () => {
    expect(validateEmailSignup(...(valid as [string, string, string, string, string]))).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateEmailSignup('', ...valid.slice(1) as [string, string, string, string])).not.toBeNull();
  });

  it('rejects invalid email format', () => {
    expect(validateEmailSignup('bad', ...valid.slice(1) as [string, string, string, string])).toBe('Please enter a valid email address.');
  });

  it('rejects empty OTP', () => {
    expect(validateEmailSignup(valid[0], '', valid[2], valid[3], valid[4])).toBe('Verification code is required.');
  });

  it('rejects empty phone', () => {
    expect(validateEmailSignup(valid[0], valid[1], '', valid[3], valid[4])).toBe('Phone number is required.');
  });

  it('rejects invalid Thai phone', () => {
    expect(validateEmailSignup(valid[0], valid[1], '1234567', valid[3], valid[4])).toBe('Please enter a valid Thai phone number (e.g. 0812345678).');
  });

  it('rejects empty name', () => {
    expect(validateEmailSignup(valid[0], valid[1], valid[2], '', valid[4])).toBe('Full name is required.');
  });

  it('rejects empty password', () => {
    expect(validateEmailSignup(valid[0], valid[1], valid[2], valid[3], '')).toBe('Password is required.');
  });
});

// ─── validateSocialSignup ────────────────────────────────────────────────────

describe('validateSocialSignup', () => {
  it('returns null for valid inputs with email', () => {
    expect(validateSocialSignup('0812345678', 'Jane', 'jane@example.com', 'pass1')).toBeNull();
  });

  it('returns null when email is omitted (optional for social signup)', () => {
    expect(validateSocialSignup('0812345678', 'Jane', '', 'pass1')).toBeNull();
  });

  it('rejects empty phone', () => {
    expect(validateSocialSignup('', 'Jane', '', 'pass1')).toBe('Phone number is required.');
  });

  it('rejects invalid phone format', () => {
    expect(validateSocialSignup('555', 'Jane', '', 'pass1')).toBe('Please enter a valid Thai phone number (e.g. 0812345678).');
  });

  it('rejects empty name', () => {
    expect(validateSocialSignup('0812345678', '', '', 'pass1')).toBe('Full name is required.');
  });

  it('rejects malformed email when one is provided', () => {
    expect(validateSocialSignup('0812345678', 'Jane', 'notvalid', 'pass1')).toBe('Please enter a valid email address.');
  });

  it('rejects empty password', () => {
    expect(validateSocialSignup('0812345678', 'Jane', '', '')).toBe('Password is required.');
  });
});

// ─── validateProfileUpdate ───────────────────────────────────────────────────

describe('validateProfileUpdate', () => {
  it('returns null for valid name and email', () => {
    expect(validateProfileUpdate('Jane Doe', 'jane@example.com')).toBeNull();
  });

  it('returns null when email is blank (optional)', () => {
    expect(validateProfileUpdate('Jane Doe', '')).toBeNull();
  });

  it('rejects empty name', () => {
    expect(validateProfileUpdate('', 'jane@example.com')).toBe('Full name is required.');
  });

  it('rejects malformed email when non-empty', () => {
    expect(validateProfileUpdate('Jane', 'notvalid')).toBe('Please enter a valid email address.');
  });
});

// ─── validateStaffDeviceAuth ─────────────────────────────────────────────────

describe('validateStaffDeviceAuth', () => {
  it('returns null for valid device name and PIN', () => {
    expect(validateStaffDeviceAuth('Counter Tablet', '1234')).toBeNull();
  });

  it('rejects empty device name', () => {
    expect(validateStaffDeviceAuth('', '1234')).toBe('Device name is required.');
  });

  it('rejects whitespace-only device name', () => {
    expect(validateStaffDeviceAuth('   ', '1234')).toBe('Device name is required.');
  });

  it('rejects empty PIN', () => {
    expect(validateStaffDeviceAuth('Counter Tablet', '')).toBe('PIN is required.');
  });
});

// ─── validatePhoneSearch ─────────────────────────────────────────────────────

describe('validatePhoneSearch', () => {
  it('returns null for valid 10-digit Thai phone', () => {
    expect(validatePhoneSearch('0812345678')).toBeNull();
  });

  it('returns null for valid 9-digit Thai phone', () => {
    expect(validatePhoneSearch('021234567')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(validatePhoneSearch('')).toBe('Phone number is required.');
  });

  it('rejects phone not starting with 0', () => {
    expect(validatePhoneSearch('1812345678')).toBe('Please enter a valid Thai phone number (e.g. 0812345678).');
  });

  it('rejects phone that is too short', () => {
    expect(validatePhoneSearch('08123')).toBe('Please enter a valid Thai phone number (e.g. 0812345678).');
  });

  it('strips non-digit characters before validating', () => {
    expect(validatePhoneSearch('081-234-5678')).toBeNull();
  });
});

// ─── validateStaffRegister ───────────────────────────────────────────────────

describe('validateStaffRegister', () => {
  it('returns null for valid name, phone, and email', () => {
    expect(validateStaffRegister('John Smith', '0812345678', 'john@example.com')).toBeNull();
  });

  it('returns null when email is blank (optional)', () => {
    expect(validateStaffRegister('John Smith', '0812345678', '')).toBeNull();
  });

  it('rejects empty name', () => {
    expect(validateStaffRegister('', '0812345678', '')).toBe('Customer name is required.');
  });

  it('rejects empty phone', () => {
    expect(validateStaffRegister('John', '', '')).toBe('Phone number is required.');
  });

  it('rejects invalid phone format', () => {
    expect(validateStaffRegister('John', '999', '')).toBe('Please enter a valid Thai phone number (e.g. 0812345678).');
  });

  it('rejects malformed email when provided', () => {
    expect(validateStaffRegister('John', '0812345678', 'bad')).toBe('Please enter a valid email address.');
  });
});

// ─── validateEarnPoints ──────────────────────────────────────────────────────

describe('validateEarnPoints', () => {
  it('returns null for a positive amount string', () => {
    expect(validateEarnPoints('500')).toBeNull();
  });

  it('returns null for a decimal amount', () => {
    expect(validateEarnPoints('99.5')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateEarnPoints('')).toBe('Purchase amount is required.');
  });

  it('rejects zero', () => {
    expect(validateEarnPoints('0')).toBe('Purchase amount must be greater than 0.');
  });

  it('rejects negative amount', () => {
    expect(validateEarnPoints('-100')).toBe('Purchase amount must be greater than 0.');
  });

  it('rejects non-numeric string', () => {
    expect(validateEarnPoints('abc')).toBe('Purchase amount must be greater than 0.');
  });
});

// ─── validateRedeemPoints ────────────────────────────────────────────────────

describe('validateRedeemPoints', () => {
  it('returns null for valid points and reward name', () => {
    expect(validateRedeemPoints('50', 'Discount Coupon')).toBeNull();
  });

  it('rejects empty points', () => {
    expect(validateRedeemPoints('', 'Coupon')).toBe('Points to redeem is required.');
  });

  it('rejects zero points', () => {
    expect(validateRedeemPoints('0', 'Coupon')).toBe('Points must be greater than 0.');
  });

  it('rejects negative points', () => {
    expect(validateRedeemPoints('-5', 'Coupon')).toBe('Points must be greater than 0.');
  });

  it('rejects empty reward name', () => {
    expect(validateRedeemPoints('50', '')).toBe('Reward name is required.');
  });

  it('rejects whitespace-only reward name', () => {
    expect(validateRedeemPoints('50', '   ')).toBe('Reward name is required.');
  });
});
