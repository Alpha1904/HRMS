// import React, { useState } from "react";
// import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux"; // Ajout de useSelector
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
//   Menu,
//   X,
//   Bell,
//   User, // Ajout pour le menu utilisateur
// } from "lucide-react";
// import { logout } from "../store/slices/authSlice";

// // --- Menu ADMIN (Basé sur le 'items' original) ---
// const itemsAdmin = [ 
//   { to: "/dashboard", label: "Accueil", icon: Home, title: "Tableau de Bord Admin" },
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

// // --- Menu UTILISATEUR (Basé sur vos instructions) ---
// const itemsUser = [
//   { to: "/dashboard", label: "Accueil", icon: Home, title: "Tableau de Bord Employé" },
//   {
//     to: "/profile", 
//     label: "Profil & Documents",
//     icon: User, 
//     title: "Mon Profil & Mes Documents",
//   },
//   {
//     to: "/my-leaves", 
//     label: "Mes Congés & Absences",
//     icon: Calendar,
//     title: "Demandes de Congés & Absences",
//   },
//   {
//     to: "/my-schedule", 
//     label: "Mon Planning",
//     icon: Clock,
//     title: "Mon Planning & Horaires",
//   },
//   {
//     to: "/my-evaluations", 
//     label: "Mes Évaluations",
//     icon: Clipboard,
//     title: "Mes Évaluations de Performance",
//   },
//   {
//     to: "/my-trainings", 
//     label: "Mes Formations",
//     icon: BookOpen,
//     title: "Mes Formations",
//   },
//   {
//     to: "/communication",
//     label: "Communication",
//     icon: Mail,
//     title: "Centre de communication",
//   },
// ];

// // --- Composant d'Entête (HeaderBar) ---
// function HeaderBar({ currentPageTitle, toggleSidebar }) { 
//   const userName = "Jumael Kamga";

//   return (
//     <header className="flex items-center justify-between bg-white px-4 lg:px-6 py-3 shadow-md">
//       <div className="flex items-center gap-4">
//         {/* Bouton pour afficher/masquer la sidebar sur mobile/PC */}
//         <button
//           onClick={toggleSidebar}
//           className="text-gray-600 lg:hidden p-1 rounded hover:bg-gray-100 transition-colors"
//           aria-label="Toggle Sidebar"
//         >
//           <Menu className="w-6 h-6" />
//         </button>
//         <h2 className="text-lg font-normal text-gray-800">
//           {currentPageTitle || "Page Inconnue"}
//         </h2>
//       </div>

//       <div className="flex items-center gap-6">
//         {/* Barre de Recherche (cachée sur mobile) */}
//         <div className="hidden sm:flex items-center border border-gray-300 rounded overflow-hidden bg-white">
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
//             <Bell className="w-5 h-5 text-gray-600" />
//           </div>

//           {/* Séparateur Visuel */}
//           <div className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />

//           <Link to="" className="flex items-center gap-4">
//             {/* Profil Utilisateur (caché sur mobile) */}
//             <div className="hidden sm:block text-sm font-medium text-gray-800">{userName}</div>

//             {/* Avatar */}
//             <button className="w-10 h-10 rounded-full bg-orange-200 border-2 border-primary overflow-hidden cursor-pointer">
//               <img
//                 src="./img/avatar.jpeg"
//                 alt={userName}
//                 className="w-full h-full object-cover"
//               />
//             </button>
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// // --- Composant Layout ---
// export default function Layout() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // 1. Simulation du rôle (À REMPLACER PAR REDUX EN PROD)
//   // const userRole = useSelector((state) => state.auth.user.role);
//   // const isAdmin = userRole === 'admin';
//   const [isAdmin, setIsAdmin] = useState(true); // SIMULATION: true = Admin, false = Employé
//   const [isActif, setIsActif] = useState(false); // SIMULATION: true = actif, false = inactif

//   // 2. Choix de la liste de navigation via TERNARY
//   const items = isAdmin ? itemsAdmin : itemsUser;

//   // État pour gérer l'ouverture de la sidebar
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

//   const getCurrentTitle = () => {
//     const currentItem = items.find((item) => item.to === location.pathname);
//     // 3. Choix du titre par défaut via TERNARY
//     return currentItem 
//       ? currentItem.title 
//       : (isAdmin ? "Application RH - Admin" : "Application RH - Employé");
//   };

//   const pageTitle = getCurrentTitle();

//   // Fonction pour basculer l'état de la sidebar
//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   // --- Déconnexion de l'utilisateur ---
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     sessionStorage.removeItem("token");
//     dispatch(logout());
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen flex">
      
