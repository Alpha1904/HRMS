import React, { useEffect, useState } from "react";
import { employees } from "../../api/api";
import { PlusCircle, Eye, Edit2, Trash2, Users, UserCheck, UserX, UserPlus, Pencil } from "lucide-react"; // icones
// import { Users, UserCheck, UserX, UserPlus } from "lucide-react"; // icones
import { toast } from "react-toastify"; // alerte (succes, info, echec et etc ...)

function StatCard({ title, value, className, icon }) {
  // carte des stats
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

function Modal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [surname, setSurname] = useState("");
  const [town, setTown] = useState("");
  const [department, setDepartment] = useState("");
  const [sex, setSex] = useState("");
  const [country, setCountry] = useState("");
  const [birth, setBirth] = useState("");
  const handle = async () => {
    await onCreate({ surname, name, email, town, country, department, sex, birth });
    setSurname("");
    setName("");
    setEmail("");
    setTown("");
    setCountry("");
    setDepartment("");
    setSex("");
    setBirth("");
    onClose();
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-[35rem]">
        <h3 className="h-bold text-lg mb-6">Enregistrer un nouvel employé</h3>
        <div className="input flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <label htmlFor="surname" className="mb-1">
                Prénom
              </label>
              <input
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom"
                className="w-full p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone"
              className="w-full p-2 border"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <input
              value={town}
              onChange={(e) => setTown(e.target.value)}
              placeholder="Ville"
              className="w-full p-2 border"
            />
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Pays"
              className="w-full p-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Département"
              className="w-full p-2 border"
            />
            <input
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              placeholder="Sexe"
              className="w-full p-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <input
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              placeholder="Naissance"
              className="w-full p-2 border"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="py-3 px-6 border rounded">
            Annuler
          </button>
          <button
            onClick={handle}
            className="py-3 px-6 bg-primary text-white rounded"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    news: 0,
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await employees.list();
      setList(res.data || []);
      setStats({
        total: (res.data || []).length,
        active: 5,
        inactive: 3,
        news: 14,
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur chargement employés");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleCreate = async (payload) => {
    try {
      await employees.create(payload);
      toast.success("Employé créé");
      fetchList();
    } catch (err) {
      console.error(err);
      toast.error("Erreur création");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet employé ?")) return;
    try {
      await employees.remove(id);
      toast.success(`${emp.name} Supprimé avec succès`);
      fetchList();
    } catch (err) {
      toast.error("Erreur suppression");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl h-bold">Liste des utilisateurs</h1>
          <p className="text-sm text-gray-600">
            Gérez vos utilisateurs depuis cet interface
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-[color:var(--primary)] text-white px-4 py-2 rounded"
          >
            <PlusCircle className="w-5 h-5" /> Nouvel utilisateur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-8 h-8" />} // Icône pour Total
          title="Effectif Total"
          value={stats.total}
          className="bg-gradient-to-r from-[#EB7808] to-[#a54218]"
        />
        <StatCard
          icon={<UserCheck className="w-8 h-8" />} // Icône pour Actifs
          title="Employés Actifs"
          value={stats.active}
          className="bg-gradient-to-r from-[#458F4A] to-[#266712]"
        />
        <StatCard
          icon={<UserX className="w-8 h-8" />} // Icône pour Absents
          title="Employés Inactifs"
          value={stats.inactive}
          className="bg-gradient-to-r from-[#CC3C3C] to-[#B81C7F]"
        />
        <StatCard
          icon={<UserPlus className="w-8 h-8" />} // Icône pour Nouveaux
          title="Nouveaux Employés"
          value={stats.news}
          className="bg-gradient-to-r from-[#480dbf] to-[#2F0B82]"
        />
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-700">
              <th className="p-4">ID</th>
              <th className="p-4">Profile</th>
              <th className="p-4">Email</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4">Département</th>
              <th className="p-4">Absence</th>
              <th className="p-4">Membre depuis</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center">
                  Chargement...
                </td>
              </tr>
            ) : (
              list.map((emp, idx) => (
                <tr
                  key={emp.id || idx}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">{String(idx + 1).padStart(2, "0")}</td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl} // image de l'utilisateur
                          alt={emp.fullName}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold">
                          {emp.fullName ? emp.fullName[0] : "U"}
                        </div>
                      )}
                    </div>
                    <div>{emp.fullName || "—"}</div>
                  </td>
                  <td className="p-4">{emp.email}</td>
                  <td className="p-4">{emp.phone || "—"}</td>
                  <td className="p-4">{emp.department || "—"}</td>
                  <td className="p-4">{emp.absence || 0}</td>
                  <td className="p-4">{emp.member_since || "—"}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      title="Voir"
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      title="Modifier"
                      className="p-2 bg-[#458F4A] hover:bg-green-600 text-white rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => handleDelete(emp.id)}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}


// import { useEffect, useState } from "react";
// import { Eye, Pencil, Trash2, Search, Users, UserCheck, UserX, UserPlus } from "lucide-react";

// export default function Employees() {
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [search, setSearch] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const usersPerPage = 5;

//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     inactive: 0,
//     new: 0,
//   });

//   // ===== FETCH USERS FROM API =====
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const savedUsers = localStorage.getItem("usersData");
//         if (savedUsers) {
//           const parsed = JSON.parse(savedUsers);
//           setUsers(parsed);
//           setFilteredUsers(parsed);
//           computeStats(parsed);
//           return;
//         }

//         const res = await fetch("http://localhost:3000/api/users");
//         const data = await res.json();
//         setUsers(data);
//         setFilteredUsers(data);
//         localStorage.setItem("usersData", JSON.stringify(data));
//         computeStats(data);
//       } catch (error) {
//         console.error("Erreur de récupération des utilisateurs:", error);
//       }
//     };
//     fetchUsers();
//   }, []);

//   // ===== FILTRAGE DIRECT =====
//   useEffect(() => {
//     const result = users.filter((u) =>
//       u.email?.toLowerCase().includes(search.toLowerCase())
//     );
//     setFilteredUsers(result);
//     setCurrentPage(1);
//   }, [search, users]);

//   // ===== PAGINATION =====
//   const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
//   const startIndex = (currentPage - 1) * usersPerPage;
//   const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

//   const handleNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
//   };
//   const handlePrevPage = () => {
//     if (currentPage > 1) setCurrentPage((prev) => prev - 1);
//   };

//   // ===== SUPPRESSION =====
//   const handleDelete = (id) => {
//     const updated = users.filter((u) => u.id !== id);
//     setUsers(updated);
//     localStorage.setItem("usersData", JSON.stringify(updated));
//     computeStats(updated);
//   };

//   // ====== CALCUL DES STATS ======
//   const computeStats = (data) => {
//     const total = data.length;

//     // Pour ce code : on suppose que "active" = tous les utilisateurs (à adapter selon ton API)
//     const active = data.length;
//     const inactive = 0;

//     // Nouveaux employés = inscrits depuis moins de 7 jours
//     const now = new Date();
//     const newUsers = data.filter((u) => {
//       const date = new Date(u.created_at);
//       const diff = (now - date) / (1000 * 60 * 60 * 24);
//       return diff <= 7;
//     }).length;

//     setStats({ total, active, inactive, new: newUsers });
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4 text-gray-800">Liste des utilisateurs</h1>

//       {/* ====== STATS ====== */}
//       <div className="grid grid-cols-4 gap-4 mb-6">
//         <div className="flex items-center gap-4 p-4 rounded-xl shadow text-white bg-gradient-to-r from-[#EB7808] to-[#a54218]">
//           <div className="p-3 rounded-full bg-white/20">
//             <Users className="w-8 h-8" />
//           </div>
//           <div>
//             <p className="text-sm">Effectif Total</p>
//             <h2 className="text-3xl font-bold">{stats.total}</h2>
//           </div>
//         </div>

//         <div className="flex items-center gap-4 p-4 rounded-xl shadow text-white bg-gradient-to-r from-[#458F4A] to-[#266712]">
//           <div className="p-3 rounded-full bg-white/20">
//             <UserCheck className="w-8 h-8" />
//           </div>
//           <div>
//             <p className="text-sm">Employés Actifs</p>
//             <h2 className="text-3xl font-bold">{stats.active}</h2>
//           </div>
//         </div>

//         <div className="flex items-center gap-4 p-4 rounded-xl shadow text-white bg-gradient-to-r from-[#CC3C3C] to-[#B81C7F]">
//           <div className="p-3 rounded-full bg-white/20">
//             <UserX className="w-8 h-8" />
//           </div>
//           <div>
//             <p className="text-sm">Employés Inactifs</p>
//             <h2 className="text-3xl font-bold">{stats.inactive}</h2>
//           </div>
//         </div>

//         <div className="flex items-center gap-4 p-4 rounded-xl shadow text-white bg-gradient-to-r from-[#480dbf] to-[#2F0B82]">
//           <div className="p-3 rounded-full bg-white/20">
//             <UserPlus className="w-8 h-8" />
//           </div>
//           <div>
//             <p className="text-sm">Nouveaux Employés (7j)</p>
//             <h2 className="text-3xl font-bold">{stats.new}</h2>
//           </div>
//         </div>
//       </div>

//       {/* Barre de recherche */}
//       <div className="flex items-center gap-3 mb-6">
//         <div className="relative w-full max-w-md">
//           <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Rechercher par email..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
//           />
//         </div>
//       </div>

//       {/* Tableau des utilisateurs */}
//       <div className="overflow-x-auto bg-white rounded-lg shadow">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               <th className="p-3">ID</th>
//               <th className="p-3">Profil</th>
//               <th className="p-3">Email</th>
//               <th className="p-3">Téléphone</th>
//               <th className="p-3">Département</th>
//               <th className="p-3">Absence</th>
//               <th className="p-3">Membre depuis</th>
//               <th className="p-3 text-center">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentUsers.map((user) => (
//               <tr key={user.id} className="border-t hover:bg-gray-50">
//                 <td className="p-3">{String(user.id).padStart(2, "0")}</td>
//                 <td className="p-3">
//                   <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
//                     {user.email?.charAt(0).toUpperCase() || "U"}
//                   </div>
//                 </td>
//                 <td className="p-3">{user.email}</td>
//                 <td className="p-3">{user.phone || "—"}</td>
//                 <td className="p-3">{user.department || "—"}</td>
//                 <td className="p-3 text-center">{user.absence || 0}</td>
//                 <td className="p-3">{user.created_at?.slice(0, 10) || "—"}</td>
//                 <td className="p-3 flex justify-center gap-2">
//                   <button className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
//                     <Eye className="w-4 h-4" />
//                   </button>
//                   <button className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
//                     <Pencil className="w-4 h-4" />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(user.id)}
//                     className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {currentUsers.length === 0 && (
//               <tr>
//                 <td colSpan="8" className="text-center py-6 text-gray-500">
//                   Aucun utilisateur trouvé
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-between items-center mt-4">
//           <button
//             onClick={handlePrevPage}
//             disabled={currentPage === 1}
//             className={`px-4 py-2 rounded ${
//               currentPage === 1
//                 ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                 : "bg-[#EA5B0C] text-white hover:bg-orange-700"
//             }`}
//           >
//             Précédent
//           </button>

//           <p className="text-gray-600">
//             Page {currentPage} sur {totalPages}
//           </p>

//           <button
//             onClick={handleNextPage}
//             disabled={currentPage === totalPages}
//             className={`px-4 py-2 rounded ${
//               currentPage === totalPages
//                 ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                 : "bg-[#EA5B0C] text-white hover:bg-orange-700"
//             }`}
//           >
//             Suivant
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
