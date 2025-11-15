// import React from 'react';
// import { Navigate } from 'react-router-dom';

// export default function PrivateRoute({ children }){
//   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//   if (!token) return <Navigate to="/login" replace />;
//   return children;
// }


import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children, allowedRoles = [] }) {
    // Récupère l'état d'authentification et les données utilisateur de Redux
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const location = useLocation();
    
    const userRole = user?.role;
    
    // 1. Redirection si l'utilisateur n'est pas connecté
    if (!isAuthenticated) {
        // Redirige vers /login en sauvegardant l'emplacement actuel
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Vérification des permissions par rôle
    if (allowedRoles.length > 0) {
        const isAuthorized = allowedRoles.includes(userRole);

        if (!isAuthorized) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}