const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Provider = require('../models/Provider.model');
const sequelize = require('../config/database');

// ===== ADMIN LOGIN =====
const loginAsAdmin = async (req, res) => {
  console.log('===========================================');
  console.log(' ADMIN LOGIN ATTEMPT');
  console.log('===========================================');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { email, password, adminKey } = req.body;

    console.log('Email received:', email ? `"${email}"` : 'MISSING');
    console.log('Password received:', password ? 'YES (hidden)' : 'MISSING');
    console.log('Admin Key received:', adminKey ? `"${adminKey}"` : 'MISSING');
    console.log('Expected Admin Key from env:', process.env.ADMIN_SECRET_KEY ? `"${process.env.ADMIN_SECRET_KEY}"` : 'NOT SET');

    if (!email || !password || !adminKey) {
      console.log(' Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email, password and admin key are required',
      });
    }

    console.log('Checking admin key match...');
    console.log('   Provided:', adminKey);
    console.log('   Expected:', process.env.ADMIN_SECRET_KEY);
    console.log('   Match:', adminKey === process.env.ADMIN_SECRET_KEY);

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      console.log(' Admin key mismatch!');
      return res.status(403).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    console.log(' Admin key verified');
    console.log('Looking up user with email:', email);

    const user = await User.findOne({ where: { email } });

    if (!user || !user.password) {
      console.log(' User not found or no password set');
      return res.status(403).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    console.log(' User found:', user.email);
    console.log('   User ID:', user.id);
    console.log('   User Role:', user.role);
    console.log('   Is Active:', user.isActive);

    console.log('Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password match:', isPasswordValid ? ' YES' : ' NO');

    if (!isPasswordValid) {
      console.log(' Password mismatch');
      return res.status(403).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    console.log('Checking user role...');
    if (user.role !== 'admin') {
      console.log('User is not an admin!');
      console.log('   Expected role: admin');
      console.log('   Actual role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    console.log('User is admin');

    if (!user.isActive) {
      console.log('Admin account is deactivated');
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated',
      });
    }

    console.log('Generating tokens...');
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: 'admin',
        isAdmin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ADMIN_TOKEN_EXPIRES_IN || '8h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, isAdmin: true },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '24h' }
    );

    user.lastLogin = new Date();
    await user.save();

    console.log('===========================================');
    console.log(' ADMIN LOGIN SUCCESSFUL!');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('===========================================');

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      refreshToken,
      expiresIn: process.env.ADMIN_TOKEN_EXPIRES_IN || '8h',
    });
  } catch (error) {
    console.error('===========================================');
    console.error(' ADMIN LOGIN ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('===========================================');
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};
// ===== ADMIN CHANGE PASSWORD =====
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

// ===== PROVIDER REGISTRATION =====
const registerProvider = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      email,
      password,
      name,
      businessName,
      category,
      phoneNumber,
      whatsappNumber,
      address,
      description,
      services,
      workingHours,
    } = req.body;

    if (!email || !password || !name || !businessName || !category || !phoneNumber || !address) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, name, businessName, category, phoneNumber, and address are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    if (password.length < 8) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const existingBusiness = await Provider.findOne({
      where: { businessName },
      transaction: t,
    });

    if (existingBusiness) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Business name already taken. Please choose another.',
      });
    }

    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        email,
        password: hashedPassword,
        name,
        role: 'provider',
        emailVerified: false,
      },
      { transaction: t }
    );

    const geolocationService = require('../services/geolocation.service');
    const location = await geolocationService.geocodeAddress(address);

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const provider = await Provider.create(
      {
        userId: user.id,
        businessName,
        description: description || '',
        category,
        subCategories: [],
        phoneNumber,
        whatsappNumber: whatsappNumber || phoneNumber,
        address: location.formattedAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        placeId: location.placeId,
        services: services || [],
        workingHours: workingHours || {},
        verificationStatus: 'pending',
        verificationOTP,
        otpExpiresAt,
        otpVerified: false,
      },
      { transaction: t }
    );

    if (location.geocoded) {
      console.log(`Provider "${businessName}" geocoded successfully: ${location.latitude}, ${location.longitude}`);
    } else {
      console.warn(` Provider "${businessName}" registered without coordinates. Address: ${address}`);
    }

    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await t.commit();

    try {
      const emailService = require('../services/email.service');
      await emailService.sendVerificationEmailWithOTP(
        user.email,
        user.name,
        verificationToken,
        verificationOTP,
        businessName
      );
      console.log(` Verification email with OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
      console.log(` Manual verification URL: ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
      console.log(`OTP: ${verificationOTP}`);
    }

    let message = 'Provider registered successfully! Check your email for verification link and OTP code.';
    
    if (!location.geocoded) {
      message += ' Note: Your address could not be automatically mapped.';
    }

    res.status(201).json({
      success: true,
      message,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        provider: {
          id: provider.id,
          businessName: provider.businessName,
          category: provider.category,
          address: provider.address,
          hasCoordinates: location.geocoded,
          verificationStatus: provider.verificationStatus,
          otpSent: true,
        },
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Provider registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register provider',
    });
  }
};

