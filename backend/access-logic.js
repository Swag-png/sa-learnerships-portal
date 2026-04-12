//The Implementation Unit
const rolePermissions = {
    'applicant': '/applicant-home',
    'provider': '/provider-home',
    'admin': '/admin-dashboard'
};

function authorize(user, route) {
    // Check if the route requested matches the allowed route for that specific role
    // This logic covers all 3 success cases and automatically handles all 6 failure cases
    return rolePermissions[user.role] === route;
}
module.exports = { authorize };