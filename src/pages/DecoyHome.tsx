import { useState, useEffect } from 'react';
import { FaCalculator, FaCloud, FaFileAlt } from 'react-icons/fa';
import type { DecoyConfig } from '@/types';

export function DecoyHome() {
  const [config, setConfig] = useState<DecoyConfig | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [display, setDisplay] = useState('0');
  const [operation, setOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('decoyConfig');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (tapCount >= 3 && Date.now() - lastTapTime < 1000) {
      // Triple tap detected - redirect to emergency
      window.location.href = '/emergency';
    }
  }, [tapCount, lastTapTime]);

  const handleScreenTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 1000) {
      setTapCount(1);
    } else {
      setTapCount((prev) => prev + 1);
    }
    setLastTapTime(now);
  };

  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
      setOperation(null);
      setPreviousValue(null);
    } else if (value === '=') {
      if (operation && previousValue !== null) {
        const current = parseFloat(display);
        let result = 0;
        switch (operation) {
          case '+':
            result = previousValue + current;
            break;
          case '-':
            result = previousValue - current;
            break;
          case '*':
            result = previousValue * current;
            break;
          case '/':
            result = previousValue / current;
            break;
        }
        setDisplay(result.toString());
        setOperation(null);
        setPreviousValue(null);
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      setPreviousValue(parseFloat(display));
      setOperation(value);
      setDisplay('0');
    } else {
      setDisplay((prev) => (prev === '0' ? value : prev + value));
    }
  };

  if (!config || !config.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Decoy mode not configured</p>
      </div>
    );
  }

  if (config.app_type === 'calculator') {
    return (
      <div
        className="min-h-screen bg-gray-100 dark:bg-dark-background p-4"
        onClick={handleScreenTap}
      >
        <div className="max-w-sm mx-auto mt-20">
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
            <div className="text-right mb-4">
              <div className="text-4xl font-mono text-gray-900 dark:text-dark-text min-h-[60px] flex items-center justify-end">
                {display}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                'C',
                '/',
                '*',
                '-',
                '7',
                '8',
                '9',
                '+',
                '4',
                '5',
                '6',
                '1',
                '2',
                '3',
                '=',
                '0',
                '.',
              ].map((btn) => (
                <button
                  key={btn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCalculatorInput(btn);
                  }}
                  className={`p-4 rounded-lg font-semibold text-lg ${
                    ['C', '/', '*', '-', '+', '='].includes(btn)
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-dark-text'
                  } min-h-tap`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            Triple tap screen to access emergency features
          </p>
        </div>
      </div>
    );
  }

  if (config.app_type === 'weather') {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4 text-white"
        onClick={handleScreenTap}
      >
        <div className="max-w-sm mx-auto mt-20 text-center">
                    <FaCloud className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">72°F</h1>
          <p className="text-xl mb-4">Sunny</p>
          <p className="text-sm opacity-75">San Francisco, CA</p>
          <p className="text-xs mt-8 opacity-50">Triple tap to access emergency features</p>
        </div>
      </div>
    );
  }

  // Notes app
  return (
    <div
      className="min-h-screen bg-yellow-50 dark:bg-dark-background p-4"
      onClick={handleScreenTap}
    >
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6">
          <FaFileAlt className="w-8 h-8 text-gray-400 mb-4" />
          <textarea
            className="w-full h-64 border-none outline-none resize-none text-gray-900 dark:text-dark-text bg-transparent"
            placeholder="Start writing..."
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Triple tap screen to access emergency features
        </p>
      </div>
    </div>
  );
}

