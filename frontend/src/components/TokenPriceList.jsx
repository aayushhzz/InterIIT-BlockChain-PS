import React, { useState, useEffect } from "react";
import Web3 from "web3"; // Correct import of Web3
import axios from "axios";
const web3 = new Web3("https://rpc.ankr.com/eth_sepolia");
const d3 = require("d3");

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

  const [tokenPriceList, setTokenPriceList] = useState([
    { id: 1, gecko: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: 2, gecko: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: 3, gecko: "chainlink", name: "Chainlink", symbol: "LINK" },
    { id: 4, gecko: "usd-coin", name: "USD-Coin", symbol: "USDC" },
  ]);

  const [hours, setHours] = useState([true, true, true, true]);
  const [curtoken, setCurToken] = useState(tokenPriceList[0]);

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
          if (token.name != curtoken.name) return token;
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
            `https://api.coingecko.com/api/v3/simple/price?ids=${curtoken.gecko}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          let data = response.data;

          marketcap = data[curtoken.gecko].usd_market_cap;
          volume = data[curtoken.gecko].usd_24h_vol;
          change = data[curtoken.gecko].usd_24h_change;
          lastupdated = data[curtoken.gecko].last_updated_at;
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

      setTokenPriceList(updatedTokenPrices);
    } catch (error) {
      console.error("Error fetching token prices: ", error.message);
    }
  };

  const generateGraph = async (token, hours) => {
    const randomPriceData = [];
    const button = document.querySelector(`.${token.name}-btn`);
    button.innerHTML = hours[token.id - 1]
      ? "Show Weekly Data"
      : "Show Hourly Data";
    if (hours[token.id - 1]) {
      let url = `https://api.coingecko.com/api/v3/coins/${token.gecko}/market_chart?vs_currency=usd&days=1`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      response.data.prices.map((price) => {
        randomPriceData.push({ time: new Date(price[0]), price: price[1] });
      });
    } else {
      let url = `https://api.coingecko.com/api/v3/coins/${token.gecko}/market_chart?vs_currency=usd&days=7`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      response.data.prices.map((price) => {
        randomPriceData.push({ time: new Date(price[0]), price: price[1] });
      });
    }

    randomPriceData.reverse();

    // Set up dimensions for the graph
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create an SVG canvas
    d3.select(`.${token.name}`).selectAll("*").remove(); // Clear existing graph
    const svg = d3
      .select(`.${token.name}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up the scales
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

    // Create the line generator
    const line = d3
      .line()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.price));

    // Add the line to the SVG
    svg
      .append("path")
      .datum(randomPriceData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add the X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(xScale).tickFormat((d) => {
          if (!hours[token.id - 1]) {
            // Weekly data: Show date in "Month Day" format (e.g., "Oct 03")
            return d3.timeFormat("%b %d")(d);
          } else {
            // Hourly data: Show time in "Hour:Minute" format (e.g., "14:30")
            return d3.timeFormat("%H:%M")(d);
          }
        })
      );
    svg.append("g").call(d3.axisLeft(yScale));

    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + 20)
      .attr("y", height + 30)
      .attr("class", "axis-label")
      .text(() => {
        if (!hours[token.id - 1]) {
          return "Date";
        } else {
          return "Time";
        }
      });

    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -height / 2 + 20)
      .attr("class", "axis-label")
      .text("Price (USD)");
    let temp = hours;
    temp[token.id - 1] = !temp[token.id - 1];
    setHours(temp);
  };

  useEffect(() => {
    fetchTokenPriceList();
    tokenPriceList.map((token) => {
      if (curtoken.name == token.name) generateGraph(token, hours);
    });
    const interval = setInterval(() => {
      fetchTokenPriceList();
      console.log("Prices updated every 60 seconds");
    }, 60000);
    return () => clearInterval(interval);
  }, [curtoken]);

  return (
    <>
      <h2 className="text-3xl font-bold underline m-2">
        Cryptocurrency Prices
      </h2>
      <div className="flex justify-center items-center p-5">
      <select
        className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm "
        onChange={(e) => setCurToken(tokenPriceList[e.target.value])}
      >
        {tokenPriceList.map((token, index) => (
          <option key={token.id} value={index}>
            {token.name}
          </option>
        ))}
      </select>
    </div>

      <div className="grid justify-center items-center gap-5">
        {tokenPriceList.map(
          (token) =>
            curtoken.name == token.name && (
              <div
                className="card"
                style={{ width: "1000px", height: "600px" }}
                key={token.id}
              >
                <svg
                  className={`${token.name}`}
                  style={{ margin: "auto" }}
                ></svg>
                <div className="card-body">
                  <button
                    className={`btn btn-primary ${token.name}-btn`}
                    onClick={() => generateGraph(token, hours)}
                  ></button>
                  <h5 className="card-title text-xl font-bold mb-4">
                    {token.name}
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm table-auto">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-medium">
                            Current Price
                          </th>
                          <th className="px-4 py-2 font-medium">Market Cap</th>
                          <th className="px-4 py-2 font-medium">Volume</th>
                          <th className="px-4 py-2 font-medium">
                            Change (24 Hours)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2">
                            {token.price || "Fetching..."}
                          </td>
                          <td className="px-4 py-2">
                            ${token.marketcap || "Fetching..."}
                          </td>
                          <td className="px-4 py-2">
                            ${token.volume || "Fetching..."}
                          </td>
                          <td className="px-4 py-2">
                            {token.change || "Fetching..."}%
                          </td>
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
