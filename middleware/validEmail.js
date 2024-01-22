function isValidEmail(email) {
  // Regular expression for a valid email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Test the email address against the regex
  return emailRegex.test(email);
}
