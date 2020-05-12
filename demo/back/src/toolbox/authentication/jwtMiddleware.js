const jwt = require('jsonwebtoken');

const config = require('../../config');

const jwtMiddleware = async (ctx, next) => {
    const authorization = ctx.request.headers.authorization || '';
    const [prefix, token] = authorization.split(' ');
    if (prefix === 'Bearer') {
        try {
            const decoded = jwt.verify(token, config.security.jwt.secretkey);
            ctx.state.jwt = decoded;
        } catch (error) {
            ctx.state.jwt = null;
        }
    }

    await next();
};

module.exports = jwtMiddleware;
