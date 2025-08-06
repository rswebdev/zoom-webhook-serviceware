module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.[cm]*js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
};
