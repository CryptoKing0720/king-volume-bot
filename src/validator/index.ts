import validator from "validator";
import isEmpty from "is-empty";

interface loginInput {
  email: string;
  password: string;
}

export const validateLoginInput = (data: loginInput) => {
  let errors: { [key: string]: string } = {};
  data.email = !isEmpty(data.email) ? data.email.trim() : "";
  data.password = !isEmpty(data.password) ? data.password.trim() : "";

  if (validator.isEmpty(data.email)) {
    errors.email = "ID field is required";
  }

  if (validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};