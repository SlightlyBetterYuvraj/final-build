"""
Unit and integration tests for the Python OR-Tools Timetable Generator.
Tests feasible schedules, odd P hour rejection, and infeasible resource constraints.
"""

import unittest
import sys
import os

try:
    from solver import solve_timetable
except ImportError:
    from generator.solver import solve_timetable


class TestOrToolsSolver(unittest.TestCase):
    def setUp(self):
        self.sample_grid = {
            "days": [1, 2],
            "slotsPerDay": 4,
            "slots": [
                {"dayOfWeek": 1, "slotIndex": 1, "startTime": "09:00", "endTime": "10:00", "isBreak": False},
                {"dayOfWeek": 1, "slotIndex": 2, "startTime": "10:00", "endTime": "11:00", "isBreak": False},
                {"dayOfWeek": 1, "slotIndex": 3, "startTime": "11:00", "endTime": "12:00", "isBreak": False},
                {"dayOfWeek": 1, "slotIndex": 4, "startTime": "12:00", "endTime": "13:00", "isBreak": True}, # Lunch break
                {"dayOfWeek": 2, "slotIndex": 1, "startTime": "09:00", "endTime": "10:00", "isBreak": False},
                {"dayOfWeek": 2, "slotIndex": 2, "startTime": "10:00", "endTime": "11:00", "isBreak": False},
                {"dayOfWeek": 2, "slotIndex": 3, "startTime": "11:00", "endTime": "12:00", "isBreak": False},
                {"dayOfWeek": 2, "slotIndex": 4, "startTime": "12:00", "endTime": "13:00", "isBreak": False},
            ]
        }
        
        self.sample_rooms = [
            {"id": "r-lt", "roomNumber": "101", "building": "Main", "floor": 1, "capacity": 60, "roomType": "LT", "active": True},
            {"id": "r-lab", "roomNumber": "Lab-1", "building": "Main", "floor": 1, "capacity": 40, "roomType": "P", "active": True},
        ]
        
        self.sample_teachers = [
            {"id": "t-1", "empId": "EMP01", "name": "Dr. Smith"},
            {"id": "t-2", "empId": "EMP02", "name": "Dr. Jones"},
        ]
        
        self.sample_sections = [
            {"id": "sec-A", "termId": "term-3", "name": "A", "expectedCount": 50}
        ]
        
        self.sample_batches = [
            {"id": "batch-A1", "sectionId": "sec-A", "name": "A1", "expectedCount": 25}
        ]

    def test_feasible_generation(self):
        package = {
            "schemaVersion": "1.0.0",
            "packageId": "pkg-test-feasible",
            "inputRevision": "rev-1",
            "termIds": ["term-3"],
            "grid": self.sample_grid,
            "rooms": self.sample_rooms,
            "teachers": self.sample_teachers,
            "sections": self.sample_sections,
            "batches": self.sample_batches,
            "teacherAvailabilities": [],
            "courses": [
                {
                    "id": "c-math",
                    "code": "MATH101",
                    "name": "Calculus",
                    "termId": "term-3",
                    "lectureHours": 2,
                    "tutorialHours": 0,
                    "practicalHours": 0,
                    "requiredRoomType": "LT"
                },
                {
                    "id": "c-phy",
                    "code": "PHY101",
                    "name": "Physics Lab",
                    "termId": "term-3",
                    "lectureHours": 0,
                    "tutorialHours": 0,
                    "practicalHours": 2,
                    "requiredRoomType": "P"
                }
            ],
            "courseOfferings": [
                {
                    "id": "off-math",
                    "courseId": "c-math",
                    "termId": "term-3",
                    "teacherId": "t-1",
                    "targetType": "section",
                    "targetId": "sec-A"
                },
                {
                    "id": "off-phy",
                    "courseId": "c-phy",
                    "termId": "term-3",
                    "teacherId": "t-2",
                    "targetType": "batch",
                    "targetId": "batch-A1"
                }
            ]
        }

        result = solve_timetable(package)
        self.assertEqual(result["status"], "succeeded")
        # 2 math lectures + 1 physics lab (2 slots) = 3 class entries
        classes = result["classes"]
        self.assertEqual(len(classes), 3)
        
        # Verify lab occupies P room and has duration 2
        lab = [c for c in classes if c["activityType"] == "P"][0]
        self.assertEqual(lab["roomId"], "r-lab")
        self.assertEqual(lab["duration"], 2)

    def test_rejection_of_odd_practical_hours(self):
        package = {
            "schemaVersion": "1.0.0",
            "packageId": "pkg-odd-p",
            "inputRevision": "rev-odd",
            "termIds": ["term-3"],
            "grid": self.sample_grid,
            "rooms": self.sample_rooms,
            "teachers": self.sample_teachers,
            "sections": self.sample_sections,
            "batches": self.sample_batches,
            "teacherAvailabilities": [],
            "courses": [
                {
                    "id": "c-odd",
                    "code": "CS301",
                    "name": "Algorithms Lab",
                    "termId": "term-3",
                    "lectureHours": 0,
                    "tutorialHours": 0,
                    "practicalHours": 3, # Odd practical hours!
                    "requiredRoomType": "P"
                }
            ],
            "courseOfferings": [
                {
                    "id": "off-odd",
                    "courseId": "c-odd",
                    "termId": "term-3",
                    "teacherId": "t-1",
                    "targetType": "section",
                    "targetId": "sec-A"
                }
            ]
        }

        result = solve_timetable(package)
        self.assertEqual(result["status"], "infeasible")
        self.assertEqual(result["diagnostics"]["statusString"], "ERR_ODD_P_HOURS")


if __name__ == "__main__":
    unittest.main()
