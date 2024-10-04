import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import Web3 from "web3";
import axios from "axios";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-luxon"; // Import the Luxon adapter for time scaling

// Register the required Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  TimeScale
);

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
  const chartRef = useRef(null);
  const [cache, setCache] = useState({});
  const [tableData, setTableData] = useState(null); // State for table data

  const fetchTokenData = async (token) => {
    const cacheKey = `${token.symbol}_prices`;
    const cacheEntry = cache[cacheKey];
    const cacheTTL = 600000; // 10 minutes

    // If cached data is available and not expired, use it
    if (cacheEntry && Date.now() - cacheEntry.timestamp < cacheTTL) {
      return cacheEntry.data;
    }

    let priceData = [];
    const url = `https://api.coingecko.com/api/v3/coins/${token.gecko}/market_chart?vs_currency=usd&days=1`;
    const response = await axios.get(url, {
      headers: { "Content-Type": "application/json" },
    });

    response.data.prices.map((price) => {
      priceData.push({ time: new Date(price[0]), price: price[1] });
    });

    // Cache the fetched data
    setCache((prevCache) => ({
      ...prevCache,
      [cacheKey]: { data: priceData, timestamp: Date.now() },
    }));

    return priceData;
  };

  const fetchTableData = async (token) => {
    const cacheKey = `${token.symbol}_table`;
    const cacheEntry = cache[cacheKey];
    const cacheTTL = 600000; // 10 minutes

    // If cached data is available and not expired, use it
    if (cacheEntry && Date.now() - cacheEntry.timestamp < cacheTTL) {
      return cacheEntry.data;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${token.gecko}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const response = await axios.get(url);
    const { usd_market_cap, usd_24h_vol, usd_24h_change } =
      response.data[token.gecko];

    const tableData = {
      price: response.data[token.gecko].usd,
      marketCap: usd_market_cap,
      volume: usd_24h_vol,
      change24h: usd_24h_change,
    };

    // Cache the fetched table data
    setCache((prevCache) => ({
      ...prevCache,
      [cacheKey]: { data: tableData, timestamp: Date.now() },
    }));

    return tableData;
  };

  const compareTableData = async (token1, token2) => {
    const tableDataOne = await fetchTableData(token1);
    const tableDataTwo = await fetchTableData(token2);

    // Set table data in state to trigger re-render
    setTableData({ tableDataOne, tableDataTwo });
  };

  const generateGraph = async (token1, token2) => {
    if (!Compare) setCompare(true);

    const priceDataOne = await fetchTokenData(token1);
    const priceDataTwo = await fetchTokenData(token2);

    const datasetOne = {
      label: token1.name,
      data: priceDataOne.map((data) => ({
        x: data.time,
        y: data.price,
      })),
      borderColor: "blue",
      fill: false,
    };

    const datasetTwo = {
      label: token2.name,
      data: priceDataTwo.map((data) => ({
        x: data.time,
        y: data.price,
      })),
      borderColor: "red",
      fill: false,
    };

    const chartConfig = {
      type: "line",
      data: {
        datasets: [datasetOne, datasetTwo],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
              tooltipFormat: "HH:mm",
            },
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            title: {
              display: true,
              text: "Price (USD)",
            },
            beginAtZero: false,
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += "$" + context.parsed.y.toFixed(2);
                }
                return label;
              },
            },
          },
        },
      },
    };

    // Destroy the old chart instance before creating a new one
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Ensure the canvas is available before accessing its context
    const ctx = document.getElementById("compareChart");
    if (ctx) {
      chartRef.current = new Chart(ctx.getContext("2d"), chartConfig);
    }
  };

  useEffect(() => {
    if (Compare) {
      compareTableData(coinOne, coinTwo);
    }
  }, [coinOne, coinTwo, Compare]);

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
          <div
            className="chart-container"
            style={{ width: "800px", height: "400px" }}
          >
            <canvas id="compareChart"></canvas>
          </div>
          {tableData && (
            <div className="flex justify-center">
              <table className="min-w-[50%] border-collapse shadow-lg mt-4">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="border p-2 text-center">Metric</th>
                    <th className="border p-2 text-center">{coinOne.name}</th>
                    <th className="border p-2 text-center">{coinTwo.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-100 hover:bg-gray-200 transition duration-300">
                    <td className="border p-2 text-center">Price</td>
                    <td className="border p-2 text-center">
                      ${tableData.tableDataOne.price}
                    </td>
                    <td className="border p-2 text-center">
                      ${tableData.tableDataTwo.price}
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-200 transition duration-300">
                    <td className="border p-2 text-center">Market Cap</td>
                    <td className="border p-2 text-center">
                      ${tableData.tableDataOne.marketCap}
                    </td>
                    <td className="border p-2 text-center">
                      ${tableData.tableDataTwo.marketCap}
                    </td>
                  </tr>
                  <tr className="bg-gray-100 hover:bg-gray-200 transition duration-300">
                    <td className="border p-2 text-center">24h Volume</td>
                    <td className="border p-2 text-center">
                      ${tableData.tableDataOne.volume}
                    </td>
                    <td className="border p-2 text-center">
                      ${tableData.tableDataTwo.volume}
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-200 transition duration-300">
                    <td className="border p-2 text-center">24h Change</td>
                    <td className="border p-2 text-center">
                      {tableData.tableDataOne.change24h}%
                    </td>
                    <td className="border p-2 text-center">
                      {tableData.tableDataTwo.change24h}%
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
