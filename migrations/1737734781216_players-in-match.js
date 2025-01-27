/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createTable('players_in_match', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
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
        team_id: { type: 'integer', notNull: true }
    })
};
