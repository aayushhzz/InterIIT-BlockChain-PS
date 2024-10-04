import React, { useState, useEffect } from "react";
import Web3 from "web3";

const WalletDetails = () => {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to map network ID to network name
  const getNetworkName = (networkId) => {
    switch (networkId) {
      case 1:
        return "Mainnet";
      case 3:
        return "Ropsten";
      case 4:
        return "Rinkeby";
      case 5:
        return "Goerli";
      case 42:
        return "Kovan";
      case 11155111:
        return "Sepolia";
      default:
        return "Unknown Network";
    }
  };

  // Function to connect and get wallet details
  const getWalletDetails = async () => {
    if (window.ethereum) {
      try {
        setLoading(true); // Show loading spinner
        setError(null); // Reset error before trying

        // Request access to MetaMask accounts
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        if (accounts.length === 0) {
          setError("No accounts found. Please connect your MetaMask wallet.");
          return;
        }

        const selectedAccount = accounts[0];
        setAccount(selectedAccount);

        // Create a Web3 instance
        const web3 = new Web3(window.ethereum);

        // Get network ID using web3.eth.net.getId()
        const networkId = await web3.eth.net.getId();
        const networkName = getNetworkName(networkId);
        setNetwork(networkName);

        // Fetch balance
        const balanceInWei = await web3.eth.getBalance(selectedAccount);
        const balanceInEther = web3.utils.fromWei(balanceInWei, "ether");
        setBalance(balanceInEther);
      } catch (err) {
        setError("Error connecting to MetaMask. Please try again.");
        console.error("Error fetching wallet details: ", err);
      } finally {
        setLoading(false); // Remove loading spinner
      }
    } else {
      setError("MetaMask is not installed. Please install MetaMask and try again.");
    }
  };


  return (
    <div className="wallet-details-container flex flex-col items-center p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-6 text-center">Wallet Details</h2>

      {loading ? (
        <p className="text-lg text-blue-500 mb-4">Loading wallet details...</p>
      ) : error ? (
        <p className="text-lg text-red-500 mb-4">{error}</p>
      ) : account ? (
        <div className="card bg-gray-100 p-6 rounded-lg shadow-md text-center">
          <p className="mb-4">
            <strong>Address:</strong> {account}
          </p>
          <p className="mb-4">
            <strong>Network:</strong> {network || "Fetching..."}
          </p>
          <p className="mb-4">
            <strong>Balance:</strong> {balance ? `${balance} ETH` : "Fetching..."}
          </p>
        </div>
      ) : (
        <p className="text-lg text-gray-500 mb-4">Please connect your MetaMask wallet to view details.</p>
      )}

      <button
        onClick={getWalletDetails}
        className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
      >
        {loading ? "Retrying..." : "Retry Fetching Details"}
      </button>
    </div>
  );
};

export default WalletDetails;
