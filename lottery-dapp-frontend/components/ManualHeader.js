import React, { useEffect } from "react";
import { useMoralis } from "react-moralis";

export default function ManualHeader() {
  const { enableWeb3, account, isWeb3Enabled, Moralis, deactivateWeb3, isWeb3EnableLoading} =
    useMoralis();

  useEffect(() => {
    if (isWeb3Enabled) return;
    if (typeof window != undefined) {
      if (window.localStorage.getItem("connected")) {
        // if we've connected our account before
        enableWeb3();
      }
    }
  }, []);

  useEffect(() => {
    // this function checks to see if there was an account change
    Moralis.onAccountChanged((account) => {
      console.log(`Account changed to ${account}`);
      if (account == null) {
        // if you're not connected to any account
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        console.log("Null account found");
      }
    });
  });
  return (
    <div>
      {account ? (
        <div>Connected to {account}</div>
      ) : (
        <button
          onClick={async () => {
            await enableWeb3();
            if (typeof window != undefined) {
              window.localStorage.setItem("connected", "injected");
            }
          }}
          disabled={isWeb3EnableLoading}
        >
          Connect
        </button>
      )}
    </div>
  );
}
