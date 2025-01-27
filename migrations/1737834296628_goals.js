/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createTable('goals', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        time: { type: 'real', notNull: true },
        distance: { type: 'real', notNull: true },
        hax_degree: { type: 'real', notNull: true },
        position: { type: 'json', notNull: true },
        team_id: { type: 'integer', notNull: true },
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
        },
        player_assistant_id: {
            type: 'integer',
            notNull: false,
            references: '"players"',
        },

    })
};
