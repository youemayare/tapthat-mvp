const fs = require('fs');
const file = 'src/app/n/[uid]/profile-view.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const [viewerState, setViewerState] = useState<{',
  'const [viewerState, setViewerState] = useState<{' + '\n    isLoggedIn: boolean;'
);

content = content.replace(
  '{ isOwner: false, alreadySaved: false, resolved: false }',
  '{ isOwner: false, alreadySaved: false, isLoggedIn: false, resolved: false }'
);

content = content.replace(
  '{ isOwner: false, alreadySaved: false }))',
  '{ isOwner: false, alreadySaved: false, isLoggedIn: false }))'
);

content = content.replace(
  '(data: { isOwner: boolean; alreadySaved: boolean })',
  '(data: { isOwner: boolean; alreadySaved: boolean; isLoggedIn: boolean })'
);

content = content.replace(
  'setViewerState({ isOwner: false, alreadySaved: false, resolved: true });',
  'setViewerState({ isOwner: false, alreadySaved: false, isLoggedIn: false, resolved: true });'
);

content = content.replace(
  '{resolved && !isOwner && !viewerState.alreadySaved && (',
  '{resolved && !isOwner && !viewerState.isLoggedIn && !viewerState.alreadySaved && ('
);

fs.writeFileSync(file, content);
