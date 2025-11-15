const fetchBtn = document.getElementById('fetchBtn');
        const clearBtn = document.getElementById('clearBtn');
        const sendBtn = document.getElementById('sendBtn');
        const diagnoseBtn = document.getElementById('diagnoseBtn');
        const reportBtn = document.getElementById('reportBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const imageUpload = document.getElementById('imageUpload');
        const chatInput = document.getElementById('chatInput');
        const chatContainer = document.getElementById('chatContainer');
        const languageSelect = document.getElementById('languageSelect');
        
        // Metrics elements
        const phMetric = document.getElementById('phMetric').querySelector('.metric-value');
        const moistureMetric = document.getElementById('moistureMetric').querySelector('.metric-value');
        const nutrientMetric = document.getElementById('nutrientMetric').querySelector('.metric-value');
        const weatherMetric = document.getElementById('weatherMetric').querySelector('.metric-value');
        const lastUpdated = document.getElementById('lastUpdated');
        
        // State
        let currentLanguage = 'hi';
        let isListening = false;
        let recognition = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Add floating elements
            addFloatingElements();
            
            // Set up event listeners
            setupEventListeners();
            
            // Try to get current location
            getCurrentLocation();
        });
        
        // Add floating elements to background
        function addFloatingElements() {
            const floatingElements = document.getElementById('floatingElements');
            const icons = ['🌱', '🚜', '💧', '🌾', '🌻', '🍅', '🌽', '🥕'];
            
            for (let i = 0; i < 15; i++) {
                const element = document.createElement('div');
                element.className = 'floating-element';
                element.textContent = icons[Math.floor(Math.random() * icons.length)];
                element.style.left = `${Math.random() * 100}%`;
                element.style.animationDelay = `${Math.random() * 15}s`;
                element.style.animationDuration = `${15 + Math.random() * 10}s`;
                floatingElements.appendChild(element);
            }
        }
        
        // Set up all event listeners
        function setupEventListeners() {
            // Fetch sensor data
            fetchBtn.addEventListener('click', fetchSensorData);
            
            // Clear inputs
            clearBtn.addEventListener('click', clearInputs);
            
            // Send chat message
            sendBtn.addEventListener('click', sendChatMessage);
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendChatMessage();
                }
            });
            
            // Language change
            languageSelect.addEventListener('change', function() {
                currentLanguage = this.value;
                updateUIForLanguage();
            });
            
            // Voice recognition
            voiceBtn.addEventListener('click', toggleVoiceRecognition);
            
            // Image upload
            imageUpload.addEventListener('change', handleImageUpload);
            
            // AI Diagnose
            diagnoseBtn.addEventListener('click', function() {
                if (document.getElementById('uploadedImage')) {
                    analyzeImage();
                } else {
                    addMessage('bot', 'Please upload an image first for diagnosis.');
                }
            });
            
            // Generate Report
            reportBtn.addEventListener('click', generateReport);
        }
        
        // Get current location
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        document.getElementById('latitude').value = position.coords.latitude.toFixed(4);
                        document.getElementById('longitude').value = position.coords.longitude.toFixed(4);
                    },
                    function(error) {
                        console.log('Geolocation error:', error);
                        // Use default values for demo
                        document.getElementById('latitude').value = '23.6108';
                        document.getElementById('longitude').value = '85.2799';
                    }
                );
            } else {
                // Use default values for demo
                document.getElementById('latitude').value = '23.6108';
                document.getElementById('longitude').value = '85.2799';
            }
        }
        
        // Fetch sensor data from backend
        function fetchSensorData() {
            const latitude = document.getElementById('latitude').value;
            const longitude = document.getElementById('longitude').value;
            
            if (!latitude || !longitude) {
                alert('Please enter latitude and longitude');
                return;
            }
            
            // Show loading state
            fetchBtn.innerHTML = '<div class="spinner"></div> Fetching...';
            fetchBtn.disabled = true;
            
            // Call backend API
            fetch('/api/sensor-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateMetrics(data.data);
                    updateRecommendations(data.data);
                    addMessage('bot', `Location data fetched successfully for ${data.data.location}`);
                } else {
                    throw new Error('Failed to fetch data');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addMessage('bot', 'Error fetching sensor data. Using demo data instead.');
                // Use demo data as fallback
                updateMetrics({
                    ph: 6.8,
                    moisture: 42,
                    nitrogen: 'Medium',
                    phosphorus: 'High',
                    potassium: 'Medium',
                    weather: {
                        temp: 28,
                        humidity: 65,
                        condition: 'Partly Cloudy',
                        rainfall: 'Low'
                    }
                });
            })
            .finally(() => {
                // Reset button
                fetchBtn.innerHTML = '<i class="fas fa-satellite"></i><span class="btn-text">Fetch Real Data</span>';
                fetchBtn.disabled = false;
            });
        }
        
        // Update metrics display
        function updateMetrics(data) {
            phMetric.textContent = data.ph;
            moistureMetric.textContent = `${data.moisture}%`;
            nutrientMetric.textContent = `${data.nitrogen}/${data.phosphorus}/${data.potassium}`;
            weatherMetric.textContent = `${data.weather.temp}°C`;
            
            // Update last updated time
            lastUpdated.textContent = new Date().toLocaleTimeString();
            
            // Also update form inputs
            document.getElementById('soilPh').value = data.ph;
            document.getElementById('moisture').value = data.moisture;
        }
        
        // Update recommendations based on data
        function updateRecommendations(data) {
            const recommendationsContainer = document.getElementById('recommendations');
            recommendationsContainer.innerHTML = '';
            
            // Generate recommendations based on soil data
            const recommendations = [];
            
            if (data.ph > 7) {
                recommendations.push({
                    icon: '🌾',
                    text: 'Soil pH is slightly high. Consider adding sulfur or organic matter.',
                    badge: 'pH'
                });
            } else if (data.ph < 6) {
                recommendations.push({
                    icon: '🌾',
                    text: 'Soil pH is slightly low. Consider adding lime.',
                    badge: 'pH'
                });
            }
            
            if (data.moisture < 30) {
                recommendations.push({
                    icon: '💧',
                    text: 'Soil moisture is low. Consider irrigation.',
                    badge: 'Water'
                });
            } else if (data.moisture > 60) {
                recommendations.push({
                    icon: '💧',
                    text: 'Soil moisture is high. Ensure proper drainage.',
                    badge: 'Water'
                });
            }
            
            if (data.weather.rainfall === 'High') {
                recommendations.push({
                    icon: '☔',
                    text: 'High rainfall expected. Prepare drainage systems.',
                    badge: 'Weather'
                });
            }
            
            // Default recommendation if none generated
            if (recommendations.length === 0) {
                recommendations.push({
                    icon: '✅',
                    text: 'Soil conditions appear favorable for most crops.',
                    badge: 'Good'
                });
            }
            
            // Add crop recommendation based on season and conditions
            const month = new Date().getMonth();
            let season = 'Rabi'; // Default to Rabi season (Oct-Mar)
            if (month >= 6 && month <= 9) {
                season = 'Kharif'; // Kharif season (Jun-Sep)
            }
            
            recommendations.push({
                icon: '🌱',
                text: `For ${season} season, consider growing: ${season === 'Kharif' ? 'Rice, Maize, Cotton' : 'Wheat, Mustard, Chickpea'}`,
                badge: season
            });
            
            // Render recommendations
            recommendations.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'recommendation-item';
                item.innerHTML = `
                    <div class="recommendation-icon">${rec.icon}</div>
                    <div class="recommendation-text">${rec.text}</div>
                    <div class="recommendation-badge">${rec.badge}</div>
                `;
                recommendationsContainer.appendChild(item);
            });
        }
        
        // Clear all inputs
        function clearInputs() {
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            document.getElementById('soilPh').value = '';
            document.getElementById('moisture').value = '';
            
            // Reset metrics
            phMetric.textContent = '—';
            moistureMetric.textContent = '—';
            nutrientMetric.textContent = 'N/A';
            weatherMetric.textContent = '—';
            lastUpdated.textContent = 'Never';
            
            // Reset recommendations
            const recommendationsContainer = document.getElementById('recommendations');
            recommendationsContainer.innerHTML = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🌱</div>
                    <div class="recommendation-text">Enter location data to get personalized recommendations</div>
                    <div class="recommendation-badge">New</div>
                </div>
            `;
            
            addMessage('bot', 'All inputs cleared.');
        }
        
        // Send chat message to backend
        function sendChatMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message to chat
            addMessage('user', message);
            chatInput.value = '';
            
            // Show typing indicator
            const typingIndicator = addMessage('bot', '<div class="loading"><div class="spinner"></div> AI is thinking...</div>', true);
            
            // Call backend API
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    language: currentLanguage
                })
            })
            .then(response => response.json())
            .then(data => {
                // Remove typing indicator
                typingIndicator.remove();
                
                if (data.success) {
                    addMessage('bot', data.response);
                } else {
                    addMessage('bot', 'Sorry, I encountered an error. Please try again.');
                }
            })
            .catch(error => {
                // Remove typing indicator
                typingIndicator.remove();
                
                console.error('Error:', error);
                addMessage('bot', 'Sorry, I am having trouble connecting. Please check your internet connection.');
            });
        }
        
        // Add message to chat container
        function addMessage(sender, content, isTyping = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}`;
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = `message-bubble ${sender}`;
            
            if (isTyping) {
                bubbleDiv.innerHTML = content;
                messageDiv.id = 'typing-indicator';
            } else {
                bubbleDiv.innerHTML = `
                    <div>${content}</div>
                    <div class="message-time">${sender === 'user' ? 'You' : 'AI Assistant'} • ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                `;
            }
            
            messageDiv.appendChild(bubbleDiv);
            chatContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            return messageDiv;
        }
        
        // Handle image upload
        function handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Check if file is an image
            if (!file.type.match('image.*')) {
                alert('Please upload an image file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = `
                    <div style="text-align: center;">
                        <img src="${e.target.result}" alt="Uploaded Image" class="image-preview" id="uploadedImage">
                        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Image ready for analysis</p>
                    </div>
                `;
                
                addMessage('bot', 'Image uploaded successfully. Click "AI Diagnose" to analyze.');
            };
            reader.readAsDataURL(file);
        }
        
        // Analyze uploaded image
        function analyzeImage() {
            const imageFile = imageUpload.files[0];
            if (!imageFile) {
                addMessage('bot', 'Please upload an image first.');
                return;
            }
            
            // Show loading state
            diagnoseBtn.innerHTML = '<div class="spinner"></div> Analyzing...';
            diagnoseBtn.disabled = true;
            
            const formData = new FormData();
            formData.append('image', imageFile);
            
            // Call backend API
            fetch('/api/analyze-image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayAnalysisResults(data.analysis);
                    addMessage('bot', `Image analysis complete: ${data.analysis.disease} detected with ${data.analysis.confidence} confidence.`);
                } else {
                    throw new Error(data.error || 'Analysis failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addMessage('bot', 'Error analyzing image. Please try again.');
            })
            .finally(() => {
                // Reset button
                diagnoseBtn.innerHTML = '<i class="fas fa-stethoscope"></i> AI Diagnose';
                diagnoseBtn.disabled = false;
            });
        }
        
        // Display image analysis results
        function displayAnalysisResults(analysis) {
            const analysisCard = document.getElementById('analysisResults');
            const analysisContent = document.getElementById('analysisContent');
            
            analysisContent.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-weight: bold; color: var(--primary);">Disease:</span>
                        <span>${analysis.disease}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-weight: bold; color: var(--primary);">Confidence:</span>
                        <span>${analysis.confidence}</span>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">Treatment:</div>
                    <div>${analysis.treatment}</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">Prevention:</div>
                    <div>${analysis.prevention}</div>
                </div>
            `;
            
            analysisCard.style.display = 'block';
        }
        
        // Generate farm report
        function generateReport() {
            // Show loading state
            reportBtn.innerHTML = '<div class="spinner"></div> Generating...';
            reportBtn.disabled = true;
            
            // Get current metrics data
            const soilData = {
                ph: document.getElementById('soilPh').value || 'Unknown',
                moisture: document.getElementById('moisture').value || 'Unknown'
            };
            
            const weatherData = {
                condition: weatherMetric.textContent !== '—' ? 'Available' : 'Unknown'
            };
            
            // Call backend API
            fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    soilData: soilData,
                    weatherData: weatherData,
                    recommendations: document.getElementById('recommendations').innerText
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayReport(data.report);
                    addMessage('bot', 'Farm report generated successfully.');
                } else {
                    throw new Error('Report generation failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addMessage('bot', 'Error generating report. Please try again.');
            })
            .finally(() => {
                // Reset button
                reportBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Generate Report';
                reportBtn.disabled = false;
            });
        }
        
        // Display generated report
        function displayReport(report) {
            // For demo purposes, we'll show an alert with the report summary
            // In a real app, you might generate a PDF or show a detailed modal
            alert(`Farm Report Generated!\n\nTitle: ${report.title}\nDate: ${report.date}\nSoil Health: ${report.soilHealth}\n\nSummary: ${report.summary}\n\nRecommendations:\n- ${report.recommendations.join('\n- ')}`);
        }
        
        // Toggle voice recognition
        function toggleVoiceRecognition() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Speech recognition not supported in this browser');
                return;
            }
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!isListening) {
                // Start listening
                recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
                
                recognition.onstart = function() {
                    isListening = true;
                    voiceBtn.classList.add('active');
                    voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Listening...';
                    addMessage('bot', 'Listening... Please speak now.');
                };
                
                recognition.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    chatInput.value = transcript;
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
                    voiceBtn.classList.remove('active');
                    isListening = false;
                    
                    // Auto-send the message
                    sendChatMessage();
                };
                
                recognition.onerror = function(event) {
                    console.error('Speech recognition error', event.error);
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
                    voiceBtn.classList.remove('active');
                    isListening = false;
                    addMessage('bot', 'Speech recognition error. Please try again.');
                };
                
                recognition.onend = function() {
                    if (isListening) {
                        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
                        voiceBtn.classList.remove('active');
                        isListening = false;
                        addMessage('bot', 'Speech recognition ended.');
                    }
                };
                
                recognition.start();
            } else {
                // Stop listening
                recognition.stop();
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
                voiceBtn.classList.remove('active');
                isListening = false;
            }
        }
        
        // Update UI based on selected language
        function updateUIForLanguage() {
            const greetings = {
                'hi': 'नमस्ते! मैं आपकी खेती सहायक हूँ — अपने खेत के बारे में बताइए या छवि अपलोड करें।',
                'en': 'Hello! I am your farming assistant — tell me about your farm or upload an image.',
                'mag': 'प्रणाम! हमरा खेती सहायक बा — अपना खेत के बारे में बतावऽ या छवि अपलोड करऽ।',
                'bn': 'নমস্কার! আমি আপনার কৃষি সহায়ক — আপনার খামার সম্পর্কে বলুন বা ছবি আপলোড করুন।'
            };
            
            // Update chat placeholder
            chatInput.placeholder = greetings[currentLanguage].split('—')[1] || 'Ask in your local language...';
            
            // Add a greeting message
            addMessage('bot', greetings[currentLanguage]);
        }