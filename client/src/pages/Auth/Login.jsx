// import React from "react";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { setCredentials } from "../../store/slices/authSlice";
// // import { auth } from "../../api/api"; // Laissez-le commenté ou retirez-le si vous ne l'utilisez pas
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // --- MOCK DATA TEMPORAIRE ---
// const MOCK_EMAIL = "admin@hr.com";
// const MOCK_PASSWORD = "password123";
// const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDEiLCJyb2xlIjoiYWRtaW4ifQ.H4p29WbTf8b_c5wM3tZkL7xS9jE4g2X0Gg6sY1Z3kM8";
// const MOCK_USER = {
//     id: "001",
//     name: "Jumael Kamga",
//     email: MOCK_EMAIL,
//     role: "admin",
// };
// // ---------------------------

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
//     formState: { errors },
//   } = useForm({ resolver: yupResolver(schema) });
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const onSubmit = async (data) => {
//     // --- DÉBUT DE LA LOGIQUE DE MOCKING ---
    
//     // 1. Simuler l'échec si les identifiants ne correspondent pas aux mocks
//     if (data.email !== MOCK_EMAIL || data.password !== MOCK_PASSWORD) {
//          toast.error("Identifiants de test incorrects. Utilisez admin@hr.com / password123");
//          return;
//     }

//     try {
//         // Simuler le délai réseau (optionnel, pour l'effet)
//         await new Promise(resolve => setTimeout(resolve, 500)); 
        
//         // 2. Définir les données à partir des mocks
//         const token = MOCK_TOKEN;
//         const user = MOCK_USER;
        
//         // 3. Procéder comme si l'API avait réussi
//         dispatch(setCredentials({ user, token }));

//         // Stocker le token selon l'option "remember me"
//         if (data.remember) localStorage.setItem("token", token);
//         else sessionStorage.setItem("token", token);
        
//         toast.success("Connecté (Mode Mock)");
//         navigate("/dashboard");
//     } catch (err) {
//       // Cette partie devrait être inaccessible en mode mock simple
//       toast.error("Erreur de connexion simulée");
//     }
//     // --- FIN DE LA LOGIQUE DE MOCKING ---
//   };

//   return (
//     <div className="secDefault min-h-screen flex items-center justify-center">
//       <div className="relative w-full max-w-md bg-white rounded-lg shadow py-8 px-4 md:p-8">
//         <div className="flex justify-center mb-4">
//           <div className="absolute w-28 h-28 rounded-full flex items-center justify-center overflow-hidden loginAbso border border-primary">
//             <img src="./img/log.png" alt="" className="w-full h-full object-cover" />
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
//             className="w-full bg-[color:var(--primary)] text-white py-3 rounded"
//           >
//             Connexion
//           </button>
//           <div className="text-xs text-center text-gray-500 pt-2">
//               Mode Développement : Utilisez <strong>{MOCK_EMAIL}</strong> / <strong>{MOCK_PASSWORD}</strong>
//           </div>
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

// --- MOCK DATA TEMPORAIRE avec 2 rôles ---
const MOCK_USERS = [
  {
    email: "admin@hr.com",
    password: "password123",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDEiLCJyb2xlIjoiYWRtaW4ifQ.H4p29WbTf8b_c5wM3tZkL7xS9jE4g2X0Gg6sY1Z3kM8",
    user: {
      id: "001",
      name: "Jumael Kamga (Admin)",
      email: "admin@hr.com",
      role: "admin",
    },
  },
  {
    email: "employe@hr.com",
    password: "password456",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDIiLCJyb2xlIjoiZW1wbG95ZSJ9.Q9m_p8aL7yG_c5wM3tZkL7xS9jE4g2X0Gg6sY1Z3kM8",
    user: {
      id: "002",
      name: "Alice Dubois (Employé)",
      email: "employe@hr.com",
      role: "employe",
    },
  },
];
// ---------------------------

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
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    // --- DÉBUT DE LA LOGIQUE DE MOCKING MISE À JOUR ---
    
    // 1. Chercher l'utilisateur dans les mocks
    const mockUser = MOCK_USERS.find(
      (u) => u.email === data.email && u.password === data.password
    );

    // 2. Simuler l'échec si les identifiants ne correspondent pas
    if (!mockUser) {
        toast.error("Identifiants incorrects. Voir les identifiants de test ci-dessous.");
        return;
    }

    try {
        // Simuler le délai réseau (optionnel)
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // 3. Définir les données à partir des mocks trouvés
        const token = mockUser.token;
        const user = mockUser.user;
        
        // 4. Procéder comme si l'API avait réussi
        dispatch(setCredentials({ user, token }));

        // Stocker le token selon l'option "remember me"
        if (data.remember) localStorage.setItem("token", token);
        else sessionStorage.setItem("token", token);
        
        toast.success(`Connecté comme : ${user.role} (Mode Mock)`);
        navigate("/dashboard");
    } catch (err) {
      // Cette partie devrait être inaccessible en mode mock simple
      toast.error("Erreur de connexion simulée");
    }
    // --- FIN DE LA LOGIQUE DE MOCKING MISE À JOUR ---
  };

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
            />
            <p className="text-sm text-red-500">{errors.email?.message}</p>
          </div>
          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Mot de passe"
              className="w-full p-3 border rounded"
            />
            <p className="text-sm text-red-500">{errors.password?.message}</p>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("remember")} /> Garder la
              session
            </label>
            <button type="button" className="text-sm text-gray-500">
              Mot de passe oublié ?
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-[color:var(--primary)] text-white py-3 rounded"
          >
            Connexion
          </button>
          
          {/* Instructions de connexion mises à jour */}
          {/* <div className="text-sm text-center text-gray-500 pt-2 border-t border-gray-200 mt-4">
            <h3 className="font-semibold mb-2 text-gray-700">Mode Développement (Tests) :</h3>
            <p className="text-xs mb-1">
                <strong>Administrateur :</strong> 
                <br />
                `admin@hr.com` / `password123`
            </p>
          </div> */}
        </form>
      </div>
    </div>
  );
}