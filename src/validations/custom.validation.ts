import Joi from 'joi';

export const password: Joi.CustomValidator<string> = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message({ custom: '{{#label}} must be at least 8 characters' });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message({ custom: '{{#label}} must contain at least 1 letter and 1 number' });
  }
  return value;
};
