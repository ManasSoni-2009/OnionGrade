import { useState, useMemo } from 'react'
import { Award, Star, Phone, Calendar } from 'lucide-react'
import { useReveal } from '../hooks/useAnimations'

type Period = 'Weekly' | 'Monthly' | 'Yearly';

const PERIODS: Period[] = ['Weekly', 'Monthly', 'Yearly'];

const MOCK_DATA = {
  Weekly: [
    { id: 101, name: 'Vikram Singh', phone: '+91 99887 76655', score: 98, region: 'Pune' },
    { id: 102, name: 'Suresh Patil', phone: '+91 87654 32109', score: 95, region: 'Nashik' },
    { id: 103, name: 'Manish Verma', phone: '+91 91234 56789', score: 93, region: 'Solapur' },
    { id: 104, name: 'Rajesh Gupta', phone: '+91 88776 65544', score: 89, region: 'Dhule' },
    { id: 105, name: 'Anil Deshmukh', phone: '+91 76543 21098', score: 87, region: 'Ahmednagar' },
  ],
  Monthly: [
    { id: 201, name: 'Ramesh Kumar', phone: '+91 98765 43210', score: 97, region: 'Nashik' },
    { id: 202, name: 'Vikram Singh', phone: '+91 99887 76655', score: 96, region: 'Pune' },
    { id: 203, name: 'Dinesh Patel', phone: '+91 76543 21098', score: 95, region: 'Ahmednagar' },
    { id: 204, name: 'Sanjay Rao', phone: '+91 88990 01122', score: 92, region: 'Satara' },
    { id: 205, name: 'Kishore Patil', phone: '+91 77665 54433', score: 90, region: 'Jalgaon' },
    { id: 206, name: 'Amit Sharma', phone: '+91 91234 56789', score: 86, region: 'Solapur' },
  ],
  Yearly: [
    { id: 301, name: 'Ramesh Kumar', phone: '+91 98765 43210', score: 98, region: 'Nashik' },
    { id: 302, name: 'Suresh Singh', phone: '+91 87654 32109', score: 96, region: 'Pune' },
    { id: 303, name: 'Dinesh Patel', phone: '+91 76543 21098', score: 94, region: 'Ahmednagar' },
    { id: 304, name: 'Amit Sharma', phone: '+91 99887 76655', score: 91, region: 'Solapur' },
    { id: 305, name: 'Rajesh Gupta', phone: '+91 88776 65544', score: 89, region: 'Dhule' },
    { id: 306, name: 'Kishore Patil', phone: '+91 77665 54433', score: 88, region: 'Jalgaon' },
    { id: 307, name: 'Anil Deshmukh', phone: '+91 91234 56789', score: 85, region: 'Satara' },
  ]
};

export function Leaderboard() {
  const ref = useReveal()
  const [periodIdx, setPeriodIdx] = useState(0);

  const currentPeriod = PERIODS[periodIdx];
  const farmers = MOCK_DATA[currentPeriod];

  const cyclePeriod = () => {
    setPeriodIdx((prev) => (prev + 1) % PERIODS.length);
  };

  const periodSubtitle = useMemo(() => {
    switch (currentPeriod) {
      case 'Weekly': return 'Rewarding the highest quality farmers of the week';
      case 'Monthly': return 'Rewarding the highest quality farmers of the month';
      case 'Yearly': return 'Rewarding the highest quality farmers of the year';
    }
  }, [currentPeriod]);

  return (
    <div className="page" ref={ref}>
      <div className="page-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4" data-reveal-tier="1">
        <div>
          <h1>Top Performers</h1>
          <p className="text-sm mt-1 text-[#777]">{periodSubtitle}</p>
        </div>
        <button 
          className="button button-primary self-start sm:self-auto cursor-pointer select-none"
          onClick={cyclePeriod}
          title="Click to change period"
        >
          <Calendar size={18} />
          {currentPeriod} Performance
        </button>
      </div>

      <div className="reports-list">
        {farmers.map((farmer, idx) => {
          const isTop3 = idx < 3;
          
          return (
            <div 
              key={farmer.id} 
              data-reveal-tier="2"
              className={`report-item relative overflow-hidden flex items-center p-3 sm:p-4 gap-3 sm:gap-4 bg-white rounded-2xl ${
                isTop3 ? 'ring-2 ring-[#d9f95a] shadow-[0_0_15px_rgba(217,249,90,0.3)]' : ''
              }`}
            >
              {isTop3 && (
                <div className="absolute top-0 right-0 p-1 sm:p-2 opacity-20 pointer-events-none">
                  <Star size={64} fill="#d9f95a" stroke="none" />
                </div>
              )}
              
              <div className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold" style={{ 
                background: isTop3 ? '#f0fad2' : '#f4f4f4',
                color: isTop3 ? '#5b7a13' : '#777',
                width: 44, height: 44 
              }}>
                {isTop3 ? <Award size={22} fill={idx === 0 ? '#d9f95a' : 'none'} /> : <span>#{idx + 1}</span>}
              </div>
              
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <b className="truncate text-[15px] sm:text-base text-[#111]">{farmer.name}</b>
                  {isTop3 && (
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold bg-[#d9f95a] text-[#3f580e] px-2 py-0.5 rounded-full whitespace-nowrap">
                      Top {idx + 1}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] text-[#777] truncate flex items-center gap-3 mt-1">
                  <span>{farmer.region} Region • {farmer.score * 10} kg</span>
                  <span className="flex items-center gap-1 font-medium text-[#4e5056]">
                    <Phone size={12} className="opacity-70" /> {farmer.phone}
                  </span>
                </p>
              </div>

              <div className="text-right flex-shrink-0 z-10 ml-auto">
                <b className="block text-lg sm:text-xl" style={{ color: isTop3 ? '#5b7a13' : 'inherit' }}>{farmer.score}%</b>
                <span className="text-[10px] sm:text-[11px] text-[#888] font-medium uppercase tracking-wide">Avg. Qual</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
