/* eslint-disable camelcase */
exports.up = pgm => {
    pgm.createTable('head_off', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        time: { type: 'integer', notNull: true },
        position: { type: 'json', notNull: true },
        match_id: {
            type: 'integer',
            notNull: true,
            references: '"matchs"',
            onDelete: 'cascade',
        },
        player_id: {
            type: 'integer',
            notNull: true,
            references: '"players"',
            onDelete: 'cascade',
        }
    })
};
