// import React from "react";
// import { Routes, Route } from "react-router-dom";

// // ROUTES PUBLIQUES
// import LandingPage from "./pages/landingPage/Index";
// import Login from "./pages/Auth/Login";
// import Layout from "./layout/Layout";
// import NotFound from "./NotFound/Index";
// import PrivateRoute from "./routes/PrivateRoute"; // Import de PrivateRoute

// // PAGES ADMIN (Accès restreint aux rôles de gestion)
// import DashboardAdmin from "./pages/Admin/Dashboard/Dashboard"; 
// import Employees from "./pages/Admin/Employees/Employees";
// import LeavesAdmin from "./pages/Admin/Leaves/Leaves";
// import SchedulesAdmin from "./pages/Admin/Schedules/Schedules";
// import Recruitment from "./pages/Admin/Recruitment/Recruitment";
// import TrainingsAdmin from "./pages/Admin/Trainings/Trainings";
// import Payroll from "./pages/Admin/Payroll/Payroll";
// import EvaluationsAdmin from "./pages/Admin/Evaluations/Evaluations";
// import CommunicationAdmin from "./pages/Admin/Communication/Communication";
// import Reports from "./pages/Admin/Reports/Reports";

// // PAGES UTILISATEURS (Accès pour EMPLOYEE, CANDIDATE, etc.)
// import UserCommunication from "./pages/users/Communication/Communication";
// import UserTraining from "./pages/users/Trainings/Training";
// import UserDashboard from "./pages/users/Dashboard/Dashboard"; 
// import UserDocument from "./pages/users/Document/Documents";
// import UserLeaves from "./pages/users/Leaves/Leaves";
// import UserSchedule from "./pages/users/Schedule/Shedule";
// import UserEvaluations from "./pages/users/Evaluations/Evaluation";
// import Profile from "./pages/profile/Profile";

// // --- Définitions des Rôles pour PrivateRoute ---
// // Rôles Gestionnaires (Admin/Manager/Recruiter)
// const GESTIONNAIRE_ROLES = ['MANAGER', 'RECRUITER', 'SYSTEM_ADMIN', 'HR_ADMIN'];
// // Rôles Utilisateurs Standards (Employé/Candidat)
// const USER_ROLES = ['EMPLOYEE', 'CANDIDATE'];
// // Tous les rôles connectés (minimum requis pour accéder au Layout)
// const ALL_AUTHENTICATED_ROLES = [...GESTIONNAIRE_ROLES, ...USER_ROLES]; 


// export default function App() {
//   return (
//     <Routes>
//       <Route path="*" element={<NotFound />} /> {/* Page d'erreur */}
      
//       {/* Routes publiques */}
//       <Route index element={<LandingPage />} />
//       <Route path="/login" element={<Login />} />
      
//       {/* Routes Protégées par le Layout */}
//       <Route
//         path="/"
//         element={<PrivateRoute allowedRoles={ALL_AUTHENTICATED_ROLES}><Layout /></PrivateRoute>}
//       >
        
//         {/*
//           ROUTES PARTAGÉES (Accessibles à tous)
//           Chaque route est protégée individuellement pour plus de sécurité et de clarté
//         */}
        
//         {/*
//           Redirection post-connexion vers /dashboard.
//           Le Layout ou le composant Dashboard décidera quoi afficher.
//           Si l'utilisateur est Gestionnaire, il verra DashboardAdmin, sinon UserDashboard.
//           Nous allons définir la route DashboardAdmin prioritaire ici.
//         */}
//         <Route 
//           path="dashboard" 
//           element={
//             <PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}>
//               <DashboardAdmin />
//             </PrivateRoute>
//           } 
//         />
        
//         {/* Fallback si l'utilisateur est connecté mais n'est pas Gestionnaire (ex: EMPLOYEE) */}
//         <Route 
//           path="dashboard" 
//           element={
//             <PrivateRoute allowedRoles={USER_ROLES}>
//               <UserDashboard />
//             </PrivateRoute>
//           } 
//         />

//         {/* La page Profile doit être accessible à tous */}
//         <Route path="profile" element={<Profile />} />
        
//         {/* Communication est souvent une page partagée ou utilisateur */}
//         <Route path="communication" element={<UserCommunication />} />


//         {/*
//           ROUTES ADMIN (Gestionnaire)
//           Chemins d'accès standard
//         */}
//         <Route path="employees" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Employees /></PrivateRoute>} />
//         <Route path="leaves" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><LeavesAdmin /></PrivateRoute>} />
//         <Route path="schedules" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><SchedulesAdmin /></PrivateRoute>} />
//         <Route path="recruitment" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Recruitment /></PrivateRoute>} />
//         <Route path="trainings" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><TrainingsAdmin /></PrivateRoute>} />
//         <Route path="payroll" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Payroll /></PrivateRoute>} />
//         <Route path="evaluations" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><EvaluationsAdmin /></PrivateRoute>} />
//         <Route path="reports" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Reports /></PrivateRoute>} />


