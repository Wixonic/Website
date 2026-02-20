import esbuild from 'esbuild';
import path from 'path';

esbuild.build({
  stdin: { contents: '@import "/src/style/font.css";', resolveDir: process.cwd(), loader: 'css' },
  plugins: [{
    name: 'test',
    setup(b) {
      b.onResolve({ filter: /^\// }, args => {
        console.log("Resolve:", args.path, args.kind);
        return { path: path.join(process.cwd(), "..", args.path) };
      })
    }
  }],
  bundle: true,
  write: false
}).then(res => console.log(res.outputFiles[0].text)).catch(console.error);
