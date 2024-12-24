from flask import Flask, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# Subjects data
subjects = [
    {"name": "CN", "creditHours": 3, "isLab": False},
    {"name": "CN Lab", "creditHours": 3, "isLab": True},
    {"name": "FSD", "creditHours": 3, "isLab": False},
    {"name": "FSD Lab", "creditHours": 3, "isLab": True},
    {"name": "ATC", "creditHours": 3, "isLab": False},
    {"name": "ATC tutorial", "creditHours": 3, "isLab": True},
    {"name": "SPEM", "creditHours": 3, "isLab": False},
    {"name": "AI", "creditHours": 3, "isLab": False},
    {"name": "RM", "creditHours": 2, "isLab": False},
]

# Teachers data
teachers = [
    {"name": "Janardhana", "subjects": ["SPEM"]},
    {"name": "Annapurna", "subjects": ["CN", "CN Lab"]},
    {"name": "Usha", "subjects": ["CN", "CN Lab"]},
    {"name": "Rashmi", "subjects": ["ATC", "ATC Lab"]},
    {"name": "Anitha", "subjects": ["ATC", "ATC Lab"]},
    {"name": "Mubeen", "subjects": ["FSD", "FSD Lab"]},
    {"name": "Padmini", "subjects": ["FSD", "FSD Lab"]},
     {"name": "Divya shree", "subjects": ["FSD", "FSD Lab"]},
    {"name": "Rekha", "subjects": ["AI"]},
    {"name": "Sobia", "subjects": ["RM"]},
    {"name": "Mahesha", "subjects": ["SPEM"]},
    {"name":"Viday Raj", "subjects": ["SPEM"]},
    {"name": "Mohammed Adnan", "subjects": ["AI"]},
    {"name":"Vishnu Kanth","subjects":["AI"]},
    {"name": "Vidya", "subjects": ["RM"]},
    {"name":"Gajendra","subjects":["RM"]},
    {"name": "Lavanya", "subjects": ["EVS"]},
    
]


# Sections, days, and time slots
sections = ["section A", "section B", "section C", "section D"]
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
timeSlots = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:30 - 12:30",
    "12:30 - 01:30",
    "02:30 - 03:30",
    "03:30 - 04:30",
]

MAX_LECTURES_PER_DAY = 7

# Utility functions
def shuffle_list(lst):
    random.shuffle(lst)
    return lst

def initialize_teacher_schedule():
    return {teacher["name"]: {day: [False] * len(timeSlots) for day in days} for teacher in teachers}


#teacher_selection_index : trackss which teacher to assign to each subject
#section_teacher_map : tracks which teacher is assigned to which subject in which section

def initialize_teacher_selection_index():
    teacher_selection_index = {subject["name"]: 0 for subject in subjects}
    section_teacher_map = {section: {subject["name"]: None for subject in subjects} for section in sections}
    return teacher_selection_index, section_teacher_map


def select_teacher(subject, eligible_teachers, section, teacher_selection_index, section_teacher_map , teacher_load):
    if section_teacher_map[section][subject["name"]] is None:
       # Find the teacher with the least load among eligible teachers
        least_loaded_teacher = min(
            eligible_teachers,
            key=lambda teacher: teacher_load[teacher].get(subject["name"], 0)
        )
        section_teacher_map[section][subject["name"]] = least_loaded_teacher
        teacher_load[least_loaded_teacher][subject["name"]] = teacher_load[least_loaded_teacher].get(subject["name"], 0) + 1

    return section_teacher_map[section][subject["name"]]

#avoids consecutive assignments
def is_teacher_available(teacher, day, slot_index, teacher_schedule, teacher_last_slot_per_day):
    return (
        not teacher_schedule[teacher][day][slot_index] and
        teacher_last_slot_per_day[day].get(teacher) != slot_index - 1
    )

def can_assign_lab(subject, slot_index, daily_lectures):
    is_near_break = slot_index in [1, 3, 5]
    return (
        subject["isLab"] and
        not is_near_break and
        slot_index + 1 < len(timeSlots) and
        daily_lectures + 2 <= MAX_LECTURES_PER_DAY
    )

