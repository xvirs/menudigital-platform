import json
import os

n8n_dir = os.path.dirname(os.path.abspath(__file__))
workflow_path = os.path.join(n8n_dir, 'workflow.json')

# Load the current workflow JSON
with open(workflow_path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# Helper to read JS code file
def read_js_code(filename):
    filepath = os.path.join(n8n_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

# Read the JS files
validate_secret_code = read_js_code('validate_secret.js')
call_gemini_code = read_js_code('call_gemini.js')
save_to_github_code = read_js_code('save_to_github.js')

# Update the nodes in workflow
for node in workflow['nodes']:
    if node['name'] == 'Validate Secret':
        node['parameters']['jsCode'] = validate_secret_code
        print("Updated 'Validate Secret' JS code.")
    elif node['name'] == 'Extract PDF Text':
        node['onError'] = 'continueRegularOutput'
        print("Ensured 'Extract PDF Text' has onError=continueRegularOutput.")
    elif node['name'] == 'Call Gemini':
        node['parameters']['jsCode'] = call_gemini_code
        print("Updated 'Call Gemini' JS code.")
    elif node['name'] == 'Save to GitHub':
        node['parameters']['jsCode'] = save_to_github_code
        print("Updated 'Save to GitHub' JS code.")

# Save the updated workflow JSON
with open(workflow_path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print("workflow.json successfully updated and compiled from JS files.")
