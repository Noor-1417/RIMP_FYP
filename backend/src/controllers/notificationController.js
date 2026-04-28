const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isRead } = req.query;

    let query = { recipient: req.user.id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .populate('recipient', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check authorization
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notification',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check authorization
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notification',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Utility function to create and send notification
exports.createAndSendNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);

    // Send email if enabled
    if (notificationData.channels.email) {
      const recipient = await User.findById(notificationData.recipient);
      if (recipient && recipient.preferences.emailNotifications) {
        await sendEmail({
          to: recipient.email,
          subject: notificationData.title,
          html: `
            <h2>${notificationData.title}</h2>
            <p>${notificationData.message}</p>
            ${notificationData.actionUrl ? `<a href="${notificationData.actionUrl}">${notificationData.actionLabel || 'View'}</a>` : ''}
          `,
        });

        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Utility function to send email
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rimp.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Utility function to create a notification for all admins
exports.createNotificationForAdmins = async (title, message, type, relatedResource = null, options = {}) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id preferences email');
    
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      title,
      message,
      type,
      relatedResource,
      channels: {
        email: admin.preferences?.emailNotifications ?? true,
        inApp: true,
      },
      ...options
    }));

    if (notifications.length > 0) {
      const created = await Notification.insertMany(notifications);
      
      // Optionally send emails asynchronously (basic implementation)
      created.forEach(notification => {
        const admin = admins.find(a => a._id.toString() === notification.recipient.toString());
        if (admin && admin.preferences?.emailNotifications) {
          sendEmail({
            to: admin.email,
            subject: notification.title,
            html: `<h2>${notification.title}</h2><p>${notification.message}</p>
                   ${notification.actionUrl ? `<a href="${notification.actionUrl}">${notification.actionLabel || 'View'}</a>` : ''}`
          }).catch(err => console.error('Error sending admin notification email:', err));
        }
      });
      return created;
    }
  } catch (error) {
    console.error('Error creating notification for admins:', error);
  }
};

// Utility function to create a notification for students
exports.createNotificationForStudents = async (title, message, type, relatedResource = null, targetStudentIds = null, options = {}) => {
  try {
    let query = { role: 'intern', isActive: true };
    if (targetStudentIds && targetStudentIds.length > 0) {
      query._id = { $in: targetStudentIds };
    }
    
    const students = await User.find(query).select('_id preferences email');
    
    const notifications = students.map(student => ({
      recipient: student._id,
      title,
      message,
      type,
      relatedResource,
      channels: {
        email: student.preferences?.emailNotifications ?? true,
        inApp: true,
      },
      ...options
    }));

    if (notifications.length > 0) {
      const created = await Notification.insertMany(notifications);
      return created;
    }
  } catch (error) {
    console.error('Error creating notification for students:', error);
  }
};

// @desc    Admin sends a manual notification
// @route   POST /api/notifications/admin-send
// @access  Private/Admin
exports.adminSendNotification = async (req, res, next) => {
  try {
    const { title, message, target, targetStudents } = req.body;
    
    let studentIds = null;
    if (target === 'students' && targetStudents && targetStudents.length > 0) {
      studentIds = targetStudents;
    }
    // Note: if target is 'all', studentIds remains null, which sends to all active students.
    
    await exports.createNotificationForStudents(
      title, 
      message, 
      'general', 
      null, 
      studentIds
    );

    res.status(200).json({
      success: true,
      message: 'Notifications sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  ...exports,
  sendEmail,
};
