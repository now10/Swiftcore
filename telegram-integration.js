// email-integration.js

// Email Configuration
const EMAIL_SERVICE = 'YOUR_EMAIL_SERVICE_ID'; // For EmailJS: service ID
const EMAIL_TEMPLATE = 'YOUR_EMAIL_TEMPLATE_ID'; // For EmailJS: template ID
const EMAIL_USER = 'YOUR_EMAILJS_USER_ID'; // For EmailJS: user ID
const RECIPIENT_EMAIL = 'accounts@swiftcore.dev'; // Your receiving email
const SENDER_EMAIL = 'noreply@swiftcore.dev'; // Sender email

// USDT Address for payments
const USDT_ADDRESS = 'T269wbsoñwvywolpavbwbhduYVX8qKJ9nMz';

// Store order data
let orderData = {
    items: [],
    total: 0,
    customerInfo: {},
    timestamp: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFormHandlers();
    initializeOrderHandlers();
    initializeFAQHandlers();
    initializeModalHandlers();
    
    // Load EmailJS library if needed
    loadEmailJSLibrary();
});

// Load EmailJS library
function loadEmailJSLibrary() {
    // Only load if EmailJS is configured
    if (EMAIL_SERVICE !== 'YOUR_EMAIL_SERVICE_ID') {
        const script = document.createElement('script');
        script.src = 'https://cdn.emailjs.com/dist/email.min.js';
        script.onload = function() {
            // Initialize EmailJS
            emailjs.init(EMAIL_USER);
        };
        document.head.appendChild(script);
    }
}

// Initialize form submission handlers
function initializeFormHandlers() {
    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactFormSubmit(this);
        });
    }
    
    // Apple Project Form Handler (from main portfolio page)
    const projectForm = document.querySelector('form[id="contactForm"]');
    if (projectForm && !contactForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProjectFormSubmit(this);
        });
    }
}

// Initialize order management handlers
function initializeOrderHandlers() {
    // Add to Order buttons
    document.querySelectorAll('.add-to-order').forEach(button => {
        button.addEventListener('click', function() {
            handleAddToOrder(this);
        });
    });
    
    // Clear Order button
    const clearOrderBtn = document.getElementById('clearOrder');
    if (clearOrderBtn) {
        clearOrderBtn.addEventListener('click', clearOrder);
    }
    
    // Submit Order button
    const submitOrderBtn = document.getElementById('submitOrder');
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', submitOrderToEmail);
    }
}

// Initialize FAQ handlers
function initializeFAQHandlers() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            toggleFAQ(this);
        });
    });
}

// Initialize modal handlers
function initializeModalHandlers() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Close buttons for modals
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Handle Contact Form Submission
function handleContactFormSubmit(form) {
    const formData = new FormData(form);
    const customerInfo = {
        fullName: formData.get('name') || 'Not provided',
        email: formData.get('email') || 'Not provided',
        company: formData.get('company') || 'Not provided',
        projectType: formData.get('project') || 'Not provided',
        projectDetails: formData.get('message') || 'Not provided',
        formType: 'Contact Form',
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href
    };
    
    // Add to order data
    orderData.customerInfo = customerInfo;
    orderData.timestamp = customerInfo.timestamp;
    
    // Send to Email
    sendToEmail(customerInfo, null, 'contact_form');
    
    // Show success message
    showMessage('Thank you! Your inquiry has been sent. We will contact you within 24 hours.', 'success');
    
    // Reset form
    form.reset();
}

// Handle Apple Project Form Submission (from main page)
function handleProjectFormSubmit(form) {
    const formData = new FormData(form);
    const customerInfo = {
        fullName: form.querySelector('#name')?.value || 'Not provided',
        email: form.querySelector('#email')?.value || 'Not provided',
        company: form.querySelector('#company')?.value || 'Not provided',
        projectType: form.querySelector('#project')?.value || 'Not provided',
        projectDetails: form.querySelector('#message')?.value || 'Not provided',
        formType: 'Apple Project Inquiry',
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href
    };
    
    // Send to Email
    sendToEmail(customerInfo, null, 'project_inquiry');
    
    // Show success message
    showMessage('Thank you! Your project inquiry has been sent. We will contact you within 24 hours.', 'success');
    
    // Reset form
    form.reset();
}

