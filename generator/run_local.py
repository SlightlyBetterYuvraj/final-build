#!/usr/bin/env python3
"""
Local Timetable Generator Runner CLI
Usage: py -3.12 generator/run_local.py --input <input_package.json> --output <draft_output.json>
"""

import argparse
import json
import sys
import os
try:
    from solver import solve_timetable
except ImportError:
    from generator.solver import solve_timetable


def main():
    parser = argparse.ArgumentParser(description="Local Timetable Generator Runner")
    parser.add_argument("--input", "-i", required=True, help="Path to input generation package JSON")
    parser.add_argument("--output", "-o", required=True, help="Path to write generated draft JSON")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Solver timeout in seconds")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found.", file=sys.stderr)
        sys.exit(1)
        
    try:
        with open(args.input, "r", encoding="utf-8") as f:
            pkg = json.load(f)
    except Exception as e:
        print(f"Error reading input JSON: {e}", file=sys.stderr)
        sys.exit(1)
        
    print(f"Running OR-Tools CP-SAT generator on package '{pkg.get('packageId', 'unknown')}'...")
    result = solve_timetable(pkg, time_limit_seconds=args.timeout)
    
    try:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        print(f"Result written to {args.output}")
        print(f"Status: {result.get('status')}")
        print(f"Solve Time: {result.get('diagnostics', {}).get('solveTimeMs', 0):.1f}ms")
        print(f"Classes: {len(result.get('classes', []))}")
    except Exception as e:
        print(f"Error writing output JSON: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
