module.exports = async ({ getNamedAccounts, deployments, network, ethers }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  const BASE_FEE = ethers.utils.parseEther("0.25"); //0.25 is the premium. It costs 0.25 LINK per request
  const GAS_PRICE_LINK = 1e9; //(LINK per gas)calculated value based on the gas price of the chain. Ideally this is a mock so we can put whatever but the real Coordinator contract will have this sorted out ;)

  if (chainId == 31337) {
    log("Local network detected. Deploying mocks...");

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    log("Mocks deployed!");
    log("-------------------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
