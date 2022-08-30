import React from "react";
import { ConnectButton } from "@web3uikit/web3";

const Header = () => {
  return (
    <div className="border-b-2 p-5 flex flex-row">
      <h1 className="py-4 ">Decentralized Lottery</h1>
      <div className="ml-auto">
        <ConnectButton moralisAuth={false} />
      </div>
    </div>
  );
};

export default Header;