//       {/* Overlay sombre pour mobile (Utilise déjà un TERNARY implicite : {isSidebarOpen && ...}) */}
//       {isSidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/90 z-40 lg:hidden"
//           onClick={() => setIsSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 flex flex-col w-[80%] max-w-64 ${
//           // 4. Position de la Sidebar via TERNARY
//           isSidebarOpen ? "translate-x-0" : "-translate-x-full"
//         } bg-white lg:flex lg:w-64`}
//       >
//         {/* Contenu de la Sidebar */}
//         <div className="p-6 flex items-center gap-3 border-b border-white/10 text-white bg-primary">
//           <div className="w-12 h-12 flex items-center justify-center rounded-md overflow-hidden bg-white/20">
//             <img src="./img/log.png" alt="" className="w-full h-full object-cover"/>
//           </div>
//           <div>
//             {/* 5. Affichage du rôle via TERNARY */}
//             <div className="font-bold">{isAdmin ? "Administrateur" : "Employé"}</div>
//             <div className="text-sm text-white/70">{isActif ? "Profil actif" : "Profil inactif"}</div>
//           </div>
//           {/* Bouton de fermeture sur mobile */}
//           <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 lg:hidden text-white/80 hover:text-white p-1">
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <nav className="p-4 flex-1 text-gray-600">
//           {items.map((it) => {
//             const Icon = it.icon;
//             return (
//               <NavLink
//                 key={it.to}
//                 to={it.to}
//                 end
//                 onClick={() => setIsSidebarOpen(false)} 
//                 className={({ isActive }) =>
//                   `flex items-center gap-3 p-2 rounded mb-3 ${
//                     isActive ? "bg-primary text-white" : "hover:bg-primary/20"
//                   }`
//                 }
//               >
//                 <Icon className={`w-5 h-5 ${
//                     location.pathname === it.to ? 'text-white' : 'text-primary'
//                 }`} />
//                 <span>{it.label}</span>
//               </NavLink>
//             );
//           })}
//         </nav>

//         <div className="p-4">
//           <button
//             onClick={handleLogout}
//             className="w-full bg-red-600 text-white py-2 rounded flex items-center gap-2 justify-center transition-colors"
//           >
//             <LogOut className="w-4 h-4" /> Se déconnecter
//           </button>
//         </div>
//       </aside>

//       <main className="flex-1 bg-[#F3F3F3]">
//         <HeaderBar currentPageTitle={pageTitle} toggleSidebar={toggleSidebar} /> 

//         <div className="p-4 lg:p-6">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// }



import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  Menu,
  X,
  Bell,
  User,
} from "lucide-react";
import { logout } from "../store/slices/authSlice";

// --- Mapping des noms de rôles pour l'affichage ---
const roleDisplayNames = {
    EMPLOYEE: 'Employé',
    MANAGER: 'Manager',
    RECRUITER: 'Recruteur',
    CANDIDATE: 'Candidat',
    SYSTEM_ADMIN: 'Administrateur Système',
    // Rôle non désiré mais conservé comme fallback au cas où il existerait dans la BDD
    HR_ADMIN: 'Admin des Ressources', 
    // Fallback pour tout autre rôle non listé
    DEFAULT: 'Utilisateur' 
};

