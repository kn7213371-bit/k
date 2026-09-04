function validateString(val) {
  return typeof val == "string";
}

function validateNumber(val) {
  return typeof val == "number";
}

function checkStringLength(val, len) {
  return "length" in val && val?.trim()?.length >= len;
}

function checkEmail(val) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(val);
}

function checkRequired(val) {
  return val !== null && val !== undefined;
}

