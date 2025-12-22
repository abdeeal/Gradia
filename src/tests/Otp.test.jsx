import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Mobile from "@/pages/Auth/Verify-otp/Layout/Mobile";
import React from "react";

global.fetch = vi.fn();

// Helper render
const renderUI = (props = {}) => {
  return render(
    <BrowserRouter>
      <Mobile
        title="Verify Your Email"
        expiredAt={new Date(Date.now() + 60000).toISOString()}
        email="test@example.com"
        from="verification"
        user={{ name: "Demo" }}
        purpose="verify"
        {...props}
      />
    </BrowserRouter>
  );
};

describe("Mobile Verify OTP Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders title and input", () => {
    renderUI();

    expect(
      screen.getByText("Verify Your Email")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Enter the 6-digit code sent to your email")
    ).toBeInTheDocument();

    expect(screen.getByText("--:--")).toBeInTheDocument();
  });

  test("shows error when OTP is less than 6 digits", async () => {
    renderUI();

    const verifyBtn = screen.getByRole("button", { name: /verify/i });

    fireEvent.click(verifyBtn);

    expect(
      await screen.findByText("Please enter a valid 6-digit OTP")
    ).toBeInTheDocument();
  });

  test("calls verifyOtp API when pressing Verify", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "OK" }),
    });

    renderUI();

    // isi OTP 6 digit
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });
    fireEvent.change(inputs[2], { target: { value: "3" } });
    fireEvent.change(inputs[3], { target: { value: "4" } });
    fireEvent.change(inputs[4], { target: { value: "5" } });
    fireEvent.change(inputs[5], { target: { value: "6" } });

    const verifyBtn = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/verifyOtp", expect.any(Object));
    });

    // success state menampilkan SuccessMsg
    expect(
      await screen.findByText(/Email Verified Successfully/i)
    ).toBeInTheDocument();

  });

  test("resend button triggers sendOtp API", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ expires_at: new Date(Date.now() + 60000).toISOString() }),
    });

    renderUI();

    const resendBtn = screen.getByText(/resend code/i);

    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/sendOtp", expect.any(Object));
    });
  });
});