// --- Menu GESTIONNAIRE (Manager, Recruteur ou Administrateur Système) ---
// Note: Le rôle HR_ADMIN est exclu de ce chemin
const itemsGestionnaire = [
  { to: "/dashboard", label: "Accueil", icon: Home, title: "Tableau de Bord Gestionnaire" },
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

// --- Menu UTILISATEUR (EMPLOYEE ou CANDIDATE) ---
const itemsUser = [
  { to: "/dashboard", label: "Accueil", icon: Home, title: "Tableau de Bord Employé" },
  {
    to: "/profile",
    label: "Profil & Documents",
    icon: User,
    title: "Mon Profil & Mes Documents",
  },
  {
    to: "/my-leaves",
    label: "Mes Congés & Absences",
    icon: Calendar,
    title: "Demandes de Congés & Absences",
  },
  {
    to: "/my-schedule",
    label: "Mon Planning",
    icon: Clock,
    title: "Mon Planning & Horaires",
  },
  {
    to: "/my-evaluations",
    label: "Mes Évaluations",
    icon: Clipboard,
    title: "Mes Évaluations de Performance",
  },
  {
    to: "/my-trainings",
    label: "Mes Formations",
    icon: BookOpen,
    title: "Mes Formations",
  },
  {
    to: "/communication",
    label: "Communication",
    icon: Mail,
    title: "Centre de communication",
  },
];

/**
 * Tronque le nom de l'utilisateur pour l'affichage compact.
 * @param {string} name Le nom complet de l'utilisateur.
 * @returns {string} Le nom tronqué ou le nom complet.
 */
const getShortUserName = (name) => {
    if (!name) return "";
    // Tronque à 6 caractères si la longueur dépasse 8
    if (name.length > 8) {
        return name.slice(0, 6) + '...';
    }
    return name;
};

// --- Composant d'Entête (HeaderBar) ---
function HeaderBar({ currentPageTitle, toggleSidebar, userName, avatarUrl }) {
  
  // URL d'avatar par défaut si l'URL réelle est vide ou non définie
  const defaultAvatar = "./img/avatar.jpeg"; 
  const finalAvatarUrl = avatarUrl || defaultAvatar;
  const shortUserName = getShortUserName(userName);

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
            <Bell className="w-5 h-5 text-gray-600" />
          </div>

          {/* Séparateur Visuel */}
          <div className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />

          <Link to="/profile" className="flex items-center gap-4">
            {/* Profil Utilisateur (Affichage compact avec troncation) */}
            {/* Le nom complet est stocké dans l'attribut title */}
            <div className="hidden sm:block text-sm font-medium text-gray-800" title={userName}>
                {shortUserName}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-orange-200 border-2 border-primary overflow-hidden cursor-pointer">
              <img
                src={finalAvatarUrl} 
                alt={userName}
                className="w-full h-full object-cover"
                // Fallback en cas d'erreur de chargement (ex: si avatarUrl n'existe pas)
                onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
              />
            </div>
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

  // 1. Récupération de l'état d'authentification depuis Redux
  const auth = useSelector((state) => state.auth);
  
  // Détermination des infos utilisateur
  const userRoleKey = auth.user?.role || 'DEFAULT';
  // Tente de récupérer le nom complet du profil (basé sur le schéma) ou utilise l'email/un nom par défaut
  const userName = auth.user?.profile?.fullName || auth.user?.email || "Utilisateur Inconnu"; 
  // URL de l'avatar (supposons qu'il pourrait être dans le profil)
  // Utilise une URL d'image personnalisée si elle existe dans le profil
  const avatarUrl = auth.user?.profile?.avatarUrl; 
  // État d'activité
  const isActif = auth.user?.isActive !== false; 

  // Rôle lisible
  const displayRole = roleDisplayNames[userRoleKey] || roleDisplayNames.DEFAULT;
  
  // 2. Détermination des droits d'accès GESTIONNAIRE (exclut HR_ADMIN)
  // Un utilisateur est "Gestionnaire" s'il est MANAGER, RECRUITER ou SYSTEM_ADMIN
  const isGestionnaire = userRoleKey === 'MANAGER' || userRoleKey === 'RECRUITER' || userRoleKey === 'SYSTEM_ADMIN';
  
  // 3. Choix de la liste de navigation
  const items = isGestionnaire ? itemsGestionnaire : itemsUser;

  // État pour gérer l'ouverture de la sidebar (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getCurrentTitle = () => {
    const currentItem = items.find((item) => item.to === location.pathname);
    // 4. Choix du titre par défaut
    return currentItem
      ? currentItem.title
      : (isGestionnaire ? "Application de Gestion" : "Application RH - Employé");
  };

  const pageTitle = getCurrentTitle();

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- Déconnexion de l'utilisateur ---
  const handleLogout = () => {
    // Suppression des tokens et déconnexion Redux
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
          // 5. Position de la Sidebar
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white lg:flex lg:w-64 shadow-2xl`}
      >
        {/* Contenu de la Sidebar */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10 text-white bg-primary">
          <div className="w-12 h-12 rounded-md overflow-hidden">
            <img src="./img/log.png" alt="Logo HRMS" className="w-full h-full object-cover" />
          </div>
          <div>
            {/* 6. Affichage du rôle et statut */}
            <div className="font-bold">
                {displayRole}
            </div>
            <div className={`text-sm ${isActif ? 'text-green-300' : 'text-red-300'}`}>
                {isActif ? "Profil actif" : "Profil inactif"}
            </div>
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
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded mb-3 transition-colors duration-200 ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/20 text-gray-700"
                  }`
                }
              >
                <Icon className={`w-5 h-5 ${
                    location.pathname === it.to ? 'text-white' : 'text-primary'
                }`} />
                <span>{it.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded flex items-center gap-2 justify-center transition-colors hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#F3F3F3]">
        <HeaderBar 
            currentPageTitle={pageTitle} 
            toggleSidebar={toggleSidebar} 
            userName={userName} 
            avatarUrl={avatarUrl}
        />

        <div className="p-4 lg:p-6 bg-blue-500 min-h-[calc(100vh-80px)] w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}