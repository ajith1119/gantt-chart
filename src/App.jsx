import React, { useEffect, useState } from 'react';
import { GanttChart } from './components/GanttChart/GanttChart';
import { mapApiToTasks } from './data/dummyData';

const API_URL = 'https://konnbot-app-zq4v4.ondigitalocean.app/get-lead-with-project/687795537e954b253fb45ba1';
const Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODc3ODNlYzY0ODVmY2ZiMzJiZDU5NTAiLCJpYXQiOjE3NTQ5NjY0NjgsImV4cCI6MTc1NTIyNTY2OH0.jFqMaWKNDOmX1CbxfrxmPLul81vET-GI0XfxVTNwSVQ';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://cors-anywhere.herokuapp.com/' + API_URL, {
      headers: {
        Authorization: `Bearer ${Token}`,
        role: 'admin'
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Raw API Data:', data);
        const mapped = mapApiToTasks(data);
        console.log('Mapped Tasks:', mapped);
        setTasks(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

          {/* Loading text */}
          <p className="text-lg font-semibold text-gray-700">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GanttChart
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}
