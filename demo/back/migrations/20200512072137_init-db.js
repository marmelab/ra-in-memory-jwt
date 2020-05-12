exports.up = async (knex) => {
    await knex.raw(`CREATE extension IF NOT EXISTS "uuid-ossp"`);
    await knex.schema.createTable('user_account', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('username', 50).notNullable();
        table.string('password', 300).notNullable();
        table.dateTime('created_at').defaultTo(knex.fn.now());
        table.unique('username');
    });
    return knex.schema.createTable('refresh_token', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id');
        table
            .foreign('user_id')
            .references('user_account.id')
            .onDelete('CASCADE');
        table.boolean('remember_me').defaultTo(false);
        table.dateTime('created_at').defaultTo(knex.fn.now());
        table.integer('validity_timestamp').unsigned().notNullable();
        table.unique('user_id');
    });
};

exports.down = function () {
    return knex.schema
        .dropTable('user_account')
        .dropTable('refresh_token');
};
