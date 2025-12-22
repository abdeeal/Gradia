import React from "react";
import ReviewCard from "./ReviewCard";

const Review = () => {
  return (
    <section id="review" className="w-full min-h-[50dvh] flex flex-col items-center justify-center max-md:mt-10">
      <p className="text-[48px] font-semibold max-xl:text-center max-xl:mt-16 text-center leading-16 max-md:text-[36px] max-md:px-2 max-md:leading-14">
        Trusted by Student <br className="max-md:hidden" />
        Loved Across Campuses
      </p>
      <span className="text-foreground-secondary max-xl:text-center max-xl:pt-4 mt-2 max-md:w-[80%] 2xl:text-[20px]">
        Feedback from active Gradia users who rely on the platform every day.
      </span>

      <div className="xl:w-[85%] grid grid-cols-3 max-xl:grid-cols-1 md:w-[50%] w-[80%] justify-center gap-10 max-xl:gap-6 py-20">
        <div className="flex flex-col gap-6 h-[359px] 2xl:h-[400px]">
          <ReviewCard
            img={"/images/profile1.png"}
            person={"Alya Putri"}
            text={
              "GRADIA makes my daily academic tasks so much easier. I finally feel organized. It’s the first platform that feels designed for real student needs."
            }
            univ={"Universitas Indonesia"}
            height={"h-[55%]"}
          />

          <ReviewCard
            img={"/images/profile2.png"}
            person={"Rizky Mahendra"}
            text={
              "The dashboard is clean and super intuitive. I rely on it every day."
            }
            univ={"Telkom University"}
            height={"h-[45%]"}
          />
        </div>

        <div className="h-[359px] 2xl:h-[400px]">
          <ReviewCard
            img={"/images/profile3.png"}
            person={"Adrian Lim"}
            text={
              "GRADIA has completely changed the way I manage my semester. I used to struggle with overlapping assignments, unclear schedules, and lost notes. But now, everything is neatly organized in one place tasks, courses, attendance, even my study materials. I genuinely feel more in control and less overwhelmed. GRADIA has made my academic life smoother and far more productive."
            }
            univ={"Telkom University"}
            height={"h-[100%]"}
          />
        </div>

        <div className="flex flex-col gap-6 h-[359px] 2xl:h-[400px]">
          <ReviewCard
            img={"/images/profile4.png"}
            person={"Nadia Safira"}
            text={
              "Thanks to GRADIA, I rarely miss any deadlines now. Amazing tool!"
            }
            univ={"Telkom University Purwokerto"}
            height={"h-[45%]"}
          />

          <ReviewCard
            img={"/images/profile5.png"}
            person={"Maya Kusumawardani"}
            text={
              "With GRADIA, planning my week feels effortless, as tasks and calendar integrate smoothly with my class schedule, while the workspace helps keep semester materials organized."
            }
            univ={"Telkom University Jakarta"}
            height={"h-[55%]"}
          />
        </div>
      </div>
    </section>
  );
};

export default Review;
