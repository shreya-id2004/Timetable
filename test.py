import requests

# Replace these with your backend API URLs
SUBJECTS_API_URL = "http://localhost:8080/getSubjects"
TEACHERS_API_URL = "http://localhost:8080/getTeachers"

def fetch_data_from_api(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()  # Parse the JSON response
    else:
        print(f"Error fetching data from {url}: {response.status_code}")
        return []

# Fetch subjects and teachers dynamically
subjects_data = fetch_data_from_api(SUBJECTS_API_URL)
teachers_data = fetch_data_from_api(TEACHERS_API_URL)

# Process subjects
subjects = [
    {
        "name": subject["name"],
        "creditHours": subject["creditHours"],
        "isLab": subject["isLab"]
    }
    for subject in subjects_data
]

# Process teachers
teachers = [
    {
        "name": teacher["teacher"],  # Adjust field name
        "subjects": teacher["subject"]  # Adjust field name
    }
    for teacher in teachers_data
]

subjects
teachers

print("Subjects:", subjects)
print("Teachers:", teachers)
