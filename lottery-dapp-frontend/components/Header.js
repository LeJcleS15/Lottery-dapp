import React from "react";
import { ConnectButton } from "@web3uikit/web3";

const Header = () => {
  return (
    <div className='hello'>
      <ConnectButton moralisAuth={false}/>
    </div>
  );
};

export default Header;
