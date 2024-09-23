const prompts = require('prompts');
const { rmSync, renameSync } = require('node:fs')
const path = require('path');


const projects = ['nestjs-query-core', 'nestjs-query-typeorm', 'nestjs-query-graphql', ]

async function run() {
  const { dir } = await prompts({
    type: 'text',
    name: 'dir',
    message: 'target folder?',
  });

  projects.forEach(p => {
    const oldPath = path.resolve('dist/packages', p, 'src');
    const newPath = path.resolve(dir, 'node_modules/@rezonate', p,);
    const newPathSrc = path.resolve(newPath, 'src');
    rmSync(newPathSrc, {recursive: true, force: true})
    renameSync(oldPath, newPathSrc);
  })
}

run();