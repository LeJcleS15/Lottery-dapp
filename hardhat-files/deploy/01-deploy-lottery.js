const { networkConfig } = require("../helper-config");
const { ethers } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deployer } = await getNamedAccounts();
  const { log, deploy } = deployments;
  const chainId = network.config.chainId;
  let vrfCoordinatorAddress, subscriptionId;

  if (chainId == 31337) {
    const vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorAddress = vrfCoordinatorMock.address;
    const transactionResponse = await vrfCoordinatorMock.createSubscription(); // create a subscription to get the subscription id
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
  } else {
    vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinator;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const networkName = networkConfig[chainId].name;

  log(
    `Deploying to the ${chainId == 31337 ? "local" : networkName} testnet....`
  );
  let entranceFee = networkConfig[chainId].entranceFee;
  let keyHash = networkConfig[chainId].keyHash;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const interval = networkConfig[chainId].interval;

  args = [
    vrfCoordinatorAddress,
    entranceFee,
    keyHash,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];

  const lottery = await deploy("Lottery", {
    contract: "Lottery",
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(
    `Lottery contract deployed on ${
      chainId == 31337 ? "local" : networkName
    } testnet..`
  );
  if (chainId != 31337) {
    await verify(lottery.address, args);
    log("Done with verification...");
  }

  log("------------------------------------------------------------");
};

module.exports.tags = ["all", "Lottery"];
