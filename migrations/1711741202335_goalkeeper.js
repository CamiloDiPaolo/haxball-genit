/* eslint-disable camelcase */
exports.up = pgm => {
    pgm.addColumns('matchs', {
        shots: { type: 'json', notNull: true, default: '[]' },
        head_off: { type: 'json', notNull: true, default: '[]' },
        intercepts: { type: 'json', notNull: true, default: '[]' }
    })
};
