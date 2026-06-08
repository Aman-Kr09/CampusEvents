import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Sparkles, Code, Cpu, LineChart, Shield, Trophy, Palette, Rocket, GraduationCap, Laptop, Music, Camera, PartyPopper, Lightbulb, Check } from 'lucide-react';

// Card definitions with icon mapping and design colors
const INTERESTS_LIST = [
  { name: 'Coding', icon: Code, color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400' },
  { name: 'AI/ML', icon: Cpu, color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400' },
  { name: 'Data Science', icon: LineChart, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' },
  { name: 'Robotics', icon: Laptop, color: 'from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400' },
  { name: 'Sports', icon: Trophy, color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400' },
  { name: 'Design', icon: Palette, color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400' },
  { name: 'Startups', icon: Rocket, color: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-400' },
  { name: 'Research', icon: GraduationCap, color: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-400' },
  { name: 'Placements', icon: Shield, color: 'from-blue-500/20 to-teal-500/20 border-blue-500/30 text-blue-400' },
  { name: 'Hackathons', icon: Code, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400' },
  { name: 'Music', icon: Music, color: 'from-lime-500/20 to-green-500/20 border-lime-500/30 text-lime-400' },
  { name: 'Photography', icon: Camera, color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/30 text-sky-400' },
  { name: 'Cultural Events', icon: PartyPopper, color: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-400' },
  { name: 'Entrepreneurship', icon: Lightbulb, color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400' }
];

const Onboarding = () => {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if user has already onboarded
  useEffect(() => {
    if (user && user.interests && user.interests.length > 0) {
      navigate('/home');
    }
  }, [user, navigate]);

  const toggleInterest = (interestName) => {
    if (selected.includes(interestName)) {
      setSelected(selected.filter(i => i !== interestName));
    } else {
      setSelected([...selected, interestName]);
    }
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      alert('Please select at least one interest to build your AI recommendations!');
      return;
    }

    setSubmitting(true);
    try {
      // Send onboarding data
      const res = await completeOnboarding(selected, user.branch, user.year);
      if (res.success) {
        navigate('/home');
      }
    } catch (err) {
      console.error('Failed to save onboarding interests:', err);
      alert('Failed to save interests. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="max-w-4xl w-full space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-400 uppercase">
            <Sparkles className="w-4 h-4" />
            <span>AI Personalization Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            What are your <span className="gradient-text-indigo-cyan">interests?</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm sm:text-base">
            Select your favorite topics. CampusEvents Scikit-Learn recommendation system uses these interests to tailor your personalized events feed.
          </p>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {INTERESTS_LIST.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selected.includes(item.name);
            
            return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleInterest(item.name)}
                className={`cursor-pointer rounded-2xl p-5 border text-left flex flex-col justify-between h-36 transition-all duration-300 relative overflow-hidden group ${
                  isSelected 
                    ? `bg-gradient-to-br ${item.color} shadow-glow` 
                    : 'bg-white/[0.02] border-glassBorder hover:bg-white/[0.05] hover:border-gray-500/30'
                }`}
              >
                {/* Embedded indicator checked */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`p-2.5 rounded-xl w-11 h-11 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] group-hover:scale-105 transition-transform duration-300 ${
                  isSelected ? 'text-white bg-white/10' : 'text-gray-400'
                }`}>
                  <IconComponent className="w-6.5 h-6.5" />
                </div>

                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Interest</span>
                  <span className={`block font-bold text-sm sm:text-base ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {item.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit action */}
        <div className="text-center pt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="glass-button-primary px-10 py-3.5 font-bold flex items-center space-x-2 mx-auto disabled:opacity-50"
          >
            <span>{submitting ? 'Calibrating Feed...' : 'Continue to Campus Hub'}</span>
            {!submitting && <Check className="w-5 h-5" />}
          </button>
          <span className="block text-xs text-gray-600 mt-3 font-semibold uppercase tracking-widest">
            {selected.length} Selected
          </span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
