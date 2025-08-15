"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [rawText, setRawText] = useState('');
  const [gamifiedRecipe, setGamifiedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for the playable experience
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerId, setTimerId] = useState(null);

  // useEffect to manage the timer countdown
  useEffect(() => {
    // Clear any existing timer when the component re-renders or unmounts
    if (timerId) {
      clearInterval(timerId);
    }

    if (isGameStarted && gamifiedRecipe && currentStepIndex < gamifiedRecipe.steps.length) {
      const currentStep = gamifiedRecipe.steps[currentStepIndex];
      if (currentStep.timer) {
        setTimeLeft(currentStep.timer);

        const newTimerId = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearInterval(newTimerId);
              // Handle timer completion (e.g., automatically move to next step)
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);

        setTimerId(newTimerId);
      } else {
        // No timer for this step
        setTimeLeft(null);
      }
    }
  }, [currentStepIndex, isGameStarted, gamifiedRecipe]);

  const handleProcessRecipe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGamifiedRecipe(null);
    setIsGameStarted(false); // Reset game state

    // Get the value directly from the textarea on form submit
    const inputText = e.target.elements.recipeInput.value;

    try {
      const response = await fetch('http://localhost:8080/api/v1/recipes/gamify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ RawText: inputText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGamifiedRecipe(data);

    } catch (e) {
      setError('An error occurred while processing the recipe.');
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    setIsGameStarted(true);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (currentStepIndex < gamifiedRecipe.steps.length - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      // End of recipe, reset game
      setIsGameStarted(false);
      setCurrentStepIndex(0);
    }
  };
  
  // Conditionally render the step-by-step view
  const renderGamifiedView = () => {
    if (!gamifiedRecipe) return null;

    if (!isGameStarted) {
      return (
        <div className="text-center">
          <button
            onClick={handleStartGame}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700"
          >
            Start Cooking
          </button>
        </div>
      );
    }

    const currentStep = gamifiedRecipe.steps[currentStepIndex];
    const isLastStep = currentStepIndex === gamifiedRecipe.steps.length - 1;

    return (
      <div>
        <h3 className="text-xl font-bold mb-2 text-gray-900">
          {/* Updated heading color to be very dark */}
          {gamifiedRecipe.title}
        </h3>
        <div className="mb-4">
          <span className="font-semibold mr-2 text-gray-800">Badges:</span>
          {gamifiedRecipe.badges.map((badge, index) => (
            <span key={index} className="inline-block bg-green-200 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
              {badge}
            </span>
          ))}
        </div>
        
        {/* Current Step Display */}
        <div className="border-b py-2 last:border-b-0">
          <p className="font-semibold text-lg text-gray-800">Step {currentStepIndex + 1}:</p>
          <p className="ml-4 text-gray-900">
            {/* Updated instruction color for better readability */}
            {currentStep.instruction}
          </p>
          
          <ul className="ml-4 mt-2 text-sm text-gray-700">
            {/* Updated details color to be darker */}
            <li><span className="font-medium">Action:</span> {currentStep.action || 'N/A'}</li>
            <li><span className="font-medium">Ingredients:</span> {currentStep.ingredients?.join(', ') || 'N/A'}</li>
          </ul>
        </div>

        {/* Timer Section */}
        {currentStep.timer && timeLeft !== null && (
          <div className="mt-4 text-center">
            <span className="text-4xl font-bold text-blue-600">{timeLeft}</span>
            <span className="text-lg font-medium text-gray-800 ml-1">seconds left</span>
          </div>
        )}
        
        {/* Next Step Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleNextStep}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
          >
            {isLastStep ? 'Finish Cooking' : 'Next Step'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          {/* Updated main heading color */}
          ChefKix Prototype
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {/* Updated heading color */}
              Enter Your Recipe
            </h2>
            <form onSubmit={handleProcessRecipe}>
              <textarea
                className="w-full p-4 h-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-800"
                placeholder="Paste your recipe here..."
                id="recipeInput" 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Gamify Recipe'}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {/* Updated heading color */}
              Gamified Output
            </h2>
            {loading && <p className="text-center text-gray-700">Loading...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            
            {renderGamifiedView()}
          </div>
        </div>
      </div>
    </div>
  );
}
