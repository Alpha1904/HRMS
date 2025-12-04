import React, { useState, useEffect } from "react";
import { Mail, Volume2, MessageSquare } from "lucide-react";
import StatCard from "../../components/StatCard";
import { Link } from "react-router-dom";

export default function Communication() {
  const [activeTab, setActiveTab] = useState("Messages");
  const [loading, setLoading] = useState(false); // À mettre à true si vous chargez des données

  const [stats, setStats] = useState({
    unread: 3,
    announcements: 5,
    activeDiscussions: 2,
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Marie Dupont - RH",
      subject: "Validation de votre demande",
      preview: "Votre demande de congés a été approuvée...",
      time: "Il y a 2h",
      tag: "Nouveau",
    },
    {
      id: 2,
      sender: "Service Formation",
      subject: "Nouvelle formation disponible",
      preview: "Une formation sur le leadership est maintenant...",
      time: "Hier",
      tag: null,
    },
    {
      id: 3,
      sender: "Direction RH",
      subject: "Fiche de paie disponible",
      preview: "Votre bulletin de salaire du mois de...",
      time: "2 jours",
      tag: null,
    },
  ]);

  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      sender: "Direction Générale",
      subject: "Fermeture exceptionnelle",
      preview: "L'entreprise sera fermée le 25...",
      time: "3h",
      tag: "Urgent",
    },
  ]);

  const statsCommDisplay = [
    {
      title: "Messages non lus",
      value: stats.unread,
      icon: <Mail className="w-5 h-5" />,
      className: "bg-gradient-to-r from-[#d13162] to-[#e45a8b]",
    },
    {
      title: "Annonces récentes",
      value: stats.announcements,
      icon: <Volume2 className="w-5 h-5" />,
      className: "bg-gradient-to-r from-[#08d4d8] to-[#24ebec]",
    },
    {
      title: "Discussions actives",
      value: stats.activeDiscussions,
      icon: <MessageSquare className="w-5 h-5" />,
      className: "bg-gradient-to-r from-[#ab12b9] to-[#e33afb]",
    },
  ];

  // Logique de chargement des données
  useEffect(() => {
    // Remplacez par votre appel API pour les données de communication
    // Exemple:
    // const fetchData = async () => {
    //   const data = await auth.me.getCommunication();
    //   setStats({ unread: data.unreadCount, announcements: data.announcementCount, activeDiscussions: data.discussionsCount });
    //   setMessages(data.messages);
    //   setAnnouncements(data.announcements);
    //   setLoading(false);
    // };
    // fetchData();
  }, []);

  const MessageItem = ({ sender, subject, preview, time, tag }) => (
    <div className="p-4 md:p-6 mb-3 rounded-xl bg-white border border-gray-100 shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="p-2 mr-3 border-r-4 border-primary rounded-full bg-white">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>

          <div className="flex flex-col">
            <p className="font-semibold text-gray-800 mb-1">{sender}</p>
            <p className="text-base font-medium text-gray-900 mb-1">
              {subject}
            </p>
            {/* <p className="text-sm text-gray-500">{preview}</p> */}
            <p className="text-sm text-primary mt-2 hover:underline">
              Lire le message
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {/* Temps à droite */}
          <p className="text-xs text-gray-500 mb-2">{time}</p>
          {/* Tag de statut */}
          {tag && (
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full 
                            ${
                              tag === "Nouveau"
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
            >
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <p>Chargement des données de communication...</p>;
  }

  return (
    <div className="space-y-6">
      <h2>Communication</h2>

      {/* --- 1. Cartes d'État (UTILISATION DU StatCard IMPORTÉ) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCommDisplay.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            className={stat.className}
          />
        ))}
      </div>

      {/* --- Interface à Onglets (Messages / Annonces) --- */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex mb-4 bg-gray-200 p-1 rounded-md">
          <button
            onClick={() => setActiveTab("Messages")}
            className={`py-1 px-4 text-center font-medium transition duration-150 w-1/2
                            ${
                              activeTab === "Messages"
                                ? "text-primary bg-white rounded-md"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
          >
            Messages
          </button>

          <button
            onClick={() => setActiveTab("Annonces")}
            className={`py-1 px-4 text-center font-medium transition duration-150 w-1/2
                            ${
                              activeTab === "Annonces"
                                ? "text-primary bg-white rounded-md"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
          >
            Annonces
          </button>
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="space-y-4">
          {activeTab === "Messages" && messages.length > 0 ? (
            messages.map((message) => (
              <MessageItem key={message.id} {...message} />
            ))
          ) : activeTab === "Messages" ? (
            <p className="text-gray-500 text-center py-8">
              Aucun nouveau message.
            </p>
          ) : null}

          {activeTab === "Annonces" && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <MessageItem key={announcement.id} {...announcement} />
            ))
          ) : activeTab === "Annonces" ? (
            <p className="text-gray-500 text-center py-8">
              Aucune annonce récente disponible.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
