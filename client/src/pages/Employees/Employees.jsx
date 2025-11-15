import React, { useEffect, useState, useCallback, useMemo } from "react";
import { employees } from "../../api/api";
import {
  PlusCircle,
  Eye,
  Trash2,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Pencil,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

// --- Constantes de Rôles pour cohérence ---
const ROLES = [
  "EMPLOYEE",
  "MANAGER",
  "HR_ADMIN",
  "RECRUITER",
  "CANDIDATE",
  "SYSTEM_ADMIN",
];

// --- Helpers de l'Application ---
const truncateText = (text) => {
  if (!text) return "—";
  const str = String(text);
  if (str.length > 10) {
    return str.slice(0, 8) + "...";
  }
  return str;
};

function StatCard({ title, value, className, icon }) {
  return (
    <div className={`p-3 rounded shadow text-white ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl shadow-2xl p-3 rounded">{icon}</div>
        <div className="">
          <p className="text-sm">{title}</p>
          <h2 className="text-3xl font-bold fontFamily-montserrat">{value}</h2>
        </div>
      </div>
    </div>
  );
}

// Helpers pour l'accès aux données
const getFullName = (emp) =>
  emp.profile?.fullName ||
  emp.fullName ||
  `${emp.surname || ""} ${emp.name || ""}`.trim() ||
  "Utilisateur";
const getAvatarUrl = (emp) => emp.profile?.avatarUrl || emp.avatarUrl;
const getDepartment = (emp) => emp.profile?.department || emp.department || "—";
const getPosition = (emp) => emp.profile?.position || emp.position || "—";
const getRole = (emp) => emp.role || "—";

// Composant Modal
function EmployeeModal({ open, onClose, onAction, employeeToEdit }) {
  const isEditing = !!employeeToEdit;

  const [id, setId] = useState(employeeToEdit?.id || null);
  const [email, setEmail] = useState(employeeToEdit?.email || "");
  const [phone, setPhone] = useState(employeeToEdit?.phone || "");
  const [surname, setSurname] = useState(employeeToEdit?.surname || "");
  const [name, setName] = useState(employeeToEdit?.name || "");
  const [role, setRole] = useState(employeeToEdit?.role || "EMPLOYEE");
  const [isActive, setIsActive] = useState(employeeToEdit?.isActive ?? true);
  const [tenantId, setTenantId] = useState(
    employeeToEdit?.tenantId || "acme-corp"
  );
  const [department, setDepartment] = useState(
    employeeToEdit?.profile?.department || employeeToEdit?.department || ""
  );
  const [position, setPosition] = useState(
    employeeToEdit?.profile?.position || employeeToEdit?.position || ""
  );
  const [contractType, setContractType] = useState(
    employeeToEdit?.profile?.contractType || employeeToEdit?.contractType || ""
  );
  const [town, setTown] = useState(employeeToEdit?.town || "");
  const [sex, setSex] = useState(employeeToEdit?.sex || "");
  const [country, setCountry] = useState(employeeToEdit?.country || "");
  const [birth, setBirth] = useState(employeeToEdit?.birth || "");

  useEffect(() => {
    if (employeeToEdit) {
      setId(employeeToEdit.id || null);
      setEmail(employeeToEdit.email || "");
      setPhone(employeeToEdit.phone || "");

      const nameParts =
        employeeToEdit.profile?.fullName?.split(" ") ||
        employeeToEdit.fullName?.split(" ") ||
        [];
      setSurname(employeeToEdit.surname || nameParts[0] || "");
      setName(employeeToEdit.name || nameParts.slice(1).join(" ") || "");

      setRole(employeeToEdit.role || "EMPLOYEE");
      // Gère la valeur 'false' stockée comme string pour l'affichage dans le select
      setIsActive(
        String(employeeToEdit.isActive) === "true" ||
          employeeToEdit.isActive === true
      );
      setTenantId(employeeToEdit.tenantId || "acme-corp");

      setDepartment(
        employeeToEdit.profile?.department || employeeToEdit.department || ""
      );
      setPosition(
        employeeToEdit.profile?.position || employeeToEdit.position || ""
      );
      setContractType(
        employeeToEdit.profile?.contractType ||
          employeeToEdit.contractType ||
          ""
      );

      setTown(employeeToEdit.town || "");
      setCountry(employeeToEdit.country || "");
      setSex(employeeToEdit.sex || "");
      setBirth(employeeToEdit.birth || "");
    } else {
      setId(null);
      setEmail("");
      setPhone("");
      setSurname("");
      setName("");
      setRole("EMPLOYEE");
      setIsActive(true);
      setTenantId("acme-corp");
      setDepartment("");
      setPosition("");
      setContractType("");
      setTown("");
      setCountry("");
      setSex("");
      setBirth("");
    }
  }, [employeeToEdit]);

  const handleAction = async () => {
    const effectiveFullName = `${surname} ${name}`.trim();

    const payload = {
      email,
      phone,
      role,
      isActive,
      tenantId,
      surname,
      name,
      town,
      country,
      sex,
      birth,
      profile: {
        fullName: effectiveFullName,
        department,
        position,
        contractType,
      },
    };

    await onAction(id, payload);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-[35rem]">
        <h3 className="h-bold text-lg mb-6">
          {isEditing ? "Modifier l'employé" : "Enregistrer un nouvel employé"}
        </h3>
        <div className="input flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="surname" className="mb-1">
                Prénom
              </label>
              <input
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Prénom"
                className="w-full p-2 border"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="mb-1">
                Nom
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom"
                className="w-full p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="mb-1">
                Rôle
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border bg-white"
              >
                {/* Utilisation de la constante ROLES */}
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="isActive" className="mb-1">
                Statut
              </label>
              <select
                id="isActive"
                // Afficher la valeur comme string 'true' ou 'false'
                value={String(isActive)}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className="w-full p-2 border bg-white"
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="phone" className="mb-1">
                Téléphone
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Téléphone"
                className="w-full p-2 border"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="mb-1">
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="position" className="mb-1">
                Position
              </label>
              <input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Position/Rôle"
                className="w-full p-2 border"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="contractType" className="mb-1">
                Type de Contrat
              </label>
              <input
                id="contractType"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="Type de Contrat"
                className="w-full p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="department" className="mb-1">
                Département
              </label>
              <input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Département"
                className="w-full p-2 border"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="town" className="mb-1">
                Ville
              </label>
              <input
                id="town"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="Ville"
                className="w-full p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="country" className="mb-1">
                Pays
              </label>
              <input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Pays"
                className="w-full p-2 border"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sex" className="mb-1">
                Sexe
              </label>
              <input
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                placeholder="Sexe"
                className="w-full p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="birth" className="mb-1">
                Naissance
              </label>
              <input
                id="birth"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                placeholder="Naissance"
                className="w-full p-2 border"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="py-3 px-6 border rounded">
            Annuler
          </button>
          <button
            onClick={handleAction}
            className="py-3 px-6 bg-primary text-white rounded"
          >
            {isEditing ? "Sauvegarder" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// État initial des filtres
const initialFilters = {
  role: "",
  department: "",
  position: "",
  status: "",
  dateRange: "",
  customDate: "",
};

// Fonction pour lire l'état initial depuis l'URL (PERSISTENCE)
const getInitialStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search);

  // Lecture de la pagination
  const currentPage = parseInt(params.get("page")) || 1;

  // Lecture des filtres
  const filters = {
    role: params.get("role") || initialFilters.role,
    department: params.get("dept") || initialFilters.department,
    position: params.get("pos") || initialFilters.position,
    status: params.get("status") || initialFilters.status,
    dateRange: params.get("dateRange") || initialFilters.dateRange,
    customDate: params.get("customDate") || initialFilters.customDate,
  };

  return { currentPage, filters };
};

// Composant Employees
export default function Employees() {
  // --- INITIALISATION DE L'ÉTAT BASÉE SUR L'URL ---
  const initialState = getInitialStateFromUrl();

  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  const [currentPage, setCurrentPage] = useState(initialState.currentPage);
  const [filters, setFilters] = useState(initialState.filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const usersPerPage = 5;
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    news: 0,
  });

  // Valeurs uniques pour les options de filtre
  const uniqueDepartments = useMemo(
    () => [
      ...new Set(
        list.map((emp) => getDepartment(emp)).filter((d) => d !== "—")
      ),
    ],
    [list]
  );
  const uniquePositions = useMemo(
    () => [
      ...new Set(list.map((emp) => getPosition(emp)).filter((p) => p !== "—")),
    ],
    [list]
  );

  // Réinitialisation des filtres
  const resetFilters = () => setFilters(initialFilters);

  // --- PERSISTENCE DE L'ÉTAT DANS L'URL ---
  useEffect(() => {
    const params = new URLSearchParams();

    // Ajouter les valeurs non vides à l'URL
    if (currentPage > 1) params.set("page", currentPage.toString());

    if (filters.role) params.set("role", filters.role);
    if (filters.department) params.set("dept", filters.department);
    if (filters.position) params.set("pos", filters.position);
    if (filters.status) params.set("status", filters.status);
    if (filters.dateRange) params.set("dateRange", filters.dateRange);
    if (filters.customDate) params.set("customDate", filters.customDate);

    // Met à jour l'URL sans recharger la page
    window.history.pushState(null, "", `?${params.toString()}`);
  }, [filters, currentPage]);

  // ====== STATS & FETCHING LOGIC () ======
  const computeStats = useCallback((data) => {
    const total = data.length;
    const now = new Date();
    // Utiliser String(u.isActive) pour la robustesse des stats
    const activeUsers = data.filter(
      (u) => String(u.isActive) === "true" || u.isActive === true
    ).length;
    const inactiveUsers = total - activeUsers;

    const newUsersCount = data.filter((u) => {
      const date = new Date(u.createdAt);
      const diff = (now - date) / (1000 * 60 * 60 * 24);
      return diff <= 7 && !isNaN(date);
    }).length;

    setStats({
      total,
      active: activeUsers,
      inactive: inactiveUsers,
      news: newUsersCount,
    });
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employees.list();
      const fetchedList = res.data || [];
      setList(fetchedList);
      computeStats(fetchedList);
    } catch (err) {
      console.error(err);
      toast.error("Erreur chargement employés");
    }
    setLoading(false);
  }, [computeStats]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ====== FILTRAGE () ======
  useEffect(() => {
    // Commence avec la liste complète
    let result = list;

    // Filtre par Rôle
    if (filters.role) {
      result = result.filter((u) => u.role === filters.role);
    }

    // Filtre par Département
    if (filters.department) {
      result = result.filter((u) => getDepartment(u) === filters.department);
    }

    // Filtre par Position
    if (filters.position) {
      result = result.filter((u) => getPosition(u) === filters.position);
    }

    // Filtre de statut
    if (filters.status) {
      result = result.filter((u) => {
        return String(u.isActive) === filters.status;
      });
    }

    // Filtre par Date (Membre depuis)
    if (filters.dateRange || filters.customDate) {
      const now = new Date();
      let limitDays = null;

      if (filters.dateRange === "7d") limitDays = 7;
      if (filters.dateRange === "30d") limitDays = 30;
      if (filters.dateRange === "90d") limitDays = 90;

      const customDateLimit = filters.customDate
        ? new Date(filters.customDate)
        : null;

      result = result.filter((u) => {
        const creationDate = new Date(u.createdAt);
        if (isNaN(creationDate.getTime())) return false;

        if (limitDays) {
          const diffDays = (now - creationDate) / (1000 * 60 * 60 * 24);
          return diffDays <= limitDays;
        }

        if (customDateLimit) {
          return creationDate >= customDateLimit;
        }

        return true;
      });
    }

    setFilteredList(result);
    // Réinitialise la pagination après filtrage pour s'assurer d'être sur la première page du nouveau jeu de résultats
    setCurrentPage(1);
  }, [list, filters]);

  // ====== PAGINATION () ======
  const totalPages = Math.ceil(filteredList.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredList.slice(
    startIndex,
    startIndex + usersPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // ====== CRUD Operations () ======
  const handleCreate = async (id, payload) => {
    try {
      await employees.create(payload);
      toast.success("Employé créé avec succès !");
      fetchList();
    } catch (err) {
      console.error("Erreur création:", err);
      toast.error("Erreur lors de la création de l'employé.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      if (!id) {
        throw new Error("ID de l'employé manquant pour la mise à jour.");
      }
      await employees.update(id, payload);

      toast.success("Employé mis à jour avec succès !");
      fetchList();
    } catch (err) {
      console.error("Erreur modification:", err);
      toast.error("Erreur lors de la modification de l'employé.");
    }
  };

  const handleDelete = async (id, empName) => {
    if (!confirm(`Supprimer cet employé (${empName}) ?`)) return;
    try {
      await employees.remove(id);
      toast.success(`${empName || "Employé"} Supprimé avec succès`);
      fetchList();
    } catch (err) {
      toast.error("Erreur suppression");
    }
  };

  const handleOpenCreateModal = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee) => {
    setEmployeeToEdit(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmployeeToEdit(null);
  };

  return (
    <div className="w-full overflow-hidden">
      {/* En-tête avec boutons */}
      <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl h-bold">Liste des utilisateurs</h1>
          <p className="text-sm text-gray-600">
            Gérez vos utilisateurs depuis cet interface
          </p>
        </div>
        <div className="flex flex-row gap-2">
          {/* Bouton pour ouvrir/fermer les filtres */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors ${
              isFilterOpen
                ? "bg-gray-500 text-white"
                : "bg-white border text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Filter className="w-5 h-5" /> Filtres
          </button>
          {/* Bouton Créer */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-[color:var(--primary)] text-white px-4 py-2 rounded"
          >
            <PlusCircle className="w-5 h-5" /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* BLOC DE FILTRES */}
      {isFilterOpen && (
        <div className="bg-gray-50 p-4 mb-6 rounded shadow-inner border border-gray-200">
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Filter className="w-5 h-5" /> Options de Filtrage
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Filtre Rôle */}
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="p-2 border rounded bg-white"
            >
              <option value="">Rôle (Tous)</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Filtre Département */}
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="p-2 border rounded bg-white"
            >
              <option value="">Département (Tous)</option>
              {uniqueDepartments.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>

            {/* Filtre Position */}
            <select
              value={filters.position}
              onChange={(e) =>
                setFilters({ ...filters, position: e.target.value })
              }
              className="p-2 border rounded bg-white"
            >
              <option value="">Position (Toutes)</option>
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            {/* Filtre Statut */}
            <select
              value={filters.status}
              // Stocke 'true' ou 'false' (string) pour la cohérence avec le champ utilisateur
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="p-2 border rounded bg-white"
            >
              <option value="">Statut (Tous)</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>

            {/* Filtre Période de Création */}
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: e.target.value,
                  customDate: "",
                })
              }
              className="p-2 border rounded bg-white"
            >
              <option value="">Créé (Toute période)</option>
              <option value="7d">Moins de 7 jours</option>
              <option value="30d">Moins de 30 jours</option>
              <option value="90d">Moins de 90 jours</option>
              <option value="custom">Date personnalisée...</option>
            </select>

            {/* Date Personnalisée (si sélectionnée) */}
            {filters.dateRange === "custom" && (
              <div className="col-span-1">
                <input
                  type="date"
                  value={filters.customDate}
                  onChange={(e) =>
                    setFilters({ ...filters, customDate: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  title="Afficher les utilisateurs créés après cette date"
                />
              </div>
            )}

            {/* Bouton de réinitialisation */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-1 flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 w-full sm:w-auto justify-center"
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-8 h-8" />}
          title="Effectif Total"
          value={stats.total}
          className="bg-gradient-to-r from-[#EB7808] to-[#a54218]"
        />
        <StatCard
          icon={<UserCheck className="w-8 h-8" />}
          title="Employés Actifs"
          value={stats.active}
          className="bg-gradient-to-r from-[#458F4A] to-[#266712]"
        />
        <StatCard
          icon={<UserX className="w-8 h-8" />}
          title="Employés Inactifs"
          value={stats.inactive}
          className="bg-gradient-to-r from-[#CC3C3C] to-[#B81C7F]"
        />
        <StatCard
          icon={<UserPlus className="w-8 h-8" />}
          title="Nouveaux Employés"
          value={stats.news}
          className="bg-gradient-to-r from-[#480dbf] to-[#2F0B82]"
        />
      </div>

      <div className="bg-white rounded shadow overflow-x-auto w-full">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-700">
              <th className="p-4">ID</th>
              <th className="p-4">Profile</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Département</th>
              <th className="p-4">Position</th>
              <th className="p-4">Absence</th>
              <th className="p-4">Membre depuis</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-4 text-center">
                  Chargement...
                </td>
              </tr>
            ) : currentUsers.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-500">
                  Aucun utilisateur trouvé ( {filteredList.length} résultats au
                  total)
                </td>
              </tr>
            ) : (
              currentUsers.map((emp, idx) => (
                <tr
                  key={emp.id || idx}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    {String(startIndex + idx + 1).padStart(2, "0")}
                  </td>

                  {/* Avatar/Nom */}
                  <td className="p-4 flex items-center gap-3">
                    {(() => {
                      const avatarUrl = getAvatarUrl(emp);
                      const nameInitial = (
                        getFullName(emp)[0] || "?"
                      ).toUpperCase();

                      return (
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {avatarUrl && (
                            <img
                              src={avatarUrl}
                              alt={getFullName(emp)}
                              crossOrigin="anonymous"
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.querySelector(
                                  ".initials-fallback"
                                ).style.display = "flex";
                              }}
                            />
                          )}

                          <div
                            className={`initials-fallback w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-lg 
                                                ${
                                                  avatarUrl ? "hidden" : "flex"
                                                }`}
                          >
                            {nameInitial}
                          </div>
                        </div>
                      );
                    })()}
                    <div>{truncateText(getFullName(emp))}</div>
                  </td>

                  <td className="p-4">{truncateText(emp.email)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        getRole(emp) === "SYSTEM_ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : getRole(emp) === "HR_ADMIN"
                          ? "bg-red-100 text-red-800"
                          : getRole(emp) === "MANAGER"
                          ? "bg-yellow-100 text-yellow-800"
                          : getRole(emp) === "RECRUITER"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getRole(emp)}
                    </span>
                  </td>
                  <td className="p-4">{truncateText(getDepartment(emp))}</td>
                  <td className="p-4">{truncateText(getPosition(emp))}</td>
                  <td className="p-4">{emp.absence || 0}</td>

                  <td className="p-4">{emp.createdAt?.slice(0, 10) || "—"}</td>

                  <td className="p-4 flex gap-2">
                    <button
                      title="Voir"
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      title="Modifier"
                      onClick={() => handleOpenEditModal(emp)}
                      className="p-2 bg-[#458F4A] hover:bg-green-600 text-white rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => handleDelete(emp.id, getFullName(emp))}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#EA5B0C] text-white hover:bg-orange-700"
            }`}
          >
            Précédent
          </button>

          <p className="text-gray-600">
            Page {currentPage} sur {totalPages}
          </p>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#EA5B0C] text-white hover:bg-orange-700"
            }`}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal UNIFIÉ */}
      <EmployeeModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onAction={employeeToEdit ? handleUpdate : handleCreate}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
}
