import React, { useEffect, useState, useRef } from "react";
import { ethers, Contract } from "ethers";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useNotification } from "@web3uikit/core";
import abi from "../constants/abi.json";
import contractAddress from "../constants/contractAddress.json";

const LotteryEntrance = () => {
  const [numPlayers, setNumPlayers] = useState(0);
  const [recentWinner, setRecentWinner] = useState(0);
  const [winnerPicked, setWinnerPicked] = useState(false);
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
  const dispatch = useNotification(); // for rendering the notification on successful or failed tx
  const entranceFee = useRef(); // to store the entrance fee gotten from the contract
  const chainId = parseInt(chainIdHex);

  const lotteryAddress =
    chainId in contractAddress ? contractAddress[chainId][1] : null;
  let provider, lottery;
  const getProvider = async () => {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_GOERLI_RPC_URL
    );
    lottery = new Contract(lotteryAddress, abi, provider);
    lottery.on("WinnerPicked", () => {
      // fires when the "WinnerPicked" event is emitted
      setWinnerPicked(true);
      console.log("WinnerPicked!!!");
      updateUI();
    });
  };

  const { runContractFunction: enterLottery, isFetching } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "enterLottery",
    params: {},
    msgValue: entranceFee.current, // this is being read from the blockchain
  });

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  const handleSuccess = async (tx) => {
    await tx.wait();
    handleNewNotification();
    await updateUI();
  };

  const handleNewNotification = (isError = false, error = "") => {
    dispatch({
      message: !isError ? "Tx Successful" : error,
      type: !isError ? "info" : "error",
      position: "topR",
      title: "Tx Notification",
    });
  };

  const handleFailure = (error) => {
    handleNewNotification(true, error.message);
  };

  async function updateUI() {
    const feeInBigNumber = (await getEntranceFee()).toString();
    const numPlayersInBigNumber = (await getNumberOfPlayers()).toString();
    const recentWinner = await getRecentWinner();
    entranceFee.current = feeInBigNumber;
    setRecentWinner(recentWinner);
    setNumPlayers(numPlayersInBigNumber);
  }
  // keep reading from the blockchain

  useEffect(() => {
    if (isWeb3Enabled) {
      // try to read the lottery entrance fee from the blockchain
      updateUI();
      getProvider();
    }
  }, [isWeb3Enabled]);

  return (
    <div>
      {winnerPicked && <p>Winner Picked!!</p>}
      <h2 className="btn btn-primary">Welcome to the lottery.</h2>
      {lotteryAddress ? (
        <div>
          <h3>
            Entrance Fee:{" "}
            {ethers.utils.formatUnits("10000000000000000", "ether")} ETH
          </h3>
          <h3>Number of players: {numPlayers}</h3>
          <h3>Recent Winner: {recentWinner}</h3>
        </div>
      ) : (
        <h3>Please connect to the Goerli Network</h3>
      )}

      <button
        className="bg-blue-500 hover:bg-blue-700 p-3 rounded-lg mt-3 text-white font-bold"
        onClick={async () => {
          setWinnerPicked(false);
          await enterLottery({
            onSuccess: handleSuccess, // takes in the transaction response
            onError: (error) => handleFailure(error), // always add this error handler
          });
        }}
        disabled={isFetching}
      >
        {isFetching ? (
          <div className="animate-spin rounded-full spinner-border h-8 w-8 border-b-2"></div>
        ) : (
          "Enter Lottery"
        )}
      </button>
    </div>
  );
};

export default LotteryEntrance;
