import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import CreateListing from "./pages/CreateListing";
import UpdateListing from "./pages/UpdateListing";
import LegalServices from "./pages/LegalServices";
import ZoningLandUse from "./pages/ZoningLandUse";
import Real from "./pages/Real";
import Lease from "./pages/Lease";
import Title from "./pages/Title";
import Listing from "./pages/Listing";
import Search from "./pages/Search";
import UserListings from "./pages/UserListings";

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
        <Route path="/legal-services" element={<LegalServices />} /> 
        <Route path="/zoning-land-use" element={<ZoningLandUse />} />
        <Route path="/lease" element={<Lease/>}/>
        <Route path="/real" element={<Real/>}/>
        <Route path="/title" element={<Title/>}/>
        <Route path="/listing/:listingId" element={<Listing />} />
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/create-listing/:listingId" element={<CreateListing />} />
          <Route
            path="/update-listing/:listingId"
            element={<UpdateListing />}
          />
        </Route>
        <Route path="/user-listings" element={<UserListings />} />
        
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;

