const Router = require('koa-router');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { getOneByUsername, getOne } = require('../../user-account/repository');
const {
    createOneForUser: createRefreshToken,
    deleteOne: deleteRefreshToken,
    getOneByUserId: getExistingRefreshToken,
    getOne: getExistingRefreshTokenById,
} = require('./refreshTokenRepository');
const config = require('../../config');

const router = new Router();

router.post('/authenticate', async (ctx) => {
    const { username, password, rememberMe = false } = ctx.request.body;

    const user = await getOneByUsername(username);

    if (!user || user.error) {
        ctx.throw(401, user ? user.error : 'Invalid credentials.');
        return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
        ctx.throw(401, 'Invalid credentials.');
        return;
    }

    // We check that there is not already a refresh token for this user.
    // If this is the case - which can happen when the same user logs on to two tabs or two browsers
    // we need to keep it to keep this refresh-token valid.
    // else, we'll create a new one.
    let refreshTokenId;
    const existingRefreshToken = await getExistingRefreshToken(user.id);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (
        existingRefreshToken &&
        !existingRefreshToken.error &&
        existingRefreshToken.validityTimestamp > currentTimestamp
    ) {
        refreshTokenId = existingRefreshToken.id;
    } else {
        // If there was already a refresh token for the user
        // but that this one was no longer valid
        // we erase it so we can create a new one.
        if (existingRefreshToken && existingRefreshToken.id) {
            await deleteRefreshToken(existingRefreshToken.id);
        }
        const newTokenData = {
            userId: user.id,
            rememberMe,
            validity_timestamp: rememberMe
                ? currentTimestamp +
                  config.security.refreshToken.rememberExpiration
                : currentTimestamp + config.security.refreshToken.expiration,
        };
        const newRefreshToken = await createRefreshToken(newTokenData);

        if (!newRefreshToken || newRefreshToken.error) {
            ctx.throw(
                newRefreshToken.error
                    ? newRefreshToken.error.message
                    : 'Error during refresh token creation'
            );
            return;
        }

        refreshTokenId = newRefreshToken[0].id;
    }

    const delay = rememberMe
        ? config.security.refreshToken.rememberExpiration * 1000
        : config.security.refreshToken.expiration * 1000;
    const tokenExpires = new Date(new Date().getTime() + delay);
    const cookieOptions = {
        expires: tokenExpires,
        httpOnly: true,
        overwrite: true,
        secure: false,
        signed: true,
    };
    ctx.cookies.set(
        config.security.refreshToken.name,
        refreshTokenId,
        cookieOptions
    );

    const token = jwt.sign({ username }, config.security.jwt.secretkey, {
        expiresIn: config.security.jwt.expiration,
    });

    ctx.body = {
        token: token,
        tokenExpiry: config.security.jwt.expiration,
        username: user.username,
    };
});

router.get('/refresh-token', async (ctx) => {
    const refreshTokenId = ctx.cookies.get(config.security.refreshToken.name, {
        signed: true,
    });

    const dbToken = await getExistingRefreshTokenById(refreshTokenId);

    if (!dbToken.id || dbToken.error) {
        ctx.throw(400, `The refresh token is not valid.`);
        return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (dbToken.validityTimestamp <= currentTimestamp) {
        await deleteRefreshToken(refreshTokenId);

        ctx.throw(400, `The refresh token is expired.`);
        return;
    }

    const user = await getOne(dbToken.userId);

    if (!user || user.error) {
        ctx.throw(401, user.error || 'Invalid credentials.');
        return;
    }

    const token = jwt.sign(
        { username: user.username },
        config.security.jwt.secretkey,
        {
            expiresIn: config.security.jwt.expiration,
        }
    );

    ctx.body = {
        token: token,
        tokenExpiry: config.security.jwt.expiration,
        username: user.username,
    };
});

router.get('/logout', async (ctx) => {
    const refreshTokenId = ctx.cookies.get(config.security.refreshToken.name, {
        signed: true,
    });

    await deleteRefreshToken(refreshTokenId);

    const cookieOptions = {
        expires: new Date(new Date().getTime() - 1),
    };
    ctx.cookies.set(config.security.refreshToken.name, null, cookieOptions);

    ctx.body = { message: 'logout' };
});

module.exports = router;
