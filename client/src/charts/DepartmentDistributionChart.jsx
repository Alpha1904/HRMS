import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#00ACC1", "#dc1db5"];

const MOCK_DATA = [
    { name: "IT", count: 32 },
    { name: "Ventes", count: 25 },
    { name: "Marketing", count: 18 },
    { name: "Finance", count: 14 },
    { name: "RH", count: 11 },
    { name: "Hacking", count: 60 },
];

export default function DepartmentDistributionChart({ data }) {
    const [chartData, setChartData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    const RELOAD_MS = 5 * 60 * 1000;

    // Détecter si écran mobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 600);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!data || !data.length) setChartData(MOCK_DATA);
        else setChartData(data);

        const interval = setInterval(() => window.location.reload(), RELOAD_MS);
        return () => clearInterval(interval);
    }, [data]);

    // Label responsive
    const renderLabel = ({ cx, cy, midAngle, outerRadius, percent, name, index }) => {
        const RAD = Math.PI / 180;

        const radius = outerRadius + (isMobile ? 15 : 35); // responsive

        const x = cx + radius * Math.cos(-midAngle * RAD);
        const y = cy + radius * Math.sin(-midAngle * RAD);

        return (
            <text
                x={x}
                y={y}
                fill={COLORS[index]}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                style={{ fontSize: isMobile ? "11px" : "15px", fontWeight: 600 }}
            >
                {`${name} ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div
            className="bg-white p-6 rounded-xl shadow-md"
            style={{
                height: isMobile ? "320px" : "420px", // responsive
                transition: "0.2s",
            }}
        >
            <h3 className="text-lg mb-2">Répartition par Département</h3>

            <div style={{ width: "100%", height: "100%", padding: isMobile ? "10px" : "20px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={isMobile ? 80 : 120} // responsive
                            label={renderLabel}
                            isAnimationActive={true}
                            animationDuration={900}
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>

                        <Tooltip
                            formatter={(value, name) => [`${value}`, `${name}`]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
