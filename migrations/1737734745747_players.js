/* eslint-disable camelcase */
exports.up = pgm => {
    pgm.createTable('players', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        name: { type: 'string', notNull: true },
    })
};
