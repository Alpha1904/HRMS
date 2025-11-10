// import React from "react";
// import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import {
//   LogOut,
//   Users,
//   Home,
//   Calendar,
//   Briefcase,
//   BookOpen,
//   DollarSign,
//   Clipboard,
//   Mail,
//   BarChart,
//   Clock,
//   Search,
// } from "lucide-react";
// import { logout } from "../store/slices/authSlice";

// const items = [
//   { to: "/", label: "Accueil", icon: Home, title: "Tableau de Bord" },
//   {
//     to: "/employees",
//     label: "Employés",
//     icon: Users,
//     title: "Gestion des utilisateurs",
//   },
//   {
//     to: "/leaves",
//     label: "Congés & Absences",
//     icon: Calendar,
//     title: "Gestion des congés",
//   },
//   {
//     to: "/schedules",
//     label: "Plannings & Horaires",
//     icon: Clock,
//     title: "Gestion des plannings",
//   },
//   {
//     to: "/recruitment",
//     label: "Recrutements",
//     icon: Briefcase,
//     title: "Suivi des recrutements",
//   },
//   {
//     to: "/trainings",
//     label: "Formations",
//     icon: BookOpen,
//     title: "Catalogue de formations",
//   },
//   {
//     to: "/payroll",
//     label: "Paie & Primes",
//     icon: DollarSign,
//     title: "Gestion de la paie",
//   },
//   {
//     to: "/evaluations",
//     label: "Évaluations",
//     icon: Clipboard,
//     title: "Évaluation des performances",
//   },
//   {
//     to: "/communication",
//     label: "Communication",
//     icon: Mail,
//     title: "Centre de communication",
//   },
//   {
//     to: "/reports",
//     label: "Rapports & Statistiques",
//     icon: BarChart,
//     title: "Génération de rapports",
//   },
// ];

// // --- Composant d'Entête (HeaderBar) ---
// function HeaderBar({ currentPageTitle }) {
//   const userName = "Jumael Kamga";

//   return (
//     <header className="flex items-center justify-between bg-white px-6 py-3 shadow-md">
//       <h2 className="text-lg font-normal text-gray-800">
//         {currentPageTitle || "Page Inconnue"}
//       </h2>

//       <div className="flex items-center gap-6">
//         {/* Barre de Recherche */}
//         <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white">
//           <input
//             type="text"
//             placeholder="Recherche..."
//             className="py-2 px-3 text-sm w-48 focus:outline-none"
//           />
//           <button className="bg-[color:var(--primary)] text-white h-full py-2 px-4 text-sm font-medium">
//             GO
//           </button>
//         </div>

//         {/* Séparateur et Infos Utilisateur */}
//         <div className="flex items-center gap-3">
//           {/* Icône de Notification */}
//           <div className="p-2 cursor-pointer relative">
//             <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
//             <Search className="w-5 h-5 text-gray-600" />
//           </div>

//           {/* Séparateur Visuel */}
//           <div className="w-px h-6 bg-gray-300 mx-1" />

//           <Link to=""
//           className="flex items-center gap-4">
//           {/* Profil Utilisateur */}
//           <div className="text-sm font-medium text-gray-800">{userName}</div>

//           {/* Avatar */}
//           <button className="w-10 h-10 rounded-full bg-orange-200 border-2 border-primary overflow-hidden cursor-pointer">
//             <img
//             src="./img/avatar.jpeg"
//               // src="https://images.unsplash.com/photo-1522075469751-3a6694fa2a87?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//               alt={userName}
//               className="w-full h-full object-cover"
//             />
//           </button>
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// // --- Composant Layout ---
// export default function Layout() {
//   const location = useLocation();
//   const navigate = useNavigate(); // Hook pour la navigation
//   const dispatch = useDispatch(); // Hook pour l'état Redux

//   const getCurrentTitle = () => {
//     const currentItem = items.find((item) => item.to === location.pathname);
//     return currentItem ? currentItem.title : "Application RH";
//   };

//   const pageTitle = getCurrentTitle();

//   // --- Déconnexion de l'utilisateur ---
//   const handleLogout = () => {
//     // Suppression du token dans le stockage local et de session
//     localStorage.removeItem("token");
//     sessionStorage.removeItem("token");

//     // Réinitialisation de l'état Redux (user et token à null)
//     dispatch(logout());

//     //Redirection vers la page de connexion
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen flex">
//       <aside
//         className="w-64 flex flex-col"
//         style={{
//           background: "#ffffff",
//         }}
//       >
//         <div className="p-6 flex items-center gap-3 border-b border-white/10 text-white bg-primary">
//           <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
//             HR
//           </div>
//           <div>
//             <div className="font-bold">Administrateur</div>
//             <div className="text-sm text-white/70">Profile actif</div>
//           </div>
//         </div>

//         <nav className="p-4 flex-1 text-gray-600">
//           {items.map((it) => {
//             const Icon = it.icon;
//             return (
//               <NavLink
//                 key={it.to}
//                 to={it.to}
//                 end
//                 className={({ isActive }) =>
//                   `flex items-center gap-3 p-2 rounded mb-3 ${
//                     isActive ? "bg-primary text-white" : "hover:bg-primary/20"
//                   }`
//                 }
//               >
//                 <Icon className="w-5 h-5 text-primary" />
//                 <span>{it.label}</span>
//               </NavLink>
//             );
//           })}
//         </nav>

