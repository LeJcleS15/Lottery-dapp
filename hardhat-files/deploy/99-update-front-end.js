const { ethers, network } = require("hardhat");
const fs = require("fs");
const FRONT_END_ADDRESSES_FILE =
  "../lottery-dapp-frontend/constants/contractAddress.json";
const FRONT_END_ABI_FILE = "../lottery-dapp-frontend/constants/abi.json";

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end constants folder content...");
    await updateContractAddress();
    await updateAbi();
  }
};

async function updateAbi() {
  //the abi will pretty much be the same no matter the network
  const lottery = await ethers.getContract("Lottery");

  fs.writeFileSync(
    FRONT_END_ABI_FILE,
    lottery.interface.format(ethers.utils.FormatTypes.json)
  );
}
async function updateContractAddress() {
  const lottery = await ethers.getContract("Lottery");
  const chainId = network.config.chainId.toString();

  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
  );

  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(lottery.address)) {
      currentAddresses[chainId].push(lottery.address);
    }
  } else {
    currentAddresses[chainId] = [lottery.address];
  }
  fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
}

module.exports.tags = ["all", "frontend-update"];
