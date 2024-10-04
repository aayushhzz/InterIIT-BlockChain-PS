import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Web3 from "web3"; // Correct import of Web3
import axios from "axios";
const d3 = require("d3");
const web3 = new Web3("https://rpc.ankr.com/eth_sepolia");

const ComparePage = () => {
  const [tokenPriceList, setTokenPriceList] = useState([
    { id: 1, gecko: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: 2, gecko: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: 3, gecko: "chainlink", name: "Chainlink", symbol: "LINK" },
    { id: 4, gecko: "usd-coin", name: "USD-Coin", symbol: "USDC" },
  ]);
  const [coinOne, setCoinOne] = useState(tokenPriceList[0]);
  const [coinTwo, setCoinTwo] = useState(tokenPriceList[0]);
  const [Compare, setCompare] = useState(false);
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
  ];
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
          if (token.name != coinOne.name && token.name != coinTwo.name)
            return token;
          const priceFeed = await new web3.eth.Contract(
            aggregatorV3InterfaceABI,
            priceFeedAddresses[token.symbol]
          );

          const roundData = await priceFeed.methods.latestRoundData().call();
          const decimals = await priceFeed.methods.decimals().call();
          const adjustedPrice =
            Number(roundData.answer) / 10 ** Number(decimals);
          let marketcap, volume, change, lastupdated;
          let response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${token.gecko}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          let data = response.data;
          marketcap = data[token.gecko].usd_market_cap;
          volume = data[token.gecko].usd_24h_vol;
          change = data[token.gecko].usd_24h_change;
          lastupdated = data[token.gecko].last_updated_at;
          lastupdated = new Date(lastupdated);
          lastupdated =
            lastupdated.getDate() +
            "/" +
            (lastupdated.getMonth() + 1) +
            " " +
            lastupdated.getHours() +
            ":" +
            lastupdated.getMinutes() +
            ":" +
            lastupdated.getSeconds();
          lastupdated = lastupdated.toString();
          return {
            ...token,
            price: `$${adjustedPrice.toFixed(2)}`,
            marketcap: marketcap.toFixed(2),
            volume: volume.toFixed(2),
            change: change.toFixed(2),
            lastupdated: lastupdated,
          };
        })
      );
      await setTokenPriceList(updatedTokenPrices);
      await setCoinOne(tokenPriceList[coinOne.id - 1]);
      await setCoinTwo(tokenPriceList[coinTwo.id - 1]);
    } catch (error) {
      console.error("Error fetching token prices: ", error.message);
    }
  };

  const fetchTokenData = async (token) => {
    let randomPriceData = [];
    let url = `https://api.coingecko.com/api/v3/coins/${token.gecko}/market_chart?vs_currency=usd&days=1`;
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    response.data.prices.map((price) => {
      randomPriceData.push({ time: new Date(price[0]), price: price[1] });
    });
    return randomPriceData;
  };
  const drawGraph = (colour, randomPriceData) => {
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(`.compareGraph`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(randomPriceData, (d) => d.time))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(randomPriceData, (d) => d.price) - 5,
        d3.max(randomPriceData, (d) => d.price) + 5,
      ])
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.price));

    // Add the line chart
    svg
      .append("path")
      .datum(randomPriceData)
      .attr("fill", "none")
      .attr("stroke", colour)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add the X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(xScale).tickFormat((d) => {
          return d3.timeFormat("%H:%M")(d);
        })
      );

    // Add the Y axis but remove ticks and labels
    svg
      .append("g")
      .call(d3.axisLeft(yScale))
      .call((g) => g.selectAll(".tick").remove());
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + 20)
      .attr("y", height + 30)
      .attr("class", "axis-label")
      .text(() => "Time");

    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 40)
      .attr("x", -height / 2 + 40)
      .attr("class", "axis-label")
      .text("Price Trend (USD)");
  };

  const generateGraph = async (token1, token2) => {
    let randomPriceData = [];
    if (!Compare) setCompare(true);
    d3.select(`.compareGraph`).selectAll("*").remove();
    await fetchTokenData(token1).then((data) => {
      randomPriceData = data;
    });
    drawGraph("steelblue", randomPriceData);
    await fetchTokenData(token2).then((data) => {
      randomPriceData = data;
    });
    drawGraph("red", randomPriceData);
    const svg = d3.select(`.compareGraph`);
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", 580)
      .attr("y", 580)
      .attr("class", "axis-label")
      .text(`red: ${token2.name}`);
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", 600)
      .attr("y", 600)
      .attr("class", "axis-label")
      .text(`blue: ${token1.name}`);
    fetchTokenPriceList();
  };
  return (
    <>
      <Navbar />
      <div className="flex-col">
        <h1 className="text-3xl font-semibold text-center mt-2">
          Compare Cryptocurrencies
        </h1>
        <p>Select two coins and click compare</p>
        <div className="flex-row p-4">
          <div className="flex justify-center items-center mt-1">
            <div className="flex flex-col items-center">
              <label htmlFor="coin1" className="font-bold">
                Coin 1
              </label>
              <select
                name="coin1"
                className="form-select"
                onChange={(e) => setCoinOne(tokenPriceList[e.target.value])}
              >
                {tokenPriceList.map((token, index) => (
                  <option key={token.id} value={index}>
                    {token.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center ml-5">
              <label htmlFor="coin2" className="font-bold">
                Coin 2
              </label>
              <select
                name="coin2"
                className="form-select"
                onChange={(e) => setCoinTwo(tokenPriceList[e.target.value])}
              >
                {tokenPriceList.map((token, index) => (
                  <option key={token.id} value={index}>
                    {token.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center">
          <button
            className="btn btn-primary"
            onClick={() => generateGraph(coinOne, coinTwo)}
          >
            Compare
          </button>
          <svg className="compareGraph"></svg>
          {Compare && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm table-auto">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 font-medium">Token</th>
                    <th className="px-4 py-2 font-medium">Current Price</th>
                    <th className="px-4 py-2 font-medium">Market Cap</th>
                    <th className="px-4 py-2 font-medium">Volume</th>
                    <th className="px-4 py-2 font-medium">Change (24 Hours)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2">
                      {coinOne.name || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      {coinOne.price || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      ${coinOne.marketcap || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      ${coinOne.volume || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      {coinOne.change || "Fetching..."}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">
                      {coinTwo.name || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      {coinTwo.price || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      ${coinTwo.marketcap || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      ${coinTwo.volume || "Fetching..."}
                    </td>
                    <td className="px-4 py-2">
                      {coinTwo.change || "Fetching..."}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ComparePage;