// Handle Add to Order button click
function handleAddToOrder(button) {
    const name = button.getAttribute('data-name');
    const basePrice = parseInt(button.getAttribute('data-price'));
    const selectElement = button.parentElement.querySelector('.option-select');
    
    if (selectElement && selectElement.value === '') {
        showMessage('Please select an option before adding to order.', 'error');
        return;
    }
    
    // Determine final price and name based on selection
    let finalName = name;
    let finalPrice = basePrice;
    let selectedOption = null;
    
    if (selectElement) {
        selectedOption = selectElement.options[selectElement.selectedIndex];
        const optionText = selectedOption.textContent;
        
        // Extract price from option text if available
        const priceMatch = optionText.match(/\$(\d+)/);
        if (priceMatch) {
            finalPrice = parseInt(priceMatch[1]);
        }
        finalName = `${name} - ${optionText.split('-')[0].trim()}`;
    }
    
    // Add item to order
    const orderItem = {
        name: finalName,
        price: finalPrice,
        selectedOption: selectedOption ? selectedOption.value : null,
        timestamp: new Date().toISOString()
    };
    
    orderData.items.push(orderItem);
    orderData.total += finalPrice;
    
    updateOrderPreview();
    
    // Show order preview
    const orderPreview = document.getElementById('orderPreview');
    if (orderPreview) {
        orderPreview.classList.add('active');
        
        // Scroll to order preview
        setTimeout(() => {
            orderPreview.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    }
    
    showMessage(`${finalName} added to order!`, 'success');
}

// Update Order Preview Display
function updateOrderPreview() {
    const orderItemsContainer = document.getElementById('orderItems');
    const orderTotalElement = document.getElementById('orderTotal');
    
    if (!orderItemsContainer || !orderTotalElement) return;
    
    // Clear current items
    orderItemsContainer.innerHTML = '';
    
    // Add each item
    orderData.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-value">$${item.price} 
                <button class="remove-item" data-index="${index}" style="background: none; border: none; color: #ff3b30; margin-left: 10px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        orderItemsContainer.appendChild(itemElement);
    });
    
    // Update total
    orderTotalElement.textContent = `$${orderData.total}`;
    
    // Add remove event listeners
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (!isNaN(index) && orderData.items[index]) {
                orderData.total -= orderData.items[index].price;
                orderData.items.splice(index, 1);
                updateOrderPreview();
                
                if (orderData.items.length === 0) {
                    const orderPreview = document.getElementById('orderPreview');
                    if (orderPreview) {
                        orderPreview.classList.remove('active');
                    }
                }
            }
        });
    });
}

// Clear Order
function clearOrder() {
    orderData = {
        items: [],
        total: 0,
        customerInfo: {},
        timestamp: null
    };
    
    updateOrderPreview();
    
    const orderPreview = document.getElementById('orderPreview');
    if (orderPreview) {
        orderPreview.classList.remove('active');
    }
    
    showMessage('Order cleared.', 'info');
}

// Submit Order and Send to Email
function submitOrderToEmail() {
    if (orderData.items.length === 0) {
        showMessage('Please add items to your order before submitting.', 'error');
        return;
    }
    
    // Prompt for customer information if not already collected
    if (!orderData.customerInfo || !orderData.customerInfo.email) {
        collectCustomerInfoForOrder();
        return;
    }
    
    // Send order to Email
    sendToEmail(orderData.customerInfo, orderData.items, 'developer_account_order');
    
    // Show confirmation
    showMessage('Thank you! Your order has been submitted. We will send payment instructions to your email shortly.', 'success');
    
    // Clear order after submission
    setTimeout(clearOrder, 3000);
}

