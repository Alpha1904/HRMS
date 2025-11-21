import React from "react";
import { Link } from "react-router-dom";

export default function ProfilForm() {
  return (
    <>
      <div className="rounded-md px-4 py-3 bg-white shadow-xl">
        <div className="imgUser text-center">
          <div className="img w-36 h-36 rounded-full overflow-hidden">
            <img
              src="./img/log.png"
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-700 capitalize">
            {fullName}
          </h2>
          <p className="text-sm text-gray-400">{role}</p>
        </div>

        <div className="infoUserForm">
          <form action="">
            <div className="input">
              <label htmlFor="profilePicture">
                Prenom
              </label>
              <input type="file" id="prenom" name="prenom" placeholder="(prenom de l'utilisateur)"/>
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
