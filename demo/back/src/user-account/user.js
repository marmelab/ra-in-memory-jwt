const owasp = require('owasp-password-strength-test');
const bcrypt = require('bcrypt');

const config = require('../config');

owasp.config({
    allowPassphrases: true,
    maxLength: 128,
    minLength: 10,
    minPhraseLength: 20,
    minOptionalTestsToPass: 4,
});

/**
 * Method to check if a string is a valid username
 *
 * @param {string} username
 * @returns {object} an object with a boolean key isValid and an optionnal key error to describe error
 */
const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9-]{3,20}$/;

    const isValid = usernameRegex.test(String(username));
    const error =
        'Un username ne doit contenir que des lettres en majuscule ou minuscule et des nombres entiers ou des -, et doit contenir entre 3 et 20 caractères';

    return isValid ? { isValid } : { isValid, error };
};

/**
 * Method to check if a string is a valid password
 *
 * @param {string} password
 * @returns {object} an object with a boolean key isValid and an optionnal key error to describe error
 */
const isValidPassword = (password) => {
    const passwordTest = owasp.test(password);
    let error = null;
    if (passwordTest.requiredTestErrors.length) {
        error = `Le mot de passe n'est pas valide : ${passwordTest.requiredTestErrors.join(
            ', '
        )}`;
    }
    if (!error && !passwordTest.strong) {
        error = `Le mot de passe n'est pas assez complexe : ${passwordTest.optionalTestErrors.join(
            ', '
        )}`;
    }

    return error ? { isValid: false, error } : { isValid: true };
};

/**
 * Method hash a plain text password with bcrypt
 *
 * @param {string} plainTextPassword
 * @returns {Promise<string>} A promise that will return the hashed password ready for secure storage
 */
const hashPassword = (plainTextPassword) =>
    bcrypt.hash(plainTextPassword, config.security.bcryptSaltRounds);

module.exports = {
    hashPassword,
    isValidPassword,
    isValidUsername,
};
