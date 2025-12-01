// import React, { useCallback } from 'react';
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF0000']; 

// export default function DepartmentDistributionChart({ data }) {
    
//     // Formatteur pour la légende
//     const renderLegend = useCallback((value, entry) => {
//         // Affiche le nom du département + le pourcentage
//         return (
//             <span className="text-sm text-gray-700 ml-1">
//                 {value} ({ (entry.payload.percent * 100).toFixed(1) }%)
//             </span>
//         );
//     }, []);
    
//     // Formatteur pour le tooltip (légende au survol)
//     const renderTooltip = useCallback(({ payload }) => {
//         if (payload && payload.length && payload[0].payload) {
//             const item = payload[0].payload;
//             return (
//                 <div className="p-2 bg-white border border-gray-300 rounded shadow-lg text-sm">
//                     <p className="font-bold" style={{ color: item.fill }}>{item.name}</p>
//                     <p>Effectif: {item.count}</p>
//                     <p>Pourcentage: {(item.percent * 100).toFixed(1)}%</p>
//                 </div>
//             );
//         }
//         return null;
//     }, []);

//     return (
//         <div className="bg-white p-4 rounded-lg shadow-md h-96">
//             <h3 className="text-lg font-semibold mb-4">Répartition par Département</h3>
//             <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                     <Pie
//                         data={data}
//                         dataKey="count"
//                         nameKey="name"
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={120}
//                         fill="#8884d8"
//                         labelLine={false}
//                     >
//                         {data.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                         ))}
//                     </Pie>
//                     <Tooltip content={renderTooltip}/>
//                     <Legend 
//                         layout="vertical" 
//                         verticalAlign="middle" 
//                         align="right"
//                         formatter={renderLegend}
//                     />
//                 </PieChart>
//             </ResponsiveContainer>
//         </div>
//     );
// }

import React, { useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Couleurs fixes pour les 6 premiers départements
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF0000']; 

// Fonction pour personnaliser l'affichage des étiquettes (labels)
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, fill }) => {
    const RADIAN = Math.PI / 180;
    // Rayon pour positionner le texte légèrement à l'extérieur des tranches
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 20; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text 
            x={x} 
            y={y} 
            fill={fill} // Utilise la couleur de la tranche pour une meilleure lisibilité
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            className="font-semibold text-sm"
        >
            {/* Affiche le Nom du département et le Pourcentage */}
            {`${name} ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export default function DepartmentDistributionChart({ data }) {
    
    // Formatteur pour le tooltip (légende au survol)
    const renderTooltip = useCallback(({ payload }) => {
        if (payload && payload.length && payload[0].payload) {
            const item = payload[0].payload;
            return (
                <div className="p-2 bg-white border border-gray-300 rounded shadow-lg text-sm">
                    <p className="font-bold" style={{ color: item.fill }}>{item.name}</p>
                    <p>Effectif: {item.count}</p>
                    <p>Pourcentage: {(item.percent * 100).toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    }, []);

    // Formatteur pour la légende (peut être désactivé si les labels sont sur les tranches)
    const renderLegend = useCallback((value) => {
        return (
            <span className="text-sm text-gray-700 ml-1">
                {value}
            </span>
        );
    }, []);


    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
            <h3 className="text-lg mb-4">Répartition par Département</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80} // Rayon réduit pour laisser de la place aux labels
                        fill="#8884d8"
                        labelLine={false} // Désactive les lignes par défaut
                        label={renderCustomizedLabel} // Active le label personnalisé
                    >
                        {data.map((entry, index) => (
                            // Assigne une couleur pour chaque tranche
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={renderTooltip}/>
                    
                    {/* Légende optionnelle si vous ne la commentez pas */}
                    {/* <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        formatter={renderLegend}
                    /> */}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}