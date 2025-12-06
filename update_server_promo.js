const fs = require('fs');
const serverContent = fs.readFileSync('server.js', 'utf8');

// Remove the three individual promo route imports
let updatedContent = serverContent.replace(
  /const validatePromoRouter = require\("\.\/routes\/promo\/validate"\);\nconst applyPromoRouter = require\("\.\/routes\/promo\/apply"\);\nconst publicPromoRouter = require\("\.\/routes\/promo\/public"\);/g,
  'const promoRoutes = require("./routes/promo/index");'
);

// Remove the individual app.use lines for promo
updatedContent = updatedContent.replace(
  /app\.use\("\/api\/promo\/validate", validatePromoRouter\);\napp\.use\("\/api\/promo\/apply", applyPromoRouter\);\napp\.use\("\/api\/promo\/public", publicPromoRouter\);/g,
  'app.use("/api/promo", promoRoutes);'
);

// Write back to server.js
fs.writeFileSync('server.js', updatedContent);
console.log('✅ Updated server.js with consolidated promo routes');
