import React from "react";
import { Link } from "react-router-dom";
import ProfileInfos from "./ProfileInfos";
import ProfilForm from "./ProfileForm";


export default function Profile() {
  return (
    <div className="min-h-[100%] bg-red-400">
      <div className="container flex flex-col md:flex-row items-center gap-4">
        <ProfileInfos />
        <ProfilForm />
      </div>
    </div>
  );
}
