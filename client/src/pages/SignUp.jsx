import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Turnstile } from "@marsidev/react-turnstile";
import OAuth from "../components/OAuth";
import { signInSuccess } from "../redux/user/userSlice";

const SignUp = () => {
  console.log("TURNSTILE KEY:", import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [verificationMethod, setVerificationMethod] = useState("");
  const [otp, setOtp] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSendOtp = async () => {
    setError("");
    setMessage("");

    if (
      !formData.username ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password
    ) {
      setError(
        "Please enter username, email, phone number and password."
      );
      return;
    }

    if (!verificationMethod) {
      setError("Please choose Email OTP or CAPTCHA verification.");
      return;
    }

    if (verificationMethod === "email" && !formData.email) {
      setError("Please enter your email address.");
      return;
    }

    if (verificationMethod === "captcha" && !captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/send-signup-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          verificationMethod: "email",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setError(data.message || "Failed to send OTP.");
        setLoading(false);
        return;
      }

      setMessage(data.message || "OTP sent successfully.");
      setStep(2);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/verify-signup-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          verificationMethod: "email",
          otp,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setError(data.message || "Invalid OTP.");
        setLoading(false);
        return;
      }

      setMessage("Verification successful! Signing you in...");
      dispatch(signInSuccess(data));
      localStorage.setItem("hasAuthenticatedBefore", "true");
      setLoading(false);
      navigate("/");
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleCaptchaSignup = async () => {
    setError("");
    setMessage("");

    if (
      !formData.username ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password
    ) {
      setError(
        "Please enter username, email, phone number and password."
      );
      return;
    }

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setError(data.message || "Signup failed.");
        setLoading(false);
        return;
      }

      setMessage("Signup successful! Signing you in...");
      dispatch(signInSuccess(data));
      localStorage.setItem("hasAuthenticatedBefore", "true");
      setLoading(false);
      navigate("/");
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">
        Sign Up
      </h1>

      {step === 1 && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (verificationMethod === "captcha") {
                handleCaptchaSignup();
              } else {
                handleSendOtp();
              }
            }}
            className="flex flex-col gap-4"
          >
            <input
              type="text"
              placeholder="Username"
              className="border p-3 rounded-lg"
              id="username"
              value={formData.username}
              onChange={handleChange}
            />

            <input
              type="email"
              placeholder="Email Address"
              className="border p-3 rounded-lg"
              id="email"
              value={formData.email}
              onChange={handleChange}
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="border p-3 rounded-lg"
              id="phoneNumber"
              maxLength="10"
              value={formData.phoneNumber}
              onChange={handleChange}
            />

            <input
              type="password"
              placeholder="Password"
              className="border p-3 rounded-lg"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />

            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-3">
                Verify your account using:
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
                    setOtp("");
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
            </div>

            {verificationMethod === "captcha" && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                    setError("");
                  }}
                  onExpire={() => {
                    setCaptchaToken("");
                    setError("CAPTCHA expired. Please complete it again.");
                  }}
                  onError={() => {
                    setCaptchaToken("");
                    setError("CAPTCHA failed. Please try again.");
                  }}
                />
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="bg-blue-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
            >
              {loading
                ? verificationMethod === "captcha"
                  ? "Creating Account..."
                  : "Sending OTP..."
                : verificationMethod === "captcha"
                ? "Create Account"
                : "Send OTP"}
            </button>

            <OAuth />
          </form>

          <div className="flex gap-2 mt-5">
            <p>Have an account?</p>

            <Link to="/sign-in">
              <span className="text-blue-700">Sign In</span>
            </Link>
          </div>
        </>
      )}

      {step === 2 && (
        <form
          onSubmit={handleVerifyOtp}
          className="flex flex-col gap-4"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              Enter OTP
            </h2>

            <p className="text-gray-600 mt-2">
              We sent a 6-digit OTP to your email address.
            </p>
          </div>

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className="border p-3 rounded-lg text-center text-xl tracking-widest"
            maxLength="6"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
          />

          <button
            disabled={loading}
            type="submit"
            className="bg-blue-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setOtp("");
              setError("");
              setMessage("");
            }}
            className="border p-3 rounded-lg"
          >
            Back
          </button>
        </form>
      )}

      {message && (
        <p className="text-green-600 mt-5 text-center">
          {message}
        </p>
      )}

      {error && (
        <p className="text-red-500 mt-5 text-center">
          {error}
        </p>
      )}
    </div>
  );
};

export default SignUp;