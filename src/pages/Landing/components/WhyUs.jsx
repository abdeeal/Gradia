import React from 'react'

const WhyUs = () => {
  return (
    <section id='whyus' className='w-full xl:h-dvh h-fit md:grid xl:grid-cols-[40%_60%] md:grid-cols-[50%_50%] flex flex-col md:flex-none bg-white text-black'>
        <div className='flex flex-col h-full w-full xl:justify-center mt-16 xl:mt-0 items-start xl:pl-16 px-6'>
            <p className='font-semibold text-[48px] md:text-[48px] xl:text-[48px] pb-6'>Why Students <br />Need Gradia?</p>
            <div className='flex flex-col justify-center items-start w-full gap-6'>
                {/* <p className='font-semibold text-[20px]'>Studying in university is more than just attending classes.</p> */}
                <p className='font-montserrat xl:text-[20px] text-gray-600'>Assignments pile up, deadlines overlap, schedules shift, and your personal life competes for attention. Traditional planners can’t keep up. Notifications get lost. Stress builds.</p>
            </div>
        </div>

        <div className='relative h-fit mt-6 xl:mt-0'>
            <img src="/images/whyUs.png" alt="" className='xl:w-[600px] xl:h-[600px] xl:absolute xl:top-[50%] xl:translate-y-[10%] xl:right-[10%]' />
        </div>
    </section>
  )
}

export default WhyUs