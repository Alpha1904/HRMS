// import React from "react";
// import { Link } from "react-router-dom";

// export default function UserLeaves() {
//   return (
//     <div>
//       <h2>Conges utilisateurs</h2>
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

const days = "Jours";

// Définition des constantes pour les statuts
const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
};

// Données Mockées pour les conges ( acquis, pris et restant )
const MOCK_DATA_ALL = [
  {
    title: "acquis",
    total: "13",
  },
  {
    title: "pris",
    total: "8",
  },
  {
    title: "restant",
    total: "5",
  },
];

// Données Mockées pour les conges, ajustées pour le style de l'image
const MOCK_DATA_LEAVES = [
  {
    id: 1,
    title: "Congés payés",
    statusTag: "Approuve",
    startDate: "15 oct. 2024",
    endDate: "19 oct. 2024",
    totalDays: "4 Jours",
  },
  {
    id: 2,
    title: "Congés payés",
    statusTag: "En attente",
    startDate: "20 déc. 2024",
    endDate: "31 déc. 2024",
    totalDays: "11 Jours",
  },
];

export default function UserLeaves() {
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
          <Calendar className="w-4 h-4 text-primary" /> Solde de congés
        </h2>

        <div className="leavesSold mt-4">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
            {MOCK_DATA_ALL.map((allLeaves) => (
              <li key={allLeaves.id}
               className="">
                <li className="text-sm text-gray-500 capitalize">{allLeaves.title}</li>
                <h2 className="font-semibold text-2xl text-gray-800">{allLeaves.total} <span className="text-sm">{days}</span></h2>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- BLOC DE DEMANDES --- */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-2xl md:text-lg font-semibold text-gray-800">
            Mes demandes
          </h3>
          {/* Bouton Créer une demande */}
          <button
            // onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 transition-colors text-white text-sm px-4 py-2 rounded"
          >
            <PlusIcon className="w-4 h-4" /> Nouvelle demande
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_DATA_LEAVES.map((leaves) => (
            <div
              key={leaves.id}
              to={notificationLink}
              className="block p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-150"
            >
              <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-3">
                <div className="">
                  <p className="text-sm text-gray-900 font-medium flex gap-2 items-center mb-2">
                    {leaves.title}
                    {leaves.statusTag && (
                      <span
                        className={`text-xs rounded-full font-normal p-1 bg-gray-200
                      ${
                        leaves.statusTag === "Approuve"
                          ? "bg-green/50 text-green-700"
                          : "bg-blue text-blue-600"
                      }`}
                      >
                        {leaves.statusTag}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-3">
                    Du <span>{leaves.startDate}</span> Au{" "}
                    <span>{leaves.endDate}</span>{" "}
                    <span className="text-gray-900 font-semibold">
                      {leaves.totalDays}
                    </span>
                  </p>
                </div>

                <div className="btn flex flex-row gap-2 items-center">
                  <button className="text-xs border border-gray-200 rounded py-2 px-3 bg-blue/5 hover:bg-inherit/10 transition-all">
                    Modifier
                  </button>
                  <button className="text-xs border border-gray-200 rounded py-2 px-3 bg-blue/5 hover:bg-inherit/10 transition-all">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
