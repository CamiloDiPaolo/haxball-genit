/* eslint-disable camelcase */
exports.up = pgm => {
    pgm.createTable('intercepts', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        time: { type: 'real', notNull: true },
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
