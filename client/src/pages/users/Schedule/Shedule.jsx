// import React from "react";
// import { Link } from "react-router-dom";

// export default function UserSchedule() {
//   return (
//     <div>
//       <h2>Horaire des utilisateurs</h2>
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
    title: "reunions",
    total: "6",
  },
  {
    title: "formations",
    total: "3",
  },
  {
    title: "heures planifiées",
    total: "13 H",
  },
];

// Données Mockées pour les horaires, ( Reunion, Formation, Entretien )
const MOCK_DATA_LEAVES1 = [
  {
    id: 1,
    icon: CheckCircle,
    title: "Réunion d'équipe",
    type: "Réunion",
    startHour: "08:20",
    endHour: "11:15",
    className: "bg-blue/50",
  },
  {
    id: 2,
    icon: CheckCircle,
    title: "Formation RH",
    type: "Formation",
    startHour: "11:40",
    endHour: "13:15",
    className: "bg-primary/50",
  },
];
// Données Mockées pour les horaires, ( Reunion, Formation, Entretien )
const MOCK_DATA_LEAVES2 = [
  {
    id: 1,
    icon: CheckCircle,
    title: "Entretiens candidats",
    type: "Entretien",
    startHour: "09:50",
    endHour: "16:15",
    className: "bg-green/50",
  },
  {
    id: 2,
    icon: CheckCircle,
    title: "Point avec manager",
    type: "Réunion",
    startHour: "08:20",
    endHour: "11:15",
    className: "bg-blue/50",
  },
];

export default function UserSchedule() {
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
          <Calendar className="w-4 h-4 text-blue" /> Cette semaine
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

      {/* --- BLOC DES HORAIRES 1 --- */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-2xl md:text-lg font-semibold text-gray-800">
            Lundi 1 dec
          </h3>
        </div>

        <div className="space-y-3">
          {MOCK_DATA_LEAVES1.map((horaires) => (
            <div
              key={horaires.id}
              className="block p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-150"
            >
              <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-start md:items-center gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-full">
                    <horaires.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="">
                    {" "}
                    <p className="text-sm text-gray-900 font-medium flex gap-2 items-center mb-0.5">
                      {/* <span className="p-2 bg-blue-50 border border-blue-100 rounded-full"><horaires.icon className="w-4 h-4 text-primary" /></span> */}
                      {horaires.title}
                      <span
                        className={`text-xs rounded-full font-normal p-1 px-2 ${horaires.className}`}
                      >
                        {horaires.type}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                      <span>{horaires.startHour}</span> -
                      <span>{horaires.endHour}</span>{" "}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- BLOC DES HORAIRES 2 --- */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-2xl md:text-lg font-semibold text-gray-800">
            Mardi 2 dec
          </h3>
        </div>

        <div className="space-y-3">
          {MOCK_DATA_LEAVES2.map((horaires) => (
            <div
              key={horaires.id}
              className="block p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-150"
            >
              <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-start md:items-center gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-full">
                    <horaires.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="">
                    {" "}
                    <p className="text-sm text-gray-900 font-medium flex gap-2 items-center mb-0.5">
                      {/* <span className="p-2 bg-blue-50 border border-blue-100 rounded-full"><horaires.icon className="w-4 h-4 text-primary" /></span> */}
                      {horaires.title}
                      <span
                        className={`text-xs rounded-full font-normal p-1 px-2 ${horaires.className}`}
                      >
                        {horaires.type}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                      <span>{horaires.startHour}</span> -
                      <span>{horaires.endHour}</span>{" "}
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
