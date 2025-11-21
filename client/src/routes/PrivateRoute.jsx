// // import React from 'react';
// // import { Navigate } from 'react-router-dom';

// // export default function PrivateRoute({ children }){
// //   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
// //   if (!token) return <Navigate to="/login" replace />;
// //   return children;
// // }


// import React from 'react';
// import { useSelector } from 'react-redux';
// import { Navigate, useLocation } from 'react-router-dom';

// export default function PrivateRoute({ children, allowedRoles = [] }) {
//     // Récupère l'état d'authentification et les données utilisateur de Redux
//     const { isAuthenticated, user } = useSelector((state) => state.auth);
//     const location = useLocation();
    
//     const userRole = user?.role;
    
//     // 1. Redirection si l'utilisateur n'est pas connecté
//     if (!isAuthenticated) {
//         // Redirige vers /login en sauvegardant l'emplacement actuel
//         return <Navigate to="/login" state={{ from: location }} replace />;
//     }

//     // 2. Vérification des permissions par rôle
//     if (allowedRoles.length > 0) {
//         const isAuthorized = allowedRoles.includes(userRole);

//         if (!isAuthorized) {
//             return <Navigate to="/dashboard" replace />;
//         }
//     }

//     return children;
// }


// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Navigate, useLocation } from 'react-router-dom';
// import { auth } from '../api/api';
// import { setCredentials } from '../store/slices/authSlice';
// import { toast } from 'react-toastify';

// export default function PrivateRoute({ children, allowedRoles = [] }) {
//   const dispatch = useDispatch();
//   const location = useLocation();

//   const { isAuthenticated, user } = useSelector(state => state.auth);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         // Vérifie si l'utilisateur est connecté via le cookie HTTP-only
//         const res = await auth.getProfile();
//         dispatch(setCredentials({ user: res.data, token: null }));
//       } catch (err) {
//         // Not authenticated
//         console.error('Utilisateur non authentifié', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     // Si pas d'utilisateur en Redux, on va tenter de récupérer le profil
//     if (!user) {
//       checkAuth();
//     } else {
//       setLoading(false);
//     }
//   }, [dispatch, user]);

//   if (loading) {
//     return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
//   }

//   // Redirige vers login si non connecté
//   if (!isAuthenticated) {
//     toast.info('Veuillez vous connecter pour accéder à cette page');
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // Vérifie si le rôle est autorisé
//   if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
//     toast.error("Vous n'avez pas la permission d'accéder à cette page");
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// }


import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const userRole = user?.role;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
