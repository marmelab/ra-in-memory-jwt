const Router = require('koa-router');

const {
    getOne,
    getPaginatedList,
} = require('./repository');
const {
    formatPaginationToLinkHeader,
} = require('../toolbox/rest-list/pagination-helpers');

const router = new Router({
    prefix: '/api/users',
});

// router.use(async (ctx, next) => {
//     if (
//         !ctx.state.jwt
//     ) {
//         ctx.throw(401, "You don't have the authorization to make this query");

//         return;
//     }

//     await next();
// });

router.get('/', async (ctx) => {
    const { users, pagination, error } = await getPaginatedList(ctx.query);

    if (error) {
        const explainedError = new Error(error.message);
        explainedError.status = 500;

        throw explainedError;
    }

    const linkHeaderValue = formatPaginationToLinkHeader({
        resourceURI: '/api/users',
        pagination,
    });

    ctx.set('X-Total-Count', pagination.total);
    if (linkHeaderValue) {
        ctx.set('Link', linkHeaderValue);
    }
    ctx.body = users;
});

router.get('/:userId', async (ctx) => {
    const user = await getOne(ctx.params.userId);

    if (!user.id) {
        const explainedError = new Error(
            `The user of id ${ctx.params.organizationId} does not exist.`
        );
        explainedError.status = 404;

        throw explainedError;
    }

    if (user.error) {
        const explainedError = new Error(user.error.message);
        explainedError.status = 400;

        throw explainedError;
    }

    ctx.body = user;
});

module.exports = router;