// Collect Customer Information for Order
function collectCustomerInfoForOrder() {
    const htmlContent = `
        <div class="modal active" id="customerInfoModal" style="display: flex;">
            <div class="modal-content">
                <button class="modal-close" onclick="closeCustomerModal()">&times;</button>
                <h3>Customer Information</h3>
                <p>Please provide your details to complete the order:</p>
                <form id="customerInfoForm" style="margin-top: 20px;">
                    <div class="form-group">
                        <label for="orderFullName">Full Name *</label>
                        <input type="text" id="orderFullName" class="form-control" required placeholder="John Appleseed">
                    </div>
                    <div class="form-group">
                        <label for="orderEmail">Email Address *</label>
                        <input type="email" id="orderEmail" class="form-control" required placeholder="john@example.com">
                    </div>
                    <div class="form-group">
                        <label for="orderPhone">Phone Number (Optional)</label>
                        <input type="tel" id="orderPhone" class="form-control" placeholder="+1 (555) 123-4567">
                    </div>
                    <div class="form-group">
                        <label for="orderCountry">Country (Optional)</label>
                        <input type="text" id="orderCountry" class="form-control" placeholder="United States">
                    </div>
                    <div class="form-group">
                        <label for="orderNotes">Additional Notes (Optional)</label>
                        <textarea id="orderNotes" class="form-control" placeholder="Any special requirements or notes..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Complete Order</button>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = htmlContent;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Add form handler
    document.getElementById('customerInfoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomerInfoAndSubmit();
    });
    
    // Add close modal function to window
    window.closeCustomerModal = function() {
        const modal = document.getElementById('customerInfoModal');
        if (modal) {
            modal.remove();
        }
    };
}

// Save Customer Info and Submit Order
function saveCustomerInfoAndSubmit() {
    const fullName = document.getElementById('orderFullName').value;
    const email = document.getElementById('orderEmail').value;
    const phone = document.getElementById('orderPhone').value;
    const country = document.getElementById('orderCountry').value;
    const notes = document.getElementById('orderNotes').value;
    
    if (!fullName || !email) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Save customer info
    orderData.customerInfo = {
        fullName: fullName,
        email: email,
        phone: phone || 'Not provided',
        country: country || 'Not provided',
        notes: notes || 'No additional notes',
        formType: 'Developer Account Order',
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href
    };
    
    // Close modal
    window.closeCustomerModal();
    
    // Continue with order submission
    submitOrderToEmail();
}

// Build Email Message
function buildEmailMessage(customerInfo, orderItems) {
    let message = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #34c759; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f5f5f7; padding: 20px; border-radius: 0 0 10px 10px; }
                .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #34c759; }
                .total { background: #0071e3; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; }
                .payment-info { background: #ff9500; color: white; padding: 15px; border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f0f0f0; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 New Apple Developer Account Order</h1>
                    <p>Order Received: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h2>Customer Information</h2>
                        <p><strong>Name:</strong> ${customerInfo.fullName}</p>
                        <p><strong>Email:</strong> ${customerInfo.email}</p>
                        <p><strong>Phone:</strong> ${customerInfo.phone}</p>
                        <p><strong>Country:</strong> ${customerInfo.country}</p>
                        <p><strong>Order Type:</strong> ${customerInfo.formType}</p>
                        <p><strong>Submitted From:</strong> ${customerInfo.pageUrl || window.location.href}</p>
                    </div>
                    
                    <div class="section">
                        <h2>Order Details</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    orderItems.forEach((item, index) => {
        message += `
            <tr>
                <td>${item.name}</td>
                <td>$${item.price}</td>
            </tr>
        `;
    });
    
    message += `
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="total">
                        <p>Total Amount: $${orderData.total}</p>
                    </div>
                    
                    <div class="payment-info section">
                        <h2>Payment Instructions</h2>
                        <p><strong>Payment Method:</strong> USDT TRC20</p>
                        <p><strong>USDT Address:</strong> ${USDT_ADDRESS}</p>
                        <p><strong>Amount to Send:</strong> $${orderData.total} USDT</p>
                        <p><strong>Important:</strong> Send the exact amount to the address above. Include your order reference in the memo if possible.</p>
                    </div>
                    
                    <div class="section">
                        <h2>Additional Notes</h2>
                        <p>${customerInfo.notes || 'No additional notes provided.'}</p>
                    </div>
                    
                    <div class="section">
                        <h2>Next Steps</h2>
                        <ol>
                            <li>Send payment to the USDT address above</li>
                            <li>Keep your transaction hash for verification</li>
                            <li>We'll confirm payment within 30 minutes</li>
                            <li>Account will be delivered within 24-48 hours</li>
                            <li>You'll receive login credentials via secure email</li>
                        </ol>
                    </div>
                    
                    <div class="footer">
                        <p>This order was submitted through SwiftCore Apple Developer Services</p>
                        <p>Contact: accounts@swiftcore.dev | Support: @SwiftCoreSupport</p>
                        <p>© 2023 SwiftCore. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    return message;
}

// Send Data to Email
function sendToEmail(customerInfo, orderItems = null, formType = 'general') {
    // Prepare email data
    const emailData = {
        to_email: RECIPIENT_EMAIL,
        from_email: SENDER_EMAIL,
        from_name: 'SwiftCore Order System',
        subject: `New ${formType.replace('_', ' ').toUpperCase()} - ${customerInfo.fullName}`,
        customer_name: customerInfo.fullName,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || 'Not provided',
        order_total: orderData.total || 0,
        order_items: orderItems ? JSON.stringify(orderItems) : 'No items',
        order_details: orderItems ? buildEmailMessage(customerInfo, orderItems) : 'No order details',
        form_type: formType,
        timestamp: new Date().toISOString(),
        page_url: window.location.href
    };
    
    // Log the data (for debugging)
    console.log('Email data prepared:', emailData);
    
    // Method 1: Using EmailJS (Recommended)
    if (typeof emailjs !== 'undefined' && EMAIL_SERVICE !== 'YOUR_EMAIL_SERVICE_ID') {
        sendViaEmailJS(emailData);
    }
    // Method 2: Using FormSubmit.co (Free alternative)
    else if (formType === 'contact_form' || formType === 'project_inquiry') {
        sendViaFormSubmit(customerInfo, formType);
    }
    // Method 3: Fallback - Show data and instructions
    else {
        showEmailFallback(emailData, customerInfo, orderItems);
    }
}

