"use client";

import { motion } from "motion/react";
import { 
  Users, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight,
  Filter,
  Download
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  PieChart, Pie
} from "recharts";
import { useEffect, useState } from "react";

// Mock Data for Charts
const revenueData = [
  { name: "Jan", total: 12000 },
  { name: "Feb", total: 15400 },
  { name: "Mar", total: 11200 },
  { name: "Apr", total: 18900 },
  { name: "May", total: 24500 },
  { name: "Jun", total: 22100 },
];

const enrollmentData = [
  { name: "Phuket", count: 420 },
  { name: "Bangkok", count: 380 },
  { name: "Chiang Mai", count: 290 },
  { name: "Krabi", count: 150 },
  { name: "Samui", count: 180 },
];

const skillsData = [
  { name: "Beginner", value: 550, color: "hsl(16 100% 50%)" },
  { name: "Intermediate", value: 340, color: "hsl(210 100% 50%)" },
  { name: "Advanced", value: 120, color: "hsl(16 100% 35%)" },
  { name: "Pro", value: 45, color: "hsl(210 100% 35%)" },
];

export default function DashboardHub() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-10 min-h-screen bg-black" />;

  return (
    <div className="p-10 space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-8">
        <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter">ANALYTICS HUB</h1>
            <p className="text-white/40 font-semibold text-xs tracking-[0.2em] uppercase">Intelligence & Operational Metrics</p>
        </div>
        <div className="flex gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-600 transition-all">
                <Download className="w-4 h-4" /> Export Report
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Enrollment" 
          value="1,284" 
          subValue="+12% from last month" 
          icon={Users} 
          trend="up" 
          trendValue="8.4%"
          chartColor="primary"
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$24,500" 
          subValue="Projected: $30k" 
          icon={CreditCard} 
          trend="up" 
          trendValue="14.2%"
          chartColor="secondary"
        />
        <StatCard 
          title="Active Camps" 
          value="12" 
          subValue="Across 5 locations" 
          icon={Calendar} 
          trend="up" 
          trendValue="2 new"
          chartColor="accent"
        />
        <StatCard 
          title="Success Rate" 
          value="94.2%" 
          subValue="Fighter retention" 
          icon={TrendingUp} 
          trend="down" 
          trendValue="1.2%"
          chartColor="primary"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 glass-surface p-8 rounded-[2.5rem] border border-white/5 relative group">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Revenue Stream</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Monthly Performance Distribution</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(16 100% 50%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(16 100% 50%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                />
                <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value/1000}k`}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                    itemStyle={{ color: "hsl(16 100% 50%)" }}
                />
                <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(16 100% 50%)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Distribution (Pie Chart) */}
        <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 flex flex-col">
            <div className="space-y-1 mb-8">
                <h3 className="text-xl font-bold text-white tracking-tight">Fighter Levels</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Student Distribution</p>
            </div>
            
            <div className="h-[250px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={skillsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {skillsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
                {skillsData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold text-white/60 tracking-wider uppercase">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Bottom Area: Location Enrollment */}
      <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Location Performance</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Enrollment counts by region</p>
            </div>
            <ShieldCheck className="text-white/10 w-8 h-8" />
        </div>

        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.2)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.2)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {enrollmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(16 100% 50%)" : "hsl(210 100% 50%)"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
