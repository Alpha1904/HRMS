// import React from "react";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { setCredentials } from "../../store/slices/authSlice";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// // IMPORT DE L'API AUTHENTIFICATION
// import { auth } from "../../api/api"; 

// // Schéma de validation
// const schema = yup.object().shape({
//   email: yup
//     .string()
//     .required("Adresse email requise")
//     .email("Adresse email invalide"),
//   password: yup
//     .string()
//     .required("Mot de passe requis"),
//   remember: yup.boolean(),
// });

// export default function Login() {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting }, // Ajout de isSubmitting pour désactiver le bouton
//   } = useForm({ resolver: yupResolver(schema) });
  
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const onSubmit = async (data) => {
//     try {
//       // 1. Appel de l'API : Envoi de l'email et du mot de passe au backend
//       const response = await auth.login(data);
      
//       // La réponse de l'API devrait idéalement ressembler à { token: '...', user: { ... } }
//       const { token, user } = response.data;
      
//       if (!token || !user) {
//         throw new Error("Réponse API invalide : jeton ou utilisateur manquant.");
//       }

//       // 2. Stockage des identifiants dans Redux
//       dispatch(setCredentials({ user, token }));

//       // 3. Stockage du token dans le stockage local ou de session
//       if (data.remember) {
//         localStorage.setItem("token", token);
//       } else {
//         sessionStorage.setItem("token", token);
//       }

//       toast.success("Connexion réussie !");
//       navigate("/dashboard");
//     } catch (err) {
//       console.error("Erreur de connexion:", err);
      
//       // Gérer les erreurs spécifiques de l'API (ex: 401 Unauthorized)
//       const errorMessage = 
//         err.response?.data?.message || 
//         "Identifiants incorrects ou erreur de serveur.";

//       toast.error(errorMessage);
//     }
//   };

//   return (
//     <div className="secDefault min-h-screen flex items-center justify-center">
//       <div className="relative w-full max-w-md bg-white rounded-lg shadow py-8 px-4 md:p-8">
//         <div className="flex justify-center mb-4">
//           <div className="absolute w-28 h-28 rounded-full flex items-center justify-center overflow-hidden loginAbso border border-primary">
//             <img src="./img/log.png" alt="Logo" className="w-full h-full object-cover" />
//           </div>
//         </div>
//         <h2 className="text-center text-3xl font-bold text-[color:var(--primary)] mb-2 mt-12">
//           Connectez-vous
//         </h2>
//         <p className="text-center text-xs text-gray-500 mb-6">
//           Si vous n'avez pas de compte, demandez à un administrateur de vous enregistrer !
//         </p>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           <div>
//             <input
//               {...register("email")}
//               placeholder="Adresse email"
//               className="w-full p-3 border rounded"
//             />
//             <p className="text-sm text-red-500">{errors.email?.message}</p>
//           </div>
//           <div>
//             <input
//               {...register("password")}
//               type="password"
//               placeholder="Mot de passe"
//               className="w-full p-3 border rounded"
//             />
//             <p className="text-sm text-red-500">{errors.password?.message}</p>
//           </div>
//           <div className="flex items-center justify-between">
//             <label className="flex items-center gap-2">
//               <input type="checkbox" {...register("remember")} /> Garder la
//               session
//             </label>
//             <button type="button" className="text-sm text-gray-500">
//               Mot de passe oublié ?
//             </button>
//           </div>
//           <button
//             type="submit"
//             disabled={isSubmitting} // Désactiver pendant la soumission
//             className="w-full bg-[color:var(--primary)] text-white py-3 rounded disabled:opacity-50"
//           >
//             {isSubmitting ? "Connexion en cours..." : "Connexion"}
//           </button>
          
//         </form>
//       </div>
//     </div>
//   );
// }

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/slices/authSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "../../api/api"; 

// Schéma de validation inchangé
const schema = yup.object().shape({
  email: yup
    .string()
    .required("Adresse email requise")
    .email("Adresse email invalide"),
  password: yup
    .string()
    .required("Mot de passe requis"),
  remember: yup.boolean(),
});

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
      // 1. Appel de l'API pour la connexion
      // Si votre backend renvoie le JWT dans un cookie HTTP-only, 
      // il n'apparaîtra pas dans response.data.
      const response = await auth.login(data);
      
      // On s'attend à ce que le corps de la réponse contienne au moins l'objet 'user'.
      // S'il est vide, ajustez à 'const user = response.data;'
      // Si votre backend envoie seulement { user: {...} }, utilisez 'const { user } = response.data;'
      const user = response.data.user || response.data; // Adaptez ceci si la réponse est { user: {...} }

      if (!user) {
        // Cela devrait être géré par une erreur 401, mais au cas où...
        throw new Error("L'objet utilisateur est manquant dans la réponse.");
      }

      // 2. Le JWT est stocké dans un cookie HTTP-only par le backend.
      // Le TOKEN N'EST PAS NÉCESSAIREMENT ENREGISTRÉ DANS REDUX/LOCAL STORAGE ici,
      // car Axios va l'envoyer automatiquement via les cookies pour les requêtes futures.
      // Nous stockons uniquement les infos utilisateur dans Redux.
      
      // Si votre 'authSlice' nécessite un champ 'token' même vide pour être valide, 
      // passez une valeur par défaut, mais le jeton réel est dans le cookie.
      const tokenPlaceholder = 'COOKIE_BASED_TOKEN'; 
      
      dispatch(setCredentials({ user, token: tokenPlaceholder })); 

      // 3. OPTIONNEL : Si vous utilisiez 'remember' pour le token, 
      // cette logique n'est plus nécessaire avec les cookies HTTP-only.
      // Vous pourriez utiliser 'remember' pour régler la durée du cookie côté serveur.
      
      toast.success("Connexion réussie ! Redirection en cours...");
      
      // IMPORTANT : Vous devez avoir configuré Axios dans api.js avec 
      // 'withCredentials: true' pour envoyer les cookies à chaque requête.
      navigate("/dashboard");

    } catch (err) {
      console.error("Erreur de connexion:", err);
      
      // 4. Gestion des erreurs
      let errorMessage = "Erreur de connexion. Vérifiez les identifiants ou le CORS.";
      
      if (err.response) {
        if (err.response.status === 401) {
             errorMessage = "Identifiants incorrects.";
        } else if (err.response.data && err.response.data.message) {
             // Tente de récupérer le message d'erreur du backend NestJS
             errorMessage = Array.isArray(err.response.data.message) 
                          ? err.response.data.message[0]
                          : err.response.data.message;
        } else if (err.response.status === 403) {
             errorMessage = "Erreur de permission ou de CORS. Vérifiez la configuration du serveur.";
        } else {
             errorMessage = `Erreur serveur (Statut ${err.response.status}).`;
        }
      }

      toast.error(errorMessage);
    }
  };

  // Rendu JSX (inchangé)
  return (
    <div className="secDefault min-h-screen flex items-center justify-center">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow py-8 px-4 md:p-8">
        <div className="flex justify-center mb-4">
          <div className="absolute w-28 h-28 rounded-full flex items-center justify-center overflow-hidden loginAbso border border-primary">
            <img src="./img/log.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-[color:var(--primary)] mb-2 mt-12">
          Connectez-vous
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          Si vous n'avez pas de compte, demandez à un administrateur de vous enregistrer !
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("email")}
              placeholder="Adresse email"
              className="w-full p-3 border rounded"
              disabled={isSubmitting}
            />
            <p className="text-sm text-red-500">{errors.email?.message}</p>
          </div>
          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Mot de passe"
              className="w-full p-3 border rounded"
              disabled={isSubmitting}
            />
            <p className="text-sm text-red-500">{errors.password?.message}</p>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("remember")} disabled={isSubmitting} /> Garder la
              session
            </label>
            <button type="button" className="text-sm text-gray-500">
              Mot de passe oublié ?
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[color:var(--primary)] text-white py-3 rounded disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? "Connexion en cours..." : "Connexion"}
          </button>
        </form>
      </div>
    </div>
  );
}