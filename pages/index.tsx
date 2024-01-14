import { Center, Box, Heading, Stack, Spacer } from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";

import NavBar from "../components/NavBar";
import styles from "../styles/Home.module.css";
import Disconnected from "@/components/Disconnected";
import { useWallet } from "@solana/wallet-adapter-react";
import Connected from "@/components/Connected";

const Home: NextPage = () => {
  const { connected } = useWallet();

  return (
    <div className={styles.App}>
      <Head>
        <title>Buildoors</title>
        <meta name="The NFT Collection for Buildoors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box
        w="full"
        h="calc(100vh)"
        bgImage={"url(/home-background.svg)"}
        backgroundPosition="center"
      >
        <Stack w="full" h="calc(100vh)" justify="center">
          <NavBar />
          <Spacer />
          <Center>{connected ? <Connected /> : <Disconnected />}</Center>
          <Center>
            <Box marginBottom={4} color={"white"}>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                built with _
              </a>
            </Box>
          </Center>
        </Stack>
      </Box>
    </div>
  );
};

export default Home;
