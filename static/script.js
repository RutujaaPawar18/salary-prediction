document.addEventListener('DOMContentLoaded', function() {
    // Initialize Charts
    const salaryCtx = document.getElementById('salaryChart').getContext('2d');
    const ageCtx = document.getElementById('ageChart').getContext('2d');
    const educationCtx = document.getElementById('educationChart').getContext('2d');

    // Salary Distribution Chart
    const salaryChart = new Chart(salaryCtx, {
        type: 'bar',
        data: {
            labels: ['IT', 'HR', 'Finance', 'Sales', 'Engineering', 'Admin', 'Marketing'],
            datasets: [{
                label: 'Average Salary by Department',
                data: [72000, 58000, 68000, 62000, 78000, 52000, 65000],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 40000,
                    title: {
                        display: true,
                        text: 'Annual Salary ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Age vs Income Chart
    const ageChart = new Chart(ageCtx, {
        type: 'line',
        data: {
            labels: ['20-25', '26-30', '31-35', '36-40', '41-45', '46-50', '51-55', '56-60'],
            datasets: [{
                label: 'Average Salary by Age Group',
                data: [45000, 52000, 62000, 72000, 78000, 82000, 85000, 80000],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Annual Salary ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Education vs Income Chart
    const educationChart = new Chart(educationCtx, {
        type: 'bar',
        data: {
            labels: ['High School', 'Some College', 'Bachelor', 'Master', 'Doctorate'],
            datasets: [{
                label: 'Average Salary by Education',
                data: [42000, 48000, 68000, 82000, 95000],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 205, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 30000,
                    title: {
                        display: true,
                        text: 'Annual Salary ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Form Submission Handler
    document.getElementById('predictionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        const resultDiv = document.getElementById('result');
        const probDiv = document.getElementById('probability');
        resultDiv.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">Analyzing employee data...</div>';
        probDiv.textContent = '';
        
        try {
            // Get all form values safely
            const getValue = (id) => {
                const element = document.getElementById(id);
                if (!element) {
                    throw new Error(`Missing field: ${id}`);
                }
                return element.value;
            };

            const formData = {
                age: parseInt(getValue('age')) || 0,
                workclass: getValue('workclass'),
                education: getValue('education'),
                'marital-status': getValue('marital-status'),
                occupation: getValue('occupation'),
                relationship: getValue('relationship'),
                race: getValue('race'),
                gender: getValue('gender'),
                'capital-gain': parseInt(getValue('capital-gain')) || 0,
                'capital-loss': parseInt(getValue('capital-loss')) || 0,
                'hours-per-week': parseInt(getValue('hours-per-week')) || 0
            };

            // Validate required fields
            const requiredFields = ['age', 'workclass', 'education', 'occupation', 'hours-per-week'];
            const missingFields = requiredFields.filter(field => !formData[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Please fill in: ${missingFields.join(', ')}`);
            }

            // Send to backend
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Prediction service unavailable');
            }

            const data = await response.json();

            // Update result display
            const isHighIncome = data.prediction > 0.5;
            const salaryRange = isHighIncome ? '>$50K' : '≤$50K';
            const confidence = (data.probability * 100).toFixed(1);
            
            resultDiv.innerHTML = `
                <div class="prediction-result ${isHighIncome ? 'prediction-high' : 'prediction-low'}">
                    ${salaryRange}
                </div>
            `;
            
            probDiv.innerHTML = `
                <div class="confidence-meter">
                    <div class="confidence-label">Confidence:</div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${isHighIncome ? 'bg-success' : 'bg-warning'}" 
                             role="progressbar" 
                             style="width: ${confidence}%" 
                             aria-valuenow="${confidence}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${confidence}%
                        </div>
                    </div>
                </div>
            `;

            // Update charts with new data
            updateDepartmentSalary(salaryChart, formData.occupation, isHighIncome ? 75000 : 45000);
            updateAgeSalary(ageChart, formData.age, isHighIncome ? 75000 : 45000);
            updateEducationSalary(educationChart, formData.education, isHighIncome ? 75000 : 45000);

        } catch (error) {
            console.error('Prediction error:', error);
            resultDiv.innerHTML = `<div class="error-text">${error.message}</div>`;
            probDiv.textContent = '';
        }
    });

    // Chart Update Functions
    function updateDepartmentSalary(chart, department, salary) {
        const deptIndex = chart.data.labels.findIndex(label => 
            label.toLowerCase().includes(department.toLowerCase())
        );
        
        if (deptIndex !== -1) {
            // Smooth transition animation
            animateValue(chart.data.datasets[0].data[deptIndex], salary, 1000, (value) => {
                chart.data.datasets[0].data[deptIndex] = Math.round(value);
                chart.update();
            });
        }
    }

    function updateAgeSalary(chart, age, salary) {
        let ageGroup;
        if (age < 26) ageGroup = '20-25';
        else if (age < 31) ageGroup = '26-30';
        else if (age < 36) ageGroup = '31-35';
        else if (age < 41) ageGroup = '36-40';
        else if (age < 46) ageGroup = '41-45';
        else if (age < 51) ageGroup = '46-50';
        else if (age < 56) ageGroup = '51-55';
        else ageGroup = '56-60';
        
        const ageIndex = chart.data.labels.indexOf(ageGroup);
        if (ageIndex !== -1) {
            animateValue(chart.data.datasets[0].data[ageIndex], salary, 1000, (value) => {
                chart.data.datasets[0].data[ageIndex] = Math.round(value);
                chart.update();
            });
        }
    }

    function updateEducationSalary(chart, education, salary) {
        let eduLevel;
        if (education.includes('HS') || education.includes('High')) eduLevel = 'High School';
        else if (education.includes('Some')) eduLevel = 'Some College';
        else if (education.includes('Bach')) eduLevel = 'Bachelor';
        else if (education.includes('Master')) eduLevel = 'Master';
        else if (education.includes('Doc')) eduLevel = 'Doctorate';
        else eduLevel = 'Bachelor'; // default
        
        const eduIndex = chart.data.labels.indexOf(eduLevel);
        if (eduIndex !== -1) {
            animateValue(chart.data.datasets[0].data[eduIndex], salary, 1000, (value) => {
                chart.data.datasets[0].data[eduIndex] = Math.round(value);
                chart.update();
            });
        }
    }

    // Helper function for smooth value transitions
    function animateValue(start, end, duration, callback) {
        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        const timer = setInterval(() => {
            current += increment;
            callback(current);
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }
});