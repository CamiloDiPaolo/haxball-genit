/* eslint-disable camelcase */
exports.up = pgm => {
    pgm.createTable('matchs', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        time: { type: 'integer', notNull: true },
        red_possession: { type: 'integer', notNull: true },
        blue_possession: { type: 'integer', notNull: true },
        red_goals: { type: 'integer', notNull: true },
        blue_goals: { type: 'integer', notNull: true },
    })
};
