export function createPageUrl(pageName) {
  const routes = {
    'Dashboard': '/dashboard',
    'History': '/history',
    'Users': '/users',
    'OSDetails': '/os/:id',
  };
  return routes[pageName] || '/';
}