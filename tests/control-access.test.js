//This loads an Assertion Library
//It gives us tools that allow us to verify if code output matches expectation
const assert = require('assert');

//This imports the unit that you want to test and it tests it individually and independently
const {authorize} = require('../backend/access-logic');

//"Describe" and "It" are part of a Test Runner that organize your test
//And summarize the results
describe('Access Control Tests', () => {
    it('authorize_applicant_accessToAdminDenied', () => {
        // 1. SETUP (Arrange): Let role be a dummy user variable called "Applicant"
        const user = { role: 'applicant' };
        const route = '/admin-dashboard';

        // 2. ACT: Invoke the operation on the unit
        // Pass User and Route into "Authorize" method to see what happens
        const result = authorize(user, route);

        // 3. VERIFY (Assert): Check that the result is false
        assert.strictEqual(result, false); 
    });

    it('authorize_applicant_accessToProviderDenied', () => {
        const user = { role: 'applicant' };
        const route = '/provider-home';
        const result = authorize(user, route);
        assert.strictEqual(result, false); 
    })

    it('authorize_provider_accessToApplicantDenied', () => {
        const user = { role: 'provider' };
        const route = '/applicant-home';
        const result = authorize(user, route);
        assert.strictEqual(result, false); 
    })
    
    it('authorize_provider_accessToAdminDenied', () => {
        const user = { role: 'provider' };
        const route = '/admin-dashboard';
        const result = authorize(user, route);
        assert.strictEqual(result, false); 
    })

    it('authorize_admin_accessToProviderPageDenied', () => {
        const user = { role: 'admin' };
        const route = '/provider-home';
        const result = authorize(user, route);
        assert.strictEqual(result, false); 
    })

    it('authorize_admin_accessToApplicantPageDenied', () => {
        const user = { role: 'admin' };
        const route = '/applicant-home';
        const result = authorize(user, route);
        assert.strictEqual(result, false); 
    })
    
    it('authorize_admin_accessToAdminDashboardGranted', () => {
        const user = { role: 'admin' };
        assert.strictEqual(authorize(user, '/admin-dashboard'), true); // [cite: 433, 463]
    });

    it('authorize_provider_accessToProviderPageGranted', () => {
        const user = { role: 'provider' };
        assert.strictEqual(authorize(user, '/provider-home'), true); // [cite: 433, 463]
    });

    it('authorize_admin_accessToApplicantPageGranted', () => {
        const user = { role: 'applicant' };
        assert.strictEqual(authorize(user, '/applicant-home'), true); // [cite: 433, 463]
    });
});