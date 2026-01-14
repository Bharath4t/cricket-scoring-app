// File: src/utils/helpers.js

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

export const calculateMVPPoints = (bat, bowl, field) => {
    let pts = 0;
    if (bat) {
        pts += (bat.runs || 0) * 1 + (bat.fours || 0) * 1 + (bat.sixes || 0) * 2;
        if ((bat.runs || 0) >= 50) pts += 10;
        if ((bat.runs || 0) >= 100) pts += 20;
    }
    if (bowl) {
        pts += (bowl.wickets || 0) * 25;
        if ((bowl.wickets || 0) >= 3) pts += 10;
        if ((bowl.wickets || 0) >= 5) pts += 20;
        if ((bowl.maidens || 0) > 0) pts += ((bowl.maidens || 0) * 10);
    }
    if (field) {
        pts += ((field.catches || 0) * 10) + ((field.stumpings || 0) * 10) + ((field.runouts || 0) * 15);
    }
    return pts;
};

export const getOversFromBalls = (balls) => {
    if (typeof balls !== 'number' || isNaN(balls)) return '0.0';
    const overs = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${overs}.${rem}`;
};

export const generateCommentary = (bowlerName, batterName, runs, extrasType, wicketType) => {
      const id = Math.random().toString(36).substr(2, 9);
      let text = `${bowlerName} to ${batterName}, `;
      
      if (wicketType) {
          text += `OUT! ${wicketType}. Big wicket!`;
      } else if (extrasType) {
          if (extrasType === 'Wd') text += "Wide ball.";
          else if (extrasType === 'NB') text += "No Ball!";
          else if (extrasType === 'B') text += "Bye, runs taken.";
          else if (extrasType === 'LB') text += "Leg Bye, runs taken.";
      } else {
          if (runs === 0) text += "no run.";
          else if (runs === 1) text += "1 run, single taken.";
          else if (runs === 2) text += "2 runs, good running.";
          else if (runs === 4) text += "FOUR! Beautiful shot!";
          else if (runs === 6) text += "SIX! Massive hit!";
          else text += `${runs} runs.`;
      }
      return { id, text };
};