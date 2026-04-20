// ─── Role → Allowed Routes ───────────────────────────────────────────────────
// Each role maps to an array of routes it is permitted to access.
const rolePermissions = {
    'applicant': ['/api/listings', '/applicant-home'],
    'provider':  ['/api/listings', '/provider-home', '/create-opportunity', '/api/applicants'],
    'admin':     ['/api/listings', '/admin-dashboard', '/applicant-home', '/provider-home', '/create-opportunity', '/api/applicants']
};

/**
 * Returns true if the given user's role is allowed to access the given route.
 * @param {{ role: string }} user
 * @param {string} route
 */
function authorize(user, route) {
    if (!user || !user.role) return false;
    const allowed = rolePermissions[user.role.toLowerCase()];
    if (!allowed) return false;
    return allowed.includes(route);
}

module.exports = { authorize };