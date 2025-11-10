import React, { useCallback, useState } from "react";
import { Map, PhoneCallIcon, Send, Trash2 } from "lucide-react"; // icones
import { LucideMailPlus } from "lucide-react";

export default function LandingPage() {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const appmap = "Douala, CMR";
  const appemail = "hrmglogal@gamil.com";
  const apptel = "+237 679 454 785";

  const galery = [
    { title: "hrm global", url: "./img/banner2.jpeg" },
    { title: "hrm global", url: "./img/bannerImg.png" },
    { title: "hrm global", url: "./img/AboutImg.png" },
    { title: "hrm global", url: "./img/banner1.jpg" },
    { title: "hrm global", url: "./img/coverBanner.jpeg" },
    { title: "hrm global", url: "./img/AboutImg.png" },
    { title: "hrm global", url: "./img/banner1.jpg" },
    { title: "hrm global", url: "./img/AboutImg.png" },
    { title: "hrm global", url: "./img/coverBanner.jpeg" },
    { title: "hrm global", url: "./img/banner2.jpeg" },
    { title: "hrm global", url: "./img/bannerImg.png" },
    { title: "hrm global", url: "./img/AboutImg.png" },
  ];
  const navBarUrl = [
    { title: "acceuil", url: "/" },
    { title: "a propos", url: "#about" },
    { title: "faqs", url: "#" },
    { title: "politique", url: "#" },
  ];

  const faqs = [
    {
      quest: "Comment nous rejoindre ?",
      res: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam unde dolorem est mollitia eligendi nulla ratione, provident, perferendis repellendus, velit exercitationem debitis harum sapiente nihil libero veniam",
    },
    {
      quest: "Pourquoi nous choisir ?",
      res: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam unde dolorem est mollitia eligendi nulla ratione, provident, perferendis repellendus",
    },
    {
      quest: "Depuis combien de temps on fonctionne ?",
      res: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam unde dolorem est mollitia eligendi",
    },
    {
      quest: "Nos meilleures offres et services ?",
      res: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam unde dolorem est mollitia eligendi",
    },
  ];

  return (
    <>
      {/* --------- entete de la page ---------- */}

      <header className="header fixed border w-[95%] md:w-[85%] border-primary flex items-center justify-between bg-white p-2 px-3 rounded-full">
        <div className="headerCircle">
          <div className="logo w-22 h-12 overflow-hidden">
            {" "}
            {/* logo */}
            <a href="#">
              <img
                src="./img/logo.png"
                alt="hrm global"
                className="w-full h-full object-cover"
              />
            </a>
          </div>
        </div>

        <nav className="">
          <ul className="flex items-center justify-center gap-6 capitalize font-500">
            {navBarUrl.map((link, index) => (
              <li
                className="hover:text-primary transition-colors hidden md:inline"
                key={index}
              >
                <a href={link.url}>{link.title}</a>
              </li>
            ))}
            <li>
              <a
                href="login"
                className="py-3 px-5 md:py-4 md:px-6 rounded-full bg-primary text-white hover:text-primary hover:bg-white border border-primary hover:border-primary transition-colors"
              >
                connexion
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* --------- entete de la page ---------- */}
      <main>
        {/* --------- Banner de la page ---------- */}
        <section className="banner md:min-h-screen">
          {/* <div className="bannerContainer bg-gradient-to-r from-[#480dbf] to-[#2F0B82] min-h-screen w-full"> */}
          <div className="bannerContainer pb-16 md:min-h-screen w-full flex flex-col pt-48 px-12 md:flex-row md:items-center md:px-28 md:gap-12 md:pt-38 secPadding">
            <div className="left text-white w-full md:w-1/2">
              <p className="text-xs text-primary montserrat">
                #Gestion des ressources humaines
              </p>
              <p className="text-xs mb-4">
                <span className="text-primary font-bold montserrat">
                  HRM GLOBAL{" "}
                </span>
                est une entreprise multisite de gestions des ressources humaines
              </p>

              <h1 className="text-4xl md:text-5xl text-primary mb-6">
                Optimisez vos ressources humaines avec HRM Global
              </h1>

              <p className="text-sm mb-4">
                Découvrez notre solution de gestion des ressources humaines qui
                vous permet d'optimiser vos processus, de gerer vos équipes et
                de prendre des décisions éclairées pour booster la performance
                de votre entreprise.
              </p>

              <div className="userPlus grid grid-cols-2 items-center w-full max-w-[23.2rem] md:gap-2 overflow-hidden">
                <p className="text-xs">
                  Plus de{" "}
                  <span className="text-primary">
                    5 millions d'utilisateurs
                  </span>{" "}
                  sur nos différentes{" "}
                  <span className="text-primary">plateformes</span>
                </p>

                <div className="img flex flex-row items-center space-x-[-1rem]">
                  <img
                    src="./img/coverBanner.jpeg"
                    alt="hrm global"
                    className="z-1 w-12 h-12 rounded-full border border-primary"
                  />
                  <img
                    src="./img/coverBanner.jpeg"
                    alt="hrm global"
                    className="z-3 w-12 h-12 rounded-full border border-primary"
                  />
                  <img
                    src="./img/coverBanner.jpeg"
                    alt="hrm global"
                    className="z-5 w-12 h-12 rounded-full border border-primary"
                  />
                </div>
              </div>

              <div className="link mt-10 flex items-center gap-3">
                <a
                  href="login"
                  className="py-3 px-6 rounded-full bg-white text-primary hover:text-white hover:bg-primary transition-colors"
                >
                  Connectez-vous
                </a>

                <a
                  href="login"
                  className="py-3 px-6 rounded-full text-primary hover:bg-white hover:text-primary border border-primary hover:border-white transition-colors"
                >
                  En savoir plus
                </a>
              </div>
            </div>

            <div className="right w-full hidden md:w-[50%] md:block h-[35rem] flex items-center justify-center">
              <div className="img w-full h-full overflow-hidden rounded-xl">
                <img
                  src="./img/bannerImg.png"
                  className="w-full h-full object-cover"
                  alt="hrm global"
                />
              </div>
            </div>
          </div>
        </section>
        {/* --------- Banner de la page ---------- */}

        {/* --------- partenariat de la page ---------- */}
        <section className="relative overflow-hidden bg-white h-[5rem] flex justify-center items-center">
          <div className="w-full h-full absolute">
            <marquee behavior="">
              <div className="flex items-center gap-24">
                <div className="imgScroll md:w-[10rem] md:h-[10rem] overflow-hidden">
                  <img
                    src="./img/logo.png"
                    alt="hrm global"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="imgScroll md:w-[10rem] md:h-[10rem] w-[10rem] h-[10rem] overflow-hidden">
                  <img
                    src="./img/logo.png"
                    alt="hrm global"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="imgScroll md:w-[10rem] md:h-[10rem] overflow-hidden">
                  <img
                    src="./img/logo.png"
                    alt="hrm global"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="imgScroll md:w-[10rem] md:h-[10rem] overflow-hidden">
                  <img
                    src="./img/logo.png"
                    alt="hrm global"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </marquee>
          </div>
        </section>
        {/* --------- partenariat de la page ---------- */}

        {/* --------- comment ca marche ---------- */}
        {/* <section className="secDefault flex justify-center items-center text-white bg-gradient-to-b from-[#6e341bf3] to-[#030202f6]"> */}
        <section className="secDefault flex justify-center items-center text-white bgGrad">
          <div className="container">
            <h2 className="text-3xl md:text-4xl mb-2">Comment ça marche ?</h2>
            <p className=" text-white/80">
              4 étapes simples pour une gestion RH efficace
            </p>

            <div className="steps grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-4 mt-16 md:mt-[5rem] text-center">
              <div className="steps1 relative text-white bg-primary rounded-lg p-10">
                <div className="absolute stepsNumber bg-white rounded-full w-14 h-14 p-4 flex items-center justify-center border border-primary">
                  <h3 className="montserrat font-black text-primary text-2xl">
                    01
                  </h3>
                </div>

                <h2 className="text-2xl font-bold mb-4 mt-4 montserrat">
                  Centraliser les données
                </h2>
                <p className="text-xs text-white">
                  Regroupez toutes les informations des collaborateurs
                  (contrats, salaires, absences, documents) dans une base
                  unique, sécurisée et facile d’accès.
                </p>
              </div>
              <div className="steps1 relative text-primary bg-white rounded-lg p-10">
                <div className="absolute stepsNumber bg-primary rounded-full w-14 h-14 p-4 flex items-center justify-center border border-white">
                  <h3 className="montserrat font-black text-white text-2xl">
                    02
                  </h3>
                </div>

                <h2 className="text-2xl font-bold mb-4 mt-4 montserrat">
                  Automatiser les processus
                </h2>
                <p className="text-xs">
                  Simplifiez la gestion des congés, absences, paies et
                  validations grâce à des flux automatisés qui réduisent les
                  erreurs et font gagner du temps.
                </p>
              </div>
              <div className="steps1 relative text-white bg-primary rounded-lg p-8">
                <div className="absolute stepsNumber bg-white rounded-full w-14 h-14 p-4 flex items-center justify-center border border-primary">
                  <h3 className="montserrat font-black text-primary text-2xl">
                    03
                  </h3>
                </div>

                <h2 className="text-2xl font-bold mb-4 mt-4 montserrat">
                  Gérer et suivre le personnel
                </h2>
                <p className="text-xs text-white">
                  Suivez les performances, planifiez les formations et
                  accompagnez le développement de carrière de vos équipes avec
                  des outils clairs et intuitifs.
                </p>
              </div>
              <div className="steps1 relative text-primary bg-white rounded-lg p-8">
                <div className="absolute stepsNumber bg-primary rounded-full w-14 h-14 p-4 flex items-center justify-center border border-white">
                  <h3 className="montserrat font-black text-white text-2xl">
                    04
                  </h3>
                </div>

                <h2 className="text-2xl font-bold mb-4 mt-4 montserrat">
                  Analyser et décider
                </h2>
                <p className="text-xs">
                  Appuyez vos décisions stratégiques sur des rapports détaillés
                  et des tableaux de bord interactifs pour optimiser vos
                  ressources humaines.
                </p>
              </div>
            </div>

            <div className="link mt-10 flex items-center justify-center gap-3">
              <a
                href="login"
                className="py-3 px-6 rounded-full text-primary hover:bg-primary hover:text-white border border-primary hover:border-primary transition-colors"
              >
                Connectez-vous
              </a>
            </div>
          </div>
        </section>
        {/* --------- comment ca marche ---------- */}

        {/* --------- A propos de nous ---------- */}
        <section
          className="secDefault flex justify-center items-center text-gray-600"
          id="about"
        >
          <div className="container flex flex-col md:flex-row items-center gap-8">
            <div className="left w-full w-full h-[25rem] md:w-[50%] md:h-[35rem] flex items-center justify-center">
              <div className="img w-full h-full overflow-hidden rounded-xl">
                <img
                  src="./img/aboutImg.png"
                  className="w-full h-full object-cover"
                  alt="hrm global"
                />
              </div>
            </div>

            <div className="right w-full md:w-1/2 md:text-right">
              <h2 className="text-4xl md:text-5xl text-primary mb-8">
                À propos de nous
              </h2>

              <p className="text-sm mb-4">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Aliquid excepturi magnitiomn perferendis, at dignissimos odit
                ducimus dolores officia dolorum neque animi alias cumq
                repudiandae. Necessitatibus iusto, nihil iure eligendi velit
                dolores dolor, tenetur quos maxime ab aliquam error obcaecati
                cupiditate Lorem ipsum, dolor sit amet consectetur adipisicing
                elit. Aliquid except uri magnitiomo perferendis, at dignissimos
                odit ducimus dolores o.
              </p>
              <p className="text-sm">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Aliquid except uri magnitiomo perferendis, at dignissimos odit
                ducimus dolores officia dolorum neque animi alias cumq
                repudiandae. Necessitatibus iusto, nihil iure eligendi velit
                dolores dolor, tenetur quos maxime ab aliquam error obcaecati
                cupiditate.
              </p>

              <div className="link mt-10 flex items-center md:justify-end">
                <a
                  href="login"
                  className="py-3 px-6 rounded-full text-primary hover:bg-primary hover:text-white border border-primary"
                >
                  En savoir plus
                </a>
              </div>
            </div>
          </div>
        </section>
        {/* --------- A propos de nous ---------- */}

        {/* --------- Faqs a propos de hrm global ---------- */}
        <section className="secDefault flex justify-center items-center text-white bgGrad">
          <div className="container flex flex-col items-center justify-center">
            <h2 className="text-primary text-3xl md:text-4xl mb-2 text-center">
              Faqs à propos de nous
            </h2>
            <p className="text-white/80 text-center">
              Retrouvez ici les réponses aux questions les plus courantes que se
              posent tout le monde sur{" "}
              <span className="montserrat font-bold">HRM Global</span>
            </p>

            <div className="faqs max-w-[40rem] mt-8">
              <ul className="text-primary flex flex-col gap-2">
                {faqs.map((quest, index) => (
                  <li
                    className="bg-white shadow rounded-xl py-4 px-8"
                    key={index}
                  >
                    <h3 className="text-sm flex items-center justify-between mb-3">
                      {quest.quest}{" "}
                      <button className="actFaqs w-6 h-6 flex items-center justify-center bg-primary text-xs text-white/100 rounded-full">
                        +
                      </button>
                    </h3>
                    <p className="text-xs montserrat text-gray-500">
                      {quest.res}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="link mt-10 flex items-center justify-center">
              <a
                href="login"
                className="py-3 px-6 rounded-full text-primary hover:bg-primary hover:text-white border border-primary"
              >
                Poser une question unique
              </a>
            </div>
          </div>
        </section>
        {/* --------- Faqs a propos de hrm global ---------- */}

        {/* --------- Newsletter ---------- */}
        <section className="newsletter secDefault flex justify-center items-center text-white bg-primary">
          <div className="container flex flex-col items-center justify-center">
            <h2 className="text-gray-900 text-3xl md:text-4xl mb-2 text-center">
              Inscrivez-vous à notre newsletter
            </h2>
            <p className="text-white/80 text-xs text-center max-w-[40rem]">
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ex,
              voluptatem ab? Voluptatibus voluptas quia libero dolor in.
              Expedita, eveniet nobis earum culpa illo incidunt odio eligendi
              architecto blanditiis consequatur provident at eum iusto ex
              tempore.
            </p>

            <div className="formNewsletter mt-8">
              <form
                action="#"
                method="post"
                className={`${
                  isFocused ? "border-gray-500" : ""
                } p-1 rounded-full bg-white flex items-center text-xs border-2 border-white`}
              >
                <input
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="email"
                  name="email"
                  required
                  placeholder="Entrez votre email"
                  className="py-3 pl-2 pr-6 rounded-full text-gray-500"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-full text-primary hover:bg-primary hover:text-white border border-primary"
                >
                  Soumettre
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </section>
        {/* --------- Newsletter ---------- */}

        {/* --------- Galerie hrm global ---------- */}
        <section className="galery secDefault flex justify-center items-center text-primary">
          <div className="container flex flex-col items-center justify-center">
            <h2 className="text-primary text-3xl md:text-4xl text-center">
              Images récentes
            </h2>

            <div className="galeryImg mt-12 grid grid-cols-2 lg:grid-cols-6 md:grid-cols-3 flex flex-wrap md:gap-6 gap-2">
              {galery.map((galeryImg, index) => (
                <div
                  className="img max-w-[12rem] h-[15rem] overflow-hidden"
                  key={index}
                >
                  <img
                    src={galeryImg.url}
                    alt={galeryImg.title}
                    className="rounded-lg h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* --------- Galerie hrm global ---------- */}

        {/* --------- Contact ---------- */}
        <section className="secDefault flex justify-center items-center text-white bg-primary">
          <div className="container flex flex-col gap-8 md:flex-row items-center">
            <div className="left md:w-1/2">
              <h2 className="text-gray-800 mb-4 text-3xl md:text-4xl">
                Contactez-nous
              </h2>
              <p className="text-white/80 text-xs max-w-[35rem]">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ex,
                voluptatem ab? Voluptatibus voluptas quia libero dolor in.
                Expedita, eveniet nobis earum culpa illo incidunt odio eligendi
                architect blanditiis consequatur provident at eum iusto ex
                tempore.
              </p>

              <div className="contactLink text-xs mt-8 flex flex-col gap-3 max-w-xs">
                <a
                  href={appemail}
                  className="flex items-center gap-2 hover:text-gray-600 transition-colors transition-colors"
                >
                  <LucideMailPlus className="w-4 h-4" />
                  {appemail}
                </a>
                <a
                  href=""
                  className="flex items-center gap-2 hover:text-gray-600 transition-colors transition-colors"
                >
                  <PhoneCallIcon className="w-4 h-4" />
                  {apptel}
                </a>
                <a
                  href=""
                  className="flex items-center gap-2 hover:text-gray-600 transition-colors transition-colors"
                >
                  <Map className="w-4 h-4" />
                  {appmap}
                </a>
              </div>
            </div>

            <div className="right md:w-1/2 md:p-23 w-[95%]">
              <form
                action="#"
                method="post"
                className="bg-white rounded-xl md:p-8 p-4 md:w-[80%]"
              >
                <h2 className="text-gray-800 text-2xl md:text-3xl">
                  Dites quelque chose
                </h2>

                <div className="input md:mt-8 mt-4 flex flex-col gap-3">
                  <div className="inputItem text-gray-600">
                    <label htmlFor="name">Votre nom</label>
                    <input
                      type="text"
                      name="Nom"
                      id="name"
                      required
                      placeholder="Martin samba"
                      className="w-full h-full p-5 bg-[#F2F2F2] text-xs text-gray-500 border focus:border-primary mt-4 rounded-lg"
                    />
                  </div>
                  <div className="inputItem text-gray-600">
                    <label htmlFor="name">Votre email</label>
                    <input
                      type="email"
                      name="Email"
                      id="email"
                      required
                      placeholder="martinsamba@gmail.com"
                      className="w-full h-full p-5 bg-[#F2F2F2] text-xs text-gray-500 border focus:border-primary mt-4 rounded-lg"
                    />
                  </div>
                  <div className="inputItem text-gray-600">
                    <label htmlFor="message">Votre message</label>
                    <textarea
                      name="Message"
                      id="name"
                      required
                      placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias dolorum id ducimus. Est, accusamus."
                      className="w-full h-full p-5 bg-[#F2F2F2] text-xs text-gray-500 border focus:border-primary mt-4 rounded-lg"
                    />
                  </div>

                  <div className="inputItem text-gray-600">
                    <button
                      className="w-full h-full p-4 bg-primary hover:bg-primary/80 pointer text-sm text-white rounded-lg flex items-center justify-center gap-3 transition-colors"
                      type="submit"
                    >
                      ENVOYER <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
        {/* --------- Contact ---------- */}
      </main>

      {/* --------- Footer ---------- */}
      <footer className="secDefault flex justify-center text-white bgGrad">
        <div className="container"></div>
      </footer>
      {/* --------- Footer ---------- */}
    </>
  );
}
