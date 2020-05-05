console.warn('* babel.config.js running');

const plugins = [
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
];

if (process.env.NODE_ENV === 'testing') {
    plugins.push('istanbul');
}

console.warn('* babel plugins', JSON.stringify(plugins));

module.exports = {
    'presets': [
        ['@babel/preset-env', { 'useBuiltIns': 'entry', 'corejs': { 'version': 3, 'proposals': true } }],
        '@babel/preset-typescript',
    ],
    plugins,
    'env': {
        'node': {
            'plugins': [
                'add-module-exports',
            ],
        },
        'test': {
            'plugins': [
                'add-module-exports',
                [
                    'istanbul',
                    {
                        'exclude': [
                            '**/*.spec.js',
                        ],
                    },
                ],
            ],
        },
    },
};
