import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

// Interest topics list
const INTERESTS_LIST = [
  'Coding', 'AI/ML', 'Data Science', 'Robotics', 'Sports', 'Design',
  'Startups', 'Research', 'Placements', 'Hackathons', 'Music',
  'Photography', 'Cultural Events', 'Entrepreneurship', 'Competition',
  'Dancing', 'Arts & Crafts', 'Drama & Theatre', 'Workshop', 'Social Work',
  'Fest', 'Gaming', 'Literature'
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
      alert('Please select at least one interest!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await completeOnboarding(selected, user?.branch, user?.year);
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
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden bg-[#F6FBFF]">
      {/* Background decoration glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            What are your <span className="text-cyan-700">interests?</span>
          </h1>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {INTERESTS_LIST.map((name) => {
            const isSelected = selected.includes(name);
            
            return (
              <motion.div
                key={name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleInterest(name)}
                className={`cursor-pointer rounded-2xl p-5 border text-left flex flex-col justify-center h-28 transition-all duration-200 relative overflow-hidden ${
                  isSelected 
                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-md' 
                    : 'bg-white border-[#D6EAF8] hover:border-cyan-400 hover:shadow-md text-slate-900'
                }`}
              >
                {/* Embedded indicator checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white text-cyan-700 flex items-center justify-center font-bold text-xs shadow-xs">
                    ✓
                  </div>
                )}

                <span className={`block font-extrabold text-base sm:text-lg leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {name}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Submit action */}
        <div className="text-center pt-4 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white px-10 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 mx-auto disabled:opacity-50 shadow-md transition-all text-sm sm:text-base"
          >
            <span>{submitting ? 'Saving Interests...' : 'Continue to Campus Events'}</span>
          </button>
          <span className="block text-xs text-slate-600 font-bold uppercase tracking-widest">
            {selected.length} Selected
          </span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
