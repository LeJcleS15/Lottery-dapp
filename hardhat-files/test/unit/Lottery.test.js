const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { networkConfig } = require("../../helper-config");
const { assert, expect } = require("chai");
const chainId = network.config.chainId;

if (chainId != 31337) {
  describe.skip;
} else {
  describe("Lottery Unit Test", () => {
    let lottery, VRFCoordinatorV2Mock, lotteryEntranceFee, deployer, interval;

    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer;

      await deployments.fixture("all");
      lottery = await ethers.getContract("Lottery", deployer);
      VRFCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock",
        deployer
      );
      await VRFCoordinatorV2Mock.addConsumer(1, lottery.address); // add our contract as a consumer to our coordinator contract
      lotteryEntranceFee = await lottery.getEntranceFee();
      interval = await lottery.getInterval();
    });

    describe("Contructor", () => {
      it("initializes the Lottery correctly", async () => {
        // ideally it should be one assert to one "it"
        const lotteryState = await lottery.getLotteryState();
        assert.equal(lotteryState.toString(), "0");
        assert.equal(interval.toString(), networkConfig[chainId].interval);
      });
    });
    describe("enterLottery", () => {
      it("reverts when you dont pay enough", async () => {
        await expect(lottery.enterLottery()).to.be.reverted;
      });

      it("records players when they enter", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee }); // since the contract is already connected to the deployer

        const playerFromContract = await lottery.getPlayer(0);

        assert.equal(playerFromContract, deployer);
      });

      it("emits event on enter", async () => {
        await expect(
          lottery.enterLottery({ value: lotteryEntranceFee })
        ).to.emit(lottery, "LotteryEnter");
      });
      it("doesnt allow entrance into lottery when calculating", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });

        await network.provider.send("evm_increaseTime", [30]); // we've moved in time on the network
        await network.provider.request({ method: "evm_mine", params: [] });

        await lottery.performUpkeep([]); // we pretend to be a chainlink keeper and call the "performUpkeep" function
        // now our contract is in a calculating state

        await expect(lottery.enterLottery({ value: lotteryEntranceFee })).to.be
          .reverted;
      });
    });
    describe("checkUpkeep", () => {
      it("returns false if people havent sent any ETH", async () => {
        await network.provider.send("evm_increaseTime", [interval.toNumber()]); // we've increased time on the blockchain
        await network.provider.request({ method: "evm_mine", params: [] });
        const { upkeepNeeded } = await lottery.checkUpkeep([]);
        // if it wasnt a view function, we could simulate a transaction using => await lottery.callStatic.checkUpkeep([]) and it would return the exact thing
        assert.equal(upkeepNeeded, false);
      });
      it("returns false if lottery isn't open", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });
        await network.provider.send("evm_increaseTime", [interval.toNumber()]);
        await network.provider.request({ method: "evm_mine", params: [] });
        await lottery.performUpkeep([]);

        const lotteryState = await lottery.getLotteryState();
        const { upkeepNeeded } = await lottery.checkUpkeep([]);

        assert.equal(lotteryState.toString(), "1");
        assert.equal(upkeepNeeded, false);
      });
      it("returns false if time hasn't passed", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() - 1,
        ]);
        const { upkeepNeeded } = await lottery.checkUpkeep([]);

        assert.equal(upkeepNeeded, false);
      });
      it("returns true if time has passed, has players, has ETH and state is OPEN", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });
        await network.provider.send("evm_increaseTime", [interval.toNumber()]);
        await network.provider.request({ method: "evm_mine", params: [] }); // important
        const { upkeepNeeded } = await lottery.checkUpkeep([]);
        assert.equal(upkeepNeeded, true);
      });
    });

    describe("performUpkeep", () => {
      it("it can only run if perform checkUpkeep is true", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });
        await network.provider.send("evm_increaseTime", [interval.toNumber()]);
        await network.provider.request({ method: "evm_mine", params: [] });

        const tx = await lottery.performUpkeep([]);
        assert(tx);
      });
      it("reverts when checkUpkeep is false", async () => {
        await expect(lottery.performUpkeep([])).to.be.reverted;
      });
      it("updates the lottery state, emits an event and calls the vrf coordinator", async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });
        await network.provider.send("evm_increaseTime", [interval.toNumber()]);
        await network.provider.request({ method: "evm_mine", params: [] });

        const txResponse = await lottery.performUpkeep([]); //

        const txReceipt = await txResponse.wait();
        const requestId = txReceipt.events[1].args.requestId; //emits an event
        const lotteryState = await lottery.getLotteryState(); // lottery state updated
        assert(requestId.toNumber() > 0);
        assert.equal(lotteryState, 1);
      });
    });

    describe("fulfillRandomWords", () => {
      beforeEach(async () => {
        await lottery.enterLottery({ value: lotteryEntranceFee });
        await network.provider.send("evm_increaseTime", [interval.toNumber()]);
        await network.provider.send("evm_mine", []);
      });
      it("can only be called after performUpkeep", async () => {
        await expect(
          VRFCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
        ).to.be.revertedWith("nonexistent request");
      });
    });
  });
}
