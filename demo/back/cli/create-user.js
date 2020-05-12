const knex = require('knex');
const signale = require('signale');

const knexConfig = require('../knexfile');
const {
    hashPassword,
    isValidPassword,
    isValidUsername,
} = require('../src/user-account/user');

const pg = knex(knexConfig);

const createUser = async () => {
    signale.info("Création d'un utilisateur");
    const { USERNAME: username, PASSWORD: password } = process.env;
    if (!username) {
        throw new Error(
            "Vous devez déclarer une variable d'environnement USERNAME avec un username valide pour pouvoir créer un utilisateur"
        );
    }
    const usernameValidation = isValidUsername(username);
    if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.error);
    }

    if (!password) {
        throw new Error(
            "Vous devez déclarer une variable d'environnement PASSWORD avec un mot de passe de plus de 10 caractères pour pouvoir créer un utilisateur"
        );
    }
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
    }
    const hashedPassword = await hashPassword(password);
    signale.info(`On va créer un utilisateur ${username}`);
    await pg('user_account').insert({
        username,
        password: hashedPassword,
    });

    return true;
};

createUser()
    .then(() => {
        signale.info('Le nouvel utilisateur a bien été créé.');
        process.exit(0);
    })
    .catch((error) => {
        signale.error(
            "Erreur lors de la création de l'utilisateur : ",
            error.message
        );
        process.exit(1);
    });
