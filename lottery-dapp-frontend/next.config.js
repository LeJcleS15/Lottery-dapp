/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};
const env = {
  goerli_rpc_url:
    "https://eth-goerli.g.alchemy.com/v2/IgGzg26ZOmgW-ZdNx_SL6gJ-M1Wccv8-",
};
module.exports = { nextConfig, env };
