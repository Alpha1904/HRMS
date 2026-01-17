
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../../components/StatCard";
import { Briefcase, UserCheck, Wallet, Bell, Calendar, CheckCircle, GraduationCap, FileText } from "lucide-react"; // Import des nouvelles icônes
import { toast } from "react-toastify";

// Définition des constantes pour les statuts
const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
};

// 🌟 Données Mockées pour les Notifications, ajustées pour le style de l'image
const MOCK_DATA_NOTIFICATION = [
  { id: 1, text: "Votre demande de congés a été validée", icon: CheckCircle, time: "Il y a 2 heures", statusTag: "Nouveau", type: "conges" },
  { id: 2, text: "Nouvelle formation disponible", icon: GraduationCap, time: "Il y a 5 heures", statusTag: "Info", type: "formation" },
  { id: 3, text: "Votre fiche de paie est accessible", icon: FileText, time: "Hier", statusTag: "Info", type: "paie" },
  { id: 4, text: "Rappel : Réunion d'équipe à 14h", icon: Bell, time: "Il y a 10 minutes", statusTag: null, type: "rappel" },
];

export default function UserDashboard() {
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
      <div className="grid grid-cols-2 md:grid-cols-3 md:gap-4 gap-1 mb-6">
        <StatCard
          icon={<Briefcase className="w-4 h-4" />}
          title="Poste"
          value={stats.position}
          className="bg-gradient-to-r from-[#3f97e1] to-[#2879cd]"
        />
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          title={<p><span className="md:hidden">Solde de co...</span> <span className="hidden md:block">Solde de congés</span></p>}
          value={<p>{stats.leaves} Jrs</p>}
          className="bg-gradient-to-r from-[#0add2a] to-[#05901b]"
        />
        <StatCard
          icon={<Wallet className="w-4 h-4" />}
          title="Prochain paiement"
          value={<p>{stats.payment} Dec</p>}
          className="bg-gradient-to-r from-[#febb01] to-[#dc7303]"
        />
      </div>

      {/* --- BLOC DE NOTIFICATIONS --- */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 mr-2 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800">Notifications récentes</h3>
        </div>
        
        <div className="space-y-3">
          {MOCK_DATA_NOTIFICATION.map((notification) => (
            <Link 
              key={notification.id} 
              to={notificationLink} 
              className="block p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition duration-150"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start md:items-center gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-full">
                    <notification.icon className="w-4 h-4 text-primary" />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{notification.text}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
                
                {/* Tag de statut à droite */}
                {notification.statusTag && (
                  <span 
                    className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full 
                      ${notification.statusTag === 'Nouveau' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`
                    }
                  >
                    {notification.statusTag}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}