import { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Clock, Calendar } from 'lucide-react';

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
  const [timeRange, setTimeRange] = useState('1D');
  
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
  
  // Calculate price difference for this time period
  const startPrice = chartData[0].price;
  const endPrice = chartData[chartData.length - 1].price;
  const priceDiff = endPrice - startPrice;
  const percentDiff = ((priceDiff / startPrice) * 100).toFixed(2);
  const isPriceUp = priceDiff >= 0;
  
  return (
    <div className="bg-neutral-800 rounded-xl p-5 border border-neutral-700">
      <div className="flex flex-wrap items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden mr-3">
              <img 
                src={selectedToken?.logoUrl || `https://cryptologos.cc/logos/${tokenSymbol.toLowerCase()}-${tokenSymbol.toLowerCase()}-logo.svg`} 
                alt={tokenSymbol} 
                className="w-6 h-6" 
              />
            </div>
            <div>
              <h3 className="font-medium text-lg">{tokenSymbol}/{baseTokenSymbol}</h3>
              <span className="text-xs text-neutral-400">{selectedToken?.name || "Ethereum"}</span>
            </div>
          </div>
          
          <div className="bg-neutral-700/40 h-10 w-px mx-1"></div>
          
          <div className="flex flex-col">
            <span className="font-mono font-medium text-xl">${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            <span className={`text-xs flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange}% (24h)</span>
            </span>
          </div>
        </div>
        
        <div className="flex space-x-1 mt-3 sm:mt-0">
          {['1H', '1D', '1W', '1M', '1Y'].map((range) => (
            <button 
              key={range}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${timeRange === range 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'hover:bg-neutral-700/70 border border-transparent'}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-5 mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`flex items-center text-sm font-medium ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
            {isPriceUp ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
            <span>{isPriceUp ? '+' : ''}{percentDiff}%</span>
          </div>
          <span className="text-neutral-400 mx-2 text-sm">in {timeRange}</span>
        </div>
        
        <div className="flex items-center text-xs text-neutral-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="chart-container h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPriceUp ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPriceUp ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  try {
                    // Safe handling of the value regardless of its type
                    const payloadValue = payload[0]?.value;
                    const numericValue = typeof payloadValue === 'number' 
                      ? payloadValue 
                      : typeof payloadValue === 'string' 
                        ? parseFloat(payloadValue)
                        : 0;
                    
                    return (
                      <div className="bg-neutral-800 border border-neutral-700 rounded-md p-2 shadow-lg">
                        <p className="font-mono">${numericValue.toFixed(2)}</p>
                      </div>
                    );
                  } catch (e) {
                    return (
                      <div className="bg-neutral-800 border border-neutral-700 rounded-md p-2 shadow-lg">
                        <p className="font-mono">$0.00</p>
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isPriceUp ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
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
