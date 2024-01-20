const isStrongPassword = (str) => {
  // Check if the string is more than 8 characters
  if (str.length < 8) {
    return false;
  }

  // Check if the string contains at least one number
  if (!/\d/.test(str)) {
    return false;
  }

  // Check if the string contains at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(str)) {
    return false;
  }

  // All criteria met
  return true;
};

module.exports = isStrongPassword;
