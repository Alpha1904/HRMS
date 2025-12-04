import React, { useState, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
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
  UserCircle,
  Settings,
} from "lucide-react";
import { useLogout } from "../pages/Auth/Logout";

// --- Mapping des noms de rôles ---
const roleDisplayNames = {
  EMPLOYEE: "Employé",
  MANAGER: "Manager",
  RECRUITER: "Recruteur",
  CANDIDATE: "Candidat",
  SYSTEM_ADMIN: "Administrateur",
  HR_ADMIN: "Admin des Ressources",
  DEFAULT: "Utilisateur",
};

// --- Menus ---
const itemsGestionnaire = [
  {
    to: "/dashboard",
    label: "Accueil",
    icon: Home,
    title: "Tableau de Bord Gestionnaire",
  },
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
  // { to: "/profile", label: "Mon profil", icon: UserCircle, title: "Mon profil" },
  {
    to: "/setting",
    label: "Réglages",
    icon: Settings,
    title: "Réglages de l'application",
  },
];

const itemsUser = [
  {
    to: "/dashboard",
    label: "Accueil",
    icon: Home,
    title: "Tableau de Bord Employé",
  },
  {
    to: "/user/document",
    label: "Profil & Documents",
    icon: User,
    title: "Mon Profil & Mes Documents",
  },
  {
    to: "/user/leaves",
    label: "Congés & Absences",
    icon: Calendar,
    title: "Demandes de Congés & Absences",
  },
  {
    to: "/user/schedule",
    label: "Mon Planning",
    icon: Clock,
    title: "Mon Planning & Horaires",
  },
  {
    to: "/user/evaluations",
    label: "Mes Évaluations",
    icon: Clipboard,
    title: "Mes Évaluations de Performance",
  },
  {
    to: "/user/trainings",
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
  {
    to: "/profile",
    label: "Mon profil",
    icon: UserCircle,
    title: "Mon profil",
  },
  {
    to: "/setting",
    label: "Réglages",
    icon: Settings,
    title: "Réglages de l'application",
  },
];

// --- Utilitaires ---
const getShortUserName = (name) =>
  !name ? "" : name.length > 8 ? name.slice(0, 6) + "..." : name;

// --- HeaderBar ---
function HeaderBar({ currentPageTitle, toggleSidebar, userName, avatarUrl }) {
  const defaultAvatar = "./img/log.png";
  const finalAvatarUrl = avatarUrl || defaultAvatar;
  const shortUserName = getShortUserName(userName);

  return (
    <header className="flex items-center justify-between bg-white px-4 lg:px-6 py-3 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="text-gray-600 lg:hidden p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-normal text-gray-800">
          {currentPageTitle || "Page Inconnue"}
        </h2>
      </div>

      <div className="flex items-center gap-6">
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

        <div className="flex items-center gap-3">
          <div className="p-2 cursor-pointer relative">
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            <Bell className="w-5 h-5 text-gray-600" />
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />

          <Link to="/profile" className="flex items-center gap-4">
            <div
              className="hidden sm:block text-sm font-medium text-gray-800"
              title={userName}
            >
              {shortUserName}
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-200 border-2 border-primary overflow-hidden cursor-pointer">
              <img
                src={finalAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

// --- Layout ---
export default function Layout() {
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const logout = useLogout();

  const userRoleKey = auth.user?.role || "DEFAULT";
  const isGestionnaire = ["MANAGER", "RECRUITER", "SYSTEM_ADMIN"].includes(
    userRoleKey
  );
  const items = isGestionnaire ? itemsGestionnaire : itemsUser;

  const userName =
    auth.user?.profile?.fullName || auth.user?.email || "Utilisateur Inconnu";
  const avatarUrl = auth.user?.profile?.avatarUrl;
  const isActif = auth.user?.isActive !== false;

  const displayRole = useMemo(
    () => roleDisplayNames[userRoleKey] || roleDisplayNames.DEFAULT,
    [userRoleKey]
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const pageTitle = useMemo(() => {
    const matched = items.find((item) => location.pathname.startsWith(item.to));
    return matched
      ? matched.title
      : isGestionnaire
      ? "Application de Gestion"
      : "Application RH - Employé";
  }, [location.pathname, items, isGestionnaire]);

  return (
    <div className="min-h-screen flex">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 flex flex-col w-[90%] max-w-64 lg:w-64 bg-white shadow-2xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="md:py-6 md:px-4 px-2 py-4 flex items-center justify-between gap-3 border-b border-white/10 text-white bg-primary relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md overflow-hidden">
              <img
                src="./img/log.png"
                alt="Logo HRMS"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-bold">{displayRole}</div>
              <div
                className={`text-sm ${
                  isActif ? "text-green-300" : "text-red-300"
                }`}
              >
                {isActif ? "Profil actif" : "Profil inactif"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className=" lg:hidden text-white/80 hover:text-white p-1"
            aria-label="Close Sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-2 py-4 md:p-4 flex-1 text-gray-600">
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
                    isActive
                      ? "bg-primary text-white"
                      : "hover:bg-primary/20 text-gray-700"
                  }`
                }
              >
                <Icon
                  className={`w-5 h-5 ${
                    location.pathname === it.to ? "text-white" : "text-primary"
                  }`}
                />
                <span>{it.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-2 rounded flex items-center gap-2 justify-center transition-colors hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#F3F3F3] min-h-[calc(100vh)]">
        <HeaderBar
          currentPageTitle={pageTitle}
          toggleSidebar={toggleSidebar}
          userName={userName}
          avatarUrl={avatarUrl}
        />
        <div className="p-4 lg:p-6 w-full overflow-x-hidden h-[90vh] outletMain">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