//         <div className="p-4">
//           {/* Connexion de la fonction de déconnexion */}
//           <button
//             onClick={handleLogout}
//             className="w-full bg-red-600 text-white py-2 rounded flex items-center gap-2 justify-center transition-colors"
//           >
//             <LogOut className="w-4 h-4" /> Se déconnecter
//           </button>
//         </div>
//       </aside>

//       <main className="flex-1 bg-[#F3F3F3]">
//         <HeaderBar currentPageTitle={pageTitle} />

//         <div className="p-6">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// }


import React, { useState } from "react"; // Importer useState
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  LogOut,
  Users,
  Home,
  Calendar,
  Briefcase,
  BookOpen,
  DollarSign,
  Clipboard,
  Mail,
  BarChart,
  Clock,
  Search,
  Menu, // Importer l'icône Menu
  X, // Importer l'icône de fermeture
} from "lucide-react";
import { logout } from "../store/slices/authSlice";

const items = [
  { to: "/dashboard", label: "Accueil", icon: Home, title: "Tableau de Bord" },
  {
    to: "/employees",
    label: "Employés",
    icon: Users,
    title: "Gestion des utilisateurs",
  },
  {
    to: "/leaves",
    label: "Congés & Absences",
    icon: Calendar,
    title: "Gestion des congés",
  },
  {
    to: "/schedules",
    label: "Plannings & Horaires",
    icon: Clock,
    title: "Gestion des plannings",
  },
  {
    to: "/recruitment",
    label: "Recrutements",
    icon: Briefcase,
    title: "Suivi des recrutements",
  },
  {
    to: "/trainings",
    label: "Formations",
    icon: BookOpen,
    title: "Catalogue de formations",
  },
  {
    to: "/payroll",
    label: "Paie & Primes",
    icon: DollarSign,
    title: "Gestion de la paie",
  },
  {
    to: "/evaluations",
    label: "Évaluations",
    icon: Clipboard,
    title: "Évaluation des performances",
  },
  {
    to: "/communication",
    label: "Communication",
    icon: Mail,
    title: "Centre de communication",
  },
  {
    to: "/reports",
    label: "Rapports & Statistiques",
    icon: BarChart,
    title: "Génération de rapports",
  },
];

// --- Composant d'Entête (HeaderBar) ---
// Ajout de la prop 'toggleSidebar'
function HeaderBar({ currentPageTitle, toggleSidebar }) { 
  const userName = "Jumael Kamga";

  return (
    <header className="flex items-center justify-between bg-white px-4 lg:px-6 py-3 shadow-md">
      <div className="flex items-center gap-4">
        {/* Bouton pour afficher/masquer la sidebar sur mobile/PC */}
        <button
          onClick={toggleSidebar}
          className="text-gray-600 lg:hidden p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-normal text-gray-800">
          {currentPageTitle || "Page Inconnue"}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Barre de Recherche (cachée sur mobile) */}
        <div className="hidden sm:flex items-center border border-gray-300 rounded overflow-hidden bg-white">
          <input
            type="text"
            placeholder="Recherche..."
            className="py-2 px-3 text-sm w-48 focus:outline-none"
          />
          <button className="bg-[color:var(--primary)] text-white h-full py-2 px-4 text-sm font-medium">
            GO
          </button>
        </div>

        {/* Séparateur et Infos Utilisateur */}
        <div className="flex items-center gap-3">
          {/* Icône de Notification */}
          <div className="p-2 cursor-pointer relative">
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            <Search className="w-5 h-5 text-gray-600" />
          </div>

          {/* Séparateur Visuel */}
          <div className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />

          <Link to="" className="flex items-center gap-4">
            {/* Profil Utilisateur (caché sur mobile) */}
            <div className="hidden sm:block text-sm font-medium text-gray-800">{userName}</div>

            {/* Avatar */}
            <button className="w-10 h-10 rounded-full bg-orange-200 border-2 border-primary overflow-hidden cursor-pointer">
              <img
                src="./img/avatar.jpeg"
                alt={userName}
                className="w-full h-full object-cover"
              />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// --- Composant Layout ---
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // État pour gérer l'ouverture de la sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const getCurrentTitle = () => {
    const currentItem = items.find((item) => item.to === location.pathname);
    return currentItem ? currentItem.title : "Application RH";
  };

  const pageTitle = getCurrentTitle();

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- Déconnexion de l'utilisateur ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      
      {/* Overlay sombre pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 flex flex-col w-[80%] max-w-64 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white lg:flex lg:w-64`}
      >
        {/* Contenu de la Sidebar */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10 text-white bg-primary">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            HR
          </div>
          <div>
            <div className="font-bold">Administrateur</div>
            <div className="text-sm text-white/70">Profile actif</div>
          </div>
          {/* Bouton de fermeture sur mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 lg:hidden text-white/80 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 flex-1 text-gray-600">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end
                // Fermer la sidebar après la navigation sur mobile
                onClick={() => setIsSidebarOpen(false)} 
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded mb-3 ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/20"
                  }`
                }
              >
                {/* Ajuster la couleur de l'icône en fonction de l'état actif */}
                <Icon className={`w-5 h-5 ${
                    location.pathname === it.to ? 'text-white' : 'text-primary'
                }`} />
                <span>{it.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded flex items-center gap-2 justify-center transition-colors"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#F3F3F3]">
        <HeaderBar currentPageTitle={pageTitle} toggleSidebar={toggleSidebar} /> 

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}