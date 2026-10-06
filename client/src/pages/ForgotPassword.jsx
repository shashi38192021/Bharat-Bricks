import { useState } from "react";
import { Link } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";

const ForgotPassword = () => {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // ================================
      // REQUEST STEP
      // ================================
      if (step === "request") {
        if (!email) {
          throw new Error("Please enter your email address.");
        }

        if (verificationMethod === "captcha" && !captchaToken) {
          throw new Error("Please complete the CAPTCHA.");
        }

        const response = await fetch(
          "/api/auth/password-reset/send-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              verificationMethod,
              captchaToken:
                verificationMethod === "captcha"
                  ? captchaToken
                  : undefined,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message ||
              "Password reset could not be started."
          );
        }

        if (verificationMethod === "email") {
          setStep("verify");
          setMessage(
            data.message || "OTP sent to your email."
          );
        } else {
          setResetToken(data.resetToken);
          setStep("password");
          setMessage(
            "CAPTCHA verified. Choose a new password."
          );
        }

        return;
      }

      // ================================
      // VERIFY EMAIL OTP
      // ================================
      if (step === "verify") {
        if (!otp || otp.length !== 6) {
          throw new Error("Please enter the 6-digit OTP.");
        }

        const response = await fetch(
          "/api/auth/password-reset/verify-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              otp,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || "Invalid OTP."
          );
        }

        setResetToken(data.resetToken);
        setStep("password");
        setMessage(
          "Email verified. Choose a new password."
        );

        return;
      }

      // ================================
      // SAVE NEW PASSWORD
      // ================================
      if (step === "password") {
        if (!newPassword || newPassword.length < 8) {
          throw new Error(
            "Password must be at least 8 characters."
          );
        }

        const response = await fetch(
          "/api/auth/password-reset/reset",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resetToken,
              newPassword,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message ||
              "Password could not be updated."
          );
        }

        setStep("done");
        setMessage(
          "Password updated. You can now sign in."
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">
        Forgot Password
      </h1>

      {step !== "done" ? (
        <form
          onSubmit={submit}
          className="flex flex-col gap-4"
        >
          {/* REQUEST */}
          {step === "request" && (
            <>
              <input
                type="email"
                placeholder="Account email address"
                className="border p-3 rounded-lg"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

              <p className="font-medium">
                Choose one verification method:
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationMethod("email");
                    setCaptchaToken("");
                    setError("");
                  }}
                  className={`flex-1 p-3 rounded-lg border ${
                    verificationMethod === "email"
                      ? "bg-blue-700 text-white"
                      : "bg-white"
                  }`}
                >
                  📧 Email OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationMethod("captcha");
                    setError("");
                  }}
                  className={`flex-1 p-3 rounded-lg border ${
                    verificationMethod === "captcha"
                      ? "bg-blue-700 text-white"
                      : "bg-white"
                  }`}
                >
                  🛡️ CAPTCHA
                </button>
              </div>

              {verificationMethod === "captcha" && (
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={
                      import.meta.env
                        .VITE_TURNSTILE_SITE_KEY
                    }
                    onSuccess={(token) => {
                      setCaptchaToken(token);
                      setError("");
                    }}
                    onExpire={() => {
                      setCaptchaToken("");
                    }}
                    onError={() => {
                      setCaptchaToken("");
                      setError(
                        "CAPTCHA failed. Please try again."
                      );
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* EMAIL OTP */}
          {step === "verify" && (
            <>
              <div className="text-center">
                <p className="text-gray-600">
                  Enter the 6-digit OTP sent to your
                  email.
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit email OTP"
                className="border p-3 rounded-lg text-center tracking-widest"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                required
              />
            </>
          )}

          {/* NEW PASSWORD */}
          {step === "password" && (
            <input
              type="password"
              placeholder="New password (at least 8 characters)"
              className="border p-3 rounded-lg"
              minLength={8}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              required
            />
          )}

          <button
            disabled={loading}
            type="submit"
            className="bg-blue-700 text-white p-3 rounded-lg uppercase disabled:opacity-80"
          >
            {loading
              ? "Please wait..."
              : step === "request"
              ? verificationMethod === "email"
                ? "Send OTP"
                : "Verify CAPTCHA"
              : step === "verify"
              ? "Verify OTP"
              : "Save New Password"}
          </button>
        </form>
      ) : (
        <Link
          className="block text-center text-blue-700"
          to="/sign-in"
        >
          Go to Sign In
        </Link>
      )}

      {message && (
        <p className="text-green-600 mt-5 text-center">
          {message}
        </p>
      )}

      {error && (
        <p className="text-red-600 mt-5 text-center">
          {error}
        </p>
      )}

      <p className="text-center mt-5">
        <Link
          className="text-blue-700"
          to="/sign-in"
        >
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;