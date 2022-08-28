const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { networkConfig } = require("../../helper-config");

network.config.chainId == 31337
  ? describe.skip
  : describe("Lottery Staging test", () => {
      let lottery, lotteryEntranceFee, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;

        // await deployments.fixture("Lottery");

        lottery = await ethers.getContract("Lottery", deployer);
        lotteryEntranceFee = await lottery.getEntranceFee();
      });

      describe("fulfillRandomWords", () => {
        it("works with external chainlink keepers and vrf nodes and picks a random winner", async () => {
          console.log("starting test ...");

          const startingTimeStamp = await lottery.getLatestTimeStamp();
          const accounts = await ethers.getSigners();

          console.log("Setting up listener");

          console.log("Entering lottery...");

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired");
              try {
                const recentWinner = await lottery.getRecentWinner();
                const lotteryState = await lottery.getLotteryState();
                const endingTimeStamp = await lottery.getLatestTimeStamp();
                await expect(lottery.getPlayer(0)).to.be.reverted;
                assert(endingTimeStamp > startingTimeStamp);
                assert.equal(lotteryState, 0);
                resolve();
              } catch (error) {
                console.log(error);
                reject(error);
              }
            });

            const tx = await lottery.enterLottery({
              value: lotteryEntranceFee,
            });
            await tx.wait(1);

            console.log("Okay time to wait");
          });
        });
      });
    });
