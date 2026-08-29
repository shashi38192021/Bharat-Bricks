import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";

const Footer = () => {
  return (
    <div className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
        {/* Company Information */}
        <div>
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            FyndYourHomes.in
          </h2>

          <p className="text-gray-400 text-sm">
            Your trusted platform for finding the perfect property. Explore
            properties and find a home that suits your needs.
          </p>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-xl font-semibold text-gray-200 mb-4">
            Follow Us
          </h3>

          <div className="flex space-x-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500"
            >
              <FaFacebook size={24} />
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400"
            >
              <FaTwitter size={24} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500"
            >
              <FaInstagram size={24} />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-700"
            >
              <FaLinkedin size={24} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
        <p>© 2026 FyndYourHomes.in. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
