import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import WhyUs from "./components/WhyUs";
import Core from "./components/Core";
import Footer from "./components/Footer";
import WhyGradia from "./components/WhyGradia";
import Review from "./components/Review";
import Stage from "./components/Stage";

const Landing = () => {
  return (
    <div className="font-inter">
      <Navbar />
      <Hero />
      <WhyUs />
      <Core />
      <WhyGradia />
      <Review />
      <Stage />
      <Footer />
    </div>
  );
};

export default Landing;