// ===== EMAIL/PASSWORD LOGIN =====
const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

// ===== PROVIDER LOGIN =====
const loginProvider = async (req, res) => {
  console.log('===========================================');
  console.log(' PROVIDER LOGIN ATTEMPT');
  console.log('===========================================');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { businessName, password } = req.body;

    console.log('Business Name received:', businessName ? `"${businessName}"` : 'MISSING');
    console.log('Password received:', password ? `"${password}"` : 'MISSING');
    console.log('Business Name length:', businessName?.length || 0);
    console.log('Password length:', password?.length || 0);

    if (!businessName || !password) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Business name and password are required',
      });
    }

    console.log('Searching for provider with business name:', `"${businessName}"`);
    const provider = await Provider.findOne({
      where: { businessName },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'name', 'password', 'role', 'isActive', 'emailVerified'],
        },
      ],
    });

    if (!provider) {
      console.log('Provider not found with business name:', `"${businessName}"`);
      console.log('Checking if provider exists with similar name...');
      
      // Try to find similar names
      const allProviders = await Provider.findAll({
        attributes: ['businessName'],
        limit: 10,
      });
      console.log('Existing business names in DB:', allProviders.map(p => `"${p.businessName}"`).join(', '));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid business name or password',
      });
    }

    console.log(' Provider found:', provider.businessName);
    console.log('   Provider ID:', provider.id);

    if (!provider.owner) {
      console.log(' Provider has no owner user!');
      return res.status(401).json({
        success: false,
        message: 'Invalid business name or password',
      });
    }

    const user = provider.owner;
    console.log(' User/Owner found:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Is Active:', user.isActive);
    console.log('   Has Password:', !!user.password);
    console.log('   Password starts with:', user.password?.substring(0, 10) || 'NO PASSWORD');

    if (!user.emailVerified) {
      console.log(' Email not verified');
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox.',
      });
    }

    console.log('Comparing passwords...');
    console.log('   Input password:', `"${password}"`);
    console.log('   Input password length:', password.length);
    console.log('   Stored hash length:', user.password?.length || 0);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isPasswordValid ? 'MATCH' : 'NO MATCH');
    
    if (!isPasswordValid) {
      console.log(' Password comparison failed');
      console.log('   This could mean:');
      console.log('   - Wrong password entered');
      console.log('   - Password case sensitivity issue');
      console.log('   - Password has extra spaces');
      return res.status(401).json({
        success: false,
        message: 'Invalid business name or password',
      });
    }

    if (!user.isActive) {
      console.log(' Account deactivated');
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    console.log('Updating last login time...');
    await User.update({ lastLogin: new Date() }, { where: { id: user.id } });

    console.log('Generating JWT tokens...');
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        businessName: provider.businessName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    console.log('===========================================');
    console.log(' LOGIN SUCCESSFUL!');
    console.log('   Business:', provider.businessName);
    console.log('   Email:', user.email);
    console.log('===========================================');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessName: provider.businessName,
        providerId: provider.id,
        otpVerified: provider.otpVerified, //  for OTP check
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('===========================================');
    console.error('PROVIDER LOGIN ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('===========================================');
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

// ===== VERIFY PROVIDER OTP  =====
const verifyProviderOTP = async (req, res) => {
  try {
    const { businessName, otp } = req.body;

    if (!businessName || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Business name and OTP are required',
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. OTP must be 6 digits.',
      });
    }

    const provider = await Provider.findOne({
      where: { businessName },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'name', 'emailVerified'],
        },
      ],
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    if (!provider.verificationOTP || !provider.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this provider. Please register again or contact support.',
      });
    }

    if (!provider.owner.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first before entering OTP',
      });
    }

    if (provider.otpVerified && provider.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Provider already verified',
      });
    }

    const now = new Date();
    const expiryDate = new Date(provider.otpExpiresAt);
    
    if (now > expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (provider.verificationOTP !== otp) {
      console.warn(` Failed OTP attempt for provider: ${provider.businessName}`);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code',
      });
    }

    provider.otpVerified = true;
    provider.verificationStatus = 'verified';
    provider.verificationOTP = null;
    provider.otpExpiresAt = null;
    await provider.save();

    console.log(` Provider "${provider.businessName}" auto-verified via OTP`);

    res.json({
      success: true,
      message: 'OTP verified successfully! Your provider profile is now active.',
      data: {
        businessName: provider.businessName,
        verificationStatus: provider.verificationStatus,
        verified: true,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
    });
  }
};

