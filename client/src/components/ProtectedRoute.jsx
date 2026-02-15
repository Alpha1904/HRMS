// Fichier : src/components/ProtectedRoute.js

import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';

/**
 * Composant de Route Protégée.
 * Il vérifie la présence d'un token d'authentification.
 * Si le token est présent, il affiche la route demandée via <Outlet />.
 * Sinon, il redirige l'utilisateur vers la page de connexion (/login).
 */
export default function ProtectedRoute() {
    // 1. Récupérer l'état du token depuis le Redux Store
    // Assurez-vous que le chemin 'auth.token' est correct par rapport à votre structure de store
    const token = useSelector((state) => state.auth.token);

    // 2. Logique de protection
    // Si le token est présent, l'utilisateur est considéré comme connecté
    if (token) {
        return <Outlet />;
    } 
    // Si le token est null, rediriger vers /login
    else {
        // Le composant Navigate est l'outil de redirection de react-router-dom
        return <Navigate to="/login" replace />;
    }
}