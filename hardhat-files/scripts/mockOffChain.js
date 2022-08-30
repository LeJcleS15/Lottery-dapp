const { ethers, network } = require("hardhat");
/**
 * 
 * HAVING SLIGHT ISSUES WITH THIS SCRIPT
 */
async function mockKeepers() {
  const lottery = await ethers.getContract("Lottery");

  const { upkeepNeeded } = await lottery.checkUpkeep("0x");

  console.log(upkeepNeeded);
  console.log((await lottery.getNumberOfPlayers()).toString());

  const vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
  await vrfCoordinatorMock.addConsumer(1, lottery.address); // very important
  console.log("finally entered");
  const tx = await lottery.performUpkeep("0x");

  const txReceipt = await tx.wait();

  const requestId = txReceipt.events[1].args.requestId;
  console.log(`Performed upkeep with requestId: ${requestId}`);
  console.log(network.config.chainId);
  if (network.config.url == "http://127.0.0.1:8545") {
    await mockVRF(requestId, lottery);
  }
}

async function mockVRF(requestId, lottery) {
  const VRFCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
  await VRFCoordinatorMock.fulfillRandomWords(requestId, lottery.address);

  console.log("Coordinator Responded!");

  const recentWinner = await lottery.getRecentWinner();

  console.log(`The recent winner is: ${recentWinner}`);
}

mockKeepers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
