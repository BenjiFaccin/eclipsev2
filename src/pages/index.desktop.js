import React, { useEffect, useState, useRef } from 'react';
import Layout from '@theme/Layout';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { Analytics } from "@vercel/analytics/react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import styles from './index.module.css';
// Test
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


// ✅ Nouvelle version compatible avec "date" (texte ou nombre Excel)
const convertExcelDateToDDMMYYYY = (value) => {
  // Cas 1 : valeur Excel numérique (ex: 45678)
  if (typeof value === 'number') {
    const baseDate = new Date(1900, 0, 1);
    const convertedDate = new Date(baseDate.getTime() + (value - 2) * 86400000);
    const day = String(convertedDate.getDate()).padStart(2, '0');
    const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
    const year = convertedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Cas 2 : valeur texte ISO (ex: "2025-11-10")
  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  // Cas 3 : si vide ou invalide
  return 'Invalid Date';
};


const formatNumber = (number) => {
  if (number >= 1000 && number < 1000000) {
    return (number / 1000).toFixed(0) + "k"; // If the number is between 1k and 999k
  }
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M"; // If the number is in millions
  }
  return number.toLocaleString(); // Return number as is for numbers less than 1000
};

export default function Home() {
  const [chartData, setChartData] = useState(null);
  const [gradientData, setGradientData] = useState(null);
  const [btcPriceData, setBtcPriceData] = useState(null);
  const [showBtcPrice, setShowBtcPrice] = useState(false); // Toggle state for Bitcoin price
  const [lastUpdate, setLastUpdate] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [timeframe, setTimeframe] = useState('all'); // Default to "All"
  const [fullChartData, setFullChartData] = useState(null); // Store the full chart data
  const [placementAmount, setPlacementAmount] = useState(100); // State to handle placement amount

// Function to calculate the earnings
const calculateEarnings = () => {
  const multiplier = 2400;
  const longOnlyMultiplier = 2400 / 11;
  const earned = placementAmount * multiplier;
  const longOnlyEarnings = placementAmount * longOnlyMultiplier;
  const difference = earned - longOnlyEarnings;

  return {
    earned,
    difference,
  };
};

  
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/assets/LastUpdatedWithPredictions.xlsx');

      const getLastWednesdayDate = () => {
        const now = new Date();
        const day = now.getUTCDay();
        
        // If today is Wednesday (day === 3), use today's date as last update
        if (day === 3) {
          return now.toLocaleDateString('en-US'); // Today's date if it's Wednesday
        }
        
        // Otherwise, calculate the last Wednesday
        const daysSinceWednesday = (day - 3 + 7) % 7 || 7; // Days since last Wednesday
        const lastWednesday = new Date(now);
        lastWednesday.setUTCDate(now.getUTCDate() - daysSinceWednesday);
        return lastWednesday.toLocaleDateString('en-US'); // Format as MM/DD/YYYY
      };
      
      const getNextWednesdayDate = () => {
        const now = new Date();
        const day = now.getUTCDay();
        
        // Always calculate the next Wednesday, even if today is Wednesday
        const daysUntilWednesday = (3 - day + 7) % 7 || 7;
        const nextWednesday = new Date(now);
        nextWednesday.setUTCDate(now.getUTCDate() + daysUntilWednesday);
        return nextWednesday.toLocaleDateString('en-US'); // Format as MM/DD/YYYY
      };
      
      // Call the functions after they are defined
      setLastUpdate(getLastWednesdayDate());
      setNextUpdate(getNextWednesdayDate());
            

      const blob = await response.blob();
      const fileReader = new FileReader();

      fileReader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const labels = jsonData.map((row) => convertExcelDateToDDMMYYYY(row.date));
        const data = jsonData.map((row) => row['Predicted Variable']);
        const btcPrice = jsonData.map((row) => row['btcPrice']); // Extract BTC price data

        // Find min and max for scaling BTC price
        const indicatorMin = Math.min(...data);
        const indicatorMax = Math.max(...data);
        const btcMin = Math.min(...btcPrice);
        const btcMax = Math.max(...btcPrice);

        // Normalize BTC price data to match the scale of the indicator
        const realBtcPrice = btcPrice.map((price) => price); // Keep actual BTC prices

        setFullChartData({
          labels,
          datasets: [
            {
              label: 'Eclipse Model',
              data,
              borderColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return 'rgba(0, 0, 0, 0)';
        
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'green');
                gradient.addColorStop(0.5, 'yellow');
                gradient.addColorStop(1, 'red');
                return gradient;
              },
              borderWidth: 4,
              pointRadius: 2,
              borderDash: [],
            },
          ],
        });
        setChartData({
          labels,
          datasets: [
            {
              label: 'Eclipse Model',
              data,
              borderColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return 'rgba(0, 0, 0, 0)';
        
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'green');
                gradient.addColorStop(0.5, 'yellow');
                gradient.addColorStop(1, 'red');
                return gradient;
              },
              borderWidth: 4,
              pointRadius: 2,
              borderDash: [],
            },
          ],
        });
        
        setBtcPriceData({
          label: 'BTC Price (Scaled)',
          data: realBtcPrice,
          borderColor: 'black',
          borderWidth: 2,
          pointRadius: 0, // Keep the line without points
          pointHoverRadius: 0,
          tension: 0.4, // Smooth line
          yAxisID: 'y1', // Link to the second Y-axis
        });
               

        const gradients = data.map((value, index, array) => {
          if (index === 0) return 0;
          return array[index] - array[index - 1];
        });

        setGradientData(gradients);
      };

      fileReader.readAsArrayBuffer(blob);
    };

    fetchData();
  }, []);

  const chartContainerStyle = {
    width: '90%',
    margin: '0 auto',
  };

  const lastUpdateStyle = {
    position: 'absolute',
    top: '100px',
    left: '110px',
    color: 'grey',
    fontSize: '14px',
    fontStyle: 'italic',
  };

  const nextUpdateStyle = {
    position: 'absolute',
    top: '120px',
    left: '110px',
    color: 'grey',
    fontSize: '14px',
    fontStyle: 'italic',
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 10,
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (tooltipItem) => {
            if (tooltipItem.dataset.label === 'BTC Price (Scaled)') {
              return `BTC Price: ${tooltipItem.raw.toFixed(2)}`;
            }
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
      title: {
        display: true,
        text: 'Predicted Variable Over Time',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(200, 200, 200, 0.5)',
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        grid: {
          color: 'rgba(200, 200, 200, 0.5)',
        },
        title: {
          display: true,
          text: 'Eclipse Model',
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false, // Prevent gridlines from overlapping
        },
        title: {
          display: true,
          text: 'BTC Price (Actual)',
        },
        ticks: {
          callback: function (value) {
            return `$${value.toLocaleString()}`; // Format BTC price values
          },
        },
      },
    },
  };
  


  const GradientBar = ({ chartData }) => {
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, label: '' });
  
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
      return <div>No data available</div>; // Avoid conditional rendering of the hook
    }
  
    const visibleData = chartData.datasets[0].data;
    const latestValue = visibleData[visibleData.length - 1] || 0;
  
    const rangeMin = -1;
    const rangeMax = 1;
  
    const positionPercentage = ((latestValue - rangeMin) / (rangeMax - rangeMin)) * 100;
  
    const intervals = [
      { min: -1, max: -0.75, name: 'Bottom cycle (Capitulation)' },
      { min: -0.75, max: -0.5, name: 'Despair' },
      { min: -0.5, max: -0.25, name: 'Fear' },
      { min: -0.25, max: 0.25, name: 'Uncertainty' },
      { min: 0.25, max: 0.5, name: 'Doubt' },
      { min: 0.5, max: 0.75, name: 'FOMO' },
      { min: 0.75, max: 1, name: 'Top cycle (Euphoria)' },
    ];
  
    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const gradientWidth = rect.width;
  
      const value = rangeMin + (mouseX / gradientWidth) * (rangeMax - rangeMin);
  
      // Determine the interval name
      const interval = intervals.find((int) => value >= int.min && value <= int.max);
      const intervalName = interval ? interval.name : '';
  
      setTooltip({
        visible: true,
        x: mouseX,
        label: `${value.toFixed(2)}: ${intervalName}`,
      });
    };
  
    const handleMouseLeave = () => {
      setTooltip({ visible: false, x: 0, label: '' });
    };
  
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '90%',
          margin: '0 auto',
        }}
      >
        {/* Gradient Bar */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginTop: '20px',
            height: '30px',
            width: '100%',
            background: 'linear-gradient(to right, red, orange, yellow, green)',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Tooltip */}
          {tooltip.visible && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltip.x}px`,
                top: '-25px',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '5px',
                borderRadius: '3px',
                fontSize: '12px',
              }}
            >
              {tooltip.label}
            </div>
          )}
  
          {/* Black indicator line */}
          <div
            style={{
              position: 'absolute',
              left: `${positionPercentage}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'black',
            }}
          ></div>
        </div>
  
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            width: '100%',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          <div style={{ textAlign: 'center', flex: 1 }}> BOTTOM CYCLE (CAPITULATION)</div>
          <div style={{ textAlign: 'center', flex: 1 }}> DESPAIR</div>
          <div style={{ textAlign: 'center', flex: 1 }}> FEAR</div>
          <div style={{ textAlign: 'center', flex: 1 }}> UNCERTAINTY</div>
          <div style={{ textAlign: 'center', flex: 1 }}> DOUBT</div>
          <div style={{ textAlign: 'center', flex: 1 }}> FOMO</div>
          <div style={{ textAlign: 'center', flex: 1 }}> TOP CYCLE (EUPHORIA)</div>
        </div>
      </div>
    );
  };
       
  
  const handleToggleBtcPrice = () => {
    if (chartData && btcPriceData) {
      if (showBtcPrice) {
        // Remove the BTC Price dataset
        setChartData((prev) => ({
          ...prev,
          datasets: prev.datasets.filter((dataset) => dataset.label !== 'BTC Price (Scaled)'), // Match the correct label
        }));
      } else {
        // Add the BTC Price dataset
        const filteredBtcPriceDataset = {
          ...btcPriceData,
          data: chartData.labels.map((label) => {
            const index = fullChartData.labels.indexOf(label); // Find corresponding index
            return btcPriceData.data[index]; // Use corresponding BTC Price value
          }),
        };
  
        setChartData((prev) => ({
          ...prev,
          datasets: [...prev.datasets, filteredBtcPriceDataset],
        }));
      }
  
      setShowBtcPrice(!showBtcPrice); // Toggle the button state
    }
  };
  
  const filterChartData = (timeframe) => {
    if (!fullChartData || !fullChartData.labels) {
      console.error('Full chart data is not loaded yet.');
      return;
    }
  
    const now = new Date();
    let cutoffDate;
  
    // Define the cutoff date based on the selected timeframe
    switch (timeframe) {
      case '6m':
        cutoffDate = new Date();
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '3y':
        cutoffDate = new Date();
        cutoffDate.setFullYear(now.getFullYear() - 3);
        break;
      case '5y':
        cutoffDate = new Date();
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case 'all':
      default:
        cutoffDate = null; // No cutoff for "All"
    }
  
    // Parse labels as dates for filtering
    const filteredIndices = [];
    const filteredLabels = fullChartData.labels.filter((label, index) => {
      const [day, month, year] = label.split('/').map(Number); // Parse DD/MM/YYYY
      const labelDate = new Date(year, month - 1, day); // Create Date object
      if (!cutoffDate || labelDate >= cutoffDate) {
        filteredIndices.push(index); // Keep the index of matching labels
        return true;
      }
      return false;
    });
  
    // Filter datasets based on the indices
    const filteredData = fullChartData.datasets[0].data.filter((_, i) => filteredIndices.includes(i));
  
    const filteredDatasets = fullChartData.datasets.map((dataset) => ({
      ...dataset,
      data: filteredIndices.map((i) => dataset.data[i]), // Use filtered indices
      borderColor: filteredData.map((value) => {
        let color;
        if (value <= -1) {
            color = '#008000'; // Exact GREEN at -1
        } else if (value >= 1) {
            color = '#FF0000'; // Exact RED at 1
        } else {
            // Define the exact HEX values based on the default gradient
const RED = '#008000';  // Default green (-1)
const YELLOW = '#FFFF00'; // Default yellow (0)
const GREEN = '#FF0000';    // Default red (1)

// Function to interpolate between two HEX colors
const interpolateColor = (startColor, endColor, factor) => {
    const hexToRgb = (hex) => ({
        r: parseInt(hex.substring(1, 3), 16),
        g: parseInt(hex.substring(3, 5), 16),
        b: parseInt(hex.substring(5, 7), 16),
    });

    const startRGB = hexToRgb(startColor);
    const endRGB = hexToRgb(endColor);

    return `rgb(${Math.round(startRGB.r + factor * (endRGB.r - startRGB.r))}, 
                ${Math.round(startRGB.g + factor * (endRGB.g - startRGB.g))}, 
                ${Math.round(startRGB.b + factor * (endRGB.b - startRGB.b))})`;
};

// Assign colors based on value
if (value <= -1) {
    color = GREEN;  // Exact GREEN at -1
} else if (value >= 1) {
    color = RED;    // Exact RED at 1
} else if (value < 0) {
    // Transition from Green (-1) to Yellow (0)
    const factor = (value + 1);  // Normalize from [-1, 0] to [0, 1]
    color = interpolateColor(GREEN, YELLOW, factor);
} else {
    // Transition from Yellow (0) to Red (1)
    const factor = value;  // Normalize from [0, 1] to [0, 1]
    color = interpolateColor(YELLOW, RED, factor);
}

        }
        return color;
    }),
          pointBackgroundColor: dataset.data.map((value) => {
  
        // Interpolate between red (-1) → yellow (0) → green (1)
      }),
    }));
  
    // If BTC Price is toggled on, re-add it to the datasets
    if (showBtcPrice) {
      const filteredBtcPriceData = {
        ...btcPriceData,
        data: filteredIndices.map((i) => btcPriceData.data[i]), // Filter BTC Price data
      };
  
      filteredDatasets.push(filteredBtcPriceData);
    }
  
    // Update the chart data
    setChartData({
      labels: filteredLabels,
      datasets: filteredDatasets,
    });
  
    setTimeframe(timeframe); // Update the timeframe state
  };
          
  return (
    <Layout
    title="Eclipse Model 1.0"
    description="LSTM Model built to predict bitcoin bottom and top"
    >
    <header className={styles.heroBanner} style={{ marginTop: '-40px' }}>
    <div className="container" style={{ position: 'relative', marginBottom: '0px' }}>
    <div style={lastUpdateStyle}>
    Last update: {lastUpdate || 'Fetching...'}
    </div>
    <div style={nextUpdateStyle}>
    Next update: {nextUpdate || 'Calculating...'}
    </div>
    <h1 className="hero__title" style={{ marginBottom: '-0px' }}>Eclipse Bitcoin Cycle Indicator</h1>
    <p className="hero__subtitle" style={{ marginBottom: '0px' }}>
    LSTM Model built to predict bitcoin bottom and top
    </p>
    <div style={chartContainerStyle}>
    {chartData ? (
    <>
    <div style={{ position: 'relative', marginBottom: '10px' }}>
    <button
    style={{
    position: 'absolute',
    top: '-10px',
    right: 0,
    padding: '5px 10px',
    backgroundColor: 'lightgray',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    }}
    onClick={handleToggleBtcPrice}
    >
    {showBtcPrice ? 'Remove Bitcoin Price' : 'Add Bitcoin Price'}
    </button>
    </div>
    <div style={{ position: 'relative', marginBottom: '10px' }}>
    <button
    style={{
    position: 'absolute',
    top: '-20px',
    right: 0,
    padding: '8px 15px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    onClick={handleToggleBtcPrice}
    >
    {showBtcPrice ? 'Remove Bitcoin Price' : 'Add Bitcoin Price'}
    </button>
    <div
    style={{
    position: 'absolute',
    top: '23px',
    right: 0,
    display: 'flex',
    flexDirection: 'row',
    gap: '5px',
    }}
    >
    <button
    style={{
    padding: '8px 12px',
    backgroundColor: timeframe === 'all' ? '#dcdcdc' : '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    onClick={() => filterChartData('all')}
    >
    All
    </button>
    <button
    style={{
    padding: '8px 12px',
    backgroundColor: timeframe === '5y' ? '#dcdcdc' : '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    onClick={() => filterChartData('5y')}
    >
    5Y
    </button>
    <button
    style={{
    padding: '8px 12px',
    backgroundColor: timeframe === '3y' ? '#dcdcdc' : '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    onClick={() => filterChartData('3y')}
    >
    3Y
    </button>
    <button
    style={{
    padding: '8px 12px',
    backgroundColor: timeframe === '6m' ? '#dcdcdc' : '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    onClick={() => filterChartData('6m')}
    >
    6M
    </button>
    </div>
    </div>
    <Line data={chartData} options={options} ref={chartRef} />
    </>
    ) : (
    <p>Loading graph...</p>
    )}
    </div>
    <GradientBar chartData={chartData} />
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginTop: '20px' }}>
    <div style={{ flex: 1, maxWidth: '50%', textAlign: 'left', padding: '20px', boxSizing: 'border-box' }}>
    <input
    type="range"
    min="100"
    max="1000000"
    value={placementAmount}
    onChange={(e) => setPlacementAmount(parseInt(e.target.value))}
    className="range-slider"
    style={{ width: '100%' }}
    />
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
    <p style={{ margin: 0 }}>Amount Placed: </p>
    <input
    type="number"
    min="0"
    max="1000000"
    value={placementAmount}
    onChange={(e) =>
    setPlacementAmount(Math.min(1000000, Math.max(0, parseInt(e.target.value))))
    }
    style={{
    width: '120px',
    padding: '5px',
    fontSize: '14px',
    textAlign: 'center',
    borderRadius: '5px',
    border: '1px solid #ccc',
    }}
    />
    </div>
    <p style={{ marginTop: '10px' }}>
    If you have placed <strong>${formatNumber(placementAmount)}</strong>, you would have earned
    <strong> ${formatNumber(calculateEarnings().earned)}</strong> based on Eclipse's cycle strategy,
    about 11 times more equivalent to an extra <strong>+${formatNumber(calculateEarnings().difference)}</strong> than long-only bitcoin since 2015!
    </p>
    </div>
    <div style={{ flex: 1, maxWidth: '50%', textAlign: 'center', padding: '20px', boxSizing: 'border-box' }}>
    <h3></h3>
    <p></p>
    <iframe
    src="/newsletter.html"
    width="100%"
    height="300px"
    style={{
    border: '1px solid #ccc',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}
    title="Newsletter Signup"
    ></iframe>
    </div>
    </div>
    </div>
    </header>
    </Layout>
    );
}