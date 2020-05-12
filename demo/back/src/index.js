const Koa = require('koa');
const cors = require('koa2-cors');
const Router = require('koa-router');
const error = require('koa-json-error');
const bodyParser = require('koa-bodyparser');

const dbMiddleware = require('./toolbox/middleware/db');
const jwtMiddleware = require('./toolbox/authentication/jwtMiddleware');
const authenticationRouter = require('./toolbox/authentication/router');
const config = require('./config');
const userRouter = require('./user-account/router');

const app = new Koa();

// Add keys for signed cookies
app.keys = [
    config.security.signedCookie.key1,
    config.security.signedCookie.key2,
];

// See https://github.com/zadzbw/koa2-cors for configuration
app.use(
    cors({
        origin: 'http://localhost:8002',
        allowHeaders: ['Origin, Content-Type, Accept, Authorization'],
        exposeHeaders: ['X-Total-Count', 'Link'],
        credentials: true,
    })
);

const router = new Router();
const env = process.env.NODE_ENV;

/**
 * This method is used to format message return by the global error middleware
 *
 * @param {object} error - the catched error
 * @return {object} the content of the json error return
 */
const formatError = (error) => {
    return {
        status: error.status,
        message: error.message,
    };
};

app.use(jwtMiddleware);
app.use(bodyParser());
app.use(error(formatError));

router.get('/api', (ctx) => {
    ctx.body = { message: 'ra-in-memory-jwt API' };
});
app.use(router.routes()).use(router.allowedMethods());
app.use(dbMiddleware);
app.use(authenticationRouter.routes()).use(
    authenticationRouter.allowedMethods()
);
app.use(userRouter.routes()).use(userRouter.allowedMethods());

app.listen(3001, () => global.console.log('API started on port 3001'));
