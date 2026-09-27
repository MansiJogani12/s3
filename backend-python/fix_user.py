import glob, re

for file in glob.glob('app/api/*.py'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace current_user.get('_id') or current_user.get('id') with str(current_user.id)
    # The subagent might have written: PydanticObjectId(current_user.get("_id") or current_user.get("id"))
    content = re.sub(r'current_user\.get\([\'\"]_?id[\'\"]\)', 'current_user.id', content)
    content = content.replace('current_user.id or current_user.id', 'current_user.id')
    
    # Replace other potential dict accesses
    content = re.sub(r'current_user\.get\([\'\"]role[\'\"]\)', 'current_user.role', content)
    content = re.sub(r'current_user\.get\([\'\"]name[\'\"]\)', 'current_user.name', content)
    content = re.sub(r'current_user\.get\([\'\"]email[\'\"]\)', 'current_user.email', content)
    
    # If they did current_user["_id"]
    content = re.sub(r'current_user\[[\'\"]_?id[\'\"]\]', 'current_user.id', content)
    content = re.sub(r'current_user\[[\'\"]role[\'\"]\]', 'current_user.role', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print("Done fixing current_user accesses.")
