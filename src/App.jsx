import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json'

// fix for `Buffer not defined` error in solana js conection
import { Buffer } from 'buffer';
window.Buffer = Buffer;

/*
  * Constants
  */
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Fetches permanent keypair for the account that holds the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// twitter information for tagline
const TWITTER_HANDLE = 'gte539z';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
  'https://media4.giphy.com/media/qgpO6MRDbGYuc/giphy.gif?cid=790b7611e1a955bbfc8aebc8c3d5331bd75a7d4c9d4ccf8f&rid=giphy.gif&ct=g',
  'https://media1.giphy.com/media/TdwziQPhbNAzK/giphy.gif?cid=790b7611cf1326aa9f28c505067bf08b3addf4af650321b5&rid=giphy.gif&ct=g',
  'https://media1.giphy.com/media/8iOzrJARYNURO/giphy.gif?cid=790b76111c9b6682911dbf76ba7662bf10d51e94981f927c&rid=giphy.gif&ct=g',
  'https://media3.giphy.com/media/14bDMRUYVrzOIo/giphy.gif?cid=790b761194f363d5f7c666cf0c281a8bd58a8c1b884966a1&rid=giphy.gif&ct=g',
  'https://media2.giphy.com/media/TLyhdPMHc7s7S/giphy.gif?cid=790b7611ffd6bf197abdcf2b46de4a570a181eba4bb7dc2f&rid=giphy.gif&ct=g',
  'https://media2.giphy.com/media/az3XlqP9zQ9ry/giphy.gif?cid=790b761143eed96c76ce28b861f128c38c47d482660e6036&rid=giphy.gif&ct=g'
]

const App = () => {

  // States
  //   wallet address
  const [walletAddress, setWalletAddress] = useState(null);
  //   GIF submit button
  const [inputValue, setInputValue] = useState('');
  //   GIF list
  const [gifList, setGifList] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          /*
          * The solana object gives us a function that will allow us to connect
          * directly with the user's wallet!
          */
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * This function holds the logic to connect the Phantom Wallet
   */
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  /*
   * This function submits gifs and fetches updated gif list
   */
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  /*
   * This function holds the logic to update the GIF input
   * 
   */
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  /*
   * This function holds the logic to update the GIF input
   */
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  /*
   * This function basically to call `startStuffOff`
   */
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  /*
   * We want to render the gif grid if user has connected
   * their wallet to our app.
   */
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } 
	  // Otherwise, we're good! Account exists. User can submit GIFs.
	  else {
    return(
    <div className="connected-container">
        {/* Input and button for submitting pictures */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
      <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} alt={`submitted by ${item.userAddress.toString()}`}/>
              <p className="footer-text">
                {`submitted by ${item.userAddress.toString()}`}
              </p>
            </div>
        ))}
      </div>
    </div>
    )
    }
  };

  /*
   * On first mount, check for a connected Phantom Wallet
   * 
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  /*
   * fetch GIF list if a wallet is connected
   */
  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
          {/* This was solely added for some styling fanciness */}
          <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">Futurama GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! if wallet, render gif grid*/}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
