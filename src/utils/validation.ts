// ─── Primitive helpers ────────────────────────────────────────────────────────

function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidThaiPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^0\d{8,9}$/.test(digits);
}

function isPositiveAmount(value: string): boolean {
  return parseFloat(value) > 0;
}

// ─── Compound validators ──────────────────────────────────────────────────────

export function validateEmailLogin(email: string, password: string): string | null {
  if (!isRequired(email)) return 'Email is required.';
  if (!isValidEmail(email)) return 'Please enter a valid email address.';
  if (!isRequired(password)) return 'Password is required.';
  return null;
}

export function validateOtpRequest(email: string): string | null {
  if (!isRequired(email)) return 'Email is required.';
  if (!isValidEmail(email)) return 'Please enter a valid email address.';
  return null;
}

export function validateEmailSignup(
  email: string,
  otp: string,
  phone: string,
  name: string,
  password: string
): string | null {
  if (!isRequired(email)) return 'Email is required.';
  if (!isValidEmail(email)) return 'Please enter a valid email address.';
  if (!isRequired(otp)) return 'Verification code is required.';
  if (!isRequired(phone)) return 'Phone number is required.';
  if (!isValidThaiPhone(phone)) return 'Please enter a valid Thai phone number (e.g. 0812345678).';
  if (!isRequired(name)) return 'Full name is required.';
  if (!isRequired(password)) return 'Password is required.';
  return null;
}

export function validateSocialSignup(
  phone: string,
  name: string,
  email: string,
  password: string
): string | null {
  if (!isRequired(phone)) return 'Phone number is required.';
  if (!isValidThaiPhone(phone)) return 'Please enter a valid Thai phone number (e.g. 0812345678).';
  if (!isRequired(name)) return 'Full name is required.';
  if (isRequired(email) && !isValidEmail(email)) return 'Please enter a valid email address.';
  if (!isRequired(password)) return 'Password is required.';
  return null;
}

export function validateProfileUpdate(name: string, email: string): string | null {
  if (!isRequired(name)) return 'Full name is required.';
  if (isRequired(email) && !isValidEmail(email)) return 'Please enter a valid email address.';
  return null;
}

export function validateStaffDeviceAuth(deviceName: string, pin: string): string | null {
  if (!isRequired(deviceName)) return 'Device name is required.';
  if (!isRequired(pin)) return 'PIN is required.';
  return null;
}

export function validatePhoneSearch(phone: string): string | null {
  if (!isRequired(phone)) return 'Phone number is required.';
  if (!isValidThaiPhone(phone)) return 'Please enter a valid Thai phone number (e.g. 0812345678).';
  return null;
}

export function validateStaffRegister(name: string, phone: string, email: string): string | null {
  if (!isRequired(name)) return 'Customer name is required.';
  if (!isRequired(phone)) return 'Phone number is required.';
  if (!isValidThaiPhone(phone)) return 'Please enter a valid Thai phone number (e.g. 0812345678).';
  if (isRequired(email) && !isValidEmail(email)) return 'Please enter a valid email address.';
  return null;
}

export function validateEarnPoints(amount: string): string | null {
  if (!isRequired(amount)) return 'Purchase amount is required.';
  if (!isPositiveAmount(amount)) return 'Purchase amount must be greater than 0.';
  return null;
}

export function validateRedeemPoints(points: string, rewardName: string): string | null {
  if (!isRequired(points)) return 'Points to redeem is required.';
  if (!isPositiveAmount(points)) return 'Points must be greater than 0.';
  if (!isRequired(rewardName)) return 'Reward name is required.';
  return null;
}
