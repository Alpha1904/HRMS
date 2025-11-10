import React, { useEffect, useState } from "react";
import { employees } from "../../api/api";
import { PlusCircle, Eye, Edit2, Trash2, Users, UserCheck, UserX, UserPlus } from "lucide-react"; // icones
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
                      {emp.avatar ? (
                        <img
                          src={emp.avatar} // image de l'utilisateur
                          alt={emp.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold">
                          {emp.name ? emp.name[0] : "U"}
                        </div>
                      )}
                    </div>
                    <div>{emp.name || "—"}</div>
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
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
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
