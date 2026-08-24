/**
 * cPanel / Phusion Passenger startup file for the Next.js app.
 *
 * cPanel's "Setup Node.js App" tool does NOT run `npm start` — it boots this
 * single file with Passenger and injects the port it wants us to listen on
 * through process.env.PORT. So we spin up Next's request handler on a plain
 * Node http server instead of calling `next start`.
 *
 * Run `npm run build` BEFORE uploading: this file only serves the prebuilt
 * .next output, it never compiles anything.
 */

const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Never dev mode on shared hosting — dev mode needs devDependencies and RAM.
const app = next({ dev: false, dir: __dirname, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        createServer((req, res) => {
            handle(req, res).catch((err) => {
                console.error("Request failed:", req.url, err);
                res.statusCode = 500;
                res.end("Internal Server Error");
            });
        }).listen(port, () => {
            console.log(`> Next.js ready on port ${port} (pid ${process.pid})`);
        });
    })
    .catch((err) => {
        console.error("Failed to start Next.js:", err);
        process.exit(1);
    });
