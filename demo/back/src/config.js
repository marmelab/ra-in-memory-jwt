const convict = require('convict');

const config = convict({
    env: {
        doc: 'Application environment.',
        format: ['production', 'development', 'test'],
        default: '',
        env: 'NODE_ENV',
    },
    db: {
        host: {
            doc: 'Database host name/IP',
            format: '*',
            default: 'postgres',
            env: 'POSTGRES_HOST',
        },
        port: {
            doc: 'Database port',
            format: 'port',
            default: 5432,
            env: 'POSTGRES_PORT',
        },
        database: {
            doc: 'Database name',
            format: String,
            default: '',
            env: 'POSTGRES_DB',
        },
        user: {
            doc: 'Database user',
            format: String,
            default: '',
            env: 'POSTGRES_USER',
        },
        password: {
            doc: 'Database password',
            format: String,
            default: '',
            env: 'POSTGRES_PASSWORD',
        },
    },
    security: {
        bcryptSaltRounds: {
            doc: 'the cost of processing the salt used during password hashing',
            format: 'integer',
            default: 10,
            env: 'PASSWORD_SALT_ROUNDS',
        },
        jwt: {
            secretkey: {
                doc: 'the key used to sign the token with HMAC SHA256',
                format: String,
                default: 'thisIsTheDefaultJWTSecretKey',
                env: 'JWT_SECRET_KET',
            },
            expiration: {
                doc: 'duration in seconds of the token lifetime',
                format: 'integer',
                default: 600, // 10 min - Token life time must be short !
                env: 'JWT_EXPIRATION',
            },
        },
        refreshToken: {
            name: {
                doc: 'the name of the refresh token',
                format: String,
                default: 'jobBoardRefreshToken',
                env: 'REFRESH_TOKEN_NAME',
            },
            expiration: {
                doc: 'The token lifetime duration in seconds',
                format: 'integer',
                default: 3600, // 1 hour
                env: 'REFRESH_TOKEN_NAME',
            },
            rememberExpiration: {
                doc:
                    'The token lifetime if user ask to remember her/him in seconds',
                format: 'integer',
                default: 1296000, // 15 days
                env: 'REFRESH_TOKEN_NAME',
            },
        },
        signedCookie: {
            key1: {
                doc: 'First key used for signed cookies',
                format: String,
                default: 'The Torture Never Stops',
                env: 'SIGNED_COOKIE_KEY_1',
            },
            key2: {
                doc: 'Second key used for signed cookies',
                format: String,
                default: 'Watermelon in Easter Hay',
                env: 'SIGNED_COOKIE_KEY_2',
            },
        },
    },
});

config.validate({ allowed: 'strict' });

module.exports = config.getProperties();
