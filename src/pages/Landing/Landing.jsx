import React from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import WhyUs from './components/WhyUs'
import Core from './components/Core'
import Footer from './components/Footer'

const Landing = () => {
  return (
    <div className='font-inter'>
        <Navbar />
        <Hero />
        <WhyUs />
        <Core />
        <Footer />
    </div>
  )
}

export default Landing