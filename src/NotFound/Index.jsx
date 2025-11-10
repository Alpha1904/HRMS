import React from "react";
export default function NotFound() {
  return (
    <div className="min-height-screen w-screen bg-[#f5f5f5] grid items-center">
      <div className="">
        <h2>Oooopps cette page n'existe pas</h2>
        <p>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tenetur
          veniam error, praesentium iusto excepturi totam hic. Pariatur
          voluptatibus totam illum!
        </p>

        <div className="btn">
          <Link to="" className="py-4 px-6 rounded-full bg-primary text-white hover:primary/30 transition-colors">
            Retour à l'acceuil
          </Link>
        </div>
      </div>
    </div>
  );
}
