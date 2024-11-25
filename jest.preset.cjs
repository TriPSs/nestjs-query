const nxPreset = require('@nx/jest/preset').default;

module.exports = {
	...nxPreset,
	/* TODO: Update to latest Jest snapshotFormat
	 * By default Nx has kept the older style of Jest Snapshot formats
	 * to prevent breaking of any existing tests with snapshots.
	 * It's recommend you update to the latest format.
	 * You can do this by removing snapshotFormat property
	 * and running tests with --update-snapshot flag.
	 * Example: "nx affected --targets=test --update-snapshot"
	 * More info: https://jestjs.io/docs/upgrading-to-jest29#snapshot-format
	 */
	snapshotFormat: { escapeString: true, printBasicPrototype: true },
	moduleNameMapper: {
		'@rezonate/nestjs-query-core': __dirname + '/packages/core/src',
		'@rezonate/nestjs-query-graphql': __dirname + '/packages/query-graphql/src',
		'@rezonate/nestjs-query-typeorm': __dirname + '/packages/query-typeorm/src',
	},
};
