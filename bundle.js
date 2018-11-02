
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(name) {
          return require(mapping[name]);
        }

        const module = { exports : {} };

        fn(localRequire, module, module.exports); 

        return module.exports;
      }

      require(0);
    })({0: [
      function (require, module, exports) {
        "use strict";

var _hello = _interopRequireDefault(require("./hello.js"));

var _world = _interopRequireDefault(require("./world.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function exec() {
  // 这是一段注释
  var 这是一个变量 = '这是一个变量';
} // 执行


exec();
      },
      {"./hello.js":1,"./world.js":2},
    ],1: [
      function (require, module, exports) {
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var hello = 'hello';
var _default = hello;
exports.default = _default;
      },
      {},
    ],2: [
      function (require, module, exports) {
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var world = 'world';
var _default = world;
exports.default = _default;
      },
      {},
    ],})
  