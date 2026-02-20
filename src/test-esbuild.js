const esbuild = require("esbuild");
esbuild.build({
  stdin: { contents: '@import url("/src/style/font.css");', resolveDir: __dirname, loader: 'css' },
  plugins: [{
    name: 'test',
    setup(b) {
      b.onResolve({ filter: /.*/ }, args => {
        console.log("Resolve:", args.path, args.kind);
        return { path: require('path').join(__dirname, args.path) };
      })
    }
  }],
  bundle: true,
  write: false
}).then(res => console.log(res.outputFiles[0].text)).catch(console.error);
