// import React from "react";
// import { Link } from "react-router-dom";

// export default function UserEvaluations() {
//   return (
//     <div>
//       <h2>Evaluation utilisateurs</h2>
//     </div>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../../components/StatCard";
import {
  Briefcase,
  UserCheck,
  Wallet,
  Bell,
  Calendar,
  CheckCircle,
  GraduationCap,
  FileText,
  PlusCircle,
  Plus,
} from "lucide-react"; // Import des nouvelles icônes
import { toast } from "react-toastify";
import { PlusIcon } from "lucide-react";
import { all } from "axios";

const hours = "H";

// Définition des constantes pour les statuts
const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
};

// Données Mockées pour les planings ( reunions, formations et heures planifiées )
const MOCK_DATA_ALL = [
  {
    title: "Note moyenne",
    total: "3.2/5",
  },
  {
    title: "Objectifs atteints",
    total: "76%",
  },
  {
    title: "Prochaine évaluation",
    total: "Oct 2026",
  },
];

// Données Mockées pour les historic, ( Reunion, Formation, Entretien )
const MOCK_DATA_LEAVES1 = [
  {
    id: 1,
    icon: CheckCircle,
    title: "Année 2027",
    type: "à venir",
    date: "prévu : Déc 2026",
    className: "bg-blue/50",
  },
  {
    id: 2,
    icon: CheckCircle,
    title: "Année 2024",
    type: "terminé",
    date: "Complétée : Sept. 2024",
    star: "3.2/5",
    className: "bg-green text-white",
  },
];
// Données Mockées pour les historic, ( Reunion, Formation, Entretien )
const MOCK_DATA_LEAVES2 = [
  {
    id: 1,
    icon: CheckCircle,
    title: "Année 2027",
    type: "à venir",
    date: "déc 2026",
    className: "bg-blue/50",
  },
  {
    id: 2,
    icon: CheckCircle,
    title: "Année 2024",
    type: "terminé",
    date: "sept. 2024",
    className: "bg-green/50 text-white",
  },
];

export default function UserEvaluations() {
  const [stats, setStats] = useState({
    leaves: 14,
    position: "Beginner",
    payment: 30,
  });
  const [loading, setLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const notificationLink = "/communication";

  if (loading) {
    return <p>Chargement des statistiques...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl md:text-lg text-gray-800 font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue" /> Performance globale
        </h2>

        <div className="leavesSold mt-4">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
            {MOCK_DATA_ALL.map((allLeaves) => (
              <li key={allLeaves.id} className="">
                <li className="text-sm text-gray-500 capitalize">
                  {allLeaves.title}
                </li>
                <h2 className="font-semibold text-2xl text-gray-800">
                  {allLeaves.total}
                </h2>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- BLOC DES historic 1 --- */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-2xl md:text-lg font-semibold text-gray-800">
            Historique des évaluations
          </h3>
        </div>

        <div className="space-y-3">
          {MOCK_DATA_LEAVES1.map((historic) => (
            <div
              key={historic.id}
              className="block p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-150"
            >
              <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-start md:items-center gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-full">
                    <historic.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="">
                    {" "}
                    <p className="text-sm text-gray-900 font-medium flex gap-2 items-center mb-0.5">
                      {/* <span className="p-2 bg-blue-50 border border-blue-100 rounded-full"><historic.icon className="w-4 h-4 text-primary" /></span> */}
                      {historic.title}
                      <span
                        className={`text-xs rounded-full font-normal p-1 px-2 ${historic.className}`}
                      >
                        {historic.type}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                      {historic.date}
                    </p>

                    <div className="percentBar">
                      <span className="w-full h-2 rounded-full bg-blue block"></span>
                    </div>
                  </div>
                </div>
                <Link
                  to="#"
                  className="text-xs py-2 px-3 bg-gray-100 border border-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Voir détails
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- BLOC DES historic 2 --- */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-2xl md:text-lg font-semibold text-gray-800">
            Mardi 2 dec
          </h3>
        </div>

        <div className="space-y-3">
          {MOCK_DATA_LEAVES2.map((historic) => (
            <div
              key={historic.id}
              className="block p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-150"
            >
              <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-start md:items-center gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-full">
                    <historic.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="">
                    {" "}
                    <p className="text-sm text-gray-900 font-medium flex gap-2 items-center mb-0.5">
                      {/* <span className="p-2 bg-blue-50 border border-blue-100 rounded-full"><historic.icon className="w-4 h-4 text-primary" /></span> */}
                      {historic.title}
                      <span
                        className={`text-xs rounded-full font-normal p-1 px-2 ${historic.className}`}
                      >
                        {historic.type}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                      <span>{historic.startHour}</span> -
                      <span>{historic.endHour}</span>{" "}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
