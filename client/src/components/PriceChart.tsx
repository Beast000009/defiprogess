import { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenPrices } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceChartProps {
  tokenSymbol?: string;
  baseTokenSymbol?: string;
}

// Generate sample chart data based on real token price
const generateChartData = (basePrice: number, timeRange: string) => {
  let dataPoints = 24;
  let volatility = 0.03; // 3% volatility
  
  switch(timeRange) {
    case '1H':
      dataPoints = 60; // 1 minute intervals for 1 hour
      volatility = 0.005;
      break;
    case '1D':
      dataPoints = 24; // 1 hour intervals for 1 day
      volatility = 0.03;
      break;
    case '1W':
      dataPoints = 7; // 1 day intervals for 1 week
      volatility = 0.08;
      break;
    case '1M':
      dataPoints = 30; // 1 day intervals for 1 month
      volatility = 0.15;
      break;
    case '1Y':
      dataPoints = 12; // 1 month intervals for 1 year
      volatility = 0.35;
      break;
  }
  
  let lastPrice = basePrice;
  const data = [];
  
  for (let i = 0; i < dataPoints; i++) {
    // Random price movement with trend
    const change = lastPrice * volatility * (Math.random() - 0.5);
    lastPrice = lastPrice + change;
    
    // Make sure price stays positive
    if (lastPrice <= 0) lastPrice = basePrice * 0.5;
    
    data.push({
      time: i,
      price: lastPrice
    });
  }
  
  return data;
};

const PriceChart = ({ tokenSymbol = 'ETH', baseTokenSymbol = 'USDT' }: PriceChartProps) => {
  const [timeRange, setTimeRange] = useState('1H');
  
  const { data: tokenPrices, isLoading } = useQuery<any[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 60000
  });

  if (isLoading) {
    return (
      <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div className="flex items-center">
            <Skeleton className="w-8 h-8 rounded-full mr-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex space-x-1 mt-2 sm:mt-0">
            {['1H', '1D', '1W', '1M', '1Y'].map((range) => (
              <Skeleton key={range} className="h-8 w-10" />
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  // Find the token price
  const selectedToken = tokenPrices?.find((token: any) => token.symbol === tokenSymbol);
  const basePrice = selectedToken ? parseFloat(selectedToken.price) : 3245.67;
  const priceChange = selectedToken ? parseFloat(selectedToken.priceChange24h) : 2.45;
  
  // Generate chart data
  const chartData = generateChartData(basePrice, timeRange);
  
  // Calculate price difference
  const startPrice = chartData[0].price;
  const endPrice = chartData[chartData.length - 1].price;
  const priceDiff = endPrice - startPrice;
  const percentDiff = ((priceDiff / startPrice) * 100).toFixed(2);
  
  return (
    <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden mr-2">
              <img 
                src={selectedToken?.logoUrl || `https://cryptologos.cc/logos/${tokenSymbol.toLowerCase()}-${tokenSymbol.toLowerCase()}-logo.svg`} 
                alt={tokenSymbol} 
                className="w-5 h-5" 
              />
            </div>
            <h3 className="font-medium text-lg">{tokenSymbol}/{baseTokenSymbol}</h3>
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-medium text-xl">${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            <span className={`text-xs flex items-center ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
              <i className={`${priceChange >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
              <span>{priceChange >= 0 ? '+' : ''}{priceChange}%</span>
            </span>
          </div>
        </div>
        <div className="flex space-x-1 mt-2 sm:mt-0">
          {['1H', '1D', '1W', '1M', '1Y'].map((range) => (
            <button 
              key={range}
              className={`px-3 py-1.5 text-sm rounded-lg ${timeRange === range ? 'bg-primary bg-opacity-20 text-primary-light' : 'hover:bg-neutral-700'}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  try {
                    return (
                      <div className="bg-neutral-800 border border-neutral-700 rounded-md p-2 shadow-lg">
                        <p className="font-mono">${Number(payload[0].value).toFixed(2)}</p>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