//         {/*
//           ROUTES UTILISATEUR (EMPLOYEE et CANDIDATE)
//           Restitution des chemins d'origine de l'utilisateur
//         */}
//         <Route path="user/document" element={<PrivateRoute allowedRoles={USER_ROLES}><UserDocument /></PrivateRoute>} />
//         <Route path="user/leaves" element={<PrivateRoute allowedRoles={USER_ROLES}><UserLeaves /></PrivateRoute>} />
//         <Route path="user/schedule" element={<PrivateRoute allowedRoles={USER_ROLES}><UserSchedule /></PrivateRoute>} />
//         <Route path="user/evaluations" element={<PrivateRoute allowedRoles={USER_ROLES}><UserEvaluations /></PrivateRoute>} />
//         <Route path="user/communication" element={<PrivateRoute allowedRoles={USER_ROLES}><UserCommunication /></PrivateRoute>} />
//         <Route path="user/trainings" element={<PrivateRoute allowedRoles={USER_ROLES}><UserTraining /></PrivateRoute>} />
        
//       </Route>
//     </Routes>
//   );
// }


import React from "react";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";

// ROUTES PUBLIQUES
import LandingPage from "./pages/landingPage/Index";
import Login from "./pages/Auth/Login";
import Layout from "./layout/Layout";
import NotFound from "./NotFound/Index";
import PrivateRoute from "./routes/PrivateRoute";

// PAGES ADMIN
import DashboardAdmin from "./pages/Admin/Dashboard/Dashboard"; 
import Employees from "./pages/Admin/Employees/Employees";
import LeavesAdmin from "./pages/Admin/Leaves/Leaves";
import SchedulesAdmin from "./pages/Admin/Schedules/Schedules";
import Recruitment from "./pages/Admin/Recruitment/Recruitment";
import TrainingsAdmin from "./pages/Admin/Trainings/Trainings";
import Payroll from "./pages/Admin/Payroll/Payroll";
import EvaluationsAdmin from "./pages/Admin/Evaluations/Evaluations";
import CommunicationAdmin from "./pages/Admin/Communication/Communication";
import Reports from "./pages/Admin/Reports/Reports";

// PAGES UTILISATEURS
import UserCommunication from "./pages/users/Communication/Communication";
import UserTraining from "./pages/users/Trainings/Training";
import UserDashboard from "./pages/users/Dashboard/Dashboard"; 
import UserDocument from "./pages/users/Document/Documents";
import UserLeaves from "./pages/users/Leaves/Leaves";
import UserSchedule from "./pages/users/Schedule/Shedule";
import UserEvaluations from "./pages/users/Evaluations/Evaluation";
import Profile from "./pages/profile/Profile";

// REDIRECTION DASHBOARD SELON ROLE
const DashboardRedirect = () => {
  const { user } = useSelector(state => state.auth);
  if (!user) return null;

  const GESTIONNAIRE_ROLES = ["MANAGER","RECRUITER","SYSTEM_ADMIN","HR_ADMIN"];

  return GESTIONNAIRE_ROLES.includes(user.role) ? <DashboardAdmin /> : <UserDashboard />;
};

// Rôles
const GESTIONNAIRE_ROLES = ["MANAGER","RECRUITER","SYSTEM_ADMIN","HR_ADMIN"];
const USER_ROLES = ["EMPLOYEE","CANDIDATE"];
const ALL_AUTHENTICATED_ROLES = [...GESTIONNAIRE_ROLES, ...USER_ROLES];

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route index element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />

      {/* Routes protégées */}
      <Route path="/" element={<PrivateRoute allowedRoles={ALL_AUTHENTICATED_ROLES}><Layout /></PrivateRoute>}>
        
        {/* Dashboard redirige automatiquement selon rôle */}
        <Route path="dashboard" element={<PrivateRoute allowedRoles={ALL_AUTHENTICATED_ROLES}><DashboardRedirect /></PrivateRoute>} />

        {/* Profil accessible à tous */}
        <Route path="profile" element={<Profile />} />
        <Route path="communication" element={<UserCommunication />} />

        {/* Routes Admin */}
        <Route path="employees" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Employees /></PrivateRoute>} />
        <Route path="leaves" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><LeavesAdmin /></PrivateRoute>} />
        <Route path="schedules" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><SchedulesAdmin /></PrivateRoute>} />
        <Route path="recruitment" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Recruitment /></PrivateRoute>} />
        <Route path="trainings" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><TrainingsAdmin /></PrivateRoute>} />
        <Route path="payroll" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Payroll /></PrivateRoute>} />
        <Route path="evaluations" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><EvaluationsAdmin /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute allowedRoles={GESTIONNAIRE_ROLES}><Reports /></PrivateRoute>} />

        {/* Routes Utilisateurs */}
        <Route path="user/document" element={<PrivateRoute allowedRoles={USER_ROLES}><UserDocument /></PrivateRoute>} />
        <Route path="user/leaves" element={<PrivateRoute allowedRoles={USER_ROLES}><UserLeaves /></PrivateRoute>} />
        <Route path="user/schedule" element={<PrivateRoute allowedRoles={USER_ROLES}><UserSchedule /></PrivateRoute>} />
        <Route path="user/evaluations" element={<PrivateRoute allowedRoles={USER_ROLES}><UserEvaluations /></PrivateRoute>} />
        <Route path="user/communication" element={<PrivateRoute allowedRoles={USER_ROLES}><UserCommunication /></PrivateRoute>} />
        <Route path="user/trainings" element={<PrivateRoute allowedRoles={USER_ROLES}><UserTraining /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
