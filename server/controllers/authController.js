import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import PasswordResetOtp from "../models/passwordResetOtpModel.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { randomInt } from "node:crypto";

// ======================================================
// GODADDY EMAIL CONFIGURATION
// ======================================================

const godaddyEmail = (process.env.GODADDY_EMAIL || "").trim();
const godaddyEmailPassword =
  process.env.GODADDY_EMAIL_PASSWORD || "";

console.info("GoDaddy OTP email configuration", {
  emailPresent: Boolean(godaddyEmail),
  passwordPresent: Boolean(godaddyEmailPassword),
});

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: godaddyEmail,
    pass: godaddyEmailPassword,
  },
});

// ======================================================
// HELPERS
// ======================================================

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verifyTurnstile = async (captchaToken) => {
  if (!captchaToken) {
    return false;
  }

  const turnstileSecret =
    process.env.TURNSTILE_SECRET_KEY;

  if (!turnstileSecret) {
    console.error("TURNSTILE_SECRET_KEY is missing.");
    throw new Error("CAPTCHA configuration is missing.");
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: captchaToken,
      }),
    }
  );

  const result = await response.json();

  console.info("Turnstile verification:", {
    success: result.success,
  });

  return result.success === true;
};

// ======================================================
// SEND SIGNUP OTP
// ======================================================

