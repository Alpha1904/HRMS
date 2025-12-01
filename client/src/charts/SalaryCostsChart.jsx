import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Données de simulation (à remplacer par le fetching réel de votre API)
const MOCK_SALARY_DATA = [
    { name: 'Jan', cost: 130000 }, { name: 'Fév', cost: 135000 }, { name: 'Mar', cost: 133000 },
    { name: 'Avr', cost: 139000 }, { name: 'Mai', cost: 140000, active: true }, { name: 'Juin', cost: 141000 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-300 rounded shadow-lg text-sm">
                <p className="font-bold">{label}</p>
                <p className="text-blue-600">Coût Total : {payload[0].value.toLocaleString()}€</p>
            </div>
        );
    }
    return null;
};

export default function SalaryCostsChart() {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-80">
            <h3 className="text-lg mb-4">Coûts Salariaux (€)</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={MOCK_SALARY_DATA} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                        dataKey="cost" 
                        name="Coût Total"
                    >
                        {/* Pour colorer le mois "actif" (Mai dans l'exemple de l'image) */}
                        {MOCK_SALARY_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.active ? '#a5e4ec' : '#3f97e1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}