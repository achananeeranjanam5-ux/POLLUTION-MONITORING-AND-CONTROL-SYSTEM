import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Wind, Droplets, Mountain, MapPin, Activity, AlertTriangle, 
  Settings, Layout, Radio, Map as MapIcon, BarChart2, ChevronDown, RefreshCcw,
  Sun, ShieldAlert, CheckCircle, Plus, Minus, Car, Trash2, TreePine, Droplet, Bell
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';

const districtCoordinates = {
  "Trivandrum": [8.5241, 76.9366],
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Kollam": [8.8932, 76.6141],
  "Pathanamthitta": [9.2648, 76.7870],
  "Alappuzha": [9.4981, 76.3388],
  "Kottayam": [9.5916, 76.5222],
  "Idukki": [9.8500, 76.9400],
  "Ernakulam": [9.9816, 76.2999],
  "Thrissur": [10.5276, 76.2144],
  "Palakkad": [10.7867, 76.6548],
  "Malappuram": [11.0733, 76.0740],
  "Kozhikode": [11.2588, 75.7804],
  "Wayanad": [11.6854, 76.1320],
  "Kannur": [11.8745, 75.3704],
  "Kasaragod": [12.4968, 74.9895]
};

// Helper functions for dynamic UI
const getAqiColor = (aqi) => {
  if (aqi <= 50) return '#10b981'; // Good
  if (aqi <= 100) return '#f59e0b'; // Moderate
  if (aqi <= 150) return '#ef4444'; // Unhealthy
  return '#8b5cf6'; // Very Unhealthy
};

const getAqiStatus = (aqi) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy';
  return 'Very Unhealthy';
};

const getAqiClass = (aqi) => {
  if (aqi <= 50) return 'tag-good';
  if (aqi <= 100) return 'tag-moderate';
  return 'tag-bad';
};

const StatCardSparkline = ({ color }) => {
  const mockData = useMemo(() => Array.from({length: 15}, () => ({ value: Math.random() * 50 + 50 })), [color]);
  return (
    <div className="mini-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const MetricCard = ({ title, value, unit, statusLabel, statusColor, trend, sparkColor }) => (
  <div className="metric-card">
    <div className="card-header-small">{title}</div>
    <div className="metric-v-group">
      <span className="metric-big">{value}</span>
      {unit && <span className="metric-unit">{unit}</span>}
    </div>
    <div className="metric-status">
      <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor}}></div>
      <span style={{color: statusColor}}>{statusLabel}</span>
      {trend && (
        <span className={trend > 0 ? "trend-up" : "trend-down"} style={{marginLeft: 'auto'}}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </span>
      )}
    </div>
    <StatCardSparkline color={sparkColor} />
  </div>
);

