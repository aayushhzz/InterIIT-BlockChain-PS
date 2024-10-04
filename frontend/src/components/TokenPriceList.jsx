import React, { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Tooltip, Legend, Title);

const web3 = new Web3("https://rpc.ankr.com/eth_sepolia");

const TokenPriceList = () => {
  const aggregatorV3InterfaceABI = [
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "description",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
      name: "getRoundData",
      outputs: [
        { internalType: "uint80", name: "roundId", type: "uint80" },
        { internalType: "int256", name: "answer", type: "int256" },
        { internalType: "uint256", name: "startedAt", type: "uint256" },
        { internalType: "uint256", name: "updatedAt", type: "uint256" },
        { internalType: "uint80", name: "answeredInRound", type: "uint80" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "latestRoundData",
      outputs: [
        { internalType: "uint80", name: "roundId", type: "uint80" },
        { internalType: "int256", name: "answer", type: "int256" },
        { internalType: "uint256", name: "startedAt", type: "uint256" },
        { internalType: "uint256", name: "updatedAt", type: "uint256" },
        { internalType: "uint80", name: "answeredInRound", type: "uint80" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "version",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const [tokenPriceList, setTokenPriceList] = useState([
    { id: 1, gecko: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: 2, gecko: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: 3, gecko: "chainlink", name: "Chainlink", symbol: "LINK" },
    { id: 4, gecko: "usd-coin", name: "USD-Coin", symbol: "USDC" },
  ]);

  const [hours, setHours] = useState([true, true, true, true]);
  const [curtoken, setCurToken] = useState(tokenPriceList[0]);
  const [graphData, setGraphData] = useState(null); // State for graph data
  const [buttonText, setButtonText] = useState("Show Weekly Data"); // State for button text
  const [cache, setCache] = useState({}); // Cache to store token price and graph data

  const priceFeedAddresses = {
    ETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    BTC: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    LINK: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    USDC: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
  };

  const fetchTokenPriceList = async () => {
    try {
      const updatedTokenPrices = await Promise.all(
        tokenPriceList.map(async (token) => {
          if (token.name !== curtoken.name) return token;

          // Check cache for token price data (10 minutes = 600,000 ms)
          if (cache[token.symbol] && Date.now() - cache[token.symbol].timestamp < 600000) {
            return cache[token.symbol].data;
          }

          const priceFeed = await new web3.eth.Contract(aggregatorV3InterfaceABI, priceFeedAddresses[token.symbol]);
          const roundData = await priceFeed.methods.latestRoundData().call();
          const decimals = await priceFeed.methods.decimals().call();
          const adjustedPrice = Number(roundData.answer) / 10 ** Number(decimals);
          
          let response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${curtoken.gecko}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
          );

          let data = response.data;
          const { usd_market_cap, usd_24h_vol, usd_24h_change, last_updated_at } = data[curtoken.gecko];

          const newTokenData = {
            ...token,
            price: `$${adjustedPrice.toFixed(2)}`,
            marketcap: usd_market_cap.toFixed(2),
            volume: usd_24h_vol.toFixed(2),
            change: usd_24h_change.toFixed(2),
            lastupdated: new Date(last_updated_at * 1000).toLocaleString(),
          };

          // Cache the token data
          setCache((prevCache) => ({
            ...prevCache,
            [token.symbol]: { data: newTokenData, timestamp: Date.now() },
          }));

          return newTokenData;
        })
      );

      setTokenPriceList(updatedTokenPrices);
    } catch (error) {
      console.error("Error fetching token prices: ", error.message);
    }
  };

  const generateGraph = async (token, isHourly) => {
    try {
      const cacheKey = `${token.symbol}_${isHourly ? "hourly" : "weekly"}`;

      // Check cache for graph data (10 minutes = 600,000 ms)
      if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 600000) {
        setGraphData(cache[cacheKey].data);
        return;
      }

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${token.gecko}/market_chart?vs_currency=usd&days=${isHourly ? "1" : "7"}`
      );
      
      const randomPriceData = response.data.prices.map((price) => ({
        time: new Date(price[0]).getDate() + "/" + (new Date(price[0]).getMonth() + 1) + " " + new Date(price[0]).getHours() + ":" + new Date(price[0]).getMinutes(),
        price: price[1],
      }));

      const data = {
        labels: randomPriceData.map((d) => d.time),
        datasets: [
          {
            label: `${token.name} Price Trend (USD)`,
            data: randomPriceData.map((d) => d.price),
            borderColor: 'steelblue',
            backgroundColor: 'rgba(70, 130, 180, 0.2)',
          },
        ],
      };

      setGraphData(data);

      // Cache the graph data
      setCache((prevCache) => ({
        ...prevCache,
        [cacheKey]: { data, timestamp: Date.now() },
      }));
    } catch (error) {
      console.error("Error fetching graph data: ", error.message);
    }
  };

  useEffect(() => {
    fetchTokenPriceList();
    generateGraph(curtoken, hours[curtoken.id - 1]);
    const interval = setInterval(() => {
      fetchTokenPriceList();
    }, 60000);
    return () => clearInterval(interval);
  }, [curtoken]);

  const toggleGraph = (token) => {
    const isHourly = hours[token.id - 1];
    setHours((prev) => {
      const newHours = [...prev];
      newHours[token.id - 1] = !isHourly;
      return newHours;
    });
    setButtonText(isHourly ? "Show Hourly Data" : "Show Weekly Data");
    generateGraph(token, !isHourly);
  };

  return (
    <>
      <h2 className="text-3xl font-bold underline m-2">Cryptocurrency Prices</h2>
      <h3 className="text-xl font-bold m-2">Select a token to view its price data:</h3>
      <div className="flex justify-center items-center gap-5">
        {tokenPriceList.map((token) => (
          <button
            key={token.id}
            className={`btn ${curtoken.name === token.name ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setCurToken(token)}
          >
            {token.name}
          </button>
        ))}
      </div>
      <div className="grid justify-center items-center gap-5">
        {tokenPriceList.map(
          (token) =>
            curtoken.name === token.name && (
              <div className="card" style={{ width: "1000px", height: "600px" }} key={token.id}>
                <div style={{ margin: "auto", width: "800px", height: "400px" }}>
                  {graphData ? <Line data={graphData} height={400} width={800} /> : "Loading graph..."}
                </div>
                <div className="card-body">
                  <button className="btn btn-primary" onClick={() => toggleGraph(token)}>
                    {buttonText}
                  </button>
                  <h5 className="card-title text-xl font-bold mb-4">{token.name}</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm table-auto">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-medium">Current Price</th>
                          <th className="px-4 py-2 font-medium">Market Cap</th>
                          <th className="px-4 py-2 font-medium">Volume</th>
                          <th className="px-4 py-2 font-medium">Change (24 Hours)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2">{token.price || "Fetching..."}</td>
                          <td className="px-4 py-2">${token.marketcap || "Fetching..."}</td>
                          <td className="px-4 py-2">${token.volume || "Fetching..."}</td>
                          <td className="px-4 py-2">{token.change || "Fetching..."}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
        )}
      </div>
    </>
  );
};

export default TokenPriceList;
