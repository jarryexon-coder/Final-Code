// Simple adminAuth middleware
export const adminAuth = (req, res, next) => {
    console.log('Admin auth: Allowing request');
    req.user = { id: 'admin', role: 'admin' };
    next();
};