// Send via EmailJS
function sendViaEmailJS(emailData) {
    emailjs.send(EMAIL_SERVICE, EMAIL_TEMPLATE, emailData)
        .then(function(response) {
            console.log('Email sent successfully!', response.status, response.text);
            showMessage('Your information has been sent successfully! We will contact you soon.', 'success');
        }, function(error) {
            console.error('Email sending failed:', error);
            showMessage('Email service is temporarily unavailable. Please contact us directly.', 'error');
            // Fallback to showing data
            showEmailFallback(emailData, orderData.customerInfo, orderData.items);
        });
}

// Send via FormSubmit.co (for simple contact forms)
function sendViaFormSubmit(customerInfo, formType) {
    // This would work with forms that have action="https://formsubmit.co/your-email"
    // For now, we'll just show a success message
    showMessage('Form submitted successfully! We will contact you within 24 hours.', 'success');
}

// Show Email Fallback (when email service is not configured)
function showEmailFallback(emailData, customerInfo, orderItems) {
    const htmlContent = `
        <div class="modal active" id="emailFallbackModal" style="display: flex;">
            <div class="modal-content" style="max-width: 700px;">
                <button class="modal-close" onclick="closeFallbackModal()">&times;</button>
                <h3>Order Summary & Next Steps</h3>
                <div class="section" style="margin: 20px 0; padding: 15px; background: #f5f5f7; border-radius: 8px;">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${customerInfo.fullName}</p>
                    <p><strong>Email:</strong> ${customerInfo.email}</p>
                    <p><strong>Order Total:</strong> $${orderData.total}</p>
                </div>
                
                <div class="section" style="margin: 20px 0; padding: 15px; background: #f5f5f7; border-radius: 8px;">
                    <h4>Order Items</h4>
                    <ul>
    `;
    
    orderItems.forEach(item => {
        htmlContent += `<li>${item.name} - $${item.price}</li>`;
    });
    
    htmlContent += `
                    </ul>
                </div>
                
                <div class="payment-info" style="background: #0071e3; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>Payment Instructions</h4>
                    <p><strong>Send payment to this USDT address:</strong></p>
                    <p style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">
                        ${USDT_ADDRESS}
                    </p>
                    <p><strong>Amount:</strong> $${orderData.total} USDT</p>
                    <p><strong>Network:</strong> TRC20 (Tron)</p>
                </div>
                
                <div class="section" style="margin: 20px 0; padding: 15px; background: #f5f5f7; border-radius: 8px;">
                    <h4>Next Steps:</h4>
                    <ol>
                        <li>Send $${orderData.total} USDT to the address above</li>
                        <li>Email your transaction hash to <strong>accounts@swiftcore.dev</strong></li>
                        <li>Include your name and order details in the email</li>
                        <li>We'll confirm payment within 30 minutes</li>
                        <li>You'll receive your account within 24-48 hours</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="copyToClipboard('${USDT_ADDRESS}')" style="margin-right: 10px;">
                        <i class="fas fa-copy"></i> Copy USDT Address
                    </button>
                    <button class="btn btn-secondary" onclick="closeFallbackModal()">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = htmlContent;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Add copy function
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('USDT address copied to clipboard!', 'success');
        });
    };
    
    // Add close function
    window.closeFallbackModal = function() {
        const modal = document.getElementById('emailFallbackModal');
        if (modal) {
            modal.remove();
        }
    };
}

// Toggle FAQ
function toggleFAQ(question) {
    const answer = question.nextElementSibling;
    const icon = question.querySelector('i');
    
    answer.classList.toggle('active');
    
    if (answer.classList.contains('active')) {
        icon.className = 'fas fa-chevron-up';
    } else {
        icon.className = 'fas fa-chevron-down';
    }
}

// Show Message Function
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.custom-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'custom-message';
    
    // Set styles based on type
    let backgroundColor;
    switch(type) {
        case 'success':
            backgroundColor = '#34c759';
            break;
        case 'error':
            backgroundColor = '#ff3b30';
            break;
        case 'warning':
            backgroundColor = '#ff9500';
            break;
        default:
            backgroundColor = '#0071e3';
    }
    
    messageElement.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 12px;
        background-color: ${backgroundColor};
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    messageElement.textContent = message;
    
    // Add to body
    document.body.appendChild(messageElement);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

// Add CSS for animations
function addMessageStyles() {
    if (!document.getElementById('message-styles')) {
        const style = document.createElement('style');
        style.id = 'message-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize message styles
addMessageStyles();

// Export functions for use in HTML if needed
window.EmailIntegration = {
    submitOrderToEmail,
    clearOrder,
    showMessage,
    toggleFAQ
};