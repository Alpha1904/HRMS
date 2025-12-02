import React, { useCallback, useEffect, useState } from "react";
import StatCard from "../../../components/StatCard";
import { UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { toast } from "react-toastify";

// ⭐️ Ajustez les chemins d'importation
import { employees, leaves } from "../../../api/api";
import AbsencesChart from "../../../charts/AbsencesChart";
import SalaryCostsChart from "../../../charts/SalaryCostsChart";
import DepartmentDistributionChart from "../../../charts/DepartmentDistributionChart";

// Définition des constantes pour les statuts
const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    news: 0,
  });
  // État pour les données du graphique de répartition
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCHING DES UTILISATEURS (Effectif Total & Nouveaux) ---
  const fetchUsersStats = useCallback(async () => {
    try {
      const resUsers = await employees.list();
      // ⭐️ Tentative de correction pour accéder aux données (res.data.data ou res.data)
      const users = resUsers.data?.data || resUsers.data || [];

      const total = users.length;

      // ⚠️ Logique pour 'news' (ajuster selon le champ réel de votre API, ex: user.createdAt)
      const newUsersCount = users.filter((user) => user.isNew === true).length;

      return { total: total, news: newUsersCount };
    } catch (err) {
      console.error("Erreur fetching users:", err);
      throw new Error("Erreur chargement employés");
    }
  }, []);

  // FETCHING DES CONGÉS (En attente & Absences actives) ---
  const fetchLeavesStats = useCallback(async () => {
    try {
      const resLeaves = await leaves.list();
      const leavesData = resLeaves.data?.data || resLeaves.data || [];

      const pending = leavesData.filter(
        (l) => l.status === LEAVE_STATUS.PENDING
      ).length;

      const today = new Date().toISOString().split("T")[0];

      const active = leavesData.filter(
        (l) =>
          l.status === LEAVE_STATUS.APPROVED &&
          l.startDate <= today &&
          l.endDate >= today
      ).length;

      return { pending: pending, active: active };
    } catch (err) {
      console.error("Erreur fetching leaves:", err);
      throw new Error("Erreur chargement congés");
    }
  }, []);

  //FETCHING & CALCUL DE LA RÉPARTITION PAR DÉPARTEMENT ---
  const fetchDepartmentDistribution = useCallback(async () => {
    try {
      const resUsers = await employees.list();
      const users = resUsers.data?.data || resUsers.data || [];

      const distribution = users.reduce((acc, user) => {
        const deptName =
          user.department?.name || user.department || "Non Assigné";

        if (acc[deptName]) {
          acc[deptName].count += 1;
        } else {
          acc[deptName] = { name: deptName, count: 1 };
        }
        return acc;
      }, {});

      const totalCount = users.length;
      const formattedData = Object.values(distribution).map((item) => ({
        ...item,
        percent: item.count / totalCount,
      }));

      return formattedData;
    } catch (err) {
      console.error("Erreur fetching distribution:", err);
      throw new Error("Erreur chargement répartition départements");
    }
  }, []);

  // --- 4. FONCTION GLOBALE POUR TOUT CHARGER EN PARALLÈLE ---
  const fetchAllStatsAndCharts = useCallback(async () => {
    setLoading(true);
    try {
      // Lance les 3 requêtes en parallèle avec Promise.all
      const [usersStats, leavesStats, deptData] = await Promise.all([
        fetchUsersStats(),
        fetchLeavesStats(),
        fetchDepartmentDistribution(),
      ]);

      // Mise à jour de l'état des statistiques
      setStats({
        total: usersStats.total,
        news: usersStats.news,
        pending: leavesStats.pending,
        active: leavesStats.active,
      });

      // Mise à jour de l'état des données du graphique
      setDepartmentData(deptData);
    } catch (err) {
      console.error(err);
      // Affiche l'erreur la plus pertinente
      toast.error("Erreur chargement des données du tableau de bord");
    } finally {
      setLoading(false);
    }
  }, [fetchUsersStats, fetchLeavesStats, fetchDepartmentDistribution]);

  useEffect(() => {
    fetchAllStatsAndCharts();
  }, [fetchAllStatsAndCharts]);

  if (loading) {
    return <p>Chargement des statistiques...</p>;
  }

  return (
    <div className="space-y-6">
      <h2>Tableau de bord administrateur</h2>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4 gap-1 mb-6">
        <StatCard
          icon={<Users className="md:w-8 md:h-8 w-4 h-4" />}
          title="Effectif Total"
          value={stats.total}
          className="bg-gradient-to-r from-[#3f97e1] to-[#2879cd]"
        />
        <StatCard
          icon={<UserCheck className="md:w-8 md:h-8 w-4 h-4" />}
          // title="Congés en attente"
          title={
            <p className="">
              <span className="md:hidden">Congés en att...</span>{" "}
              <span className="hidden md:block">Congés en attente</span>
            </p>
          }
          value={stats.pending}
          className="bg-gradient-to-r from-[#0add2a] to-[#05901b]"
        />
        <StatCard
          icon={<UserX className="md:w-8 md:h-8 w-4 h-4" />}
          title="Absences actives"
          value={stats.active}
          className="bg-gradient-to-r from-[#febb01] to-[#dc7303]"
        />
        <StatCard
          icon={<UserPlus className="md:w-8 md:h-8 w-4 h-4" />}
          title={
            <p className="">
              <span className="md:hidden">Nouveaux Em...</span>{" "}
              <span className="hidden md:block">Nouveaux Employés </span>
            </p>
          }
          value={stats.news}
          className="bg-gradient-to-r from-[#9f3779] to-[#843065]"
        />
      </div>

      {/* --- GRAPHIQUES LIGNE ET BARRES (Basés sur Mock Data pour l'exemple) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AbsencesChart />
        <SalaryCostsChart />
      </div>

      {/* --- GRAPHIQUE RÉPARTITION PAR DÉPARTEMENT (Basé sur données temps réel) --- */}
      <div className="grid grid-cols-1">
        <DepartmentDistributionChart data={departmentData} />
      </div>
    </div>
  );
}
