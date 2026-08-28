const fs = require('fs');
const file = 'src/app/n/[uid]/profile-view.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update viewerState type
content = content.replace(
  /const \[viewerState, setViewerState\] = useState<\{[\s\S]*?resolved: boolean;\s*\}>/,
  \const [viewerState, setViewerState] = useState<{
    isOwner: boolean;
    alreadySaved: boolean;
    isLoggedIn: boolean;
    resolved: boolean;
  }>\
);

// Update default state
content = content.replace(
  /\{ isOwner: false, alreadySaved: false, resolved: false \}/,
  \{ isOwner: false, alreadySaved: false, isLoggedIn: false, resolved: false }\
);

// Update json fallback
content = content.replace(
  /\{ isOwner: false, alreadySaved: false \}\)\)/,
  \{ isOwner: false, alreadySaved: false, isLoggedIn: false }))\
);

// Update data typing in fetch
content = content.replace(
  /\(data: \{ isOwner: boolean; alreadySaved: boolean \}\)/,
  \(data: { isOwner: boolean; alreadySaved: boolean; isLoggedIn: boolean })\
);

// Update catch block
content = content.replace(
  /setViewerState\(\{ isOwner: false, alreadySaved: false, resolved: true \}\);/,
  \setViewerState({ isOwner: false, alreadySaved: false, isLoggedIn: false, resolved: true });\
);

// Update the condition for "Sign in to Anoya" link
content = content.replace(
  /\{resolved && !isOwner && !viewerState\.alreadySaved && \(/,
  \{resolved && !isOwner && !viewerState.isLoggedIn && !viewerState.alreadySaved && (\
);

fs.writeFileSync(file, content);
