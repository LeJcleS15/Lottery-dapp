import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useNotification } from "@web3uikit/core";
import abi from "../constants/abi.json";
import contractAddress from "../constants/contractAddress.json";

const LotteryEntrance = () => {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis(); 
  const dispatch = useNotification(); // for rendering the notification on successful or failed tx
  const entranceFee = useRef(); // to store the entrance fee gotten from the contract
  const chainId = parseInt(chainIdHex);
  console.log("LotteryEntranct component mounted!")
  const lotteryAddress =
    chainId in contractAddress ? contractAddress[chainId][0] : null;
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

  const handleSuccess = async (tx) => {
    console.log(tx);
    const txReceipt = await tx.wait();
    console.log(txReceipt);
    handleNewNotification();
  };

  const handleNewNotification = () => {
    dispatch({
      message: "Tx Successful",
      type: "info",
      position: "topR",
      title: "Tx Notification",
    });
  };

  const handleFailure = (error) => {
    dispatch({
      position: "topR",
      message: error.message,
      title: "Tx Error",
      type: "error" || "danger",
    });
  };
  useEffect(() => {
    if (isWeb3Enabled) {
      // try to read the lottery entrance fee from the blockchain

      async function updateUI() {
        const feeInBigNumber = (await getEntranceFee()).toString();
        entranceFee.current = feeInBigNumber;
      }
      updateUI();
    }
  }, [isWeb3Enabled]);
  return (
    <div>
      <h2>Welcome to the lottery.</h2>
      {lotteryAddress ? (
        <h3>
          Entrance Fee: {ethers.utils.formatUnits("10000000000000000", "ether")}{" "}
          ETH
        </h3>
      ) : (
        <h3>No valid address detected</h3>
      )}

      <button
        onClick={async () => {
          console.log("clicked");
          await enterLottery({
            onSuccess: handleSuccess,
            onError: (error) => handleFailure(error), // always add this error handler
          });
        }}
        disabled={isFetching}
      >
        Enter Raffle
      </button>
    </div>
  );
};

export default LotteryEntrance;
