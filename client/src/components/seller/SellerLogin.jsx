import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SellerLogin = () => {
  const { isSeller, setIsSeller, navigate, axios } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (event) => {
    try {
      event.preventDefault();
      const { data } = await axios.post('/api/seller/login', { email, password });
      if (data.success) {
        setIsSeller(true);
        navigate('/seller');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isSeller) {
      navigate("/seller");
    }
  }, [isSeller]);

  return !isSeller && (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f9ff] via-white to-[#e8f3ff] text-sm text-gray-600 transition-all duration-300 font-[Outfit]">

      <motion.form
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col gap-6 items-start p-8 py-12 w-[90%] max-w-sm rounded-3xl shadow-2xl border border-gray-100 bg-white/80 glass-card shadow-glow backdrop-blur-xl animate-fade-in"
      >
        <p className="text-4xl font-extrabold m-auto text-center text-gray-800 mb-3 tracking-tight leading-tight">
          <span className="text-primary drop-shadow">Seller</span> Login
        </p>

        <div className="w-full">
          <label className="block mb-1 text-gray-700 font-semibold text-sm">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Enter your email"
            className="border border-gray-300 rounded-lg w-full px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition focus:shadow-lg bg-white/90 text-gray-700 placeholder-gray-400"
            required
          />
        </div>

        <div className="w-full">
          <label className="block mb-1 text-gray-700 font-semibold text-sm">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Enter your password"
            className="border border-gray-300 rounded-lg w-full px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition focus:shadow-lg bg-white/90 text-gray-700 placeholder-gray-400"
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 bg-primary hover:bg-primary-dull text-white rounded-xl font-semibold uppercase tracking-wider transition duration-300 shadow-md hover:shadow-lg text-base"
        >
          Login
        </motion.button>
      </motion.form>
    </div>
  );
};

export default SellerLogin;
