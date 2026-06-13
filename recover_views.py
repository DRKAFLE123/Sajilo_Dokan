import json
import re

log_path = r"C:\Users\Dr.Kafle\.gemini\antigravity-ide\brain\4df2304f-ea42-4c61-9184-51a544b85007\.system_generated\logs\transcript.jsonl"
recovered_file = r"e:\Projects\local_connect_marketplace\api\views_original.py"

step_59 = ""
step_61 = ""

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get('step_index')
            if step_idx == 59:
                step_59 = data.get('content', '')
            elif step_idx == 61:
                step_61 = data.get('content', '')
        except Exception:
            pass

def clean_content(content):
    lines = content.split('\n')
    code_lines = []
    started = False
    matched_count = 0
    skipped_count = 0
    
    for line in lines:
        line_str = line.strip('\r\n')
        if not started:
            if re.match(r'^\d+:', line_str):
                started = True
            else:
                continue
        
        # Robust regex matching number: code
        match = re.match(r'^(\d+):(.*)', line_str)
        if match:
            code = match.group(2)
            # Remove the single leading space if it exists
            if code.startswith(' '):
                code = code[1:]
            code_lines.append(code)
            matched_count += 1
        else:
            if "complete file contents" in line_str or "does NOT show the entire" in line_str:
                print(f"Stopping at line: {line_str}")
                break
            skipped_count += 1
            
    print(f"Matched: {matched_count}, Skipped: {skipped_count}")
    return "\n".join(code_lines)

print("Cleaning step 59:")
code_59 = clean_content(step_59)
print("Cleaning step 61:")
code_61 = clean_content(step_61)

full_original_code = code_59 + "\n" + code_61

with open(recovered_file, 'w', encoding='utf-8') as out:
    out.write(full_original_code)

print(f"Original views.py restored to {recovered_file}. Total length: {len(full_original_code)} characters.")
