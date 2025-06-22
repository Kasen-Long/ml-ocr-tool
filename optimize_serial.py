import os
import sys

# The number to subtract from the filename
SUBTRACT_NUM = 2

def is_numeric_filename(filename):
    """Checks if a filename (without extension) is purely numeric."""
    return filename.isdigit()

def main():
    """
    Finds files with numeric names in the current directory and subdirectories,
    sorts them, and renames them by subtracting a number.
    """
    # By default, this script runs in the directory where you execute it.
    # If you want to run it on a different directory, change this value.
    target_directory = '.' 
    print(f"Starting file processing, subtract value: {SUBTRACT_NUM}")
    print(f"Scanning {os.path.abspath(target_directory)} and all subdirectories recursively...")
    print("")

    # --- Step 1: Finding all files ---
    print("=== Step 1: Finding all files with numeric names ===")
    numeric_files = []
    for root, _, files in os.walk(target_directory):
        for file in files:
            filename, extension = os.path.splitext(file)
            # print(f"Checking file: {file}")
            if is_numeric_filename(filename):
                full_path = os.path.join(root, file)
                # Store path, integer value of filename, and original length for padding
                numeric_files.append((full_path, int(filename), len(filename)))
                # print(f"  => MATCH: Pure numeric filename found: {full_path}")
            # else:
                # print(f"  => SKIP: Not pure numeric")

    print("")
    
    # --- Step 2: Processing found files ---
    print("=== Step 2: Processing found files ===")
    if not numeric_files:
        print("No files with pure numeric names found.")
        return

    # Sort files based on their numeric value
    numeric_files.sort(key=lambda x: x[1])

    # print("Found and sorted files:")
    # for path, _, _ in numeric_files:
    #     print(path)
    # print("")

    # --- Step 3: Renaming files in order ---
    print("=== Step 3: Renaming files in order ===")
    process_count = 0
    for full_path, original_num, original_len in numeric_files:
        directory, old_filename_with_ext = os.path.split(full_path)
        _, extension = os.path.splitext(old_filename_with_ext)

        new_num = original_num - SUBTRACT_NUM

        if new_num < 0:
            print(f"  => WARNING: Result for {old_filename_with_ext} would be negative ({new_num}), skipping.")
            continue

        # Format new number with leading zeros to match original length
        new_filename = str(new_num).zfill(original_len)
        new_full_path = os.path.join(directory, f"{new_filename}{extension}")

        if os.path.exists(new_full_path):
            print(f"  => WARNING: Target file {new_full_path} already exists, skipping rename of {old_filename_with_ext}.")
            continue
        
        try:
            os.rename(full_path, new_full_path)
            print(f"  => SUCCESS: Renamed {full_path} to {new_full_path}")
            process_count += 1
        except OSError as e:
            print(f"  => ERROR: Rename failed for {full_path}: {e}")

    print("")
    print("=== Processing completed ===")
    print(f"Total files renamed: {process_count}")

if __name__ == "__main__":
    # You can pass a directory path as a command-line argument
    if len(sys.argv) > 1:
        os.chdir(sys.argv[1])
    main()