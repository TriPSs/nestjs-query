// Remove the nodeJS module in rezonapp

const fs = require("fs");
const dir = "/Users/benjaminarbibe/git/rezonate/rezonapp/node_modules/@rezonate";
fs.rmSync(dir, { recursive: true, force: true });

// Create a new directory
fs.mkdirSync(dir, { recursive: true });

// Move the dist folder to the new directory
fs.renameSync(
    "/Users/benjaminarbibe/git/rezonate/nestjs-query/dist/packages/nestjs-query-core",
    dir + "/nestjs-query-core/"
);

// Move the dist folder to the new directory
fs.renameSync(
    "/Users/benjaminarbibe/git/rezonate/nestjs-query/dist/packages/nestjs-query-graphql",
    dir + "/nestjs-query-graphql/"
);


// Move the dist folder to the new directory
fs.renameSync(
    "/Users/benjaminarbibe/git/rezonate/nestjs-query/dist/packages/nestjs-query-typeorm",
    dir + "/nestjs-query-typeorm/"
);