// ===== GOOGLE OAUTH CALLBACK =====
const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// ===== GET CURRENT USER =====
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
    });
  }
};

//  VERIFY EMAIL
const verifyEmail = async (req, res) => {
  console.log('===========================================');
  console.log(' EMAIL VERIFICATION ENDPOINT CALLED');
  console.log('===========================================');
  console.log('Token received:', req.query.token ? 'YES' : 'NO');
  console.log('FRONTEND_URL env var:', process.env.FRONTEND_URL);
  
  try {
    const { token } = req.query;

    if (!token) {
      console.log(' ERROR: No token provided');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    console.log('Verifying JWT token...');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully');
      console.log('   User ID:', decoded.userId);
      console.log('   Email:', decoded.email);
    } catch (error) {
      console.log('Token verification failed:', error.message);
      // FIXED: Changed to /login/vendor
      const redirectUrl = `${process.env.FRONTEND_URL}/login/vendor?error=token_expired&message=${encodeURIComponent('Verification link expired')}`;
      console.log(' Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    console.log('Looking up user in database...');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      console.log(' User not found for ID:', decoded.userId);
      //  FIXED: Changed to /login/vendor
      const redirectUrl = `${process.env.FRONTEND_URL}/login/vendor?error=user_not_found&message=${encodeURIComponent('User not found')}`;
      console.log(' Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    console.log('User found:', user.email);
    console.log('   Email already verified?', user.emailVerified);

    if (user.emailVerified) {
      console.log(' Email already verified, redirecting...');
      //  FIXED: Changed to /login/vendor
      const redirectUrl = `${process.env.FRONTEND_URL}/login/vendor?verified=true&message=${encodeURIComponent('Email already verified')}`;
      console.log('🔗 Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    console.log('Marking email as verified...');
    user.emailVerified = true;
    await user.save();
    console.log(' Email verification saved to database');

    console.log('Looking up provider...');
    const provider = await Provider.findOne({ where: { userId: user.id } });
    console.log(' Provider found:', provider?.businessName || 'No provider');

    const businessName = provider?.businessName || '';
    // FIXED: Changed to /login/vendor
    const redirectUrl = `${process.env.FRONTEND_URL}/login/vendor?verified=true&business=${encodeURIComponent(businessName)}&message=${encodeURIComponent('Email verified! Please login.')}`;
    
    console.log('===========================================');
    console.log('VERIFICATION SUCCESSFUL!');
    console.log('REDIRECTING TO:', redirectUrl);
    console.log('===========================================');

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('===========================================');
    console.error(' VERIFICATION ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('===========================================');
    
    // FIXED: Changed to /login/vendor
    const redirectUrl = `${process.env.FRONTEND_URL}/login/vendor?error=verification_failed&message=${encodeURIComponent('Verification failed. Please try again.')}`;
    console.log('🔗 Error redirect to:', redirectUrl);
    res.redirect(redirectUrl);
  }
};

//  LOGOUT 
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

module.exports = {
  registerProvider,
  loginWithEmail,
  loginProvider,
  verifyEmail,
  verifyProviderOTP,
  loginAsAdmin,
  changeAdminPassword,
  googleCallback,
  getCurrentUser,
  logout,
};