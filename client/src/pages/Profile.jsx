import { useSelector, useDispatch } from "react-redux";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { app } from "../firebase";

import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
  signOutUserFailure,
  signOutUserSuccess,
} from "../redux/user/userSlice";

const Profile = () => {
  const fileRef = useRef(null);

  const { currentUser, loading, error } = useSelector(
    (state) => state.user
  );

  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
   * =========================================================
   * PROFILE PHOTO UPLOAD
   * =========================================================
   */

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);

    const fileName = new Date().getTime() + file.name;

    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(
      storageRef,
      file
    );

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred /
            snapshot.totalBytes) *
          100;

        setFilePerc(Math.round(progress));
      },

      () => {
        setFileUploadError(true);
      },

      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(
          (downloadURL) => {
            setFormData((prev) => ({
              ...prev,
              avatar: downloadURL,
            }));
          }
        );
      }
    );
  };

  /*
   * =========================================================
   * FORM CHANGE
   * =========================================================
   */

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  /*
   * =========================================================
   * UPDATE ACCOUNT
   * =========================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      dispatch(updateUserStart());

      const res = await fetch(
        `/api/user/update/${currentUser._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));

      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  /*
   * =========================================================
   * DELETE ACCOUNT
   * =========================================================
   */

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());

      const res = await fetch(
        `/api/user/delete/${currentUser._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }

      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  /*
   * =========================================================
   * SIGN OUT
   * =========================================================
   */

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());

      const res = await fetch("/api/auth/signout");

      const data = await res.json();

      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        return;
      }

      dispatch(signOutUserSuccess(data));
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  };

  /*
   * =========================================================
   * MY LISTINGS
   * =========================================================
   */

  const handleShowListings = () => {
    navigate("/user-listings");
  };

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ===================================================
            PROFILE HEADER
        =================================================== */}

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col items-center">

            <input
              onChange={(e) =>
                setFile(e.target.files[0])
              }
              type="file"
              ref={fileRef}
              hidden
              accept="image/*"
            />

            <img
              onClick={() =>
                fileRef.current.click()
              }
              className="rounded-full h-28 w-28 object-cover cursor-pointer border-4 border-blue-100 shadow-md"
              src={
                formData.avatar ||
                currentUser.avatar
              }
              alt="profile"
            />

            <h1 className="text-2xl font-bold text-slate-800 mt-4">
              {currentUser.username}
            </h1>

            {fileUploadError && (
              <p className="text-red-600 text-sm mt-2">
                Error uploading image. Image must be
                less than 2 MB.
              </p>
            )}

            {filePerc > 0 && filePerc < 100 && (
              <p className="text-blue-600 text-sm mt-2">
                Uploading {filePerc}%
              </p>
            )}

            {filePerc === 100 && (
              <p className="text-green-600 text-sm mt-2">
                Profile photo updated
              </p>
            )}

          </div>
        </div>

        {/* ===================================================
            DASHBOARD GRID
        =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* =================================================
              LEFT MENU
          ================================================= */}

          <div className="bg-white rounded-2xl shadow-md p-4 h-fit">

            <h2 className="text-lg font-bold text-slate-800 px-3 py-3">
              My Account
            </h2>

            {/* MY LISTINGS */}

            <button
              onClick={handleShowListings}
              className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-blue-50 text-slate-700 font-medium transition"
            >
              <span>My Listings</span>
              <span>→</span>
            </button>

            <div className="border-t my-3"></div>

            {/* MY ACTIVITIES */}

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("my-activities")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-blue-50 text-slate-700 font-medium transition"
            >
              <span>My Activities</span>
              <span>→</span>
            </button>

            {/* ACCOUNT DETAILS */}

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("account-details")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-blue-50 text-slate-700 font-medium transition"
            >
              <span>Account Details</span>
              <span>→</span>
            </button>

            <div className="border-t my-3"></div>

            {/* SIGN OUT */}

            <button
              onClick={handleSignOut}
              type="button"
              className="w-full text-left p-4 rounded-xl hover:bg-red-50 text-red-600 font-medium transition"
            >
              Sign Out
            </button>

            {/* DELETE ACCOUNT */}

            <button
              onClick={handleDeleteUser}
              type="button"
              className="w-full text-left p-4 rounded-xl hover:bg-red-50 text-red-700 font-medium transition"
            >
              Delete Account
            </button>

          </div>

          {/* =================================================
              RIGHT CONTENT
          ================================================= */}

          <div className="md:col-span-2 space-y-6">

            {/* =================================================
                WELCOME
            ================================================= */}

            <div className="bg-white rounded-2xl shadow-md p-6">

              <h2 className="text-2xl font-bold text-slate-800">
                Welcome, {currentUser.username}
              </h2>

              <p className="text-slate-500 mt-2">
                Manage your properties, activities and
                account from here.
              </p>

            </div>

            {/* =================================================
                MY LISTINGS
            ================================================= */}

            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex justify-between items-center gap-4">

                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    My Listings
                  </h2>

                  <p className="text-slate-500 text-sm mt-1">
                    Manage the properties you have posted.
                  </p>
                </div>

                <button
                  onClick={handleShowListings}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                >
                  View
                </button>

              </div>

            </div>

            {/* =================================================
                MY ACTIVITIES
            ================================================= */}

            <div
              id="my-activities"
              className="bg-white rounded-2xl shadow-md p-6"
            >

              <h2 className="text-xl font-bold text-slate-800">
                My Activities
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Properties you have interacted with.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

                <button className="text-left p-4 border rounded-xl hover:bg-blue-50 transition">
                  ❤️ Liked Properties
                </button>

                <button className="text-left p-4 border rounded-xl hover:bg-blue-50 transition">
                  🔖 Saved Properties
                </button>

                <button className="text-left p-4 border rounded-xl hover:bg-blue-50 transition">
                  📍 Wanted to Visit
                </button>

                <button className="text-left p-4 border rounded-xl hover:bg-blue-50 transition">
                  ✅ Visited Properties
                </button>

                <button className="text-left p-4 border rounded-xl hover:bg-blue-50 transition sm:col-span-2">
                  ⭐ Selected for Finalize
                </button>

              </div>

            </div>

            {/* =================================================
                ACCOUNT DETAILS
            ================================================= */}

            <div
              id="account-details"
              className="bg-white rounded-2xl shadow-md p-6"
            >

              <h2 className="text-xl font-bold text-slate-800 mb-5">
                Account Details
              </h2>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >

                {/* USERNAME */}

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    defaultValue={
                      currentUser.username
                    }
                    className="border p-3 rounded-lg w-full"
                    onChange={handleChange}
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    defaultValue={
                      currentUser.email
                    }
                    className="border p-3 rounded-lg w-full"
                    onChange={handleChange}
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    defaultValue={
                      currentUser.phone || ""
                    }
                    placeholder="Add phone number"
                    className="border p-3 rounded-lg w-full"
                    onChange={handleChange}
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    New Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    className="border p-3 rounded-lg w-full"
                    onChange={handleChange}
                  />
                </div>

                {/* SAVE */}

                <button
                  disabled={loading}
                  type="submit"
                  className="bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-70"
                >
                  {loading
                    ? "Updating..."
                    : "Save Changes"}
                </button>

              </form>

              {updateSuccess && (
                <p className="text-green-600 mt-4">
                  Account updated successfully!
                </p>
              )}

              {error && (
                <p className="text-red-600 mt-4">
                  {error}
                </p>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;