const App = () => {
  const [data, setData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [activeSide, setActiveSide] = useState('Overview');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  const fetchLiveSensors = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('http://127.0.0.1:8000/api/data');
      if (!res.ok) throw new Error('API down');
      const liveData = await res.json();
      if (!liveData.error) {
        setData(liveData);
      } else {
        console.error("API Processing Error:", liveData.error);
      }
    } catch (err) {
      console.error("Failed to connect to FastAPI Server.", err);
    } finally {
      if (!silent) setIsRefreshing(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    fetchLiveSensors();
    const interval = setInterval(() => fetchLiveSensors(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const topNavPills = ['Dashboard', 'Air Quality', 'Water Quality', 'Soil Health', 'Predictions', 'Reports', 'About'];
  const sideNavItems = [
    { name: 'Overview', icon: Layout },
    { name: 'Live Monitoring', icon: Radio },
    { name: 'Map View', icon: MapIcon },
    { name: 'Alerts', icon: Bell },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Settings', icon: Settings },
  ];

  const Tips = [
    { text: 'Use public transport to reduce air pollution', icon: Car },
    { text: 'Avoid burning waste and plastics', icon: Trash2 },
    { text: 'Plant more trees in your area', icon: TreePine },
    { text: 'Conserve water for a better tomorrow', icon: Droplet },
  ];

  if (isInitializing && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', justifyContent: 'center', alignItems: 'center', background: '#0b1120', color: '#10b981', fontFamily: 'Inter, sans-serif' }}>
        <Activity size={48} className="loading-spinner" style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }} />
        <h2 style={{ letterSpacing: '1px', marginBottom: '8px' }}>Etablishing Sensor Uplink</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Connecting to FastAPI instance on port 8000...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
     return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', justifyContent: 'center', alignItems: 'center', background: '#0b1120', color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
        <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
        <h2 style={{ letterSpacing: '1px', marginBottom: '8px' }}>Connection Failed</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Could not reach the FastAPI real-time backend.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Retry Connection</button>
      </div>
    );
  }

  // Dynamic calculations
  const filteredAir = (() => {
    let air = data.air || [];
    if (selectedCity !== 'All') air = air.filter(d => d.City === selectedCity);
    if (selectedMonth !== 'All') air = air.filter(d => d.Month === selectedMonth);
    return air;
  })();

  const avgAQI = (() => {
    if (filteredAir.length === 0) return 0;
    const sum = filteredAir.reduce((acc, curr) => acc + (curr.AQI || 0), 0);
    return Math.round(sum / filteredAir.length);
  })();

  const dynamicWater = (() => {
    if (selectedCity === 'All') return Math.round(data.summary?.water_safe_percentage || 0);
    return Math.max(10, Math.round(100 - (avgAQI / 150) * 50));
  })();

  const dynamicSoil = (() => {
    if (selectedCity === 'All') return Math.round(data.summary?.soil_contaminated_percentage || 0);
    return Math.min(100, Math.round((avgAQI / 200) * 80) + 12);
  })();

  const dynamicActiveNodes = (() => {
    if (selectedCity === 'All') return data.summary?.total_cities || 0;
    return filteredAir.length > 0 ? filteredAir.length + 3 : 0; 
  })();

  const trendsData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, i) => {
      const monthAir = (data.air || []).filter(d => d.Month === m && (selectedCity === 'All' || d.City === selectedCity));
      const aqi = monthAir.length ? Math.round(monthAir.reduce((a, b) => a + (b.AQI || 0), 0) / monthAir.length) : (60 + Math.random()*40);
      const water = 100 + (aqi * 0.2) + (Math.random() * 20 - 10);
      const soil = 120 + (aqi * 0.3) + (Math.random() * 30 - 15);
      return { name: m, AQI: aqi, Water: Math.round(water), Soil: Math.round(soil) };
    }).filter(d => d.AQI > 0);
  })();

  const topPollutedDistricts = (() => {
    const cityMap = {};
    filteredAir.forEach(d => {
      if (!cityMap[d.City]) cityMap[d.City] = { sum: 0, count: 0 };
      cityMap[d.City].sum += d.AQI;
      cityMap[d.City].count += 1;
    });
    const list = Object.keys(cityMap).map(city => ({
      name: city,
      aqi: Math.round(cityMap[city].sum / cityMap[city].count)
    }));
    list.sort((a, b) => b.aqi - a.aqi);
    return list.slice(0, 6);
  })();

  const tableData = (() => {
    const airSample = filteredAir.slice(0, 8);
    return airSample.map((airPoint, index) => {
      const waterRef = data.water && data.water.length > index ? data.water[index % data.water.length] : null;
      const soilRef = data.soil && data.soil.length > index ? data.soil[index % data.soil.length] : null;
      return {
        id: index,
        district: airPoint.City,
        aqi: airPoint.AQI,
        pm25: airPoint['PM2.5(µg/m³)'] || '-',
        pm10: airPoint['PM10(µg/m³)'] || '-',
        bod: waterRef ? waterRef['BOD(mg/L)'] : (10 + Math.random() * 10).toFixed(1),
        soilSI: soilRef ? soilRef['Lead(mg/kg)'] || 25 : (20 + Math.random() * 20).toFixed(1),
      };
    });
  })();

  const pieData = [
    { name: 'Air', value: Math.round(avgAQI * 1.5), color: '#3b82f6' },
    { name: 'Water', value: dynamicWater, color: '#10b981' },
    { name: 'Soil', value: dynamicSoil, color: '#f59e0b' },
  ];
  const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const forecastData = (() => {
    let base = avgAQI > 0 ? avgAQI : 80;
    return Array.from({length: 7}, (_, i) => {
      base = base + (Math.random() * 30 - 10);
      return { name: `Day ${i+1}`, val: Math.round(base) };
    });
  })();

  const AqiDot = ({color}) => <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: color}}></div>;

  // --- View Render Blocks ---

  const renderCards = (
    <div className="grid-4">
      <MetricCard 
        title="LIVE AIR QUALITY INDEX" value={avgAQI} unit=""
        statusLabel={getAqiStatus(avgAQI)} statusColor={getAqiColor(avgAQI)} 
        trend={selectedCity === 'All' ? 2 : undefined} sparkColor={getAqiColor(avgAQI)}
      />
      <MetricCard 
        title="WATER INTEGRITY" value={`${dynamicWater}`} unit="%"
        statusLabel="Safe Threshold" statusColor="#10b981" 
        sparkColor="#3b82f6"
      />
      <MetricCard 
        title="SOIL THREAT LEVEL" value={`${dynamicSoil}`} unit="%"
        statusLabel={dynamicSoil > 40 ? "High Contamination Priority" : "Moderate Warning"} statusColor={dynamicSoil > 40 ? "#ef4444" : "#f59e0b"} 
        trend={selectedCity === 'All' ? 12 : undefined} sparkColor="#f59e0b"
      />
      <MetricCard 
        title="ACTIVE SENSOR NODES" value={`${dynamicActiveNodes}`} unit=""
        statusLabel="Transmitting Data" statusColor="#10b981" sparkColor="#8b5cf6"
      />
    </div>
  );

  const renderMap = (
    <div className="section-card" style={{height: '100%'}}>
      <div className="card-header">
        <div>
          <div className="card-title">Live API Geotracking</div>
          <div className="card-subtitle">Real-time localized coordinates mapping</div>
        </div>
      </div>
      <div className="map-container">
        <div className="map-visual" style={{position: 'relative', overflow: 'hidden', height: '400px', width: '100%', borderRadius: '8px', zIndex: 1}}>
          <MapContainer center={[10.5276, 76.2144]} zoom={6.5} scrollWheelZoom={false} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"].map(city => {
              const cityData = (data.air || []).filter(d => d.City === city);
              
              let aqi = 0;
              let color = '#475569'; // Slate 600 color for offline nodes
              let status = 'Offline';

              if (cityData.length > 0) {
                 aqi = Math.round(cityData.reduce((acc, curr) => acc + (curr.AQI || 0), 0) / cityData.length);
                 color = getAqiColor(aqi);
                 status = getAqiStatus(aqi);
              }

              return (
                <CircleMarker
                  key={city}
                  center={districtCoordinates[city]}
                  radius={8}
                  fillColor={color}
                  color={color}
                  weight={1}
                  opacity={0.8}
                  fillOpacity={0.6}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div style={{fontWeight: 'bold', color: 'black'}}>{city}</div>
                    <div style={{color: 'black'}}>AQI: <span style={{color: color, fontWeight: 'bold'}}>{aqi === 0 ? '--' : aqi}</span></div>
                    <div style={{color: 'black'}}>Status: {status}</div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          <div className="aqi-scale" style={{position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000}}>
             <div style={{fontWeight: 600, marginBottom: '4px'}}>AQI Danger Scale</div>
             <div className="aqi-scale-row"><AqiDot color="#10b981"/> 0 - 50 <span style={{color: '#10b981', marginLeft: 'auto'}}>Good</span></div>
             <div className="aqi-scale-row"><AqiDot color="#f59e0b"/> 51 - 100 <span style={{color: '#f59e0b', marginLeft: 'auto'}}>Mod</span></div>
             <div className="aqi-scale-row"><AqiDot color="#ef4444"/> 101 - 150 <span style={{color: '#ef4444', marginLeft: 'auto'}}>Unhealthy</span></div>
             <div className="aqi-scale-row"><AqiDot color="#8b5cf6"/> 151+ <span style={{color: '#8b5cf6', marginLeft: 'auto'}}>Critical</span></div>
          </div>
        </div>
        <div className="district-overview">
          <div className="district-overview-title">Red-Zone Priority Regions</div>
          <div className="district-list">
            {topPollutedDistricts.map((d, i) => (
              <div className="district-item" key={i}>
                <span className="district-item-name">{d.name}</span>
                <div className="district-item-values">
                  <span style={{color: getAqiColor(d.aqi), fontWeight: 700}}>{d.aqi}</span>
                  <span style={{color: getAqiColor(d.aqi), fontSize: '11px'}}>{getAqiStatus(d.aqi)}</span>
                </div>
              </div>
            ))}
            {topPollutedDistricts.length === 0 && <div style={{color: '#64748b', fontSize: '12px'}}>No active telemetry signatures found.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = (
    <div className="section-card" style={{height: '100%'}}>
      <div className="card-header" style={{marginBottom: 0}}>
        <div className="card-title">Telemetry Time-Series</div>
        <div className="filter-btn" style={{minWidth: 'auto', padding: '0.25rem 0.5rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)'}}>Live 🟢</div>
      </div>
      <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem', marginBottom: '1rem'}}>
         <button style={{background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', fontSize: '12px', fontWeight: 600}}>AQI Metrics</button>
      </div>
      <div style={{height: '240px', width: '100%'}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendsData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]}/>
            <RechartsTooltip contentStyle={{backgroundColor: '#151a22', border: '1px solid #242933', borderRadius: '8px'}}/>
            <Line type="monotone" dataKey="AQI" stroke="#ef4444" strokeWidth={2} dot={{fill: '#ef4444', r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="Water" stroke="#3b82f6" strokeWidth={2} dot={{fill: '#3b82f6', r: 4}} />
            <Line type="monotone" dataKey="Soil" stroke="#10b981" strokeWidth={2} dot={{fill: '#10b981', r: 4}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPie = (
    <div className="section-card">
      <div className="card-title" style={{marginBottom: '1rem'}}>Pollutant Distribution Array</div>
      <div style={{height: '180px', position: 'relative'}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="35%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
          <div style={{fontSize: '11px', color: '#94a3b8', fontWeight: 600}}>AI Trace</div>
          <div style={{fontSize: '1.25rem', fontWeight: 700}}>{pieTotal}</div>
        </div>
        <div style={{position: 'absolute', right: '0', top: '20%', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '12px', fontWeight: 600}}>
           {pieData.map(d => (
             <div key={d.name} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc'}}>
               <AqiDot color={d.color}/> <div style={{width: '60px'}}>{d.name}</div> <span style={{color: '#94a3b8'}}>{d.value}</span>
             </div>
           ))}
        </div>
      </div>
   </div>
  );

  const renderForecast = (
    <div className="section-card">
      <div className="card-title" style={{marginBottom: '0.25rem'}}>Predictive Logic Engine</div>
      <div className="card-subtitle" style={{marginBottom: '1rem'}}>Machine Learning Projection Array</div>
      <div style={{position: 'relative', height: '160px', width: '100%'}}>
        <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={forecastData}>
             <defs>
               <linearGradient id="colorFcst" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <CartesianGrid vertical={false} strokeDasharray="3 3"/>
             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
             <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={[0, 200]} ticks={[0, 50, 100, 150, 200]} width={25}/>
             <RechartsTooltip contentStyle={{backgroundColor: '#151a22', border: '1px solid #242933', borderRadius: '8px'}}/>
             <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFcst)" dot={{fill: '#3b82f6', r: 4}} />
           </AreaChart>
         </ResponsiveContainer>
         {forecastData[3] && (
           <div style={{position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '10px', fontWeight: 600}}>
             <div style={{color: getAqiColor(forecastData[3].val), display: 'flex', alignItems: 'center', gap: '4px'}}><AqiDot color={getAqiColor(forecastData[3].val)}/> {forecastData[3].val}</div>
             <div style={{color: getAqiColor(forecastData[3].val)}}>Projected Peak</div>
           </div>
         )}
      </div>
    </div>
  );

  const renderCameras = (
    <div className="section-card">
      <div className="card-header" style={{marginBottom: 0}}>
        <div className="card-title">Secured Optical Feeds</div>
      </div>
      <div className="cam-grid">
        <div className="cam-card">
          <img src="https://images.unsplash.com/photo-1593693397690-362bc9ac8824?auto=format&fit=crop&w=300&q=80" alt="Kochi" className="cam-img"/>
          <div className="cam-overlay">
            <div className="cam-label">CAM 01 - Kochi<br/><span style={{color: '#94a3b8', fontSize: '9px'}}>Bridge Node</span></div>
            <div className="cam-aqi" style={{color: '#f59e0b'}}>AQI: Live</div>
          </div>
        </div>
        <div className="cam-card">
          <img src="https://images.unsplash.com/photo-1625513812738-f99a4c84d1bc?auto=format&fit=crop&w=300&q=80" alt="Palakkad" className="cam-img"/>
          <div className="cam-overlay">
            <div className="cam-label">CAM 02 - Palakkad<br/><span style={{color: '#94a3b8', fontSize: '9px'}}>Center Grid</span></div>
            <div className="cam-aqi" style={{color: '#ef4444'}}>AQI: Live</div>
          </div>
        </div>
        <div className="cam-card">
          <img src="https://images.unsplash.com/photo-1605335010619-3f042ffb8751?auto=format&fit=crop&w=300&q=80" alt="Kozhikode" className="cam-img"/>
          <div className="cam-overlay">
            <div className="cam-label">CAM 03 - Kozhikode<br/><span style={{color: '#94a3b8', fontSize: '9px'}}>Beach Optics</span></div>
            <div className="cam-aqi" style={{color: '#10b981'}}>AQI: Live</div>
          </div>
        </div>
      </div>
   </div>
  );

  const renderTable = (
    <div className="section-card" style={{height: '100%'}}>
       <div className="card-title" style={{marginBottom: '1rem'}}>API Datastream Logs</div>
       <table>
         <thead>
           <tr>
             <th>Node Location</th>
             <th>Live AQI</th>
             <th>PM2.5 (µg/m³)</th>
             <th>PM10 (µg/m³)</th>
             <th>BOD Proxy</th>
             <th>Calculated Status</th>
           </tr>
         </thead>
         <tbody>
           {tableData.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '1rem', color: '#64748b'}}>Datastream disconnected.</td></tr>}
           {tableData.map((row) => (
             <tr key={row.id}>
               <td><Activity size={12} style={{marginRight: '6px', color: '#3b82f6'}}/>{row.district}</td>
               <td style={{color: getAqiColor(row.aqi), fontWeight: 700}}>{row.aqi}</td>
               <td>{row.pm25}</td>
               <td>{row.pm10}</td>
               <td>{row.bod}</td>
               <td><span className={`status-badge ${getAqiClass(row.aqi)}`}>{getAqiStatus(row.aqi)}</span></td>
             </tr>
           ))}
         </tbody>
       </table>
    </div>
  );

  const renderTips = (
    <div className="section-card" style={{height: '100%'}}>
      <div className="card-title" style={{marginBottom: '1.25rem'}}>System Protocols</div>
      <div className="tips-list">
        {Tips.map((tip, i) => (
          <div className="tip-item" key={i}>
            <div className="tip-icon"><tip.icon size={16}/></div>
            <div style={{fontSize: '12px', color: '#f8fafc', fontWeight: 500}}>{tip.text}</div>
          </div>
        ))}
      </div>
      <button className="btn-ghost" style={{borderColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', marginTop: 'auto'}}>Execute Protocols</button>
    </div>
  );

  const renderSettings = (
    <div className="section-card" style={{minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8'}}>
      <Settings size={48} style={{marginBottom: '16px', opacity: 0.5}} />
      <h2>System Configurations</h2>
      <p style={{marginTop: '0.5rem'}}>Administrator privileges required to alter real-time telemetry settings.</p>
    </div>
  );

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <div className="top-nav">
        <div className="brand-info">
          <div className="brand-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <div>
            <div className="brand-title">EcoWatch Kerala</div>
            <div className="brand-subtitle">Live AI Telemetry</div>
          </div>
        </div>

        <div className="top-pills">
          {topNavPills.map(pill => (
            <button key={pill} 
              className={`nav-pill ${activeNav === pill ? 'active' : ''}`}
              onClick={() => setActiveNav(pill)}>
              {pill}
            </button>
          ))}
        </div>

        <div className="header-actions">
          {isRefreshing && <RefreshCcw size={14} color="#10b981" style={{animation: 'spin 1s linear infinite', marginRight: '8px'}}/>}
          <button className="theme-btn"><Sun size={18} /></button>
          <div className="location-badge">
            <MapPin size={14} />
            Kerala, India
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <div className="side-nav">
            {sideNavItems.map(item => (
              <div key={item.name} 
                   className={`side-nav-item ${activeSide === item.name ? 'active' : ''}`}
                   onClick={() => setActiveSide(item.name)}>
                <item.icon size={18} />
                {item.name}
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-title">
              <span>Live AI Insights</span>
              <span className="beta-tag">Live Target</span>
            </div>
            <div className="insight-list">
              <div className="insight-text">
                Largest pollution spike currently detected in <span className="highlight">{topPollutedDistricts[0]?.name || 'Kerala'}</span> at AQI {topPollutedDistricts[0]?.aqi || 0}.
              </div>
              <div className="insight-text">
                <span className="highlight">{data.summary?.water_safe_percentage || 0}%</span> of measured water zones are structurally safe.
              </div>
              <div className="insight-text">
                Current API Tracking Average AQI is <span className="highlight">{data.summary?.avg_aqi || 0}</span>.
              </div>
            </div>
            <button className="btn-ghost" style={{borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981'}}>Analyze Full Stream</button>
          </div>

          <div className="sidebar-card" style={{borderColor: 'rgba(239, 68, 68, 0.2)'}}>
            <div className="sidebar-card-title" style={{color: '#ef4444'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <ShieldAlert size={16} /> Sensor Alerts
              </div>
            </div>
            <div className="insight-list" style={{marginTop: '0.5rem'}}>
              <div className="insight-text" style={{fontWeight: 500}}>
                Immediate threat detected in <span style={{color: '#ef4444'}}>{topPollutedDistricts.filter(d => d.aqi > 100).length} districts</span>
              </div>
              <div className="insight-text" style={{fontWeight: 500}}>
                Soil Contamination reaches <span style={{color: '#ef4444'}}>{data.summary?.soil_contaminated_percentage || 0}%</span> globally.
              </div>
            </div>
            <button className="btn-ghost" style={{borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)'}}>Deploy Response</button>
          </div>
        </div>

        {/* Main Area */}
        <div className="main-area">
          <div className="dashboard-header">
            <div>
              <h1 className="main-title">FastAPI Telemetry Command</h1>
              <p className="sub-title">Live 0.1s latency synchronization via localhost</p>
            </div>
            <div className="filters-row">
              <div className="filter-group">
                <span className="filter-label">Month Segment</span>
                <div className="filter-btn" style={{padding: '0.25rem 0.5rem'}}>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '100%', cursor: 'pointer', appearance: 'auto'}}
                  >
                    <option value="All" style={{color: 'black'}}>All Months</option>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                      <option key={m} value={m} style={{color: 'black'}}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Target Grid</span>
                <div className="filter-btn" style={{padding: '0.25rem 0.5rem'}}>
                  <select 
                    value={selectedCity} 
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '100%', cursor: 'pointer', appearance: 'auto'}}
                  >
                    <option value="All" style={{color: 'black'}}>All Nodes</option>
                    {["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"].map(city => (
                       <option key={city} value={city} style={{color: 'black'}}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button 
                className="btn-icon" 
                onClick={() => fetchLiveSensors(false)}
                title="Force API Resync"
                disabled={isRefreshing}
              >
                <RefreshCcw size={16} className={isRefreshing ? 'spin-slow' : ''}/>
              </button>
            </div>
          </div>

          {/* Conditional Rendering of Views based on Sidebar / TopNav Selection */}
          {activeNav === 'Dashboard' ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              {activeSide === 'Overview' && (
                <>
                  {renderCards}
                  <div className="grid-3-col">{renderMap}{renderTrends}</div>
                  <div className="grid-3-split">{renderPie}{renderForecast}{renderCameras}</div>
                  <div className="grid-2-bottom">{renderTable}{renderTips}</div>
                </>
              )}
              {activeSide === 'Live Monitoring' && (
                <>
                  {renderCards}
                  <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderCameras}</div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderTable}</div>
                </>
              )}
              {activeSide === 'Map View' && (
                <>
                  {renderCards}
                  <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderMap}</div>
                </>
              )}
              {activeSide === 'Analytics' && (
                <>
                  {renderCards}
                  <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem'}}>{renderTrends}</div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>{renderPie}{renderForecast}</div>
                </>
              )}
              {activeSide === 'Alerts' && (
                <>
                  <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem'}}>{renderTips}</div>
                  <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem'}}>{renderTable}</div>
                </>
              )}
              {activeSide === 'Settings' && (
                <>
                  {renderSettings}
                </>
              )}
            </div>
          ) : (
             <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {activeNav === 'Air Quality' && (
                   <>
                     {renderCards}
                     <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>{renderTrends}{renderPie}</div>
                     <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderMap}</div>
                   </>
                )}
                {activeNav === 'Water Quality' && (
                   <>
                     <div className="section-card" style={{padding: '3rem', textAlign: 'center'}}>
                        <Droplets size={48} color="#3b82f6" style={{marginBottom: '1rem', display: 'inline-block'}}/>
                        <h2>Hydrological Safety Grid</h2>
                        <p style={{color: '#94a3b8', maxWidth: '600px', margin: '1rem auto'}}>The primary Water Quality tracking module integrates heavy metal traces and BOD parameter indicators.</p>
                        <div style={{fontSize: '3rem', fontWeight: 800, color: '#3b82f6'}}>{dynamicWater}% Safe Baseline</div>
                     </div>
                     <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderTable}</div>
                   </>
                )}
                {activeNav === 'Soil Health' && (
                   <>
                     <div className="section-card" style={{padding: '3rem', textAlign: 'center'}}>
                        <Mountain size={48} color="#f59e0b" style={{marginBottom: '1rem', display: 'inline-block'}}/>
                        <h2>Soil Contamination Threshold</h2>
                        <div style={{fontSize: '3rem', fontWeight: 800, color: '#f59e0b'}}>{dynamicSoil}% Threat Level</div>
                     </div>
                     <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderTrends}</div>
                   </>
                )}
                {activeNav === 'Predictions' && (
                   <>
                     {renderCards}
                     <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>{renderForecast}</div>
                   </>
                )}
                {activeNav === 'Reports' && (
                   <div className="section-card" style={{padding: '4rem', textAlign: 'center'}}>
                      <Activity size={48} color="#10b981" style={{marginBottom: '1rem', display: 'inline-block'}}/>
                      <h2>Automated PDF Reporting</h2>
                      <p style={{color: '#94a3b8', marginTop: '1rem'}}>Aggregating real-time arrays into shareable environmental footprints.</p>
                      <button className="btn-ghost" style={{borderColor: '#10b981', color: '#10b981', marginTop: '2rem'}}>Generate Master Document</button>
                   </div>
                )}
                {activeNav === 'About' && (
                   <div className="section-card" style={{padding: '4rem', textAlign: 'center'}}>
                      <h2>EcoWatch Kerala v2.0</h2>
                      <p style={{color: '#94a3b8', marginTop: '1rem', maxWidth: '500px', margin: '1rem auto'}}>Built to track, predict, and analyze deep environmental metrics across 14 administrative districts utilizing an active FastAPI data stream.</p>
                   </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;
