import { Link } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ProfilForm() {

  // --- PERSISTENCE DE L'ÉTAT DANS L'URL ---
  useEffect(() => {
    const params = new URLSearchParams();

    // Ajouter les valeurs non vides à l'URL
    // if (currentPage > 1) params.set("page", currentPage.toString());

    // if (filters.role) params.set("role", filters.role);
    // if (filters.department) params.set("dept", filters.department);
    // if (filters.position) params.set("pos", filters.position);
    // if (filters.status) params.set("status", filters.status);
    // if (filters.dateRange) params.set("dateRange", filters.dateRange);
    // if (filters.customDate) params.set("customDate", filters.customDate);

    // Met à jour l'URL sans recharger la page
    window.history.pushState(null, "", `?${params.toString()}`);
  }, []);
  // }, [filters, currentPage]);

    const [loading, setLoading] = useState(false);
  
    // ====== STATS & FETCHING LOGIC () ======
    const computeStats = useCallback((data) => {
      const total = data.length;
      const now = new Date();
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




  return (
    <>
      <div className="rounded-md px-4 py-3 bg-white shadow-xl">
        <div className="imgUser text-center">
          <div className="img w-36 h-36 rounded-full overflow-hidden">
            <img
              src="./img/log.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-700 capitalize">
            uu
          </h2>
          <p className="text-sm text-gray-400">role</p>
        </div>

        <div className="infoUserForm">
          <form action="" className="">
            <div className="input">
              <div className="inputflex">
                <label htmlFor="profilePicture">Prenom</label>
                <input
                  type="file"
                  id="prenom"
                  name="prenom"
                  placeholder="(prenom de l'utilisateur)"
                />
              </div>
              <div className="inputflex">
                <label htmlFor="profilePicture">Prenom</label>
                <input
                  type="file"
                  id="prenom"
                  name="prenom"
                  placeholder="(prenom de l'utilisateur)"
                />
              </div>
            </div>
          </form>
          <p className="text-sm text-gray-700">
            Prenom : (prenom de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">Nom : (nom de l'utilisateur)</p>
          <p className="text-sm text-gray-700">
            Telephone : (telephone de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">
            email : (email de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">
            ville : (ville de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">
            etat ou pays : (etat ou pays de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">
            nombre d'absence : (nombre d'absence de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">
            en conge : (en conge ou pas de l'utilisateur)
          </p>
          <p className="text-sm text-gray-700">
            role : (role de l'utilisateur)
          </p>
        </div>
      </div>
    </>
  );
}
