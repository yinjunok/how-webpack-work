# 一个极简 js 打包器

为了更深入理解 webpack, 专门研究了打包器的实现.

```js
function createAsset(filename) {
  // 从文件中读取代码, 并生成 AST
  const source = fs.readFileSync(filename, 'utf8');
  const { ast } = transformSync(source, { ast: true, comments: true });

  // 遍历 AST, 从 import 语句中提取依赖.
  const dependencies = [];
  traverse(ast, {
    ImportDeclaration({ node }) {
      dependencies.push(node.source.value);
    },
  });

  // 一个文件为一个模块, 并给它一个唯一的编号.
  const id = ID++;

  // 用 babel 把 ast 编译成浏览器可以接受的代码
  const { code } = transformFromAstSync(ast, null, {
    presets: ['@babel/env'],
  });

  return {
    id,
    code,
    filename,
    dependencies,
  }
}
```

```js
// 构建依赖图
// entry 相当于 webpack 当中的 entry 文件.
// 会通过这个文件获取到所有的依赖
function createGraph(entry) {
  // 我们把入口文件当成主文件. 并把它推到一个队列当中.
  const mainAsset = createAsset(entry);
  const queue = [mainAsset];

  // 遍历依赖, 并把新依赖推入队列里.
  for (const asset of queue) {
    // 依赖路径与编号构成的 map.
    asset.mapping = {};

    // 依赖的路径
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
```

```js
function bundle(graph) {
  let modules = '';

  // 到这里其实就是把模块的代码符合 commonjs 的 bundle
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
```

参考:  
https://github.com/chinanf-boy/minipack-explain