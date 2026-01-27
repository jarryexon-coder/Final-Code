// middleware/passwordPolicy.js
const passwordPolicy = {
  // Check password strength
  validatePasswordStrength: (password) => {
    const requirements = {
      minLength: 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    };

    const errors = [];
    
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters`);
    }
    if (!requirements.hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!requirements.hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!requirements.hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!requirements.hasSpecialChar) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: calculatePasswordScore(password)
    };
  },

  // Calculate password score (0-100)
  calculatePasswordScore: (password) => {
    let score = 0;
    
    // Length score
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character variety score
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[@$!%*?&]/.test(password)) score += 15;
    
    // Deductions for common patterns
    if (/password/i.test(password)) score -= 30;
    if (/123456/.test(password)) score -= 30;
    if (/qwerty/.test(password)) score -= 30;
    
    return Math.min(Math.max(score, 0), 100);
  },

  // Check if password is in common passwords list
  isCommonPassword: async (password) => {
    const commonPasswords = [
      'password', '123456', '12345678', '123456789', '12345',
      'qwerty', 'abc123', 'password1', 'admin', 'letmein'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  },

  // Password history check (prevent reusing old passwords)
  checkPasswordHistory: async (userId, newPassword, UserModel, maxHistory = 5) => {
    // This would require storing password history in the User model
    const user = await UserModel.findById(userId);
    
    if (!user.passwordHistory) return true;
    
    for (const oldHash of user.passwordHistory.slice(-maxHistory)) {
      const isMatch = await bcrypt.compare(newPassword, oldHash);
      if (isMatch) return false;
    }
    
    return true;
  }
};

export default passwordPolicy;

// Add to User model if you want password history:
userSchema.add({
  passwordHistory: [{
    hash: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    // Store old password in history before hashing new one
    if (this.password && !this.isNew) {
      this.passwordHistory = this.passwordHistory || [];
      this.passwordHistory.push({
        hash: this.password,
        changedAt: new Date()
      });
      
      // Keep only last 5 passwords
      if (this.passwordHistory.length > 5) {
        this.passwordHistory = this.passwordHistory.slice(-5);
      }
    }
    
    // Validate password strength
    const validation = passwordPolicy.validatePasswordStrength(this.password);
    if (!validation.isValid) {
      return next(new Error(`Password validation failed: ${validation.errors.join(', ')}`));
    }
    
    // Check if password is too common
    if (await passwordPolicy.isCommonPassword(this.password)) {
      return next(new Error('Password is too common. Please choose a stronger password.'));
    }
  }
  next();
});
