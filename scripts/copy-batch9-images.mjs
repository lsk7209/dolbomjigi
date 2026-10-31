import fs from 'node:fs';
import path from 'node:path';

const IMG_DIR = path.join(process.cwd(), 'public', 'images', 'blog-ai', 'posts');

const copies = [
  ['rural-bus-schedule-care-robot-voice-query.jpg', 'rural-village-bus-station-care-robot-schedule.jpg'],
  ['parents-hearing-loss-voice-robot-tuning.jpg', 'senior-hearing-loss-custom-frequency-care-robot.jpg'],
  ['nursing-home-visit-care-robot-video-call.jpg', 'dementia-reminiscence-photo-album-care-robot.jpg'],
  ['smart-safety-door-sensor-elderly-wandering-alert.jpg', 'smart-refrigerator-door-sensor-care-robot-inactivity.jpg'],
  ['rural-village-hall-shared-care-robot-program.jpg', 'social-worker-care-robot-group-program-toolkit.jpg'],
];

for (const [src, dest] of copies) {
  const srcPath = path.join(IMG_DIR, src);
  const destPath = path.join(IMG_DIR, dest);
  if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.log(`Already exists or src missing: ${dest}`);
  }
}
