const fs = require('fs');
const path = require('path');
const traverse = require('@babel/traverse').default;
const { transformSync, transformFromAstSync } = require("@babel/core");

let ID = 0;

// remove console plugin
function babelPlugin({ types: t }) {
  return {
    visitor: {
      MemberExpression(path) {
       // console.log(path.node.callee.object)
        if (
          path.node.object.name === 'console'
          ) {
            path.getStatementParent().remove();
        }
      }
    }
  };
};

function createAsset(filename) {
  // 从文件当中读取代码
  const source = fs.readFileSync(filename, 'utf8');
  const { ast } = transformSync(source, { ast: true, comments: true });
  if (ID === 0) {
    fs.writeFileSync(path.resolve(__dirname, 'bundle.json'), JSON.stringify(ast));
  }


  const dependencies = [];
  traverse(ast, {
    ImportDeclaration({ node }) {
      dependencies.push(node.source.value);
    },
  });

  
  const id = ID++;
  const { code } = transformFromAstSync(ast, null, {
    presets: ['@babel/env'],
    "plugins": [
      babelPlugin
     ]
  });

  return {
    id,
    code,
    filename,
    dependencies,
  }
}

function createGraph(entry) {
  const mainAsset = createAsset(entry);

  const queue = [mainAsset];

  for (const asset of queue) {
    asset.mapping = {};

    const dirname = path.dirname(asset.filename);
    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath);
      const child = createAsset(absolutePath);
      asset.mapping[relativePath] = child.id;

      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = '';

  graph.forEach(mod => {
    modules += `${mod.id}: [
      function (require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });

  const result = `
    (function(modules) {
      function require(id) { //🌟
        const [fn, mapping] = modules[id];

        function localRequire(name) {
          return require(mapping[name]);
        }

        const module = { exports : {} };

        fn(localRequire, module, module.exports); 

        return module.exports;
      }

      require(0);
    })({${modules}})
  `;

  return result;
}

const graph = createGraph('./example/index.js');
const result = bundle(graph);
fs.writeFileSync(path.resolve(__dirname, 'bundle.js'), result);