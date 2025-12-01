export function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[A-Za-z]{2,}$/;
  return regex.test(email);
}

export function checkPasswordStrength(password) {
  let missing = [];

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) missing.push("lowercase letters");

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) missing.push("uppercase letters");

  // Check for digits
  if (!/\d/.test(password)) missing.push("digits");

  // Check for special characters
  if (!/[@$!%*?&]/.test(password)) missing.push("special characters (@$!%*?&)");

  // Check for length
  if (password.length < 8) missing.push("at least 8 characters");

  // Return combined message
  if (missing.length === 0) {
    return "";
  } else {
    return `Password must contain ${missing.join(", ")}.`;
  }
}

export function validateNameStrength(name) {
  const nameRegex = /^[a-zA-Z\s]*$/;
  return nameRegex.test(name);
}
