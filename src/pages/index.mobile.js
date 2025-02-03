import React, { useEffect, useState, useRef } from 'react';
import Layout from '@theme/Layout';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- Fonctions utilitaires
const convertExcelDateToDDMMYYYY = (serial) => {
  const baseDate = new Date(1900, 0, 1);
  const convertedDate = new Date(baseDate.getTime() + (serial - 2) * 86400000);
  const day = String(convertedDate.getDate()).padStart(2, '0');
  const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${convertedDate.getFullYear()}`;
};

const formatNumber = (number) => {
  if (number >= 1000 && number < 1000000) return (number / 1000).toFixed(0) + "k";
  if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
  return number.toLocaleString();
};

export default function Home() {
  const [chartData, setChartData] = useState(null);
  const [gradientData, setGradientData] = useState(null);
  const [btcPriceData, setBtcPriceData] = useState(null);
  const [showBtcPrice, setShowBtcPrice] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [fullChartData, setFullChartData] = useState(null);
  const [placementAmount, setPlacementAmount] = useState(100);

  // Fonction de calcul des gains
  const calculateEarnings = () => {
    const multiplier = 2400;
    const longOnlyMultiplier = 2400 / 11;
    const earned = placementAmount * multiplier;
    return { earned, difference: earned - placementAmount * longOnlyMultiplier };
  };

  const chartRef = useRef(null);

  // Fonction qui crée le dégradé pour la courbe du graphique
  const getGradient = (context) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return 'rgba(0,0,0,0)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'green');
    gradient.addColorStop(0.5, 'yellow');
    gradient.addColorStop(1, 'red');
    return gradient;
  };

  // Fonction pour récupérer la date de mercredi, soit la dernière (si next=false) ou la prochaine (si next=true)
  const getWednesdayDate = (next = true) => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = next ? (((3 - day + 7) % 7) || 7) : (day === 3 ? 0 : ((day - 3 + 7) % 7 || 7));
    now.setUTCDate(now.getUTCDate() + (next ? diff : -diff));
    return now.toLocaleDateString('en-US');
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/assets/LastUpdatedWithPredictions.xlsx');
      setLastUpdate(getWednesdayDate(false));
      setNextUpdate(getWednesdayDate(true));
      const blob = await response.blob();
      const fileReader = new FileReader();

      fileReader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const labels = jsonData.map((row) => convertExcelDateToDDMMYYYY(row.date));
        const data = jsonData.map((row) => row['Predicted Variable']);
        const btcPrice = jsonData.map((row) => row['btcPrice']);
        const realBtcPrice = btcPrice.map((price) => price);

        // Création unique du dataset pour le modèle Eclipse
        const dataset = {
          label: 'Eclipse Model',
          data,
          borderColor: getGradient,
          borderWidth: 4,
          pointRadius: 2,
          borderDash: [],
        };

        setFullChartData({ labels, datasets: [dataset] });
        setChartData({ labels, datasets: [dataset] });

        setBtcPriceData({
          label: 'BTC Price (Scaled)',
          data: realBtcPrice,
          borderColor: 'black',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.4,
          yAxisID: 'y1',
        });

        setGradientData(data.map((value, index, arr) => (index === 0 ? 0 : value - arr[index - 1])));
      };

      fileReader.readAsArrayBuffer(blob);
    };

    fetchData();
  }, []);

  // Styles en ligne
  const chartContainerStyle = { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    flexDirection: 'column', 
    width: '110%', 
    maxWidth: '1000px', 
    margin: '-0px auto',  // Adds 15px of margin at the top
    height: '350px',  // Increased height for more space below the graph
    paddingBottom: '20px',  // Added padding to separate the buttons
    overflow: 'hidden',  // Prevents overflow
    position: 'relative', 
    left: '50%', 
    transform: 'translateX(-50%)'  // Centers the chart even if width exceeds 100%
  };
  const lastUpdateStyle = { position: 'absolute', top: '65px', right: '10px', color: 'grey', fontSize: '6px', fontStyle: 'italic', textAlign: 'right' };
  const nextUpdateStyle = { position: 'absolute', top: '75px', right: '10px', color: 'grey', fontSize: '6px', fontStyle: 'italic', textAlign: 'right' };
  
  // Options de configuration du graphique
  const options = {
  responsive: true,
  maintainAspectRatio: false, // ✅ Permet d'adapter la hauteur
  aspectRatio: 1.5, // ✅ Garde une bonne proportion
  plugins: {
    legend: { display: true, position: 'top', labels: { boxWidth: 8, font: { size: 10 } } },
    tooltip: { enabled: true, mode: 'index', intersect: false },
    title: { display: true, text: 'Predicted Variable Over Time', font: { size: 12 } },
  },
  scales: {
    x: {
      grid: { display: false },
      title: { display: true, text: 'Date', font: { size: 10 } },
      ticks: { 
        font: { size: 9 }, 
        maxTicksLimit: 5 // ✅ Réduit le nombre d'étiquettes affichées 
      },
    },
    y: {
      type: 'linear',
      position: 'left',
      grid: { display: false },
      title: { display: true, text: 'Eclipse Model', font: { size: 10 } },
      ticks: { font: { size: 9 } },
    },
    y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'BTC Price (Actual)', font: { size: 10 } },
        ticks: { 
          font: { size: 9 }, 
          callback: (value) => `$${value.toLocaleString()}` // ✅ Ensure this line has a preceding comma
        }, // ✅ Missing comma was likely needed here
      },  // ⛔ THIS MUST BE CLOSED PROPERLY
    } 
}
const GradientBar = ({ chartData }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, label: '' });
  if (!chartData || !chartData.datasets || !chartData.datasets.length)
    return <div>No data available</div>;

  const visibleData = chartData.datasets[0].data;
  const latestValue = visibleData[visibleData.length - 1] || 0;
  const rangeMin = -1,
        rangeMax = 1,
        positionPercentage = ((latestValue - rangeMin) / (rangeMax - rangeMin)) * 100;

  const intervals = [
    { min: -1,    max: -0.75, name: 'Bottom cycle (Capitulation)' },
    { min: -0.75, max: -0.5,  name: 'Despair' },
    { min: -0.5,  max: -0.25, name: 'Fear' },
    { min: -0.25, max: 0.25,  name: 'Uncertainty' },
    { min: 0.25,  max: 0.5,   name: 'Doubt' },
    { min: 0.5,   max: 0.75,  name: 'FOMO' },
    { min: 0.75,  max: 1,     name: 'Top cycle (Euphoria)' },
  ];

  // Regroupement des styles utilisés
  const containerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', margin: '0 auto',marginBottom: '-5px' },
        gradientBarStyle = {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          marginTop: '10px',
          height: '30px',
          width: '100%',
          background: 'linear-gradient(to right, red, orange, yellow, green)',
          borderRadius: '5px',
          cursor: 'pointer',
        },
        legendStyle = { display: 'flex', justifyContent: 'space-between', marginTop: '10px', width: '100%', fontSize: '6px', fontWeight: 'bold' },
        legendItemStyle = { textAlign: 'center', flex: 1 };

  const handleMouseMove = (e) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const value = rangeMin + (mouseX / width) * (rangeMax - rangeMin);
    const interval = intervals.find(int => value >= int.min && value <= int.max);
    setTooltip({ 
        visible: true, 
        x: mouseX, 
        label: `${value.toFixed(2)}: ${interval ? interval.name : ''}` 
      });
      
  };

  const handleMouseLeave = () => setTooltip({ visible: false, x: 0, label: '' });

  return (
    <div style={containerStyle}>
      <div style={gradientBarStyle} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {tooltip.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltip.x}px`,  // ✅ Wrapped in backticks
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
        <div
          style={{
            position: 'absolute',
            left: `${positionPercentage}%`,  // ✅ Wrapped in backticks
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'black',
          }}
        />
      </div>
      <div style={legendStyle}>
        {[
          'BOTTOM CYCLE (CAPITULATION)',
          'DESPAIR',
          'FEAR',
          'UNCERTAINTY',
          'DOUBT',
          'FOMO',
          'TOP CYCLE (EUPHORIA)',
        ].map((text, idx) => (
          <div key={idx} style={legendItemStyle}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
  };
  
const handleToggleBtcPrice = () => {
  if (chartData && btcPriceData) {
    if (showBtcPrice) {
      // Supprime le dataset BTC Price
      setChartData(prev => ({
        ...prev,
        datasets: prev.datasets.filter(ds => ds.label !== 'BTC Price (Scaled)'),
      }));
    } else {
      // Ajoute le dataset BTC Price filtré
      const filteredBtcPriceDataset = {
        ...btcPriceData,
        data: chartData.labels.map(label => btcPriceData.data[fullChartData.labels.indexOf(label)]),
      };
      setChartData(prev => ({
        ...prev,
        datasets: [...prev.datasets, filteredBtcPriceDataset],
      }));
    }
    setShowBtcPrice(!showBtcPrice);
  }
};

const filterChartData = (timeframe) => {
  if (!fullChartData || !fullChartData.labels) {
    console.error('Full chart data is not loaded yet.');
    return;
  }
  const now = new Date();
  let cutoffDate;
  switch (timeframe) {
    case '6m':
      cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      break;
    case '3y':
      cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);
      break;
    case '5y':
      cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
      break;
    case 'all':
    default:
      cutoffDate = null;
  }
  const filteredIndices = [];
  const filteredLabels = fullChartData.labels.filter((label, index) => {
    const [day, month, year] = label.split('/').map(Number);
    const labelDate = new Date(year, month - 1, day);
    if (!cutoffDate || labelDate >= cutoffDate) {
      filteredIndices.push(index);
      return true;
    }
    return false;
  });
  const filteredData = fullChartData.datasets[0].data.filter((_, i) => filteredIndices.includes(i));

  // Fonction utilitaire pour interpoler la couleur en fonction d'une valeur
  const getBorderColor = (value) => {
    if (value <= -1) return '#008000';
    if (value >= 1) return '#FF0000';
    const RED = '#008000', YELLOW = '#FFFF00', GREEN = '#FF0000',
          interpolateColor = (start, end, factor) => {
            const hexToRgb = hex => ({
              r: parseInt(hex.substr(1, 2), 16),
              g: parseInt(hex.substr(3, 2), 16),
              b: parseInt(hex.substr(5, 2), 16)
            });
            const s = hexToRgb(start), e = hexToRgb(end);
            return `rgb(${Math.round(s.r + factor * (e.r - s.r))}, ${Math.round(s.g + factor * (e.g - s.g))}, ${Math.round(s.b + factor * (e.b - s.b))})`;
          };
    return value < 0 ? interpolateColor(GREEN, YELLOW, value + 1) : interpolateColor(YELLOW, RED, value);
  };

  const filteredDatasets = fullChartData.datasets.map(dataset => ({
    ...dataset,
    data: filteredIndices.map(i => dataset.data[i]),
    borderColor: filteredData.map(value => getBorderColor(value)),
    pointBackgroundColor: dataset.data.map(value => {
      // Interpolate between red (-1) → yellow (0) → green (1)
    }),
  }));

  if (showBtcPrice) {
    filteredDatasets.push({
      ...btcPriceData,
      data: filteredIndices.map(i => btcPriceData.data[i]),
    });
  }

  setChartData({ labels: filteredLabels, datasets: filteredDatasets });
  setTimeframe(timeframe);
};

          
return (
  <Layout title="Eclipse Model 1.0" description="LSTM Model built to predict bitcoin bottom and top">
    <header className={styles.heroBanner} style={{ marginTop: '-40px' }}>
      <div className="container" style={{ position: 'relative', marginBottom: '0px' }}>
        <div style={lastUpdateStyle}>Last update: {lastUpdate || 'Fetching...'}</div>
        <div style={nextUpdateStyle}>Next update: {nextUpdate || 'Calculating...'}</div>
        <h1 className="hero__title" style={{ fontSize: '20px', textAlign: 'center', marginTop: '20px' }}>Eclipse Bitcoin Cycle Indicator</h1>
        <p className="hero__subtitle" style={{ marginBottom: '20px', marginTop: '-10px', fontSize: '12px' }}>LSTM Model built to predict bitcoin bottom and top</p>

        <div style={chartContainerStyle}>
          {chartData ? (
            <>
              {/* Conteneur du graphique */}
<div style={chartContainerStyle}>
  {chartData ? (
    <>
      <Line data={chartData} options={options} ref={chartRef} />

      {/* Conteneur des boutons sous le graphique */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px', width: '100%', paddingTop: '5px', paddingBottom: '20px' }}>

        
        {/* Bouton pour ajouter/supprimer Bitcoin Price */}
        <button
          style={{
            padding: '5px 8px', 
            fontSize: '12px', 
            backgroundColor: '#f0f0f0', 
            border: '1px solid #ccc', 
            borderRadius: '5px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            marginBottom: '5px'
          }}
          onClick={handleToggleBtcPrice}
        >
          {showBtcPrice ? 'Remove Bitcoin Price' : 'Add Bitcoin Price'}
        </button>

        {/* Boutons de filtre (All, 5Y, 3Y, 6M) */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', '5y', '3y', '6m'].map((time) => (
            <button
              key={time}
              style={{
                padding: '4px 6px', 
                fontSize: '10px', 
                backgroundColor: timeframe === time ? '#dcdcdc' : '#ffffff', 
                border: '1px solid #ccc', 
                borderRadius: '4px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onClick={() => filterChartData(time)}
            >
              {time.toUpperCase()}
            </button>
          ))}
        </div>

      </div>
    </>
  ) : (
    <p style={{ textAlign: 'center', fontSize: '14px', color: 'gray' }}>Loading graph...</p>
  )}
</div>
            </>
          ) : (
            <p>Loading graph...</p>
          )}
        </div>
        <GradientBar chartData={chartData} style={{ marginBottom: '30px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '5px' }}>



        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'left', padding: '0px', boxSizing: 'border-box', marginTop: '0px' }}>

    <input
      type="range"
      min="100"
      max="1000000"
      value={placementAmount}
      onChange={(e) => setPlacementAmount(parseInt(e.target.value))}
      className="range-slider"
      style={{
        width: '100%',
        fontSize: '10px',  // Réduit la taille de la police de la plage
      }}
    />
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '0px' }}>
      <p style={{ margin: 0, fontSize: '10px' }}>Amount Placed: </p>
      <input
        type="number"
        min="0"
        max="1000000"
        value={placementAmount}
        onChange={(e) => setPlacementAmount(Math.min(1000000, Math.max(0, parseInt(e.target.value))))}
        style={{
          width: '100px', // Réduit la largeur du champ de saisie
          padding: '4px',
          fontSize: '10px', // Réduit la taille de la police du champ de saisie
          textAlign: 'center',
          borderRadius: '5px',
          border: '1px solid #ccc',
        }}
      />
    </div>
    <p style={{ marginTop: '0px', fontSize: '10px' }}>
      If you have placed <strong>${formatNumber(placementAmount)}</strong>, you would have earned
      <strong> ${formatNumber(calculateEarnings().earned)}</strong> based on Eclipse's cycle strategy,
      about 11 times more equivalent to an extra <strong>+${formatNumber(calculateEarnings().difference)}</strong> than long-only bitcoin since 2015!
    </p>
  </div>
  <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '10px', boxSizing: 'border-box', fontSize: '10px' }}>
            <h3></h3>
            <p></p>
            <iframe 
  src="/newsletter.html" 
  width="100%" 
  height="300px"
  style={{
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontSize: '14px',
    maxWidth: '600px',  // ✅ Increase width for desktop
    height: '400px',    // ✅ Increase height for desktop
    marginTop: '10px'
  }}
  title="Newsletter Signup">
</iframe>

          </div>
        </div>
      </div>
    </header>
  </Layout>
);
}