// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import Login from "./pages/Auth/Login";
// import Layout from "./layout/Layout";
// import Dashboard from "./pages/Dashboard/Dashboard";
// import Employees from "./pages/Employees/Employees";
// import Leaves from "./pages/Leaves/Leaves";
// import Schedules from "./pages/Schedules/Schedules";
// import Recruitment from "./pages/Recruitment/Recruitment";
// import Trainings from "./pages/Trainings/Trainings";
// import Payroll from "./pages/Payroll/Payroll";
// import Evaluations from "./pages/Evaluations/Evaluations";
// import Communication from "./pages/Communication/Communication";
// import Reports from "./pages/Reports/Reports";
// import PrivateRoute from "./routes/PrivateRoute";

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route
//         path="/"
//         element={
//           <PrivateRoute>
//             <Layout />
//           </PrivateRoute>
//         }
//       >
//         <Route index element={<LandingPage />} />
//         <Route path="dashbord" element={<Dashboard />} />
//         <Route path="leaves" element={<Leaves />} />
//         <Route path="schedules" element={<Schedules />} />
//         <Route path="recruitment" element={<Recruitment />} />
//         <Route path="trainings" element={<Trainings />} />
//         <Route path="payroll" element={<Payroll />} />
//         <Route path="evaluations" element={<Evaluations />} />
//         <Route path="communication" element={<Communication />} />
//         <Route path="reports" element={<Reports />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="employees" element={<Employees />} />
//       </Route>
//     </Routes>
//   );
// }

import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Employees from "./pages/Employees/Employees";
import Leaves from "./pages/Leaves/Leaves";
import Schedules from "./pages/Schedules/Schedules";
import Recruitment from "./pages/Recruitment/Recruitment";
import Trainings from "./pages/Trainings/Trainings";
import Payroll from "./pages/Payroll/Payroll";
import Evaluations from "./pages/Evaluations/Evaluations";
import Communication from "./pages/Communication/Communication";
import Reports from "./pages/Reports/Reports";
import LandingPage from "./pages/landingPage/Index";
import NotFound from "./NotFound/Index";
// import PrivateRoute from "./routes/PrivateRoute"; // Plus nécessaire pour le moment

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} /> {/* Page d'erreur en cas de non existance d'une page */}
      {/* Route de connexion (publique) */}
      <Route path="/login" element={<Login />} />

      <Route index element={<LandingPage />} />
      <Route
        path="/"
        element={<Layout />} // <Layout /> est maintenant directement l'élément de la route parent
      >
        {/* Routes enfants qui s'affichent dans le <Layout /> */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="trainings" element={<Trainings />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="evaluations" element={<Evaluations />} />
        <Route path="communication" element={<Communication />} />
        <Route path="reports" element={<Reports />} />
        <Route path="employees" element={<Employees />} />
      </Route>
    </Routes>
  );
}
