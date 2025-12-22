import React from "react";

export const Container = ({
  children,
  noPadding = false,
  noPaddingRight = false,
}) => {
  let className = "";

  if (noPadding) {
    // tanpa padding sama sekali (login/register)
    className = "";
  } else if (noPaddingRight) {
    // hapus hanya kanan — kiri, atas, bawah tetap
    className = "px-[22px] pt-[20px] pb-[20px] xl:pl-[20px] xl:pt-[20px] xl:pb-[20px]";
  } else {
    // default padding kiri-kanan-atas-bawah
    className = "px-[22px] py-[20px] xl:p-[20px]";
  }

  return <div className={className}>{children}</div>;
};
