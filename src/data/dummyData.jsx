

export function mapApiToTasks(apiData) {
  const tasks = [];

  apiData.projectID?.forEach((project, pIdx) => {
    let projectStart = null;
    let projectEnd = null;

    // Activities as children
    project.activitiesID?.forEach((activity) => {
      let activityStart = null;
      let activityEnd = null;

      // Subactivities as sub-children
      if (Array.isArray(activity.subactivitiesID) && activity.subactivitiesID.length > 0) {
        activity.subactivitiesID.forEach((sub) => {
          const subStart = sub.startdatesubactivity ? new Date(sub.startdatesubactivity) : null;
          const subEnd = sub.duedatesubactivity ? new Date(sub.duedatesubactivity) : null;

          // Update activity start/end
          if (subStart && (!activityStart || subStart < activityStart)) activityStart = subStart;
          if (subEnd && (!activityEnd || subEnd > activityEnd)) activityEnd = subEnd;

          // Update project start/end
          if (subStart && (!projectStart || subStart < projectStart)) projectStart = subStart;
          if (subEnd && (!projectEnd || subEnd > projectEnd)) projectEnd = subEnd;

          tasks.push({
            id: sub._id,
            name: sub.subactivityname,
            startDate: subStart || new Date(),
            endDate: subEnd || new Date(),
            progress: 0,
            parentId: activity._id,
            color: '#F59E0B'
          });
        });
      }

      // Only push activity if it has valid dates
      if (activityStart && activityEnd) {
        tasks.push({
          id: activity._id,
          name: activity.categoryname,
          startDate: activityStart,
          endDate: activityEnd,
          progress: 0,
          parentId: project._id,
          color: '#60A5FA'
        });
      }
    });

    // Only push project if it has valid dates
    if (projectStart && projectEnd) {
      tasks.push({
        id: project._id,
        name: apiData.projectname || `Project ${pIdx + 1}`,
        startDate: projectStart,
        endDate: projectEnd,
        progress: 0,
        color: '#3B82F6'
      });
    }
  });

  return tasks;
}