def find_eligible_subject(shuffled_subjects, day, slot_index, daily_lectures, section, teacher_schedule,
                          teacher_last_slot_per_day, lecture_count, subject_count_per_day, weekly_lab_count,
                          lab_assigned_per_day, teacher_selection_index, section_teacher_map,teacher_load):

    for subject in shuffled_subjects:
        eligible_teachers = [
            teacher["name"]
            for teacher in teachers
            if subject["name"] in teacher["subjects"] and
            is_teacher_available(teacher["name"], day, slot_index, teacher_schedule, teacher_last_slot_per_day)
        ]

        if lecture_count.get(subject["name"], 0) >= subject["creditHours"]:
            continue
        if subject_count_per_day[day].get(subject["name"], 0) >= 1:
            continue

        if subject["isLab"]:
            if weekly_lab_count.get(subject["name"], 0) >= 1 or \
               lab_assigned_per_day[day] >= 1 or \
               not can_assign_lab(subject, slot_index, daily_lectures):
                continue

        if eligible_teachers:
            selected_teacher = select_teacher(subject, eligible_teachers, section, teacher_selection_index, section_teacher_map,teacher_load)

            return subject, selected_teacher

    return None, None

def auto_fill_timetable(section,global_teacher_schedule,teacher_load):
    timetable = {day: [] for day in days}
    teacher_schedule = initialize_teacher_schedule()
    teacher_selection_index, section_teacher_map = initialize_teacher_selection_index()

    lecture_count = {}
    weekly_lab_count = {}
    teacher_last_slot_per_day = {day: {} for day in days}
    lab_assigned_per_day = {day: 0 for day in days}

    # iterate over Days in week
    for day in days:
        subject_count_per_day = {day: {}}
        daily_lectures = 0

        shuffled_subjects = shuffle_list(subjects)

        # assing the slots for each day
        for slot_index in range(len(timeSlots)):

            if daily_lectures >= MAX_LECTURES_PER_DAY:
                break

            subject, selected_teacher = find_eligible_subject(
                shuffled_subjects, day, slot_index, daily_lectures, section,
                teacher_schedule, teacher_last_slot_per_day, lecture_count,
                subject_count_per_day, weekly_lab_count, lab_assigned_per_day,
                teacher_selection_index, section_teacher_map,teacher_load
            )

            if subject and selected_teacher:
                # Check for overlap in the global_teacher_schedule
                if global_teacher_schedule[selected_teacher][day][slot_index]:
                    print(f"Overlap detected for teacher {selected_teacher} on {day} at {timeSlots[slot_index]} between sections.")
                    continue

                timetable[day].append({
                    "time": timeSlots[slot_index],
                    "subject": subject["name"],
                    "teacher": selected_teacher,
                })

                teacher_schedule[selected_teacher][day][slot_index] = True
                global_teacher_schedule[selected_teacher][day][slot_index] = True
                lecture_count[subject["name"]] = lecture_count.get(subject["name"], 0) + 1
                subject_count_per_day[day][subject["name"]] = subject_count_per_day[day].get(subject["name"], 0) + 1
                teacher_last_slot_per_day[day][selected_teacher] = slot_index
                daily_lectures += 1

                if subject["isLab"] and slot_index + 1 < len(timeSlots):
                    timetable[day].append({
                        "time": timeSlots[slot_index + 1],
                        "subject": subject["name"],
                        "teacher": selected_teacher,
                    })
                    teacher_schedule[selected_teacher][day][slot_index + 1] = True
                    global_teacher_schedule[selected_teacher][day][slot_index + 1] = True
                    weekly_lab_count[subject["name"]] = weekly_lab_count.get(subject["name"], 0) + 1
                    lab_assigned_per_day[day] += 1
                    daily_lectures += 1
                    slot_index += 1

    return timetable

@app.route("/timetable", methods=["GET"])
def generate_timetable():
    global_teacher_schedule = {teacher["name"]: {day: [False] * len(timeSlots) for day in days} for teacher in teachers}
    teacher_load = {teacher["name"]: {} for teacher in teachers}
    teacher_section_slots = {teacher["name"]: [] for teacher in teachers}  # To track sections and slots

    timetables = {section: auto_fill_timetable(section, global_teacher_schedule,teacher_load) for section in sections}

    # Collect detailed information about teacher schedules
    for section, timetable in timetables.items():
        for day, slots in timetable.items():
            for slot in slots:
                teacher = slot["teacher"]
                time = slot["time"]
                subject = slot["subject"]
                teacher_section_slots[teacher].append({
                    "section": section,
                    "day": day,
                    "time": time,
                    "subject": subject
                })

    # Print teacher schedules for debugging
    print("\nDetailed Teacher Load Distribution:")
    for teacher, schedules in teacher_section_slots.items():
        print(f"\n{teacher} is handling the following:")
        for schedule in schedules:
            print(f"  - Section: {schedule['section']}, Day: {schedule['day']}, Time: {schedule['time']}, Subject: {schedule['subject']}")
    
    # Print teacher loads for debugging
    print("Teacher Load Distribution:")
    for teacher, loads in teacher_load.items():
        print(f"{teacher}: {loads}")

    return jsonify(timetables)

if __name__ == "__main__":
    app.run(debug=True)
