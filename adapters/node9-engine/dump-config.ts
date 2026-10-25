// Child process for snapshot.ts: prints the config node9 itself would build
// for the HOME it runs under, using node9-proxy's own getConfig(). Run with
// HOME set to a prepared temporary home and NODE9_PROXY_DIR set to the
// checkout. Prints one JSON object: { config, activeEnvironment }.

const dir = process.env.NODE9_PROXY_DIR;
const cwd = process.argv[2];
if (!dir || !cwd) {
  console.error('usage: NODE9_PROXY_DIR=... HOME=... dump-config.ts <cwd>');
  process.exit(2);
}
const mod = (await import(`${dir}/src/config/index.ts`)) as {
  getConfig: (cwd?: string) => unknown;
  getActiveEnvironment: (c: unknown) => unknown;
};
const config = mod.getConfig(cwd);
process.stdout.write(JSON.stringify({ config, activeEnvironment: mod.getActiveEnvironment(config) ?? undefined }));
