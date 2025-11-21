import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[100vh] bg-[#F5F5F5] grid items-center justify-center text-center secDefault">
      <div className="max-w-[35rem]">
        <h2 className="lg:text-5xl mb:text-4xl text-3xl font-bold text-primary mb-7">
          Oooopps cette page n'existe pas
        </h2>
        <p className="text-sm text-gray-500 mb-7">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tenetur
          veniam error, praesentium iusto excepturi totam hic. Pariatur
          voluptatibus totam illum!
        </p>

        <div className="btn mt-12">
          <Link
            to="login"
            className="py-4 px-6 rounded-full bg-primary text-white hover:primary/30 transition-colors"
          >
            Retour à l'acceuil
          </Link>
        </div>
      </div>
    </div>
  );
}
