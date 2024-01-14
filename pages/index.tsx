import { NextPage } from "next";
import { useState } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

import styles from "../styles/Home.module.css";
import AddressForm from "@/components/AddressForm";

const Home: NextPage = () => {
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");
  const [accountInfo, setAccountInfo] = useState("");

  const addressSubmittedHandler = (address: string) => {
    try {
      const key = new PublicKey(address);
      setAddress(key.toBase58());

      const connection = new Connection(clusterApiUrl("devnet"));
      connection.getBalance(key).then((balance) => {
        setBalance(balance / LAMPORTS_PER_SOL);
      });

      connection.getAccountInfo(key).then((info) => {
        if (info?.executable) {
          setAccountInfo("Yes");
        } else {
          setAccountInfo("Nope");
        }
      });
    } catch (err) {
      setAddress("");
      setBalance(0);
      alert(err);
    }
  };

  return (
    <div className={styles.App}>
      <header className={styles.AppHeader}>
        <p>Start Your Solana Journey</p>
        <AddressForm handler={addressSubmittedHandler} />
        <p>{`Address: ${address}`}</p>
        <p>{`Balance: ${balance} SOL`}</p>
        <p>{`Is it executable? ${accountInfo}`}</p>
      </header>
    </div>
  );
};

export default Home;