export const sendSignupOtp = async (
  req,
  res,
  next
) => {
  try {
    const {
      username,
      email,
      phoneNumber,
      password,
      verificationMethod,
    } = req.body;

    if (
      !username ||
      !email ||
      !phoneNumber ||
      !password ||
      !verificationMethod
    ) {
      return next(
        errorHandler(
          400,
          "Username, email, phone number, password and verification method are required."
        )
      );
    }

    if (
      !["email", "phone"].includes(
        verificationMethod
      )
    ) {
      return next(
        errorHandler(
          400,
          "Invalid verification method."
        )
      );
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return next(
        errorHandler(
          400,
          "Please enter a valid 10-digit mobile number."
        )
      );
    }

    const existingUsername =
      await User.findOne({ username });

    if (existingUsername) {
      return next(
        errorHandler(
          400,
          "Username is already registered."
        )
      );
    }

    const existingEmail =
      await User.findOne({ email });

    if (existingEmail) {
      return next(
        errorHandler(
          400,
          "Email is already registered."
        )
      );
    }

    // Phone OTP is not connected.
    if (verificationMethod === "phone") {
      return res.status(501).json({
        success: false,
        message:
          "Phone OTP is not connected yet. Please use Email OTP.",
      });
    }

    const otp = generateOtp();

    const hashedPassword =
      bcryptjs.hashSync(password, 10);

    await Otp.deleteMany({
      $or: [
        { email },
        { phoneNumber },
      ],
    });

    await Otp.create({
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      otp,
      verificationMethod,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    try {
      await transporter.sendMail({
        from: "noreply@fyndyourhomes.in",
        to: email,
        subject:
          "fyndyourhomes.in - Email Verification OTP",
        text: `Your fyndyourhomes.in verification OTP is ${otp}. This OTP will expire in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>fyndyourhomes.in</h2>

            <p>Your email verification OTP is:</p>

            <h1 style="letter-spacing: 8px;">
              ${otp}
            </h1>

            <p>This OTP will expire in 5 minutes.</p>

            <p>
              If you did not request this verification,
              you can ignore this email.
            </p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error(
        "Signup OTP email delivery failed",
        {
          errorCode: mailError.code || null,
          responseCode:
            mailError.responseCode || null,
          emailPresent: Boolean(godaddyEmail),
          passwordPresent:
            Boolean(godaddyEmailPassword),
        }
      );

      return next(
        errorHandler(
          502,
          "Unable to send verification email. Check the server GoDaddy email configuration."
        )
      );
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// VERIFY SIGNUP OTP
// ======================================================

export const verifySignupOtp = async (
  req,
  res,
  next
) => {
  try {
    const {
      username,
      email,
      phoneNumber,
      password,
      verificationMethod,
      otp,
    } = req.body;

    if (
      !username ||
      !email ||
      !phoneNumber ||
      !password ||
      !verificationMethod ||
      !otp
    ) {
      return next(
        errorHandler(
          400,
          "Signup details and OTP are required."
        )
      );
    }

    const otpRecord = await Otp.findOne({
      username,
      email,
      phoneNumber,
      verificationMethod,
      otp,
    });

    if (!otpRecord) {
      return next(
        errorHandler(400, "Invalid OTP.")
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return next(
        errorHandler(
          400,
          "OTP has expired. Please request a new OTP."
        )
      );
    }

    const existingUser = await User.findOne({
      $or: [
        { username },
        { email },
      ],
    });

    if (existingUser) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return next(
        errorHandler(
          400,
          "Username or email is already registered."
        )
      );
    }

    const newUser = new User({
      username,
      email,
      password: otpRecord.password,
      phoneNumber,
    });

    await newUser.save();

    await Otp.deleteOne({
      _id: otpRecord._id,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        isAdmin: newUser.isAdmin === true,
      },
      process.env.JWT_SECRET
    );

    const {
      password: pass,
      ...rest
    } = newUser._doc;

    return res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(201)
      .json({
        success: true,
        message:
          "Account created and signed in successfully.",
        ...rest,
      });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// NORMAL SIGNUP WITH CAPTCHA
// ======================================================

export const signup = async (
  req,
  res,
  next
) => {
  try {
    const {
      username,
      email,
      password,
      phoneNumber,
      captchaToken,
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !phoneNumber
    ) {
      return next(
        errorHandler(
          400,
          "Username, email, password, and phone number are required!"
        )
      );
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return next(
        errorHandler(
          400,
          "Please enter a valid 10-digit mobile number."
        )
      );
    }

    if (!captchaToken) {
      return next(
        errorHandler(
          400,
          "Please complete the CAPTCHA."
        )
      );
    }

    let captchaValid;

    try {
      captchaValid =
        await verifyTurnstile(captchaToken);
    } catch (captchaError) {
      console.error(
        "Turnstile configuration error:",
        captchaError.message
      );

      return next(
        errorHandler(
          500,
          "CAPTCHA configuration is missing."
        )
      );
    }

    if (!captchaValid) {
      return next(
        errorHandler(
          400,
          "CAPTCHA verification failed. Please try again."
        )
      );
    }

    const existingUsername =
      await User.findOne({ username });

    if (existingUsername) {
      return next(
        errorHandler(
          400,
          "Username is already registered."
        )
      );
    }

    const existingEmail =
      await User.findOne({ email });

    if (existingEmail) {
      return next(
        errorHandler(
          400,
          "Email is already registered."
        )
      );
    }

    const hashedPassword =
      bcryptjs.hashSync(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
    });

    await newUser.save();

    // Automatically sign the user in.
    const token = jwt.sign(
      {
        id: newUser._id,
        isAdmin: newUser.isAdmin === true,
      },
      process.env.JWT_SECRET
    );

    const {
      password: pass,
      ...rest
    } = newUser._doc;

    return res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(201)
      .json({
        success: true,
        message:
          "Account created and signed in successfully.",
        ...rest,
      });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// SEND PASSWORD RESET OTP / CAPTCHA
// ======================================================

export const sendPasswordResetOtp = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      verificationMethod,
      captchaToken,
    } = req.body;

    if (!email) {
      return next(
        errorHandler(
          400,
          "Enter your account email."
        )
      );
    }

    if (
      !["email", "captcha"].includes(
        verificationMethod
      )
    ) {
      return next(
        errorHandler(
          400,
          "Choose Email OTP or CAPTCHA."
        )
      );
    }

    // ================================================
    // CAPTCHA VERIFICATION
    // ================================================

    if (verificationMethod === "captcha") {
      if (!captchaToken) {
        return next(
          errorHandler(
            400,
            "Please complete the CAPTCHA."
          )
        );
      }

      let captchaValid;

      try {
        captchaValid =
          await verifyTurnstile(captchaToken);
      } catch (captchaError) {
        console.error(
          "Turnstile configuration error:",
          captchaError.message
        );

        return next(
          errorHandler(
            500,
            "CAPTCHA configuration is missing."
          )
        );
      }

      if (!captchaValid) {
        return next(
          errorHandler(
            400,
            "CAPTCHA verification failed. Please try again."
          )
        );
      }

      const user = await User.findOne({
        email,
      });

      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If the account matches, password reset can continue.",
        });
      }

      await PasswordResetOtp.deleteMany({
        userId: user._id,
      });

      const resetRecord =
        await PasswordResetOtp.create({
          userId: user._id,
          email: user.email,
          otpHash: "CAPTCHA_VERIFIED",
          verifiedAt: new Date(),
          expiresAt: new Date(
            Date.now() + 10 * 60 * 1000
          ),
        });

      const resetToken = jwt.sign(
        {
          purpose: "password-reset",
          resetId: resetRecord._id.toString(),
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "10m",
        }
      );

      return res.status(200).json({
        success: true,
        resetToken,
        message:
          "CAPTCHA verified. Choose a new password.",
      });
    }

    // ================================================
    // EMAIL OTP
    // ================================================

    const user = await User.findOne({
      email,
    });

    // Keep account existence private.
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If the account matches, an OTP will be sent to its email.",
      });
    }

    const otp = String(
      randomInt(100000, 1000000)
    );

    const otpHash =
      bcryptjs.hashSync(otp, 10);

    await PasswordResetOtp.deleteMany({
      userId: user._id,
    });

    await PasswordResetOtp.create({
      userId: user._id,
      email: user.email,
      otpHash,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    try {
      await transporter.sendMail({
        from: "noreply@fyndyourhomes.in",
        to: user.email,
        subject:
          "fyndyourhomes.in - Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>fyndyourhomes.in</h2>

            <p>Your password reset OTP is:</p>

            <h1 style="letter-spacing: 8px;">
              ${otp}
            </h1>

            <p>This OTP will expire in 5 minutes.</p>

            <p>
              If you did not request a password reset,
              you can ignore this email.
            </p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error(
        "Password reset email delivery failed",
        {
          errorCode:
            mailError.code || null,
          responseCode:
            mailError.responseCode || null,
        }
      );

      await PasswordResetOtp.deleteMany({
        userId: user._id,
      });

      return next(
        errorHandler(
          502,
          "Unable to send the password reset email."
        )
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "If the account matches, an OTP will be sent to its email.",
    });
  } catch (error) {
    return next(error);
  }
};

// ======================================================
// VERIFY PASSWORD RESET OTP
// ======================================================

export const verifyPasswordResetOtp = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    if (
      !email ||
      !/^\d{6}$/.test(
        String(otp || "")
      )
    ) {
      return next(
        errorHandler(
          400,
          "Enter the account email and 6-digit OTP."
        )
      );
    }

    const resetRecord =
      await PasswordResetOtp.findOne({
        email,
      });

    if (
      !resetRecord ||
      resetRecord.expiresAt < new Date() ||
      !resetRecord.otpHash ||
      resetRecord.otpHash ===
        "CAPTCHA_VERIFIED" ||
      !bcryptjs.compareSync(
        String(otp),
        resetRecord.otpHash
      )
    ) {
      return next(
        errorHandler(
          400,
          "Invalid or expired OTP. Request a new one."
        )
      );
    }

    resetRecord.verifiedAt =
      new Date();

    resetRecord.expiresAt =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    await resetRecord.save();

    const resetToken = jwt.sign(
      {
        purpose: "password-reset",
        resetId:
          resetRecord._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.status(200).json({
      success: true,
      resetToken,
    });
  } catch (error) {
    return next(error);
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword = async (
  req,
  res,
  next
) => {
  try {
    const {
      resetToken,
      newPassword,
    } = req.body;

    if (
      !resetToken ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return next(
        errorHandler(
          400,
          "Enter a new password with at least 8 characters."
        )
      );
    }

    let tokenData;

    try {
      tokenData = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      );
    } catch {
      return next(
        errorHandler(
          400,
          "Password reset verification expired. Request a new OTP."
        )
      );
    }

    if (
      tokenData.purpose !==
        "password-reset" ||
      !tokenData.resetId
    ) {
      return next(
        errorHandler(
          400,
          "Invalid password reset verification."
        )
      );
    }

    const resetRecord =
      await PasswordResetOtp.findById(
        tokenData.resetId
      );

    if (
      !resetRecord ||
      !resetRecord.verifiedAt ||
      resetRecord.expiresAt < new Date()
    ) {
      return next(
        errorHandler(
          400,
          "Password reset verification expired. Request a new OTP."
        )
      );
    }

    const hashedPassword =
      bcryptjs.hashSync(
        newPassword,
        10
      );

    await User.findByIdAndUpdate(
      resetRecord.userId,
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    // Delete reset record after successful password change.
    await PasswordResetOtp.deleteOne({
      _id: resetRecord._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password updated. You can now sign in.",
    });
  } catch (error) {
    return next(error);
  }
};

// ======================================================
// SIGN IN
// ======================================================

export const signin = async (
  req,
  res,
  next
) => {
  const {
    email,
    password,
  } = req.body;

  try {
    const validUser =
      await User.findOne({ email });

    if (!validUser) {
      return next(
        errorHandler(
          404,
          "User not found!"
        )
      );
    }

    const validPassword =
      bcryptjs.compareSync(
        password,
        validUser.password
      );

    if (!validPassword) {
      return next(
        errorHandler(
          401,
          "Wrong credentials!"
        )
      );
    }

    const token = jwt.sign(
      {
        id: validUser._id,
        isAdmin:
          validUser.isAdmin === true,
      },
      process.env.JWT_SECRET
    );

    const {
      password: pass,
      ...rest
    } = validUser._doc;

    return res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GOOGLE SIGN IN
// ======================================================

export const google = async (
  req,
  res,
  next
) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (user) {
      const token = jwt.sign(
        {
          id: user._id,
          isAdmin:
            user.isAdmin === true,
        },
        process.env.JWT_SECRET
      );

      const {
        password: pass,
        ...rest
      } = user._doc;

      return res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(200)
        .json(rest);
    }

    const generatedPassword =
      Math.random()
        .toString(36)
        .slice(-8) +
      Math.random()
        .toString(36)
        .slice(-8);

    const hashedPassword =
      bcryptjs.hashSync(
        generatedPassword,
        10
      );

    const newUser = new User({
      username:
        req.body.name
          .split(" ")
          .join("")
          .toLowerCase() +
        Math.random()
          .toString(36)
          .slice(-4),

      email: req.body.email,

      password: hashedPassword,

      phoneNumber:
        req.body.phoneNumber || "0000000000",

      avatar: req.body.photo,
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        isAdmin:
          newUser.isAdmin === true,
      },
      process.env.JWT_SECRET
    );

    const {
      password: pass,
      ...rest
    } = newUser._doc;

    return res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// ======================================================
// SIGN OUT
// ======================================================

export const signout = async (
  req,
  res,
  next
) => {
  try {
    res.clearCookie(
      "access_token"
    );

    return res
      .status(200)
      .json(
        "User has been logged out!"
      );
  } catch (error) {
    next(error);
  }
};