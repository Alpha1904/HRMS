import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Données de simulation (à remplacer par le fetching réel de votre API)
const MOCK_ABSENCES_DATA = [
    { name: 'Jan', absences: 12 }, { name: 'Fév', absences: 18 }, { name: 'Mar', absences: 15 },
    { name: 'Avr', absences: 26 }, { name: 'Mai', absences: 22 }, { name: 'Juin', absences: 18 },
    { name: 'Juil', absences: 29 }, { name: 'Août', absences: 35 }, { name: 'Sep', absences: 19 },
    { name: 'Oct', absences: 16 }, { name: 'Nov', absences: 15 }, { name: 'Déc', absences: 28 },
];

export default function AbsencesChart() {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-80">
            <h3 className="text-lg mb-4">Courbe des Absences</h3>
            <ResponsiveContainer width="100%" height="85%">
                <LineChart data={MOCK_ABSENCES_DATA} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 36]} tickCount={4} />
                    <Tooltip />
                    <Line 
                        type="monotone" 
                        dataKey="absences" 
                        stroke="#3f97e1" 
                        dot={{ r: 5 }} 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                        name="Absences"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}